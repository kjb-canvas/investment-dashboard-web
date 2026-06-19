import Link from "next/link";
import { fetchCurrentUserPortfolio } from "@/lib/server/portfolio";
import { PortfolioView } from "./PortfolioView";

export const dynamic = "force-dynamic";

export default async function PortfolioPage() {
  const portfolio = await fetchCurrentUserPortfolio();
  const accounts = portfolio?.accounts ?? [];
  const holdings = accounts.flatMap((a) => a.holdings);

  if (holdings.length === 0) {
    return (
      <div>
        <h1 className="mb-4 text-xl font-bold">포트폴리오</h1>
        <EmptyState errors={portfolio?.errors.length ?? 0} />
      </div>
    );
  }

  const usdToKrw = portfolio!.usdToKrw;

  return (
    <div>
      <h1 className="mb-4 text-xl font-bold">포트폴리오</h1>
      <PortfolioView accounts={accounts} usdToKrw={usdToKrw} />
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
