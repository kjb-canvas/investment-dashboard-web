// 시세·환율·배당 제공자 규약.

import type { DividendSchedule } from "../domain/dividend";
import type { FinnhubCreds, EcosCreds } from "../brokers/credentialTypes";

/** 종목 현재가. */
export interface Quote {
  symbol: string;
  price: number; // 원 통화(미국주식이면 USD)
}

/** USD→KRW 환율 제공자. creds 가 null 이면 공개 폴백 사용. */
export type ExchangeRateProvider = (creds: EcosCreds | null) => Promise<number>;

/** 미국주식 현재가 조회. */
export type QuoteProvider = (
  creds: FinnhubCreds,
  symbols: string[],
) => Promise<Quote[]>;

/** 배당 일정 조회. */
export type DividendProvider = (
  creds: FinnhubCreds,
  symbols: string[],
  from: Date,
  to: Date,
) => Promise<DividendSchedule[]>;
