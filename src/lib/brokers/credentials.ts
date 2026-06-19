// 자격증명 로드·복호화. 페이지(사용자 세션)와 크론(서비스 롤) 양쪽에서 쓰도록
// Supabase 클라이언트와 userId 를 받는다. RLS 세션 클라이언트면 userId 필터는 안전망.

import type { SupabaseClient } from "@supabase/supabase-js";
import { decryptSecret } from "../crypto/secretCipher";

export interface LoadedCredential<T> {
  broker: string;
  creds: T;
}

/** 단일 브로커 자격증명 로드. 없거나 비활성이면 null. */
export async function loadCredential<T>(
  supabase: SupabaseClient,
  userId: string,
  broker: string,
): Promise<T | null> {
  const { data } = await supabase
    .from("api_credentials")
    .select("secret_enc")
    .eq("user_id", userId)
    .eq("broker", broker)
    .eq("is_enabled", true)
    .maybeSingle();

  if (!data?.secret_enc) return null;
  const json = await decryptSecret(data.secret_enc as string);
  return JSON.parse(json) as T;
}

/** 활성화된 모든 자격증명을 로드·복호화한다. */
export async function loadAllCredentials(
  supabase: SupabaseClient,
  userId: string,
): Promise<LoadedCredential<unknown>[]> {
  const { data } = await supabase
    .from("api_credentials")
    .select("broker, secret_enc")
    .eq("user_id", userId)
    .eq("is_enabled", true);

  const out: LoadedCredential<unknown>[] = [];
  for (const row of data ?? []) {
    try {
      const json = await decryptSecret(row.secret_enc as string);
      out.push({ broker: row.broker as string, creds: JSON.parse(json) });
    } catch {
      // 복호화 실패 항목은 건너뜀(키 변경 등).
    }
  }
  return out;
}
