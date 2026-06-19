// KIS API DTO — iOS KISModels.swift 포팅.
// 수치는 모두 문자열로 내려온다.

/** `POST /oauth2/tokenP` 응답. */
export interface KISTokenResponse {
  access_token: string;
  token_type?: string;
  expires_in?: number;
  access_token_token_expired?: string;
}

/** KIS 국내 보유 종목 1건. ⚠️ 실제 키로 검증 필요 (필드명은 추정값). */
export interface KISDomesticHolding {
  pdno: string; // 종목코드 "005930"
  prdt_name: string; // 종목명
  hldg_qty: string; // 보유수량
  pchs_avg_pric: string; // 매입평균가
  prpr: string; // 현재가
}

/** `GET .../domestic-stock/v1/trading/inquire-balance` 응답. ⚠️ 실제 키로 검증 필요. */
export interface KISDomesticBalanceResponse {
  output1?: KISDomesticHolding[];
  rt_cd?: string; // "0" 이면 정상
  msg1?: string;
}

/** KIS 해외 보유 종목 1건. ⚠️ 실제 키로 검증 필요. */
export interface KISOverseasHolding {
  ovrs_pdno: string; // 해외 종목코드 "AAPL"
  ovrs_item_name: string; // 종목명
  ovrs_cblc_qty: string; // 보유수량
  pchs_avg_pric: string; // 매입평균가
  now_pric2: string; // 현재가
  tr_crcy_cd?: string; // 거래통화 "USD"
}

/** `GET .../overseas-stock/v1/trading/inquire-balance` 응답. ⚠️ 실제 키로 검증 필요. */
export interface KISOverseasBalanceResponse {
  output1?: KISOverseasHolding[];
  rt_cd?: string;
  msg1?: string;
}
