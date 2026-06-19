import { createClient } from "@/lib/supabase/server";
import { TrendView, type TrendPoint } from "./TrendView";

export const dynamic = "force-dynamic";

export default async function TrendPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const points: TrendPoint[] = [];
  if (user) {
    const { data } = await supabase
      .from("asset_snapshots")
      .select("snapshot_date, total_value_krw, principal_krw")
      .eq("user_id", user.id)
      .order("snapshot_date", { ascending: true });

    for (const row of data ?? []) {
      points.push({
        date: new Date(row.snapshot_date as string).toISOString(),
        totalValue: row.total_value_krw as number,
        principal: row.principal_krw as number,
      });
    }
  }

  return (
    <div>
      <h1 className="mb-4 text-xl font-bold">추이</h1>
      <TrendView points={points} />
    </div>
  );
}
