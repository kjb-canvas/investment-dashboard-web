// iOS InvestAppCore/Domain/UseCases/FetchTotalAssetsUseCase.swift 포팅.

import type { Account } from "../domain/account";
import {
  type Holding,
  evaluatedValueKRW,
  costBasisKRW,
  profitLossKRW,
} from "../domain/holding";
import type { TotalAssets } from "./types";

/** 모든 계좌의 보유 종목을 환율로 KRW 환산해 총자산을 집계한다. */
export function fetchTotalAssets(
  accounts: Account[],
  usdToKrw: number,
): TotalAssets {
  const holdings: Holding[] = accounts.flatMap((a) => a.holdings);

  const totalValue = holdings.reduce(
    (sum, h) => sum + evaluatedValueKRW(h, usdToKrw),
    0,
  );
  const principal = holdings.reduce(
    (sum, h) => sum + costBasisKRW(h, usdToKrw),
    0,
  );
  const profitLoss = totalValue - principal;
  const rate = principal !== 0 ? (profitLoss / principal) * 100 : 0;

  const today = holdings.reduce((sum, h) => sum + profitLossKRW(h, usdToKrw), 0);

  return {
    totalValue,
    principal,
    totalProfitLoss: profitLoss,
    totalProfitLossRate: rate,
    todayProfitLoss: today,
  };
}
