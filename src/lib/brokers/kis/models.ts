// KIS API DTO — iOS KISModels.swift 포팅.
// 수치는 모두 문자열로 내려온다.

/** `POST /oauth2/tokenP` 응답. */
export interface KISTokenResponse {
  access_token: string;
  token_type?: string;
  expires_in?: number;
  access_token_token_expired?: string;
}

/** KIS 국내 보유 종목 1건. (필드명은 KIS 공식 문서 TTTC8434R output1 기준 — 실제 키 E2E 검증 권장) */
export interface KISDomesticHolding {
  pdno: string; // 상품번호(종목코드) "005930"
  prdt_name: string; // 상품명(종목명)
  hldg_qty: string; // 보유수량
  pchs_avg_pric: string; // 매입평균가격
  prpr: string; // 현재가
}

/** `GET .../domestic-stock/v1/trading/inquire-balance` 응답. */
export interface KISDomesticBalanceResponse {
  output1?: KISDomesticHolding[];
  rt_cd?: string; // "0" 이면 정상
  msg1?: string;
}

/** KIS 해외 보유 종목 1건. (필드명은 KIS 공식 문서 TTTS3012R output1 기준) */
export interface KISOverseasHolding {
  ovrs_pdno: string; // 해외상품번호(종목코드) "AAPL"
  ovrs_item_name: string; // 해외종목명
  ovrs_cblc_qty: string; // 해외잔고수량
  pchs_avg_pric: string; // 매입평균가격
  now_pric2: string; // 현재가격2
  tr_crcy_cd?: string; // 거래통화코드 "USD"
}

/** `GET .../overseas-stock/v1/trading/inquire-balance` 응답. ⚠️ 실제 키로 검증 필요. */
export interface KISOverseasBalanceResponse {
  output1?: KISOverseasHolding[];
  rt_cd?: string;
  msg1?: string;
}
