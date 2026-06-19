import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function HomePage() {
  const supabase = await createClient();
  const { data: creds } = await supabase
    .from("api_credentials")
    .select("broker")
    .eq("is_enabled", true);

  const hasKeys = (creds ?? []).length > 0;

  return (
    <div>
      <h1 className="mb-4 text-xl font-bold">홈</h1>

      {!hasKeys ? (
        <EmptyState />
      ) : (
        <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-6">
          <p className="text-sm text-neutral-400">
            총자산·보유종목 조회는 증권사 API 연동(다음 단계)에서 연결됩니다.
            현재 {creds!.length}개 소스가 등록되어 있습니다.
          </p>
        </div>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-xl border border-dashed border-neutral-700 bg-neutral-900 p-8 text-center">
      <p className="text-neutral-300">아직 등록된 API 키가 없습니다.</p>
      <p className="mt-1 text-sm text-neutral-500">
        설정에서 업비트·증권사 키를 등록하면 자산이 모여서 표시됩니다.
      </p>
      <Link
        href="/settings"
        className="mt-4 inline-block rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500"
      >
        설정으로 이동
      </Link>
    </div>
  );
}
