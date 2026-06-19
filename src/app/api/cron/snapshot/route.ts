// 자동 스냅샷 크론 — Vercel Cron 이 매일 호출.
// 자격증명이 있는 모든 사용자의 총자산을 계산해 asset_snapshots 에 UPSERT 한다.
// CRON_SECRET 으로 보호 (Authorization: Bearer <CRON_SECRET>).

import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { fetchPortfolio } from "@/lib/server/portfolio";
import { fetchTotalAssets } from "@/lib/usecases/fetchTotalAssets";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();

  // 자격증명을 가진 사용자 목록(중복 제거).
  const { data: credRows, error } = await admin
    .from("api_credentials")
    .select("user_id")
    .eq("is_enabled", true);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  const userIds = [...new Set((credRows ?? []).map((r) => r.user_id as string))];

  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const results: { userId: string; ok: boolean; error?: string }[] = [];

  for (const userId of userIds) {
    try {
      const portfolio = await fetchPortfolio(admin, userId);
      const totals = fetchTotalAssets(portfolio.accounts, portfolio.usdToKrw);
      const { error: upErr } = await admin.from("asset_snapshots").upsert(
        {
          user_id: userId,
          snapshot_date: today,
          total_value_krw: totals.totalValue,
          principal_krw: totals.principal,
        },
        { onConflict: "user_id,snapshot_date" },
      );
      if (upErr) throw new Error(upErr.message);
      results.push({ userId, ok: true });
    } catch (e) {
      results.push({
        userId,
        ok: false,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  }

  return NextResponse.json({
    date: today,
    count: results.length,
    succeeded: results.filter((r) => r.ok).length,
    results,
  });
}
