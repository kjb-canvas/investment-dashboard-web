// 서버 데이터 오케스트레이션 — 모든 소스를 병렬 조회해 PortfolioData 로 묶는다.
// iOS HomeViewModel.refresh() 의 "병렬 페치 + 부분 실패 허용" 을 서버로 옮긴 것.
// 서버 전용(자격증명 복호화 + Supabase). 클라이언트에서 import 금지.

import type { SupabaseClient } from "@supabase/supabase-js";
import { loadAllCredentials } from "../brokers/credentials";
import { fetchUpbitAccounts } from "../brokers/upbit";
import { fetchKISAccounts } from "../brokers/kis";
import { fetchTossAccounts } from "../brokers/toss";
import { fetchExchangeRate } from "../market/exchangeRate";
import type { Account } from "../domain/account";
import type { Holding } from "../domain/holding";
import type {
  UpbitCreds,
  KISCreds,
  TossCreds,
  EcosCreds,
} from "../brokers/credentialTypes";
import type { PortfolioData, BrokerError } from "./contracts";
import { createClient } from "../supabase/server";

const DEFAULT_USD_KRW = 1300;

/** 현재 로그인 사용자의 포트폴리오. 미로그인이면 null. (페이지용 편의 래퍼) */
export async function fetchCurrentUserPortfolio(): Promise<PortfolioData | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  return fetchPortfolio(supabase, user.id);
}

/** 한 사용자의 모든 자산을 병렬 조회한다. 한 소스가 실패해도 나머지는 반영. */
export async function fetchPortfolio(
  supabase: SupabaseClient,
  userId: string,
): Promise<PortfolioData> {
  const creds = await loadAllCredentials(supabase, userId);
  const errors: BrokerError[] = [];

  // 환율: ECOS 자격증명이 있으면 사용, 없으면 공개 폴백.
  const ecos = creds.find((c) => c.broker === "ecos")?.creds as
    | EcosCreds
    | undefined;
  const ratePromise = fetchExchangeRate(ecos ?? null).catch((e) => {
    errors.push({ broker: "ecos", error: errMsg(e) });
    return DEFAULT_USD_KRW;
  });

  // 계좌 제공자: 자격증명 있는 소스만 병렬 호출.
  const accountTasks: Promise<Account[]>[] = [];
  for (const c of creds) {
    const task = providerFor(c.broker, c.creds);
    if (task) {
      accountTasks.push(
        task.catch((e) => {
          errors.push({ broker: c.broker, error: errMsg(e) });
          return [];
        }),
      );
    }
  }

  const [usdToKrw, accountGroups, nhAccounts] = await Promise.all([
    ratePromise,
    Promise.all(accountTasks),
    fetchNHFromCache(supabase, userId).catch((e) => {
      errors.push({ broker: "nhInvestment", error: errMsg(e) });
      return [] as Account[];
    }),
  ]);

  const accounts = [...accountGroups.flat(), ...nhAccounts];

  return {
    accounts,
    usdToKrw,
    errors,
    fetchedAt: new Date().toISOString(),
  };
}

function providerFor(
  broker: string,
  creds: unknown,
): Promise<Account[]> | null {
  switch (broker) {
    case "upbit":
      return fetchUpbitAccounts(creds as UpbitCreds);
    case "kis":
      return fetchKISAccounts(creds as KISCreds);
    case "tossSecurities":
      return fetchTossAccounts(creds as TossCreds);
    default:
      // finnhub/ecos 는 계좌 제공자가 아님, nhInvestment 는 캐시에서 읽음.
      return null;
  }
}

/** NH(나무)는 PC 브릿지가 holdings_cache 에 올린 데이터를 읽어 Account 로 만든다. */
async function fetchNHFromCache(
  supabase: SupabaseClient,
  userId: string,
): Promise<Account[]> {
  const { data } = await supabase
    .from("holdings_cache")
    .select(
      "account_name, symbol, name, market, quantity, average_cost, current_price, currency",
    )
    .eq("user_id", userId)
    .eq("broker", "nhInvestment");

  if (!data || data.length === 0) return [];

  const byAccount = new Map<string, Holding[]>();
  for (const row of data) {
    const list = byAccount.get(row.account_name as string) ?? [];
    list.push({
      id: `${row.account_name}:${row.symbol}`,
      symbol: row.symbol as string,
      name: row.name as string,
      market: row.market as Holding["market"],
      quantity: row.quantity as number,
      averageCost: row.average_cost as number,
      currentPrice: row.current_price as number,
      currency: row.currency as Holding["currency"],
    });
    byAccount.set(row.account_name as string, list);
  }

  return [...byAccount.entries()].map(([name, holdings]) => ({
    id: `nh:${name}`,
    broker: "nhInvestment" as const,
    accountType: "general" as const,
    name,
    holdings,
  }));
}

function errMsg(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}
