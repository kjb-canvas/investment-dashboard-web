import {
  SkeletonTitle,
  SkeletonHeroCard,
  SkeletonListCard,
} from "./_components/Skeleton";

export default function DashboardLoading() {
  return (
    <div>
      <SkeletonTitle />
      <SkeletonHeroCard />
      <div className="mb-3 flex items-center justify-between">
        <div className="flex gap-1.5">
          <div className="h-6 w-14 animate-pulse rounded-md bg-neutral-800" />
          <div className="h-6 w-14 animate-pulse rounded-md bg-neutral-800" />
          <div className="h-6 w-14 animate-pulse rounded-md bg-neutral-800" />
        </div>
        <div className="h-6 w-12 animate-pulse rounded-md bg-neutral-800" />
      </div>
      <SkeletonListCard rows={6} />
    </div>
  );
}
