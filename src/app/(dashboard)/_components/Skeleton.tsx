/** 공용 스켈레톤 빌딩 블록. animate-pulse 기반 neutral-800 placeholder. */

export function SkeletonBox({ className = "" }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded-md bg-neutral-800 ${className}`} />
  );
}

/** 페이지 제목 자리 placeholder. */
export function SkeletonTitle() {
  return <SkeletonBox className="mb-4 h-7 w-20" />;
}

/** 총자산/손익 히어로 카드 placeholder. */
export function SkeletonHeroCard() {
  return (
    <div className="mb-6 rounded-2xl border border-neutral-800 bg-gradient-to-b from-neutral-900 to-neutral-950 p-6">
      <SkeletonBox className="h-4 w-16" />
      <SkeletonBox className="mt-2 h-9 w-48" />
      <SkeletonBox className="mt-3 h-4 w-32" />
      <SkeletonBox className="mt-2 h-3 w-40" />
    </div>
  );
}

/** 한 줄짜리 리스트 행 placeholder (좌측 라벨 + 우측 값). */
export function SkeletonListRow() {
  return (
    <div className="flex items-center justify-between p-3">
      <div className="min-w-0 flex-1">
        <SkeletonBox className="h-4 w-32" />
        <SkeletonBox className="mt-1.5 h-3 w-20" />
      </div>
      <div className="ml-4 flex flex-col items-end">
        <SkeletonBox className="h-4 w-20" />
        <SkeletonBox className="mt-1.5 h-3 w-16" />
      </div>
    </div>
  );
}

/** 리스트 카드 placeholder (행 N개). */
export function SkeletonListCard({ rows = 5 }: { rows?: number }) {
  return (
    <div className="divide-y divide-neutral-800 rounded-xl border border-neutral-800 bg-neutral-900">
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonListRow key={i} />
      ))}
    </div>
  );
}

/** 탭/세그먼트 버튼 줄 placeholder. */
export function SkeletonTabs({ count = 5 }: { count?: number }) {
  return (
    <div className="mb-4 flex flex-wrap gap-1.5">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonBox key={i} className="h-7 w-16" />
      ))}
    </div>
  );
}

/** 차트 영역 placeholder. */
export function SkeletonChart({ className = "h-64" }: { className?: string }) {
  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-4">
      <SkeletonBox className={`w-full ${className}`} />
    </div>
  );
}
