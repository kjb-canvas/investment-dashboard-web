import { createClient } from "@/lib/supabase/server";
import { SettingsForm } from "./SettingsForm";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("api_credentials")
    .select("broker")
    .eq("is_enabled", true);

  const configured: Record<string, boolean> = {};
  for (const row of data ?? []) configured[row.broker as string] = true;

  return (
    <div>
      <h1 className="mb-1 text-xl font-bold">설정</h1>
      <p className="mb-6 text-sm text-neutral-400">
        각 서비스의 API 키를 입력하면 암호화되어 저장됩니다. 키는 서버에서만
        복호화되어 사용되며, 화면이나 브라우저로 다시 내려가지 않습니다.
      </p>
      <SettingsForm configured={configured} />
    </div>
  );
}
