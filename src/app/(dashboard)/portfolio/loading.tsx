import {
  SkeletonTitle,
  SkeletonTabs,
  SkeletonListCard,
} from "../_components/Skeleton";

export default function PortfolioLoading() {
  return (
    <div>
      <SkeletonTitle />
      <SkeletonTabs count={5} />
      <div className="rounded-2xl border border-neutral-800 bg-gradient-to-b from-neutral-900 to-neutral-950 p-6">
        <div className="mx-auto h-48 w-48 animate-pulse rounded-full bg-neutral-800" />
        <div className="mt-4">
          <SkeletonListCard rows={5} />
        </div>
      </div>
    </div>
  );
}
