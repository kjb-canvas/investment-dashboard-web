// 토스증권 API DTO — iOS TossModels.swift 포팅.
// ⚠️ 실제 키로 검증 필요 — 필드명/중첩 구조는 추정값이다.

/**
 * 문자열("123.45") 또는 숫자(123.45)로 내려올 수 있는 수치 필드를 모두 수용한다.
 * iOS FlexibleDouble 포팅. 콤마 천단위 구분자를 제거 후 파싱하며 실패 시 0.
 */
export function flexibleDouble(raw: unknown): number {
  if (typeof raw === "number") {
    return Number.isFinite(raw) ? raw : 0;
  }
  if (typeof raw === "string") {
    const cleaned = raw.replace(/,/g, "").trim();
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

/** 토스 국내 보유 종목 1건 (원시 응답). ⚠️ 실제 키로 검증 필요. */
export interface TossDomesticHolding {
  stock_code: string; // 종목코드 "005930"
  stock_name: string; // 종목명
  balance_qty: string | number; // 보유수량
  avg_buy_price: string | number; // 평균 매입가 (KRW)
  current_price: string | number; // 현재가 (KRW)
}

/** 토스 국내 주식 잔고 응답. ⚠️ 실제 키로 검증 필요. */
export interface TossDomesticBalanceResponse {
  holdings: TossDomesticHolding[];
}

/** 토스 해외 보유 종목 1건 (원시 응답). ⚠️ 실제 키로 검증 필요. */
export interface TossOverseasHolding {
  ticker: string; // "AAPL"
  stock_name: string; // 종목명
  balance_qty: string | number; // 보유수량
  avg_buy_price: string | number; // 평균 매입가 (USD)
  current_price: string | number; // 현재가 (USD)
  currency?: string; // "USD"
}

/** 토스 해외 주식 잔고 응답. ⚠️ 실제 키로 검증 필요. */
export interface TossOverseasBalanceResponse {
  holdings: TossOverseasHolding[];
}
