import { SkeletonTitle } from "../_components/Skeleton";

export default function SettingsLoading() {
  return (
    <div>
      <SkeletonTitle />
      <div className="mb-6 h-4 w-full max-w-md animate-pulse rounded-md bg-neutral-800" />
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-neutral-800 bg-neutral-900 p-4"
          >
            <div className="h-5 w-32 animate-pulse rounded-md bg-neutral-800" />
            <div className="mt-2 h-3 w-48 animate-pulse rounded-md bg-neutral-800" />
            <div className="mt-3 h-9 w-full animate-pulse rounded-lg bg-neutral-800" />
          </div>
        ))}
      </div>
    </div>
  );
}
