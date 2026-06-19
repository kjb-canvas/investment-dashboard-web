// 서버용 Supabase 클라이언트 (Server Component / Route Handler / Server Action).
// 쿠키 기반 세션을 사용하며, RLS 가 사용자별 접근을 강제한다.

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Server Component 에서 호출되면 set 이 막힐 수 있음 — 미들웨어가 세션을 갱신하므로 무시 가능.
          }
        },
      },
    },
  );
}
