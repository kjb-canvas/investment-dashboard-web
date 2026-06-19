// 도메인 모델 — iOS InvestAppCore/Domain/Models/Account.swift 포팅.

import {
  type Broker,
  type Holding,
  evaluatedValueKRW,
} from "./holding";

export type AccountType =
  | "general" // 일반 위탁
  | "cma"
  | "isa"
  | "ria" // 일임/RIA
  | "cryptoWallet";

/** 한 계좌(거래소/증권사 계정)와 그 보유 종목. */
export interface Account {
  id: string;
  broker: Broker;
  accountType: AccountType;
  name: string;
  holdings: Holding[];
}

/** 지정 환율 기준 계좌 총 평가금액(KRW). */
export function totalValueKRW(account: Account, usdToKrw: number): number {
  return account.holdings.reduce(
    (sum, h) => sum + evaluatedValueKRW(h, usdToKrw),
    0,
  );
}
