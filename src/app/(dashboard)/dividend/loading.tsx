import {
  SkeletonTitle,
  SkeletonHeroCard,
  SkeletonChart,
  SkeletonListCard,
} from "../_components/Skeleton";

export default function DividendLoading() {
  return (
    <div>
      <SkeletonTitle />
      <SkeletonHeroCard />
      <div className="mb-6">
        <SkeletonChart className="h-64" />
      </div>
      <div className="mb-3 h-4 w-24 animate-pulse rounded-md bg-neutral-800" />
      <SkeletonListCard rows={4} />
    </div>
  );
}
