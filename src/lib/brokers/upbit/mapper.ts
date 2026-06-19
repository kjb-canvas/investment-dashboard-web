// 업비트 API 원시 응답 → 도메인 모델 변환 (순수 함수). iOS UpbitMapper.swift 포팅.

import type { Account } from "../../domain/account";
import type { Holding } from "../../domain/holding";
import {
  type UpbitAccount,
  type UpbitTicker,
  isFiat,
  krwMarketCode,
  totalQuantity,
} from "./models";

/**
 * 업비트 계좌 + 현재가를 합쳐 보유 종목 목록을 만든다.
 *
 * - 원화(KRW) 잔고는 현금으로 보고 종목 변환에서 제외한다.
 * - 현재가를 찾지 못한 종목은 평단가를 현재가로 사용한다(부분 실패 허용).
 * - 수량 0 이하는 제외한다.
 */
export function makeUpbitHoldings(
  accounts: UpbitAccount[],
  tickers: UpbitTicker[],
): Holding[] {
  const priceByMarket = new Map<string, number>();
  for (const t of tickers) {
    if (!priceByMarket.has(t.market)) {
      priceByMarket.set(t.market, t.trade_price);
    }
  }

  return accounts
    .filter((a) => !isFiat(a) && totalQuantity(a) > 0)
    .map((a) => {
      const avg = Number(a.avg_buy_price) || 0;
      const price = priceByMarket.get(krwMarketCode(a)) ?? avg;
      return {
        id: crypto.randomUUID(),
        symbol: a.currency,
        name: a.currency,
        market: "crypto",
        quantity: totalQuantity(a),
        averageCost: avg,
        currentPrice: price,
        currency: "krw",
      } satisfies Holding;
    });
}

/** 원화(KRW) 현금 잔고 합계. */
export function krwCashBalance(accounts: UpbitAccount[]): number {
  return accounts
    .filter(isFiat)
    .reduce((sum, a) => sum + totalQuantity(a), 0);
}

/** 잔고 + 현재가를 하나의 업비트 코인 지갑 계좌로 묶는다. */
export function mapUpbitAccount(
  balances: UpbitAccount[],
  tickers: UpbitTicker[],
): Account {
  return {
    id: crypto.randomUUID(),
    broker: "upbit",
    accountType: "cryptoWallet",
    name: "업비트",
    holdings: makeUpbitHoldings(balances, tickers),
  };
}
