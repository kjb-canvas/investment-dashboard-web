"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  type TooltipContentProps,
  XAxis,
  YAxis,
} from "recharts";
import { formattedKRW, formattedPercent, profitColorClass } from "@/lib/format";

/** 직렬화 가능한 배당 일정 행 (paymentDate 는 ISO 문자열). */
export interface DividendRow {
  id: string;
  symbol: string;
  paymentDate: string;
  totalAmount: number;
  isConfirmed: boolean;
}

interface MonthBar {
  label: string;
  total: number;
}

function paymentLabel(iso: string): string {
  const d = new Date(iso);
  const y = d.getUTCFullYear();
  const m = (d.getUTCMonth() + 1).toString().padStart(2, "0");
  const day = d.getUTCDate().toString().padStart(2, "0");
  return `${y}.${m}.${day}`;
}

function ChartTooltip({ active, payload, label }: TooltipContentProps) {
  if (!active || !payload || payload.length === 0) return null;
  const value = payload[0]?.value;
  return (
    <div className="rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-xs shadow-lg">
      <div className="text-neutral-400">{String(label ?? "")}</div>
      <div className="mt-0.5 font-medium text-neutral-100">
        {formattedKRW(typeof value === "number" ? value : 0)}
      </div>
    </div>
  );
}

export function DividendView({
  year,
  annual,
  yieldPct,
  monthly,
  rows,
  errors,
}: {
  year: number;
  annual: number;
  yieldPct: number;
  monthly: number[];
  rows: DividendRow[];
  errors: number;
}) {
  const bars: MonthBar[] = monthly.map((total, i) => ({
    label: `${i + 1}월`,
    total,
  }));
  const hasMonthly = monthly.some((v) => v > 0);

  return (
    <div>
      {errors > 0 && (
        <div className="mb-4 rounded-lg border border-amber-700/40 bg-amber-900/10 p-3 text-xs text-amber-300">
          일부 소스 조회에 실패해 보유 수량이 부분적으로만 반영됐을 수 있습니다.
        </div>
      )}

      <div className="mb-6 rounded-2xl border border-neutral-800 bg-gradient-to-b from-neutral-900 to-neutral-950 p-6">
        <div className="text-sm text-neutral-400">{year}년 연간 배당</div>
        <div className="mt-1 text-3xl font-bold">{formattedKRW(annual)}</div>
        <div className={`mt-2 text-sm ${profitColorClass(yieldPct)}`}>
          배당수익률 {formattedPercent(yieldPct)}
        </div>
      </div>

      <div className="mb-6 rounded-xl border border-neutral-800 bg-neutral-900 p-4">
        <div className="mb-3 text-sm text-neutral-400">월별 배당</div>
        {hasMonthly ? (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={bars}
                margin={{ top: 8, right: 8, bottom: 0, left: 8 }}
              >
                <CartesianGrid stroke="#262626" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fill: "#737373", fontSize: 11 }}
                  axisLine={{ stroke: "#404040" }}
                  tickLine={false}
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
                  cursor={{ fill: "#ffffff10" }}
                />
                <Bar dataKey="total" name="배당" fill="#34d399" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="p-6 text-center text-sm text-neutral-500">
            올해 예정된 배당 내역이 없습니다.
          </div>
        )}
      </div>

      <div>
        <div className="mb-3 text-sm text-neutral-400">배당 일정</div>
        <div className="divide-y divide-neutral-800 rounded-xl border border-neutral-800 bg-neutral-900">
          {rows.map((r) => (
            <div key={r.id} className="flex items-center justify-between p-3">
              <div className="min-w-0">
                <div className="truncate font-medium">{r.symbol}</div>
                <div className="text-xs text-neutral-500">
                  지급 {paymentLabel(r.paymentDate)}
                  {r.isConfirmed ? " · 확정" : " · 예정"}
                </div>
              </div>
              <div className="text-right text-sm">
                {formattedKRW(r.totalAmount)}
              </div>
            </div>
          ))}
          {rows.length === 0 && (
            <div className="p-6 text-center text-sm text-neutral-500">
              표시할 배당 일정이 없습니다.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
