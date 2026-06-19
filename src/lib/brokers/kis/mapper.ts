// KIS 원시 응답 → 도메인 모델 변환 (순수 함수). iOS KISMapper.swift 포팅.

import type { Account } from "../../domain/account";
import type { Holding } from "../../domain/holding";
import type {
  KISDomesticBalanceResponse,
  KISOverseasBalanceResponse,
} from "./models";

/** 콤마/공백을 제거하고 숫자로 파싱한다. 실패 시 0. */
function parseNumber(s: string): number {
  const cleaned = s.replace(/,/g, "").trim();
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : 0;
}

/** 국내 잔고 → 보유 종목. (market: krStock, currency: krw) 수량 0 이하는 제외. */
export function makeKISDomesticHoldings(
  response: KISDomesticBalanceResponse,
): Holding[] {
  return (response.output1 ?? []).flatMap((item) => {
    const qty = parseNumber(item.hldg_qty);
    if (qty <= 0) return [];
    return [
      {
        id: crypto.randomUUID(),
        symbol: item.pdno,
        name: item.prdt_name,
        market: "krStock",
        quantity: qty,
        averageCost: parseNumber(item.pchs_avg_pric),
        currentPrice: parseNumber(item.prpr),
        currency: "krw",
      } satisfies Holding,
    ];
  });
}

/** 해외 잔고 → 보유 종목. (market: usStock, currency: usd) 수량 0 이하는 제외. */
export function makeKISOverseasHoldings(
  response: KISOverseasBalanceResponse,
): Holding[] {
  return (response.output1 ?? []).flatMap((item) => {
    const qty = parseNumber(item.ovrs_cblc_qty);
    if (qty <= 0) return [];
    return [
      {
        id: crypto.randomUUID(),
        symbol: item.ovrs_pdno,
        name: item.ovrs_item_name,
        market: "usStock",
        quantity: qty,
        averageCost: parseNumber(item.pchs_avg_pric),
        currentPrice: parseNumber(item.now_pric2),
        currency: "usd",
      } satisfies Holding,
    ];
  });
}

/** 국내 + 해외 잔고를 하나의 KIS 계좌로 묶는다. */
export function mapKISAccount(
  domestic: KISDomesticBalanceResponse,
  overseas: KISOverseasBalanceResponse,
  accountName = "한국투자증권",
): Account {
  return {
    id: crypto.randomUUID(),
    broker: "kis",
    accountType: "general",
    name: accountName,
    holdings: [
      ...makeKISDomesticHoldings(domestic),
      ...makeKISOverseasHoldings(overseas),
    ],
  };
}
