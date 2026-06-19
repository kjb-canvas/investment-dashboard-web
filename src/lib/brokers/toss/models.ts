// 토스증권 Open API DTO — 공식 OpenAPI 스펙(openapi.tossinvest.com /openapi-docs/latest) 기준.
// 잔고는 /api/v1/accounts 로 accountSeq 획득 후 /api/v1/holdings 로 조회한다(국내+해외 통합).

/**
 * 문자열("123.45") 또는 숫자(123.45)로 내려올 수 있는 수치 필드를 모두 수용한다.
 * 토스는 가격/수량을 문자열로 내려준다. 콤마 제거 후 파싱, 실패 시 0.
 */
export function flexibleDouble(raw: unknown): number {
  if (typeof raw === "number") return Number.isFinite(raw) ? raw : 0;
  if (typeof raw === "string") {
    const cleaned = raw.replace(/,/g, "").trim();
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

/** 모든 응답은 { result } 래퍼로 감싸진다. */
export interface TossApiResponse<T> {
  result: T;
}

/** OAuth2 client_credentials 토큰 응답. */
export interface TossTokenResponse {
  access_token: string;
  token_type?: string;
  expires_in?: number; // 초 (3600)
}

/** `GET /api/v1/accounts` 의 계좌 1건. */
export interface TossAccount {
  accountNo: string; // 계좌번호
  accountSeq: number; // 계좌 식별 키 — API 호출 시 X-Tossinvest-Account 헤더에 사용
  accountType: string; // 현재 "BROKERAGE" 만 지원
}

/** `GET /api/v1/holdings` 의 보유 종목 1건. */
export interface TossHoldingsItem {
  symbol: string; // 종목 심볼. KR: 6자리 숫자, US: 티커
  name: string; // 종목명
  quantity: string; // 보유 수량
  averagePurchasePrice: string; // 매수 평균가 (currency 기준)
  lastPrice: string; // 현재가 (currency 기준)
  currency: "KRW" | "USD"; // 거래 통화
  marketCountry: "KR" | "US"; // 시장 국가
}

/** `GET /api/v1/holdings` 응답의 result. */
export interface TossHoldingsOverview {
  items: TossHoldingsItem[];
}
