"use client";

import { useMemo, useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import type { Account } from "@/lib/domain/account";
import type { WeightDimension } from "@/lib/usecases/types";
import { portfolioWeights } from "@/lib/usecases/portfolioWeight";
import { formattedKRW } from "@/lib/format";

const DIMENSIONS: { id: WeightDimension; label: string }[] = [
  { id: "account", label: "계좌" },
  { id: "holding", label: "종목" },
  { id: "type", label: "자산유형" },
  { id: "country", label: "국가" },
  { id: "exchange", label: "거래소" },
];

const COLORS = [
  "#10b981", // emerald-500
  "#3b82f6", // blue-500
  "#f59e0b", // amber-500
  "#a855f7", // purple-500
  "#ef4444", // red-500
  "#14b8a6", // teal-500
  "#ec4899", // pink-500
  "#84cc16", // lime-500
  "#f97316", // orange-500
  "#6366f1", // indigo-500
];

export function PortfolioView({
  accounts,
  usdToKrw,
}: {
  accounts: Account[];
  usdToKrw: number;
}) {
  const [dimension, setDimension] = useState<WeightDimension>("holding");

  const slices = useMemo(
    () => portfolioWeights(accounts, dimension, usdToKrw),
    [accounts, dimension, usdToKrw],
  );

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-1">
        {DIMENSIONS.map((d) => (
          <button
            key={d.id}
            onClick={() => setDimension(d.id)}
            className={`min-h-9 rounded-md px-2.5 py-1.5 text-xs ${
              dimension === d.id
                ? "bg-neutral-200 text-neutral-900"
                : "border border-neutral-700 text-neutral-300 hover:bg-neutral-800"
            }`}
          >
            {d.label}
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-neutral-800 bg-gradient-to-b from-neutral-900 to-neutral-950 p-6">
        {slices.length === 0 ? (
          <div className="py-8 text-center text-sm text-neutral-500">
            표시할 비중이 없습니다.
          </div>
        ) : (
          <>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={slices}
                    dataKey="valueKRW"
                    nameKey="label"
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    stroke="none"
                  >
                    {slices.map((s, i) => (
                      <Cell key={s.label} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-4 divide-y divide-neutral-800">
              {slices.map((s, i) => (
                <div
                  key={s.label}
                  className="flex items-center justify-between py-2.5"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: COLORS[i % COLORS.length] }}
                    />
                    <span className="truncate text-sm">{s.label}</span>
                  </div>
                  <div className="shrink-0 pl-3 text-right">
                    <div className="text-sm">{formattedKRW(s.valueKRW)}</div>
                    <div className="text-xs text-neutral-500">
                      {s.percent.toFixed(1)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
