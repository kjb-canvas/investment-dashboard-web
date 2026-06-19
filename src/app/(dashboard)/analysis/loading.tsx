import {
  SkeletonTitle,
  SkeletonTabs,
  SkeletonHeroCard,
  SkeletonListCard,
} from "../_components/Skeleton";

export default function AnalysisLoading() {
  return (
    <div>
      <SkeletonTitle />
      <SkeletonTabs count={6} />
      <SkeletonHeroCard />
      <div className="mb-2 h-4 w-24 animate-pulse rounded-md bg-neutral-800" />
      <SkeletonListCard rows={5} />
    </div>
  );
}
