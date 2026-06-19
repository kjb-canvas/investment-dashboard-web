// 업비트 API DTO — iOS UpbitModels.swift 포팅.

/** `GET /v1/accounts` 응답 1건. 모든 수치는 문자열로 내려온다. */
export interface UpbitAccount {
  currency: string; // "BTC", "KRW", "USDT"
  balance: string; // 주문 가능 수량
  locked: string; // 주문 중 묶인 수량
  avg_buy_price: string; // 매수 평균가
  avg_buy_price_modified: boolean;
  unit_currency: string; // 평단 기준 통화 "KRW"
}

/** `GET /v1/ticker?markets=...` 응답 1건. (인증 불필요) */
export interface UpbitTicker {
  market: string; // "KRW-BTC"
  trade_price: number; // 현재가
}

/** 보유 총수량(가용 + 잠김). */
export function totalQuantity(account: UpbitAccount): number {
  return (Number(account.balance) || 0) + (Number(account.locked) || 0);
}

/** 업비트 마켓 코드(KRW 마켓 기준). 예: BTC → "KRW-BTC". */
export function krwMarketCode(account: UpbitAccount): string {
  return `KRW-${account.currency}`;
}

/** 원화 현금 잔고 여부. */
export function isFiat(account: UpbitAccount): boolean {
  return account.currency === "KRW";
}
