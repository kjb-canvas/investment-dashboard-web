// API 키 암호화 — iOS 의 Keychain 을 대체.
// 서버 전용 마스터키(APP_ENCRYPTION_KEY)로 AES-256-GCM 암복호화한다.
// 절대 클라이언트 번들에 포함되면 안 되며, 서버(Route Handler/Server Action)에서만 사용한다.

import { webcrypto } from "node:crypto";

const subtle = webcrypto.subtle;
const ALGO = "AES-GCM";
const IV_BYTES = 12;

/** 마스터키 로드. base64 또는 hex(64자) 32바이트 키를 허용. */
async function importKey(): Promise<CryptoKey> {
  const raw = process.env.APP_ENCRYPTION_KEY;
  if (!raw) {
    throw new Error(
      "APP_ENCRYPTION_KEY 가 설정되지 않았습니다. 32바이트 키를 base64 로 지정하세요.",
    );
  }
  const bytes = decodeKey(raw);
  if (bytes.length !== 32) {
    throw new Error(
      `APP_ENCRYPTION_KEY 는 32바이트여야 합니다 (현재 ${bytes.length}바이트).`,
    );
  }
  return subtle.importKey("raw", bytes, ALGO, false, ["encrypt", "decrypt"]);
}

function decodeKey(raw: string): Uint8Array {
  // hex 64자면 hex 로, 아니면 base64 로 해석.
  if (/^[0-9a-fA-F]{64}$/.test(raw)) {
    const out = new Uint8Array(32);
    for (let i = 0; i < 32; i++) {
      out[i] = parseInt(raw.slice(i * 2, i * 2 + 2), 16);
    }
    return out;
  }
  return new Uint8Array(Buffer.from(raw, "base64"));
}

/**
 * 평문을 암호화해 "iv.ciphertext" (둘 다 base64) 형식 문자열로 반환.
 */
export async function encryptSecret(plaintext: string): Promise<string> {
  const key = await importKey();
  const iv = webcrypto.getRandomValues(new Uint8Array(IV_BYTES));
  const encoded = new TextEncoder().encode(plaintext);
  const cipher = await subtle.encrypt({ name: ALGO, iv }, key, encoded);
  const ivB64 = Buffer.from(iv).toString("base64");
  const ctB64 = Buffer.from(new Uint8Array(cipher)).toString("base64");
  return `${ivB64}.${ctB64}`;
}

/** encryptSecret 로 만든 문자열을 복호화한다. */
export async function decryptSecret(stored: string): Promise<string> {
  const key = await importKey();
  const [ivB64, ctB64] = stored.split(".");
  if (!ivB64 || !ctB64) {
    throw new Error("암호문 형식이 올바르지 않습니다.");
  }
  const iv = new Uint8Array(Buffer.from(ivB64, "base64"));
  const ct = new Uint8Array(Buffer.from(ctB64, "base64"));
  const plain = await subtle.decrypt({ name: ALGO, iv }, key, ct);
  return new TextDecoder().decode(plain);
}
