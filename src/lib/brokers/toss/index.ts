// 토스증권 계좌 제공자. iOS TossAPIClient + OAuth2TokenProvider + TossRepository 포팅.

import type { Account } from "../../domain/account";
import type { TossCreds } from "../credentialTypes";
import { httpJson } from "../../http";
import { mapTossAccount } from "./mapper";
import type {
  TossDomesticBalanceResponse,
  TossOverseasBalanceResponse,
} from "./models";

const BASE_URL = "https://openapi.tossinvest.com";
// ⚠️ 실제 키로 검증 필요 — 토큰 엔드포인트 경로는 추정값.
const TOKEN_URL = "https://openapi.tossinvest.com/oauth2/token";

/** OAuth2 client_credentials 토큰 응답. */
interface TokenResponse {
  access_token: string;
  token_type?: string;
  expires_in?: number;
}

/**
 * OAuth2 client_credentials 액세스 토큰 발급.
 * 표준 form 바디(application/x-www-form-urlencoded)를 사용한다.
 */
async function fetchToken(creds: TossCreds): Promise<string> {
  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: creds.clientId,
    client_secret: creds.clientSecret,
  }).toString();

  const res = await httpJson<TokenResponse>(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  return res.access_token;
}

/**
 * 토스증권 계좌 1개(국내 + 해외 통합)를 조회한다.
 * ⚠️ 엔드포인트 경로/응답 스키마는 실제 키로 검증 필요.
 */
export async function fetchTossAccounts(creds: TossCreds): Promise<Account[]> {
  const token = await fetchToken(creds);
  const authHeader = { Authorization: `Bearer ${token}` };

  const domestic = await httpJson<TossDomesticBalanceResponse>(
    `${BASE_URL}/api/v1/account/domestic/balance`,
    { method: "GET", headers: authHeader },
  );

  const overseas = await httpJson<TossOverseasBalanceResponse>(
    `${BASE_URL}/api/v1/account/overseas/balance`,
    { method: "GET", headers: authHeader },
  );

  return [mapTossAccount(domestic, overseas)];
}
