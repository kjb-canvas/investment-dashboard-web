import { createClient } from "@/lib/supabase/server";

export default async function TrendPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("asset_snapshots")
    .select("snapshot_date, total_value_krw, principal_krw")
    .order("snapshot_date", { ascending: true });

  const snapshots = data ?? [];

  return (
    <div>
      <h1 className="mb-4 text-xl font-bold">추이</h1>
      {snapshots.length === 0 ? (
        <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-6 text-sm text-neutral-400">
          아직 스냅샷이 없습니다. 자동 스냅샷 크론이 매일 총자산을 기록하면 여기에
          시계열 그래프가 그려집니다.
        </div>
      ) : (
        <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-6 text-sm text-neutral-400">
          스냅샷 {snapshots.length}건. 차트는 다음 단계에서 Recharts 로
          렌더링됩니다.
        </div>
      )}
    </div>
  );
}
