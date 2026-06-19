// 공용 fetch 헬퍼 — 서버에서 외부 API 호출 시 사용.

export class HttpError extends Error {
  constructor(
    public status: number,
    public url: string,
    public bodyText: string,
  ) {
    super(`HTTP ${status} for ${url}: ${bodyText.slice(0, 200)}`);
    this.name = "HttpError";
  }
}

export interface RequestOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: string;
  // 기본 10초 타임아웃
  timeoutMs?: number;
}

export async function httpRequest(
  url: string,
  options: RequestOptions = {},
): Promise<Response> {
  const { method = "GET", headers, body, timeoutMs = 10_000 } = options;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method,
      headers,
      body,
      signal: controller.signal,
      cache: "no-store",
    });
    return res;
  } finally {
    clearTimeout(timer);
  }
}

/** JSON GET/POST 후 파싱. 2xx 아니면 HttpError. */
export async function httpJson<T>(
  url: string,
  options: RequestOptions = {},
): Promise<T> {
  const res = await httpRequest(url, options);
  const text = await res.text();
  if (!res.ok) {
    throw new HttpError(res.status, url, text);
  }
  return (text ? JSON.parse(text) : null) as T;
}
