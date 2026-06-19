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
 * OAuth 액세스 토큰 발급.
 * KIS 는 표준 form 바디가 아니라 JSON 바디로 토큰을 발급한다.
 */
async function fetchToken(creds: KISCreds): Promise<string> {
  const res = await httpJson<KISTokenResponse>(`${BASE_URL}/oauth2/tokenP`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      grant_type: "client_credentials",
      appkey: creds.appKey,
      appsecret: creds.appSecret,
    }),
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
      AFHR_FLPR_YN: "N",
      INQR_DVSN: "02",
      UNPR_DVSN: "01",
      FUND_STTL_ICLD_YN: "N",
      FNCG_AMT_AUTO_RDPT_YN: "N",
      PRCS_DVSN: "00",
      CTX_AREA_FK100: "",
      CTX_AREA_NK100: "",
    },
  );

  const overseas = await authorizedGet<KISOverseasBalanceResponse>(
    token,
    creds,
    "uapi/overseas-stock/v1/trading/inquire-balance",
    TR_ID.overseasBalance,
    {
      CANO: cano,
      ACNT_PRDT_CD: acntPrdtCd,
      OVRS_EXCG_CD: "NASD",
      TR_CRCY_CD: "USD",
      CTX_AREA_FK200: "",
      CTX_AREA_NK200: "",
    },
  );

  return [mapKISAccount(domestic, overseas)];
}
