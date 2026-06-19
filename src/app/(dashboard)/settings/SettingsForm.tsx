"use client";

import { useState, useTransition } from "react";
import {
  CREDENTIAL_SOURCES,
  type CredentialSource,
} from "@/lib/brokers/config";
import { saveCredential, deleteCredential } from "./actions";

export function SettingsForm({
  configured,
}: {
  configured: Record<string, boolean>;
}) {
  return (
    <div className="space-y-4">
      {CREDENTIAL_SOURCES.map((source) => (
        <SourceCard
          key={source.id}
          source={source}
          isConfigured={!!configured[source.id]}
        />
      ))}
    </div>
  );
}

function SourceCard({
  source,
  isConfigured,
}: {
  source: CredentialSource;
  isConfigured: boolean;
}) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onSave() {
    setMsg(null);
    setErr(null);
    startTransition(async () => {
      const res = await saveCredential(source.id, values);
      if (res.ok) {
        setMsg("저장됐습니다.");
        setValues({});
      } else {
        setErr(res.error ?? "저장 실패");
      }
    });
  }

  function onDelete() {
    startTransition(async () => {
      const res = await deleteCredential(source.id);
      if (res.ok) setMsg("삭제됐습니다.");
      else setErr(res.error ?? "삭제 실패");
    });
  }

  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold">{source.name}</h3>
            {isConfigured && (
              <span className="rounded-full bg-emerald-600/20 px-2 py-0.5 text-xs text-emerald-400">
                연결됨
              </span>
            )}
            {!source.supported && (
              <span className="rounded-full bg-amber-600/20 px-2 py-0.5 text-xs text-amber-400">
                브릿지 필요
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-neutral-400">{source.description}</p>
        </div>
        {source.issueUrl && (
          <a
            href={source.issueUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 text-xs text-sky-400 underline"
          >
            키 발급
          </a>
        )}
      </div>

      {!source.supported ? (
        <p className="mt-3 rounded-lg bg-neutral-950 p-3 text-xs text-neutral-400">
          {source.unsupportedNote}
        </p>
      ) : (
        <div className="mt-3 space-y-2">
          {source.fields.map((f) => (
            <input
              key={f.key}
              type={f.type === "text" ? "text" : "password"}
              placeholder={f.label}
              value={values[f.key] ?? ""}
              onChange={(e) =>
                setValues((v) => ({ ...v, [f.key]: e.target.value }))
              }
              className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm outline-none focus:border-neutral-500"
            />
          ))}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={onSave}
              disabled={pending}
              className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
            >
              {isConfigured ? "갱신" : "저장"}
            </button>
            {isConfigured && (
              <button
                onClick={onDelete}
                disabled={pending}
                className="rounded-lg border border-neutral-700 px-3 py-1.5 text-sm text-neutral-300 hover:bg-neutral-800 disabled:opacity-50"
              >
                삭제
              </button>
            )}
            {msg && <span className="text-sm text-emerald-400">{msg}</span>}
            {err && <span className="text-sm text-red-400">{err}</span>}
          </div>
        </div>
      )}
    </div>
  );
}
