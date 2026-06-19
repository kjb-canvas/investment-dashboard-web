// 환율 응답 DTO 및 순수 파서 — iOS InvestAppCore/Data/ExchangeRate/
// BOKExchangeRateClient.swift + FallbackExchangeRateClient.swift 포팅.
// 네트워크 없이 단위 테스트 가능하도록 파싱만 분리.

// MARK: - BOK(ECOS) 응답 모델

/** ECOS StatisticSearch row. */
export interface BokRow {
  DATA_VALUE: string;
  TIME: string;
}

/** ECOS StatisticSearch 성공 응답 엔벨로프. */
export interface BokSearchEnvelope {
  StatisticSearch?: {
    row?: BokRow[];
  };
}

/** ECOS 에러 응답 엔벨로프. 오류 시 `RESULT` 키가 존재한다. */
export interface BokErrorEnvelope {
  RESULT?: {
    CODE?: string;
    MESSAGE?: string;
  };
}

/** ECOS 응답 (성공/에러 엔벨로프 모두 포함 가능). */
export type BokResponse = BokSearchEnvelope & BokErrorEnvelope;

// MARK: - Fallback(open.er-api) 응답 모델

export interface ERAPIResponse {
  result: string;
  rates: Record<string, number>;
}

// MARK: - 파서

/**
 * ECOS 응답에서 최신 USD/KRW 매매기준율을 추출한다.
 *
 * iOS BOKExchangeRateClient 와 동일:
 * - RESULT(에러 엔벨로프)가 있으면 에러.
 * - row 를 TIME 내림차순 정렬 후 첫 유효(비공백, 숫자) DATA_VALUE 반환.
 * - 유효 값 없으면 에러.
 */
export function parseEcosResponse(json: BokResponse): number {
  if (json.RESULT != null) {
    const code = json.RESULT.CODE ?? "UNKNOWN";
    const message = json.RESULT.MESSAGE ?? "ECOS API 오류";
    throw new Error(`ECOS 오류: [${code}] ${message}`);
  }

  const rows = json.StatisticSearch?.row;
  if (!Array.isArray(rows)) {
    throw new Error("ECOS 응답 형식 오류: StatisticSearch.row 없음");
  }

  // TIME 내림차순 정렬 (가장 최신 우선).
  const sorted = [...rows].sort((a, b) => (a.TIME > b.TIME ? -1 : a.TIME < b.TIME ? 1 : 0));

  for (const row of sorted) {
    const trimmed = row.DATA_VALUE.trim();
    if (trimmed.length === 0) continue;
    const value = Number(trimmed);
    if (!Number.isNaN(value)) {
      return value;
    }
  }

  throw new Error(`유효한 환율 데이터 없음 (rows: ${sorted.length})`);
}

/**
 * open.er-api 응답에서 USD/KRW 환율을 추출한다.
 *
 * iOS FallbackExchangeRateClient 와 동일:
 * - result == "success" 가 아니면 에러.
 * - rates.KRW 없으면 에러.
 */
export function parseFallbackResponse(json: ERAPIResponse): number {
  if (json.result !== "success") {
    throw new Error(`open.er-api: result=${json.result}`);
  }
  const krw = json.rates?.KRW;
  if (krw == null) {
    throw new Error("KRW 환율 키가 응답에 없음");
  }
  return krw;
}
