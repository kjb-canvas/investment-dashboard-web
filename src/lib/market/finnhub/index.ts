// Finnhub 시세/배당 제공자 — iOS InvestAppCore/Data/Finnhub/FinnhubClient.swift 포팅.
// 서버 전용 (no 'use client'). 인증 토큰은 쿼리 파라미터 `token` 으로 전달.

import { httpJson } from "../../http";
import type { FinnhubCreds } from "../../brokers/credentialTypes";
import type { Quote } from "../types";
import type { DividendSchedule } from "../../domain/dividend";
import {
  type FinnhubQuoteDTO,
  type FinnhubDividendDTO,
  mapQuote,
  mapDividends,
  formatUtcDate,
} from "./mapper";

const BASE_URL = "https://finnhub.io/api/v1";

function quoteUrl(symbol: string, token: string): string {
  return `${BASE_URL}/quote?symbol=${encodeURIComponent(symbol)}&token=${encodeURIComponent(token)}`;
}

function dividendUrl(
  symbol: string,
  from: Date,
  to: Date,
  token: string,
): string {
  const params = new URLSearchParams({
    symbol,
    from: formatUtcDate(from),
    to: formatUtcDate(to),
    token,
  });
  return `${BASE_URL}/stock/dividend?${params.toString()}`;
}

/**
 * 현재가 조회 (`GET /quote?symbol=&token=`, `c` = current price).
 * 심볼별 1요청(Promise.all). 개별 실패는 건너뛴다.
 */
export async function fetchFinnhubQuotes(
  creds: FinnhubCreds,
  symbols: string[],
): Promise<Quote[]> {
  const results = await Promise.all(
    symbols.map(async (symbol): Promise<Quote | null> => {
      try {
        const dto = await httpJson<FinnhubQuoteDTO>(
          quoteUrl(symbol, creds.apiKey),
        );
        return mapQuote(symbol, dto);
      } catch {
        // 개별 심볼 실패는 무시하고 건너뛴다.
        return null;
      }
    }),
  );
  return results.filter((q): q is Quote => q !== null);
}

/**
 * 배당 일정 조회 (`GET /stock/dividend?symbol=&from=&to=&token=`).
 * 심볼별 1요청(Promise.all). 개별 실패는 건너뛴다.
 */
export async function fetchFinnhubDividends(
  creds: FinnhubCreds,
  symbols: string[],
  from: Date,
  to: Date,
): Promise<DividendSchedule[]> {
  const results = await Promise.all(
    symbols.map(async (symbol): Promise<DividendSchedule[]> => {
      try {
        const dtos = await httpJson<FinnhubDividendDTO[]>(
          dividendUrl(symbol, from, to, creds.apiKey),
        );
        return mapDividends(dtos);
      } catch {
        return [];
      }
    }),
  );
  return results.flat();
}
