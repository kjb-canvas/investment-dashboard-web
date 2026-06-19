import { ALL_PERIODS, periodDisplayName } from "@/lib/domain/analysisPeriod";

export default function AnalysisPage() {
  return (
    <div>
      <h1 className="mb-4 text-xl font-bold">분석</h1>
      <div className="mb-4 flex flex-wrap gap-2">
        {ALL_PERIODS.map((p) => (
          <span
            key={p}
            className="rounded-full border border-neutral-700 px-3 py-1 text-sm text-neutral-300"
          >
            {periodDisplayName(p)}
          </span>
        ))}
      </div>
      <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-6 text-sm text-neutral-400">
        기간별 손익·종목별 손익은 증권사 연동 후 표시됩니다. 손익 계산 로직은
        이미 포팅·검증되어 있습니다 (profitAnalysis).
      </div>
    </div>
  );
}
