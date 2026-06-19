// USD→KRW 환율 제공자 — iOS InvestAppCore/Data/ExchangeRate/ 포팅.
// Primary: 한국은행 ECOS, Fallback: open.er-api.com.
// ExchangeRateRepository 동작(primary 실패 시 fallback)을 단일 함수로 합쳤다.
// 서버 전용 (no 'use client').

import { httpJson } from "../../http";
import type { EcosCreds } from "../../brokers/credentialTypes";
import {
  type BokResponse,
  type ERAPIResponse,
  parseEcosResponse,
  parseFallbackResponse,
} from "./parser";

// ECOS StatisticSearch API.
// 통계표 코드 731Y001, 항목 코드 0000001(원/미국달러 매매기준율), 주기 D.
const ECOS_BASE_URL = "https://ecos.bok.or.kr/api/StatisticSearch";
const ECOS_STAT_CODE = "731Y001";
const ECOS_ITEM_CODE = "0000001";
const FALLBACK_URL = "https://open.er-api.com/v6/latest/USD";

/** 오늘 기준 `days`일 이전부터 오늘까지의 (start, end) yyyyMMdd 문자열. Asia/Seoul. */
function recentDateRange(days: number): { start: string; end: string } {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  // en-CA → "yyyy-MM-dd"; "-" 제거해 yyyyMMdd 로.
  const toYmd = (d: Date): string => fmt.format(d).replace(/-/g, "");
  const today = new Date();
  const start = new Date(today.getTime() - (days - 1) * 24 * 60 * 60 * 1000);
  return { start: toYmd(start), end: toYmd(today) };
}

function ecosUrl(apiKey: string): string {
  const { start, end } = recentDateRange(7);
  // .../{KEY}/json/kr/1/10/{STAT}/D/{start}/{end}/{ITEM}
  return `${ECOS_BASE_URL}/${encodeURIComponent(apiKey)}/json/kr/1/10/${ECOS_STAT_CODE}/D/${start}/${end}/${ECOS_ITEM_CODE}`;
}

/** Primary: ECOS 에서 최신 USD/KRW 조회. */
async function fetchEcosRate(apiKey: string): Promise<number> {
  const json = await httpJson<BokResponse>(ecosUrl(apiKey));
  return parseEcosResponse(json);
}

/** Fallback: open.er-api 에서 USD/KRW 조회. */
async function fetchFallbackRate(): Promise<number> {
  const json = await httpJson<ERAPIResponse>(FALLBACK_URL);
  return parseFallbackResponse(json);
}

/**
 * 최신 USD→KRW 환율을 반환한다.
 *
 * - creds 가 있으면 ECOS(primary) 먼저 시도.
 * - creds 가 null 이거나 ECOS 실패 시 open.er-api(fallback) 사용.
 *   (iOS ExchangeRateRepository: primary 실패 → fallback)
 */
export async function fetchExchangeRate(
  creds: EcosCreds | null,
): Promise<number> {
  if (creds != null) {
    try {
      return await fetchEcosRate(creds.apiKey);
    } catch {
      // primary 실패 → fallback 으로 전환.
    }
  }
  return fetchFallbackRate();
}
