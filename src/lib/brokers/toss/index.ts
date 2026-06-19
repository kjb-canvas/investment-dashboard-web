// 토스증권 계좌 제공자. 토스 Open API(openapi.tossinvest.com) 공식 스펙 기준.
// 흐름: OAuth2 토큰 → GET /api/v1/accounts(계좌목록) → 계좌별 GET /api/v1/holdings
//       (X-Tossinvest-Account: accountSeq 헤더 필수, 국내+해외 통합 응답).

import type { Account } from "../../domain/account";
import type { TossCreds } from "../credentialTypes";
import { httpJson } from "../../http";
import { mapTossAccount } from "./mapper";
import type {
  TossApiResponse,
  TossAccount,
  TossHoldingsOverview,
  TossTokenResponse,
} from "./models";

const BASE_URL = "https://openapi.tossinvest.com";
const TOKEN_URL = `${BASE_URL}/oauth2/token`;

/** 토큰 인메모리 캐시 (clientId 별). 토스 토큰은 약 1시간 유효. */
interface CachedToken {
  token: string;
  expiresAt: number;
}
const tokenCache = new Map<string, CachedToken>();

async function fetchToken(creds: TossCreds): Promise<string> {
  const cached = tokenCache.get(creds.clientId);
  if (cached && cached.expiresAt > Date.now() + 60_000) return cached.token;

  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: creds.clientId,
    client_secret: creds.clientSecret,
  }).toString();

  const res = await httpJson<TossTokenResponse>(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const ttlMs = (res.expires_in ?? 3600) * 1000;
  tokenCache.set(creds.clientId, {
    token: res.access_token,
    expiresAt: Date.now() + ttlMs,
  });
  return res.access_token;
}

/** 토스증권 계좌(들)를 조회한다. 계좌가 여러 개면 각각을 도메인 Account 로 반환. */
export async function fetchTossAccounts(creds: TossCreds): Promise<Account[]> {
  const token = await fetchToken(creds);
  const authHeader = { Authorization: `Bearer ${token}` };

  const accountsRes = await httpJson<TossApiResponse<TossAccount[]>>(
    `${BASE_URL}/api/v1/accounts`,
    { method: "GET", headers: authHeader },
  );
  const accounts = accountsRes.result ?? [];

  const results = await Promise.all(
    accounts.map(async (acc) => {
      const holdingsRes = await httpJson<TossApiResponse<TossHoldingsOverview>>(
        `${BASE_URL}/api/v1/holdings`,
        {
          method: "GET",
          headers: {
            ...authHeader,
            "X-Tossinvest-Account": String(acc.accountSeq),
          },
        },
      );
      return mapTossAccount(holdingsRes.result, `토스증권 ${acc.accountNo}`);
    }),
  );

  return results;
}
