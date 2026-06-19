import Link from "next/link";
import { fetchCurrentUserPortfolio } from "@/lib/server/portfolio";
import { createClient } from "@/lib/supabase/server";
import { AnalysisView, type SnapshotDTO } from "./AnalysisView";

export const dynamic = "force-dynamic";

export default async function AnalysisPage() {
  const portfolio = await fetchCurrentUserPortfolio();
  const accounts = portfolio?.accounts ?? [];
  const holdings = accounts.flatMap((a) => a.holdings);

  if (holdings.length === 0) {
    return (
      <div>
        <h1 className="mb-4 text-xl font-bold">분석</h1>
        <EmptyState errors={portfolio?.errors.length ?? 0} />
      </div>
    );
  }

  const usdToKrw = portfolio!.usdToKrw;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let snapshots: SnapshotDTO[] = [];
  if (user) {
    const { data } = await supabase
      .from("asset_snapshots")
      .select("snapshot_date, total_value_krw, principal_krw")
      .order("snapshot_date", { ascending: true });

    snapshots = (data ?? []).map(
      (row): SnapshotDTO => ({
        id: row.snapshot_date as string,
        date: row.snapshot_date as string,
        totalValue: row.total_value_krw as number,
        principal: row.principal_krw as number,
      }),
    );
  }

  return (
    <div>
      <h1 className="mb-4 text-xl font-bold">분석</h1>
      <AnalysisView
        holdings={holdings}
        snapshots={snapshots}
        usdToKrw={usdToKrw}
      />
    </div>
  );
}

function EmptyState({ errors }: { errors: number }) {
  return (
    <div className="rounded-xl border border-dashed border-neutral-700 bg-neutral-900 p-8 text-center">
      <p className="text-neutral-300">분석할 자산이 없습니다.</p>
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
