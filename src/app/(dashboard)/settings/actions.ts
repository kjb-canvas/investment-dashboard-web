"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { encryptSecret } from "@/lib/crypto/secretCipher";
import { getSource } from "@/lib/brokers/config";

export interface SaveResult {
  ok: boolean;
  error?: string;
}

/** 설정 화면에서 입력한 자격증명을 암호화해 저장(UPSERT)한다. */
export async function saveCredential(
  brokerId: string,
  values: Record<string, string>,
): Promise<SaveResult> {
  const source = getSource(brokerId);
  if (!source || !source.supported) {
    return { ok: false, error: "지원하지 않는 소스입니다." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "로그인이 필요합니다." };

  // 필수 필드 검증 + 공백 제거
  const payload: Record<string, string> = {};
  for (const field of source.fields) {
    const v = (values[field.key] ?? "").trim();
    if (!v) return { ok: false, error: `${field.label} 을(를) 입력하세요.` };
    payload[field.key] = v;
  }

  const secretEnc = await encryptSecret(JSON.stringify(payload));

  const { error } = await supabase.from("api_credentials").upsert(
    {
      user_id: user.id,
      broker: brokerId,
      label: "default",
      secret_enc: secretEnc,
      is_enabled: true,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,broker,label" },
  );

  if (error) return { ok: false, error: error.message };

  revalidatePath("/settings");
  return { ok: true };
}

/** 자격증명을 삭제한다. */
export async function deleteCredential(brokerId: string): Promise<SaveResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "로그인이 필요합니다." };

  const { error } = await supabase
    .from("api_credentials")
    .delete()
    .eq("user_id", user.id)
    .eq("broker", brokerId);

  if (error) return { ok: false, error: error.message };
  revalidatePath("/settings");
  return { ok: true };
}
