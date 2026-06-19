// iOS InvestAppCore/Domain/UseCases/PortfolioWeightUseCase.swift 포팅.

import { type Account, totalValueKRW } from "../domain/account";
import { type Holding, evaluatedValueKRW } from "../domain/holding";
import type { WeightDimension, WeightSlice } from "./types";

/**
 * 분류 기준별 비중 조각. 비중(percent) 내림차순 정렬.
 * percent 합계는 (값이 있을 경우) 약 100 이 된다.
 */
export function portfolioWeights(
  accounts: Account[],
  dimension: WeightDimension,
  usdToKrw: number,
): WeightSlice[] {
  const values = new Map<string, number>();
  const labels = new Map<string, string>();
  const order: string[] = [];

  const add = (key: string, label: string, value: number) => {
    if (!values.has(key)) {
      order.push(key);
      labels.set(key, label);
    }
    values.set(key, (values.get(key) ?? 0) + value);
  };

  for (const account of accounts) {
    if (dimension === "account") {
      add(account.id, account.name, totalValueKRW(account, usdToKrw));
      continue;
    }
    for (const holding of account.holdings) {
      const v = evaluatedValueKRW(holding, usdToKrw);
      const { key, label } = classify(holding, dimension);
      add(key, label, v);
    }
  }

  const total = [...values.values()].reduce((s, v) => s + v, 0);
  const slices = order.map((key): WeightSlice => {
    const value = values.get(key) ?? 0;
    const percent = total !== 0 ? (value / total) * 100 : 0;
    return { label: labels.get(key) ?? key, valueKRW: value, percent };
  });
  return slices.sort((a, b) => b.percent - a.percent);
}

function classify(
  holding: Holding,
  dimension: WeightDimension,
): { key: string; label: string } {
  switch (dimension) {
    case "holding":
      return { key: holding.id, label: holding.name };
    case "type":
      return holding.market === "crypto"
        ? { key: "crypto", label: "코인" }
        : { key: "stock", label: "주식" };
    case "country":
      switch (holding.market) {
        case "usStock":
          return { key: "us", label: "미국" };
        case "krStock":
          return { key: "kr", label: "한국" };
        case "crypto":
          return { key: "crypto", label: "코인" };
      }
    case "exchange":
      switch (holding.market) {
        case "crypto":
          return { key: "upbit", label: "업비트" };
        case "krStock":
          return { key: "krx", label: "KRX" };
        case "usStock":
          return { key: "etc", label: "기타" };
      }
    case "account":
      // account 차원은 호출부에서 처리되어 도달하지 않음.
      return { key: holding.id, label: holding.name };
  }
}
