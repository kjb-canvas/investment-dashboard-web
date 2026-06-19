import Link from "next/link";
import { fetchCurrentUserPortfolio } from "@/lib/server/portfolio";
import { fetchTotalAssets } from "@/lib/usecases/fetchTotalAssets";
import {
  formattedKRW,
  formattedSignedKRW,
  formattedPercent,
  profitColorClass,
} from "@/lib/format";
import { HoldingsList } from "./HoldingsList";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const portfolio = await fetchCurrentUserPortfolio();
  const accounts = portfolio?.accounts ?? [];
  const holdings = accounts.flatMap((a) => a.holdings);

  if (holdings.length === 0) {
    return (
      <div>
        <h1 className="mb-4 text-xl font-bold">홈</h1>
        <EmptyState errors={portfolio?.errors.length ?? 0} />
      </div>
    );
  }

  const usdToKrw = portfolio!.usdToKrw;
  const totals = fetchTotalAssets(accounts, usdToKrw);

  return (
    <div>
      <h1 className="mb-4 text-xl font-bold">홈</h1>

      <div className="mb-6 rounded-2xl border border-neutral-800 bg-gradient-to-b from-neutral-900 to-neutral-950 p-6">
        <div className="text-sm text-neutral-400">총자산</div>
        <div className="mt-1 text-3xl font-bold">
          {formattedKRW(totals.totalValue)}
        </div>
        <div className={`mt-2 text-sm ${profitColorClass(totals.totalProfitLoss)}`}>
          {formattedSignedKRW(totals.totalProfitLoss)} (
          {formattedPercent(totals.totalProfitLossRate)})
        </div>
        <div className="mt-1 text-xs text-neutral-500">
          원금 {formattedKRW(totals.principal)} · 환율 1$={usdToKrw.toLocaleString("ko-KR")}원
        </div>
      </div>

      {portfolio!.errors.length > 0 && (
        <div className="mb-4 rounded-lg border border-amber-700/40 bg-amber-900/10 p-3 text-xs text-amber-300">
          일부 소스 조회 실패:{" "}
          {portfolio!.errors.map((e) => e.broker).join(", ")} (나머지 자산만
          표시 중)
        </div>
      )}

      <HoldingsList holdings={holdings} usdToKrw={usdToKrw} />
    </div>
  );
}

function EmptyState({ errors }: { errors: number }) {
  return (
    <div className="rounded-xl border border-dashed border-neutral-700 bg-neutral-900 p-8 text-center">
      <p className="text-neutral-300">표시할 자산이 없습니다.</p>
      <p className="mt-1 text-sm text-neutral-500">
        {errors > 0
          ? "API 키를 등록했지만 조회에 실패했습니다. 키를 다시 확인해 주세요."
          : "설정에서 업비트·증권사 키를 등록하면 자산이 모여서 표시됩니다."}
      </p>
      <Link
        href="/settings"
        className="mt-4 inline-block rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500"
      >
        설정으로 이동
      </Link>
    </div>
  );
}
