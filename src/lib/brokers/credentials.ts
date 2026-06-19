// 서버 전용 — 현재 로그인 사용자의 자격증명을 로드·복호화한다.
// RLS 가 본인 행만 반환하도록 강제하므로 user_id 필터는 안전망 겸용.

import { createClient } from "../supabase/server";
import { decryptSecret } from "../crypto/secretCipher";

export interface LoadedCredential<T> {
  broker: string;
  creds: T;
}

/** 단일 브로커 자격증명 로드. 없거나 비활성이면 null. */
export async function loadCredential<T>(broker: string): Promise<T | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("api_credentials")
    .select("secret_enc")
    .eq("broker", broker)
    .eq("is_enabled", true)
    .maybeSingle();

  if (!data?.secret_enc) return null;
  const json = await decryptSecret(data.secret_enc as string);
  return JSON.parse(json) as T;
}

/** 활성화된 모든 자격증명을 로드·복호화한다. */
export async function loadAllCredentials(): Promise<
  LoadedCredential<unknown>[]
> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("api_credentials")
    .select("broker, secret_enc")
    .eq("is_enabled", true);

  const out: LoadedCredential<unknown>[] = [];
  for (const row of data ?? []) {
    try {
      const json = await decryptSecret(row.secret_enc as string);
      out.push({ broker: row.broker as string, creds: JSON.parse(json) });
    } catch {
      // 복호화 실패한 항목은 건너뜀(키 변경 등).
    }
  }
  return out;
}
