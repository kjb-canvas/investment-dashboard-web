"use client";

import { useMemo, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  type TooltipContentProps,
  XAxis,
  YAxis,
} from "recharts";
import type { AssetSnapshot } from "@/lib/domain/snapshot";
import {
  ALL_PERIODS,
  type AnalysisPeriod,
  periodDisplayName,
} from "@/lib/domain/analysisPeriod";
import { trendSeries } from "@/lib/usecases/trend";
import { formattedKRW } from "@/lib/format";

/** 직렬화 가능한 스냅샷 포인트 (date 는 ISO 문자열). */
export interface TrendPoint {
  date: string;
  totalValue: number;
  principal: number;
}

interface ChartRow {
  label: string;
  totalValue: number;
  principal: number;
}

function axisLabel(date: Date): string {
  const m = (date.getMonth() + 1).toString().padStart(2, "0");
  const d = date.getDate().toString().padStart(2, "0");
  return `${m}/${d}`;
}

function fullLabel(date: Date): string {
  const y = date.getFullYear();
  const m = (date.getMonth() + 1).toString().padStart(2, "0");
  const d = date.getDate().toString().padStart(2, "0");
  return `${y}.${m}.${d}`;
}

function ChartTooltip({ active, payload, label }: TooltipContentProps) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-xs shadow-lg">
      <div className="mb-1 text-neutral-400">{String(label ?? "")}</div>
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-2">
          <span
            className="inline-block h-2 w-2 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-neutral-300">{String(entry.name ?? "")}</span>
          <span className="ml-auto font-medium text-neutral-100">
            {formattedKRW(typeof entry.value === "number" ? entry.value : 0)}
          </span>
        </div>
      ))}
    </div>
  );
}

export function TrendView({ points }: { points: TrendPoint[] }) {
  const [period, setPeriod] = useState<AnalysisPeriod>("month");

  const snapshots = useMemo<AssetSnapshot[]>(
    () =>
      points.map((p) => ({
        id: p.date,
        date: new Date(p.date),
        totalValue: p.totalValue,
        principal: p.principal,
      })),
    [points],
  );

  const rows = useMemo<ChartRow[]>(() => {
    const series = trendSeries(snapshots, period);
    return series.map((s) => ({
      label: axisLabel(s.date),
      totalValue: s.totalValue,
      principal: s.principal,
    }));
  }, [snapshots, period]);

  if (points.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-neutral-700 bg-neutral-900 p-8 text-center">
        <p className="text-neutral-300">아직 스냅샷이 없습니다.</p>
        <p className="mt-1 text-sm text-neutral-500">
          매일 자동 스냅샷 크론이 총자산을 기록하면 여기에 시계열 그래프가
          그려집니다.
        </p>
      </div>
    );
  }

  const latest = snapshots[snapshots.length - 1];

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-1">
        {ALL_PERIODS.map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`rounded-md px-2.5 py-1 text-xs ${
              period === p
                ? "bg-neutral-200 text-neutral-900"
                : "border border-neutral-700 text-neutral-300 hover:bg-neutral-800"
            }`}
          >
            {periodDisplayName(p)}
          </button>
        ))}
      </div>

      <div className="mb-4 rounded-2xl border border-neutral-800 bg-gradient-to-b from-neutral-900 to-neutral-950 p-6">
        <div className="text-sm text-neutral-400">총자산</div>
        <div className="mt-1 text-3xl font-bold">
          {formattedKRW(latest.totalValue)}
        </div>
        <div className="mt-1 text-xs text-neutral-500">
          원금 {formattedKRW(latest.principal)} · {fullLabel(latest.date)} 기준
        </div>
      </div>

      <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-4">
        {rows.length === 0 ? (
          <div className="p-6 text-center text-sm text-neutral-500">
            선택한 기간에 표시할 스냅샷이 없습니다.
          </div>
        ) : (
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={rows}
                margin={{ top: 8, right: 8, bottom: 0, left: 8 }}
              >
                <CartesianGrid stroke="#262626" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fill: "#737373", fontSize: 11 }}
                  axisLine={{ stroke: "#404040" }}
                  tickLine={false}
                  minTickGap={24}
                />
                <YAxis
                  tick={{ fill: "#737373", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  width={70}
                  tickFormatter={(v: number) =>
                    `${Math.round(v / 10000).toLocaleString("ko-KR")}만`
                  }
                />
                <Tooltip
                  content={(props) => <ChartTooltip {...props} />}
                  cursor={{ stroke: "#525252" }}
                />
                <Line
                  type="monotone"
                  dataKey="totalValue"
                  name="총자산"
                  stroke="#34d399"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="principal"
                  name="원금"
                  stroke="#737373"
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
