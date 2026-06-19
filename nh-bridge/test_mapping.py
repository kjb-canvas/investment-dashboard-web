#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
map_c8201_to_holdings 테스트 (Linux 에서도 실행 가능, pytest 불필요).

실행:
    python nh-bridge/test_mapping.py
또는 pytest 가 있으면:
    pytest nh-bridge/test_mapping.py
"""

import os
import sys

# bridge.py 를 import 할 수 있도록 이 파일이 있는 디렉토리를 경로에 추가
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from bridge import map_c8201_to_holdings, BROKER, MARKET, CURRENCY  # noqa: E402


# 실제 c8201 응답 형태를 모사한 샘플
# (필드명은 pynamuh structures/ord/c8201.py 의 CTc8201OutBlock1 기준)
SAMPLE_RAW = {
    "deposit": "1,500,000",  # c8201OutBlock.dpsit_amtz16 (예수금, 콤마 포함 가능)
    "holdings": [
        {
            "issue_codez6": "005930",      # 종목코드
            "issue_namez40": "삼성전자",     # 종목명
            "bal_qtyz16": "10",            # 잔고수량
            "slby_amtz16": "70,000",       # 평균매입가(매입단가)
            "prsnt_pricez16": "75000",     # 현재가
            "ass_amtz16": "750000",        # 평가금액
        },
        {
            "issue_codez6": "000660",
            "issue_namez40": "SK하이닉스",
            "bal_qtyz16": "5",
            "slby_amtz16": "120000",
            "prsnt_pricez16": "135000",
            "ass_amtz16": "675000",
        },
        {
            # 잔고수량 0 -> 보유로 보지 않고 제외되어야 함
            "issue_codez6": "035720",
            "issue_namez40": "카카오",
            "bal_qtyz16": "0",
            "slby_amtz16": "50000",
            "prsnt_pricez16": "48000",
            "ass_amtz16": "0",
        },
    ],
}

USER_ID = "11111111-2222-3333-4444-555555555555"
ACCOUNT_NAME = "NH 주식계좌"
SYNCED_AT = "2026-06-19T00:00:00+00:00"


def test_basic_mapping():
    rows = map_c8201_to_holdings(
        SAMPLE_RAW, user_id=USER_ID, account_name=ACCOUNT_NAME, synced_at=SYNCED_AT
    )

    # 잔고수량 0 인 카카오는 제외 -> 2건
    assert len(rows) == 2, f"기대 2건, 실제 {len(rows)}건"

    samsung = rows[0]
    assert samsung["user_id"] == USER_ID
    assert samsung["broker"] == BROKER == "nhInvestment"
    assert samsung["account_name"] == ACCOUNT_NAME
    assert samsung["symbol"] == "005930"
    assert samsung["name"] == "삼성전자"
    assert samsung["market"] == MARKET == "krStock"
    assert samsung["currency"] == CURRENCY == "krw"
    assert samsung["quantity"] == 10.0
    assert samsung["average_cost"] == 70000.0  # 콤마 제거 확인
    assert samsung["current_price"] == 75000.0
    assert samsung["synced_at"] == SYNCED_AT

    sk = rows[1]
    assert sk["symbol"] == "000660"
    assert sk["quantity"] == 5.0
    assert sk["average_cost"] == 120000.0
    assert sk["current_price"] == 135000.0


def test_excludes_zero_quantity():
    rows = map_c8201_to_holdings(
        SAMPLE_RAW, user_id=USER_ID, account_name=ACCOUNT_NAME
    )
    symbols = {r["symbol"] for r in rows}
    assert "035720" not in symbols, "잔고수량 0 종목은 제외되어야 함"


def test_empty_holdings():
    rows = map_c8201_to_holdings(
        {"deposit": "0", "holdings": []}, user_id=USER_ID, account_name=ACCOUNT_NAME
    )
    assert rows == []


def test_synced_at_optional():
    rows = map_c8201_to_holdings(
        SAMPLE_RAW, user_id=USER_ID, account_name=ACCOUNT_NAME
    )
    # synced_at 미지정 시 키가 없어야 함(서버 default 사용 가능하도록)
    assert "synced_at" not in rows[0]


def test_required_columns_present():
    rows = map_c8201_to_holdings(
        SAMPLE_RAW, user_id=USER_ID, account_name=ACCOUNT_NAME, synced_at=SYNCED_AT
    )
    required = {
        "user_id", "broker", "account_name", "symbol", "name",
        "market", "quantity", "average_cost", "current_price",
        "currency", "synced_at",
    }
    for r in rows:
        assert required.issubset(r.keys()), f"누락 컬럼: {required - set(r.keys())}"


def _run_all():
    tests = [
        test_basic_mapping,
        test_excludes_zero_quantity,
        test_empty_holdings,
        test_synced_at_optional,
        test_required_columns_present,
    ]
    failed = 0
    for t in tests:
        try:
            t()
            print(f"PASS  {t.__name__}")
        except AssertionError as e:
            failed += 1
            print(f"FAIL  {t.__name__}: {e}")
    print("-" * 50)
    if failed:
        print(f"{failed}/{len(tests)} 테스트 실패")
        return 1
    print(f"모든 테스트 통과 ({len(tests)}건)")
    return 0


if __name__ == "__main__":
    raise SystemExit(_run_all())
