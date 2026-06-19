// 토스증권 원시 응답 → 도메인 모델 변환 (순수 함수). iOS TossMapper.swift 포팅.

import type { Account } from "../../domain/account";
import type { Holding } from "../../domain/holding";
import {
  type TossDomesticBalanceResponse,
  type TossOverseasBalanceResponse,
  flexibleDouble,
} from "./models";

/** 국내 잔고 → 보유 종목. (market: krStock, currency: krw) 수량 0 이하는 제외. */
export function makeTossDomesticHoldings(
  response: TossDomesticBalanceResponse,
): Holding[] {
  return response.holdings.flatMap((item) => {
    const qty = flexibleDouble(item.balance_qty);
    if (qty <= 0) return [];
    return [
      {
        id: crypto.randomUUID(),
        symbol: item.stock_code,
        name: item.stock_name,
        market: "krStock",
        quantity: qty,
        averageCost: flexibleDouble(item.avg_buy_price),
        currentPrice: flexibleDouble(item.current_price),
        currency: "krw",
      } satisfies Holding,
    ];
  });
}

/** 해외 잔고 → 보유 종목. (market: usStock, currency: usd) 수량 0 이하는 제외. */
export function makeTossOverseasHoldings(
  response: TossOverseasBalanceResponse,
): Holding[] {
  return response.holdings.flatMap((item) => {
    const qty = flexibleDouble(item.balance_qty);
    if (qty <= 0) return [];
    return [
      {
        id: crypto.randomUUID(),
        symbol: item.ticker,
        name: item.stock_name,
        market: "usStock",
        quantity: qty,
        averageCost: flexibleDouble(item.avg_buy_price),
        currentPrice: flexibleDouble(item.current_price),
        currency: "usd",
      } satisfies Holding,
    ];
  });
}

/** 국내 + 해외 잔고를 하나의 토스증권 계좌로 묶는다. */
export function mapTossAccount(
  domestic: TossDomesticBalanceResponse,
  overseas: TossOverseasBalanceResponse,
  accountName = "토스증권",
): Account {
  return {
    id: crypto.randomUUID(),
    broker: "tossSecurities",
    accountType: "general",
    name: accountName,
    holdings: [
      ...makeTossDomesticHoldings(domestic),
      ...makeTossOverseasHoldings(overseas),
    ],
  };
}
