#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
nh-bridge — NH투자증권(나무증권) 잔고 -> 웹 대시보드 DB(Supabase) 브릿지

왜 필요한가:
    NH 의 QV/WMCA OpenAPI 는 Windows 전용 DLL(wmca.dll, ActiveX 류)로만 제공되어
    클라우드(Linux/Vercel)에서 실행할 수 없습니다. 그래서 이 프로그램은 사용자의
    Windows PC 에서 직접 NH 에 로그인해 주식잔고(c8201)를 조회하고, 그 결과 "행"만
    Supabase 의 holdings_cache 테이블로 밀어넣습니다. 웹 앱은 이 데이터를 다른
    데이터 소스와 동일하게 읽습니다.

보안 모델:
    NH 로그인 ID/PW, 공인인증서, 인증서 비밀번호, 계좌 비밀번호는 절대 PC 밖으로
    나가지 않습니다. DB 로 전송되는 것은 (종목/수량/평단/현재가 등) 잔고 행 뿐입니다.

구조:
    - map_c8201_to_holdings(...)  : 순수 함수. c8201 응답 -> holdings_cache 행 목록.
                                    Windows 가 아니어도 import/실행 가능(테스트용).
    - fetch_c8201_from_nh(...)    : Windows 전용. pynamuh 로 로그인 후 c8201 조회.
    - push_to_supabase(...)       : PostgREST 로 upsert + 오래된 행 삭제.
    - main()                      : 설정 로드 -> 조회 -> 매핑 -> push.

