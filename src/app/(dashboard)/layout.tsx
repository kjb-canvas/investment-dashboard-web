import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const TABS = [
  { href: "/", label: "홈" },
  { href: "/analysis", label: "분석" },
  { href: "/dividend", label: "배당" },
  { href: "/trend", label: "추이" },
  { href: "/portfolio", label: "포트폴리오" },
  { href: "/settings", label: "설정" },
];

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      <header className="sticky top-0 z-10 border-b border-neutral-800 bg-neutral-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <span className="shrink-0 font-bold">투자 모아보기</span>
          <div className="flex min-w-0 items-center gap-3 text-sm text-neutral-400">
            <span className="hidden truncate sm:inline">{user.email}</span>
            <form action="/auth/signout" method="post">
              <button className="shrink-0 rounded-md border border-neutral-700 px-2.5 py-1.5 hover:bg-neutral-800">
                로그아웃
              </button>
            </form>
          </div>
        </div>
        <nav className="mx-auto flex max-w-5xl gap-1 overflow-x-auto px-2 pb-2">
          {TABS.map((t) => (
            <Link
              key={t.href}
              href={t.href}
              className="whitespace-nowrap rounded-md px-3 py-2 text-sm text-neutral-300 hover:bg-neutral-800"
            >
              {t.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
    </div>
  );
}
