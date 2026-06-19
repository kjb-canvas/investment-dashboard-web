import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { fetchPortfolio } from "@/lib/server/portfolio";
import { loadCredential } from "@/lib/brokers/credentials";
import type { FinnhubCreds } from "@/lib/brokers/credentialTypes";
import { fetchFinnhubDividends } from "@/lib/market/finnhub";
import { costBasisKRW } from "@/lib/domain/holding";
import {
  annualDividendTotal,
  monthlyDividendTotals,
  dividendYield,
} from "@/lib/usecases/dividend";
import { DividendView, type DividendRow } from "./DividendView";

export const dynamic = "force-dynamic";

export default async function DividendPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 미로그인은 레이아웃에서 /login 으로 리다이렉트되지만 타입 안전을 위해 가드.
  if (!user) {
    return (
      <DividendShell>
        <EmptyState reason="login" />
      </DividendShell>
    );
  }

  const [portfolio, creds] = await Promise.all([
    fetchPortfolio(supabase, user.id),
    loadCredential<FinnhubCreds>(supabase, user.id, "finnhub"),
  ]);

  const usHoldings = portfolio.accounts
    .flatMap((a) => a.holdings)
    .filter((h) => h.market === "usStock");

  if (!creds || usHoldings.length === 0) {
    return (
      <DividendShell>
        <EmptyState reason={!creds ? "noKey" : "noHoldings"} />
      </DividendShell>
    );
  }

  // 심볼 → 보유 수량 합산(같은 종목이 여러 계좌에 있을 수 있음).
  const quantityBySymbol = new Map<string, number>();
  for (const h of usHoldings) {
    quantityBySymbol.set(
      h.symbol,
      (quantityBySymbol.get(h.symbol) ?? 0) + h.quantity,
    );
  }
  const symbols = [...quantityBySymbol.keys()];

  const year = new Date().getFullYear();
  const from = new Date(year, 0, 1);
  const to = new Date(year, 11, 31);

  let schedules;
  try {
    schedules = await fetchFinnhubDividends(creds, symbols, from, to);
  } catch (e) {
    return (
      <DividendShell>
        <ErrorCard message={e instanceof Error ? e.message : String(e)} />
      </DividendShell>
    );
  }

  // 총 배당금(KRW) = 1주당 배당(USD) × 보유 수량 × 환율.
  const filled = schedules.map((s) => ({
    ...s,
    totalAmount:
      s.amountPerShare *
      (quantityBySymbol.get(s.symbol) ?? 0) *
      portfolio.usdToKrw,
  }));

  const annual = annualDividendTotal(filled, year);
  const monthlyMap = monthlyDividendTotals(filled, year);
  const monthly = Array.from({ length: 12 }, (_, i) => monthlyMap[i + 1] ?? 0);

  const invested = usHoldings.reduce(
    (sum, h) => sum + costBasisKRW(h, portfolio.usdToKrw),
    0,
  );
  const yieldPct = dividendYield(annual, invested);

  const rows: DividendRow[] = filled
    .map((s) => ({
      id: s.id,
      symbol: s.symbol,
      paymentDate: s.paymentDate.toISOString(),
      totalAmount: s.totalAmount,
      isConfirmed: s.isConfirmed,
    }))
    .sort((a, b) => a.paymentDate.localeCompare(b.paymentDate));

  return (
    <DividendShell>
      <DividendView
        year={year}
        annual={annual}
        yieldPct={yieldPct}
        monthly={monthly}
        rows={rows}
        errors={portfolio.errors.length}
      />
    </DividendShell>
  );
}

function DividendShell({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <h1 className="mb-4 text-xl font-bold">배당</h1>
      {children}
    </div>
  );
}

function EmptyState({ reason }: { reason: "login" | "noKey" | "noHoldings" }) {
  const message =
    reason === "login"
      ? "로그인이 필요합니다."
      : reason === "noKey"
        ? "Finnhub API 키가 없습니다. 설정에서 키를 등록하면 미국 주식의 배당 일정을 조회합니다."
        : "보유 중인 미국 주식이 없습니다. 미국 주식을 보유하면 배당 일정이 표시됩니다.";
  return (
    <div className="rounded-xl border border-dashed border-neutral-700 bg-neutral-900 p-8 text-center">
      <p className="text-neutral-300">배당 정보를 표시할 수 없습니다.</p>
      <p className="mt-1 text-sm text-neutral-500">{message}</p>
      <Link
        href="/settings"
        className="mt-4 inline-block rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500"
      >
        설정으로 이동
      </Link>
    </div>
  );
}

function ErrorCard({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-amber-700/40 bg-amber-900/10 p-6 text-center">
      <p className="text-amber-300">배당 일정을 불러오지 못했습니다.</p>
      <p className="mt-1 text-xs text-amber-400/70">{message}</p>
      <p className="mt-2 text-xs text-neutral-500">
        Finnhub 키와 요청 한도를 확인한 뒤 잠시 후 다시 시도해 주세요.
      </p>
    </div>
  );
}
