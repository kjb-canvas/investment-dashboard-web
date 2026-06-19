import {
  SkeletonTitle,
  SkeletonTabs,
  SkeletonHeroCard,
  SkeletonChart,
} from "../_components/Skeleton";

export default function TrendLoading() {
  return (
    <div>
      <SkeletonTitle />
      <SkeletonTabs count={6} />
      <SkeletonHeroCard />
      <SkeletonChart className="h-72" />
    </div>
  );
}
