// 업비트 인증 JWT(HS256) 생성. iOS UpbitAuthToken 포팅.

import { createHmac } from "node:crypto";

function base64url(input: Buffer | string): string {
  const buf = typeof input === "string" ? Buffer.from(input, "utf8") : input;
  return buf
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

/**
 * 업비트 Open API 인증 토큰(JWT, HS256)을 만든다.
 *
 * 헤더 {alg:'HS256', typ:'JWT'}, 페이로드 {access_key, nonce} 를
 * secretKey 로 HMAC-SHA256 서명한다.
 * `GET /v1/accounts` 처럼 쿼리가 없는 요청은 query_hash 를 포함하지 않는다.
 */
export function makeUpbitToken(
  accessKey: string,
  secretKey: string,
  nonce: string = crypto.randomUUID(),
): string {
  const header = base64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = base64url(
    JSON.stringify({ access_key: accessKey, nonce }),
  );
  const signingInput = `${header}.${payload}`;
  const signature = base64url(
    createHmac("sha256", secretKey).update(signingInput).digest(),
  );
  return `${signingInput}.${signature}`;
}
