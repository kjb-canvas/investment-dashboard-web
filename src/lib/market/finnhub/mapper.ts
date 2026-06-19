// Finnhub 응답 DTO 및 순수 매핑 함수 — iOS InvestAppCore/Data/Finnhub/FinnhubModels.swift + FinnhubClient.swift 포팅.
// 네트워크 없이 단위 테스트 가능하도록 파싱/매핑만 분리.

import type { Quote } from "../types";
import type { DividendSchedule } from "../../domain/dividend";

/** `GET /quote?symbol=` 응답. `c` = current price. */
export interface FinnhubQuoteDTO {
  c: number; // current price
  // h/l/o/pc 등 다른 필드는 사용하지 않으므로 생략.
}

/**
 * `GET /stock/dividend?symbol=&from=&to=` 응답 1건.
 * 날짜는 "yyyy-MM-dd" 문자열.
 */
export interface FinnhubDividendDTO {
  symbol: string;
  date: string; // 배당락일 (exDate)
  payDate: string; // 지급일
  amount: number; // 1주당 배당금 (USD)
}

/** "yyyy-MM-dd" 문자열을 UTC Date 로 파싱. */
export function parseUtcDate(iso: string): Date {
  // ISO 날짜만 있는 문자열은 UTC 자정으로 해석된다.
  return new Date(`${iso}T00:00:00Z`);
}

/** "yyyy-MM-dd" (UTC) 포맷 문자열. Finnhub from/to 쿼리에 사용. */
export function formatUtcDate(date: Date): string {
  const y = date.getUTCFullYear().toString().padStart(4, "0");
  const m = (date.getUTCMonth() + 1).toString().padStart(2, "0");
  const d = date.getUTCDate().toString().padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** quote 응답 → Quote. `c` 필드가 현재가. */
export function mapQuote(symbol: string, dto: FinnhubQuoteDTO): Quote {
  return { symbol, price: dto.c };
}

/**
 * dividend 응답 배열 → DividendSchedule[].
 *
 * iOS FinnhubClient.dividends 와 동일:
 * - amount(USD) → amountPerShare
 * - totalAmount = 0 (보유 수량/환율을 아는 상위 계층에서 채운다)
 * - isConfirmed = true
 * - exDividendDate = date, paymentDate = payDate (파싱 실패 시 fallback)
 */
export function mapDividends(dtos: FinnhubDividendDTO[]): DividendSchedule[] {
  return dtos.map((dto) => {
    const exParsed = parseUtcDate(dto.date);
    const exDividendDate = Number.isNaN(exParsed.getTime())
      ? new Date(0)
      : exParsed;
    const payParsed = parseUtcDate(dto.payDate);
    const paymentDate = Number.isNaN(payParsed.getTime())
      ? exDividendDate
      : payParsed;
    return {
      id: crypto.randomUUID(),
      symbol: dto.symbol,
      exDividendDate,
      paymentDate,
      amountPerShare: dto.amount,
      totalAmount: 0,
      isConfirmed: true,
    };
  });
}
