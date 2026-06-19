// 한국투자증권(KIS) 계좌 제공자. iOS KISAuthClient + KISAPIClient + KISRepository 포팅.

import type { Account } from "../../domain/account";
import type { KISCreds } from "../credentialTypes";
import { httpJson } from "../../http";
import { mapKISAccount } from "./mapper";
import type {
  KISDomesticBalanceResponse,
  KISOverseasBalanceResponse,
  KISTokenResponse,
} from "./models";

const BASE_URL = "https://openapi.koreainvestment.com:9443";

/** 거래 ID (tr_id). */
const TR_ID = {
  domesticBalance: "TTTC8434R",
  overseasBalance: "TTTS3012R",
} as const;

/** rt_cd 가 "0"(정상)이 아니면 msg1 과 함께 throw 한다. (오케스트레이션이 부분 실패로 기록) */
function assertOk(
  res: { rt_cd?: string; msg1?: string },
  context: string,
): void {
  if (res.rt_cd !== undefined && res.rt_cd !== "0") {
    throw new Error(
      `KIS ${context} 실패 (rt_cd=${res.rt_cd}): ${res.msg1 ?? "알 수 없는 오류"}`,
    );
  }
}

/** 계좌번호 앞 8자리(종합계좌번호 CANO). */
function accountPrefix(accountNo: string): string {
  return accountNo.replace(/-/g, "").slice(0, 8);
}

/** 계좌번호 뒤 자리(상품코드 ACNT_PRDT_CD). 없으면 "01". */
function accountSuffix(accountNo: string): string {
  const digits = accountNo.replace(/-/g, "");
  return digits.length > 8 ? digits.slice(8) : "01";
}

/**
 * OAuth 액세스 토큰 발급 (인메모리 캐시).
 * KIS 는 JSON 바디로 토큰을 발급하며, **토큰 발급은 분당 1회로 제한**되고 토큰은 24시간 유효하다.
 * 매 요청마다 신규 발급하면 rate limit(EGW00133 등)에 걸리므로, 워밍된 서버 인스턴스 내에서
 * appKey 별로 토큰을 캐시한다. (콜드스타트 시에는 재발급)
 */
interface CachedToken {
  token: string;
  expiresAt: number; // epoch ms
}
const tokenCache = new Map<string, CachedToken>();

async function fetchToken(creds: KISCreds): Promise<string> {
  const cached = tokenCache.get(creds.appKey);
  // 만료 60초 전까지는 캐시 사용.
  if (cached && cached.expiresAt > Date.now() + 60_000) {
    return cached.token;
  }
  const res = await httpJson<KISTokenResponse>(`${BASE_URL}/oauth2/tokenP`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      grant_type: "client_credentials",
      appkey: creds.appKey,
      appsecret: creds.appSecret,
    }),
  });
  const ttlMs = (res.expires_in ?? 86_400) * 1000;
  tokenCache.set(creds.appKey, {
    token: res.access_token,
    expiresAt: Date.now() + ttlMs,
  });
  return res.access_token;
}

/** 인증 헤더가 붙은 GET 요청. */
async function authorizedGet<T>(
  token: string,
  creds: KISCreds,
  path: string,
  trId: string,
  query: Record<string, string>,
): Promise<T> {
  const qs = new URLSearchParams(query).toString();
  return httpJson<T>(`${BASE_URL}/${path}?${qs}`, {
    method: "GET",
    headers: {
      authorization: `Bearer ${token}`,
      appkey: creds.appKey,
      appsecret: creds.appSecret,
      tr_id: trId,
      custtype: "P",
      "Content-Type": "application/json",
    },
  });
}

/**
 * KIS 계좌 1개(국내 + 해외 통합)를 조회한다.
 * ⚠️ 쿼리 파라미터/응답 스키마는 실제 키로 검증 필요.
 */
export async function fetchKISAccounts(creds: KISCreds): Promise<Account[]> {
  const token = await fetchToken(creds);
  const cano = accountPrefix(creds.accountNo);
  const acntPrdtCd = accountSuffix(creds.accountNo);

  const domestic = await authorizedGet<KISDomesticBalanceResponse>(
    token,
    creds,
    "uapi/domestic-stock/v1/trading/inquire-balance",
    TR_ID.domesticBalance,
    {
      CANO: cano,
      ACNT_PRDT_CD: acntPrdtCd,
      AFHR_FLPR_YN: "N", // 시간외단일가 여부
      OFL_YN: "", // 오프라인 여부 (공란)
      INQR_DVSN: "02", // 02: 종목별
      UNPR_DVSN: "01", // 단가구분
      FUND_STTL_ICLD_YN: "N", // 펀드결제분 포함 여부
      FNCG_AMT_AUTO_RDPT_YN: "N", // 융자금액자동상환 여부
      PRCS_DVSN: "00", // 00: 전일매매 포함
      CTX_AREA_FK100: "",
      CTX_AREA_NK100: "",
    },
  );
  assertOk(domestic, "국내 잔고조회");

  const overseas = await authorizedGet<KISOverseasBalanceResponse>(
    token,
    creds,
    "uapi/overseas-stock/v1/trading/inquire-balance",
    TR_ID.overseasBalance,
    {
      CANO: cano,
      ACNT_PRDT_CD: acntPrdtCd,
      OVRS_EXCG_CD: "NASD", // 잔고조회에서 NASD = 미국전체 (나스닥/뉴욕/아멕스 통합)
      TR_CRCY_CD: "USD",
      CTX_AREA_FK200: "",
      CTX_AREA_NK200: "",
    },
  );
  assertOk(overseas, "해외 잔고조회");

  return [mapKISAccount(domestic, overseas)];
}