Windows 전용 import(pynamuh/pywin32)는 모듈 최상단에 두지 않고, Windows 코드
경로 안에서만 import 합니다. 따라서 이 모듈은 Linux 에서도 문제없이 import 됩니다.
"""

from __future__ import annotations

import argparse
import json
import os
import sys
from typing import Any, Dict, List, Optional

# -----------------------------------------------------------------------------
# 상수 (DB 에 고정으로 들어가는 값)
# -----------------------------------------------------------------------------
BROKER = "nhInvestment"
MARKET = "krStock"
CURRENCY = "krw"

# c8201 블록 이름 (pynamuh structures/ord/c8201.py 기준)
BLOCK_HEADER = "c8201OutBlock"   # 계좌 요약(예수금 등) - 단일
BLOCK_HOLDINGS = "c8201OutBlock1"  # 보유종목 - 반복


# -----------------------------------------------------------------------------
# 순수 매핑 로직 (Linux 에서도 import/테스트 가능)
# -----------------------------------------------------------------------------
def _to_float(value: Any) -> float:
    """NH 응답 필드(문자열, 콤마/공백/부호 포함 가능)를 float 로 변환.

    NH WMCA 의 수치 필드는 고정폭 문자열로 오며, 콤마가 포함될 수 있습니다.
    빈 값/None 은 0.0 으로 처리합니다.
    """
    if value is None:
        return 0.0
    if isinstance(value, (int, float)):
        return float(value)
    s = str(value).strip().replace(",", "")
    if s in ("", "-", "+"):
        return 0.0
    try:
        return float(s)
    except ValueError:
        return 0.0


def map_c8201_to_holdings(
    raw: Dict[str, Any],
    *,
    user_id: str,
    account_name: str,
    synced_at: Optional[str] = None,
) -> List[Dict[str, Any]]:
    """c8201 조회 결과(raw)를 holdings_cache 행 목록으로 변환하는 순수 함수.

    기대하는 raw 형태(Windows 코드 경로에서 fetch_c8201_from_nh 가 생성):
        {
            "deposit": "<예수금 문자열>",            # c8201OutBlock.dpsit_amtz16
            "holdings": [                            # c8201OutBlock1 (반복)
                {
                    "issue_codez6": "005930",        # 종목코드
                    "issue_namez40": "삼성전자",      # 종목명
                    "bal_qtyz16": "10",              # 잔고수량
                    "slby_amtz16": "70000",          # 평균매입가(매입단가)
                    "prsnt_pricez16": "75000",       # 현재가
                    "ass_amtz16": "750000",          # 평가금액
                    ...
                },
                ...
            ]
        }

    반환: holdings_cache 의 컬럼에 맞춘 dict 목록.
        잔고수량이 0 인 행은 보유로 보지 않고 제외합니다.

    참고: 예수금(deposit)은 holdings_cache 스키마에 별도 컬럼이 없어 행으로 만들지
    않습니다. 필요 시 현금성 행으로 매핑하도록 확장할 수 있습니다.
    """
    holdings = raw.get("holdings") or []
    rows: List[Dict[str, Any]] = []

    for h in holdings:
        symbol = str(h.get("issue_codez6", "")).strip()
        if not symbol:
            continue

        quantity = _to_float(h.get("bal_qtyz16"))
        if quantity == 0.0:
            # 잔고수량 0 = 더 이상 보유하지 않음 -> 행으로 만들지 않음(삭제 대상이 됨)
            continue

        row: Dict[str, Any] = {
            "user_id": user_id,
            "broker": BROKER,
            "account_name": account_name,
            "symbol": symbol,
            "name": str(h.get("issue_namez40", "")).strip(),
            "market": MARKET,
            "quantity": quantity,
            # 매입평균가(매입단가): slby_amtz16 = "평균매입가"
            "average_cost": _to_float(h.get("slby_amtz16")),
            # 현재가: prsnt_pricez16
            "current_price": _to_float(h.get("prsnt_pricez16")),
            "currency": CURRENCY,
        }
        if synced_at is not None:
            row["synced_at"] = synced_at
        rows.append(row)

    return rows


# -----------------------------------------------------------------------------
# Windows 전용: NH 로그인 + c8201 조회
# -----------------------------------------------------------------------------
def fetch_c8201_from_nh(cfg: "Config") -> Dict[str, Any]:
    """Windows 에서 pynamuh 로 NH 에 로그인하고 c8201(주식잔고)을 조회.

    반환: map_c8201_to_holdings 가 기대하는 raw dict.

    이 함수는 Windows + 32비트 Python + wmca.dll 환경에서만 동작합니다.
    pynamuh import 는 이 함수 안에서만 수행하므로 Linux 에서 모듈 import 는 영향 없음.
    """
    if sys.platform != "win32":
        raise RuntimeError(
            "fetch_c8201_from_nh()는 Windows 에서만 실행할 수 있습니다. "
            "(NH WMCA DLL 은 Windows 전용입니다.) Linux 에서는 --dry-run 을 쓰세요."
        )

    # Windows 전용 import — 모듈 최상단이 아니라 여기서 import 합니다.
    from pynamuh import WMCAAgent, WMCAMessage  # type: ignore
    from pynamuh.structures.ord.c8201 import Tc8201InBlock  # type: ignore

    account_index = cfg.account_index

    with WMCAAgent() as agent:
        # 1) 로그인 요청
        ok = agent.connect(szID=cfg.nh_id, szPW=cfg.nh_pw, szCertPW=cfg.nh_cert_pw)
        if not ok:
            raise RuntimeError("wmcaConnect() 호출 실패")

        # 로그인 응답 대기
        connected = False
        for msg_type, _data in agent.receive_events(timeout=15.0):
            if msg_type == WMCAMessage.CA_CONNECTED:
                connected = True
                break
            if msg_type == WMCAMessage.CA_DISCONNECTED:
                break
        if not connected:
            raise RuntimeError("NH 로그인 실패 (ID/PW/인증서 비밀번호 또는 서버 확인)")

        # 2) 계좌 비밀번호 44자 해시 생성
        pswd_hash = agent.get_account_hash_password(
            account_index=account_index, password=cfg.nh_account_pw
        )

        # 3) c8201 조회 요청
        input_data = Tc8201InBlock(
            pswd_noz44=pswd_hash,
            bnc_bse_cdz1="1",  # 1: 체결잔고
        )
        tr_index = 8201
        agent.query(
            nTRID=tr_index,
            szTRCode="c8201",
            szInput=input_data,
            nAccountIndex=account_index,
        )

        deposit: str = ""
        holdings: List[Dict[str, Any]] = []

        for msg_type, data in agent.receive_events(timeout=20.0):
            if getattr(data, "TrIndex", None) != tr_index:
                continue
            if msg_type == WMCAMessage.CA_RECEIVEDATA:
                block = data.pData
                if block.szBlockName == BLOCK_HEADER:
                    deposit = getattr(block.szData, "dpsit_amtz16", "")
                elif block.szBlockName == BLOCK_HOLDINGS:
                    # 반복 블록: szData 가 리스트
                    items = block.szData
                    if not isinstance(items, list):
                        items = [items]
                    for item in items:
                        holdings.append(_outblock1_to_dict(item))
            elif msg_type == WMCAMessage.CA_RECEIVECOMPLETE:
                break
            elif msg_type == WMCAMessage.CA_RECEIVEERROR:
                raise RuntimeError("c8201 조회 실패 (CA_RECEIVEERROR)")

        return {"deposit": deposit, "holdings": holdings}


def _outblock1_to_dict(item: Any) -> Dict[str, Any]:
    """Tc8201OutBlock1(dataclass) -> 매핑에 필요한 필드만 추린 dict."""
    fields = (
        "issue_codez6",
        "issue_namez40",
        "bal_qtyz16",
        "slby_amtz16",
        "prsnt_pricez16",
        "ass_amtz16",
    )
    return {f: getattr(item, f, "") for f in fields}


# -----------------------------------------------------------------------------
# Supabase PostgREST push
# -----------------------------------------------------------------------------
def push_to_supabase(
    rows: List[Dict[str, Any]],
    *,
    supabase_url: str,
    service_role_key: str,
    user_id: str,
) -> None:
    """holdings_cache 에 upsert 후, 이번에 없는 (user_id, broker) 행 삭제.

    인증/push 모델:
      - apikey + Authorization: Bearer <service_role>  헤더로 PostgREST 호출.
      - service_role 키는 RLS 를 우회하므로 지정 user_id 대신 쓸 수 있음.
      - Upsert: Prefer: resolution=merge-duplicates + on_conflict 유니크키.
      - 삭제: 이번 조회에 포함되지 않은 symbol 의 행을 제거 -> 청산 종목이 사라짐.
    """
    import requests  # 표준 의존성 — 매핑/테스트 경로에는 불필요하므로 지연 import

    base = supabase_url.rstrip("/")
    endpoint = f"{base}/rest/v1/holdings_cache"
    headers = {
        "apikey": service_role_key,
        "Authorization": f"Bearer {service_role_key}",
        "Content-Type": "application/json",
    }

    # 1) Upsert
    if rows:
        upsert_headers = dict(headers)
        upsert_headers["Prefer"] = "resolution=merge-duplicates,return=minimal"
        params = {"on_conflict": "user_id,broker,account_name,symbol"}
        resp = requests.post(
            endpoint, headers=upsert_headers, params=params, data=json.dumps(rows), timeout=30
        )
        resp.raise_for_status()
        print(f"[push] upsert {len(rows)}건 완료")
    else:
        print("[push] upsert 대상 없음(보유 종목 0건)")

    # 2) 오래된 행 삭제: 이번 결과에 없는 symbol 제거
    held_symbols = [r["symbol"] for r in rows]
    del_params = {
        "user_id": f"eq.{user_id}",
        "broker": f"eq.{BROKER}",
    }
    if held_symbols:
        # symbol=not.in.(a,b,c)  -> 보유 목록에 없는 행만 삭제
        in_list = ",".join(f'"{s}"' for s in held_symbols)
        del_params["symbol"] = f"not.in.({in_list})"
    # held_symbols 가 비어 있으면 (user_id, broker)의 모든 행 삭제(전량 청산 케이스)

    del_headers = dict(headers)
    del_headers["Prefer"] = "return=minimal"
    resp = requests.delete(endpoint, headers=del_headers, params=del_params, timeout=30)
    resp.raise_for_status()
    print("[push] 미보유(청산) 행 정리 완료")


# -----------------------------------------------------------------------------
# 설정
# -----------------------------------------------------------------------------
class Config:
    def __init__(self) -> None:
        self.supabase_url = os.environ.get("SUPABASE_URL", "")
        self.service_role_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
        self.user_id = os.environ.get("DASHBOARD_USER_ID", "")
        self.nh_id = os.environ.get("NH_ID", "")
        self.nh_pw = os.environ.get("NH_PW", "")
        self.nh_cert_pw = os.environ.get("NH_CERT_PW", "")
        self.nh_account_no = os.environ.get("NH_ACCOUNT_NO", "")
        self.nh_account_pw = os.environ.get("NH_ACCOUNT_PW", "")
        self.account_index = int(os.environ.get("NH_ACCOUNT_INDEX", "1"))
        self.account_name = os.environ.get("NH_ACCOUNT_NAME", "") or self.nh_account_no

    def require_for_push(self) -> None:
        missing = [
            k
            for k, v in {
                "SUPABASE_URL": self.supabase_url,
                "SUPABASE_SERVICE_ROLE_KEY": self.service_role_key,
                "DASHBOARD_USER_ID": self.user_id,
            }.items()
            if not v
        ]
        if missing:
            raise SystemExit(f"필수 환경변수 누락: {', '.join(missing)}")

    def require_for_nh(self) -> None:
        missing = [
            k
            for k, v in {
                "NH_ID": self.nh_id,
                "NH_PW": self.nh_pw,
                "NH_CERT_PW": self.nh_cert_pw,
                "NH_ACCOUNT_NO": self.nh_account_no,
                "NH_ACCOUNT_PW": self.nh_account_pw,
            }.items()
            if not v
        ]
        if missing:
            raise SystemExit(f"필수 환경변수 누락: {', '.join(missing)}")


def _load_dotenv() -> None:
    """python-dotenv 가 있으면 .env 로드(없어도 동작)."""
    try:
        from dotenv import load_dotenv  # type: ignore
    except Exception:
        return
    here = os.path.dirname(os.path.abspath(__file__))
    load_dotenv(os.path.join(here, ".env"))


def _now_iso() -> str:
    from datetime import datetime, timezone

    return datetime.now(timezone.utc).isoformat()


# -----------------------------------------------------------------------------
# main
# -----------------------------------------------------------------------------
def main(argv: Optional[List[str]] = None) -> int:
    parser = argparse.ArgumentParser(
        description="NH투자증권 잔고를 Supabase holdings_cache 로 동기화"
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="DB 로 push 하지 않고 매핑된 행만 출력. --sample 로 모의 데이터 사용 가능(모든 OS).",
    )
    parser.add_argument(
        "--sample",
        metavar="PATH",
        help="--dry-run 시 사용할 c8201 raw JSON 파일 경로(Windows 없이 매핑 확인용).",
    )
    args = parser.parse_args(argv)

    _load_dotenv()
    cfg = Config()
    synced_at = _now_iso()

    # 1) raw 확보
    if args.dry_run and args.sample:
        with open(args.sample, "r", encoding="utf-8") as f:
            raw = json.load(f)
    elif args.dry_run and sys.platform != "win32":
        # Windows 가 아니고 샘플도 없으면 내장 데모 데이터 사용
        raw = _demo_raw()
        print("[dry-run] --sample 미지정 & 비Windows 환경 -> 내장 데모 데이터 사용")
    else:
        cfg.require_for_nh()
        raw = fetch_c8201_from_nh(cfg)

    # 2) 매핑
    account_name = cfg.account_name or "NH"
    user_id = cfg.user_id or "00000000-0000-0000-0000-000000000000"
    rows = map_c8201_to_holdings(
        raw, user_id=user_id, account_name=account_name, synced_at=synced_at
    )

    # 3) 출력 또는 push
    if args.dry_run:
        print(f"[dry-run] 예수금(deposit): {raw.get('deposit')}")
        print(f"[dry-run] 매핑된 보유종목 {len(rows)}건:")
        print(json.dumps(rows, ensure_ascii=False, indent=2))
        return 0

    cfg.require_for_push()
    push_to_supabase(
        rows,
        supabase_url=cfg.supabase_url,
        service_role_key=cfg.service_role_key,
        user_id=cfg.user_id,
    )
    print(f"[done] synced_at={synced_at}, 종목 {len(rows)}건 동기화 완료")
    return 0


def _demo_raw() -> Dict[str, Any]:
    """--dry-run 데모용 c8201 raw 샘플(실제 NH 필드명 사용)."""
    return {
        "deposit": "1500000",
        "holdings": [
            {
                "issue_codez6": "005930",
                "issue_namez40": "삼성전자",
                "bal_qtyz16": "10",
                "slby_amtz16": "70000",
                "prsnt_pricez16": "75000",
                "ass_amtz16": "750000",
            },
            {
                "issue_codez6": "000660",
                "issue_namez40": "SK하이닉스",
                "bal_qtyz16": "5",
                "slby_amtz16": "120000",
                "prsnt_pricez16": "135000",
                "ass_amtz16": "675000",
            },
        ],
    }


if __name__ == "__main__":
    raise SystemExit(main())
