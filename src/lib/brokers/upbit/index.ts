// 업비트 계좌 제공자. iOS UpbitAPIClient + UpbitRepository 포팅.

import type { Account } from "../../domain/account";
import type { UpbitCreds } from "../credentialTypes";
import { httpJson } from "../../http";
import { makeUpbitToken } from "./auth";
import { mapUpbitAccount } from "./mapper";
import {
  type UpbitAccount,
  type UpbitTicker,
  isFiat,
  krwMarketCode,
  totalQuantity,
} from "./models";

const BASE_URL = "https://api.upbit.com/v1";

/**
 * 업비트 계좌(코인 지갑 1개)를 조회한다.
 *
 * 1. `GET /v1/accounts` (JWT 인증) 로 잔고 조회.
 * 2. 보유 코인의 KRW 마켓 현재가를 `GET /v1/ticker?markets=...` 로 조회(인증 불필요).
 * 3. 둘을 합쳐 단일 Account 로 매핑.
 */
export async function fetchUpbitAccounts(
  creds: UpbitCreds,
): Promise<Account[]> {
  const token = makeUpbitToken(creds.accessKey, creds.secretKey);

  const balances = await httpJson<UpbitAccount[]>(`${BASE_URL}/accounts`, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  });

  // 코인 보유분의 마켓 코드만 추려 현재가 조회 (KRW 현금 제외)
  const markets = balances
    .filter((a) => !isFiat(a) && totalQuantity(a) > 0)
    .map(krwMarketCode);

  const tickers =
    markets.length === 0
      ? []
      : await httpJson<UpbitTicker[]>(
          `${BASE_URL}/ticker?markets=${encodeURIComponent(markets.join(","))}`,
          { method: "GET" },
        );

  return [mapUpbitAccount(balances, tickers)];
}
