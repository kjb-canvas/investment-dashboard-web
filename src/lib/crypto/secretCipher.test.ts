import { describe, it, expect, beforeAll } from "vitest";
import { webcrypto } from "node:crypto";
import { encryptSecret, decryptSecret } from "./secretCipher";

beforeAll(() => {
  // 테스트용 32바이트 키 (base64)
  const key = Buffer.from(webcrypto.getRandomValues(new Uint8Array(32)));
  process.env.APP_ENCRYPTION_KEY = key.toString("base64");
});

describe("secretCipher", () => {
  it("암호화 후 복호화하면 원문이 복원된다", async () => {
    const secret = "my-upbit-secret-key-1234567890";
    const enc = await encryptSecret(secret);
    expect(enc).not.toContain(secret);
    expect(enc).toContain(".");
    const dec = await decryptSecret(enc);
    expect(dec).toBe(secret);
  });

  it("같은 평문도 IV 때문에 매번 다른 암호문이 된다", async () => {
    const a = await encryptSecret("same");
    const b = await encryptSecret("same");
    expect(a).not.toBe(b);
    expect(await decryptSecret(a)).toBe("same");
    expect(await decryptSecret(b)).toBe("same");
  });

  it("한글·유니코드도 보존된다", async () => {
    const secret = "비밀키🔐토큰";
    expect(await decryptSecret(await encryptSecret(secret))).toBe(secret);
  });
});
