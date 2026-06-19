// 토스 원시 응답 → 도메인 모델 변환 (순수 함수).

import type { Account } from "../../domain/account";
import type { Holding } from "../../domain/holding";
import { flexibleDouble, type TossHoldingsOverview } from "./models";

/** 보유 종목 변환. marketCountry/currency 로 국내·해외를 구분한다. 수량 0 이하는 제외. */
export function makeTossHoldings(overview: TossHoldingsOverview): Holding[] {
  return (overview.items ?? []).flatMap((item) => {
    const qty = flexibleDouble(item.quantity);
    if (qty <= 0) return [];
    return [
      {
        id: crypto.randomUUID(),
        symbol: item.symbol,
        name: item.name,
        market: item.marketCountry === "US" ? "usStock" : "krStock",
        quantity: qty,
        averageCost: flexibleDouble(item.averagePurchasePrice),
        currentPrice: flexibleDouble(item.lastPrice),
        currency: item.currency === "USD" ? "usd" : "krw",
      } satisfies Holding,
    ];
  });
}

/** 한 토스 계좌의 보유 종목을 도메인 Account 로 묶는다. */
export function mapTossAccount(
  overview: TossHoldingsOverview,
  accountName = "토스증권",
): Account {
  return {
    id: crypto.randomUUID(),
    broker: "tossSecurities",
    accountType: "general",
    name: accountName,
    holdings: makeTossHoldings(overview),
  };
}
