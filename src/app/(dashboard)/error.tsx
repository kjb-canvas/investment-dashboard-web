"use client";

import { useEffect } from "react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="rounded-2xl border border-neutral-800 bg-gradient-to-b from-neutral-900 to-neutral-950 p-8 text-center">
      <p className="text-lg font-semibold text-neutral-100">
        문제가 발생했어요
      </p>
      <p className="mt-2 text-sm text-neutral-400">
        데이터를 불러오는 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.
      </p>
      {error.digest && (
        <p className="mt-2 break-all text-xs text-neutral-600">
          오류 코드: {error.digest}
        </p>
      )}
      <button
        onClick={() => reset()}
        className="mt-5 inline-block rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500"
      >
        다시 시도
      </button>
    </div>
  );
}
