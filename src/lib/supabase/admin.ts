// 서비스 롤 클라이언트 — RLS 를 우회한다. 크론 등 사용자 세션이 없는 서버 작업에서만 사용.
// 절대 클라이언트 번들에 포함 금지 (SUPABASE_SERVICE_ROLE_KEY 노출 금지).

import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
