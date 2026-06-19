// 복호화된 자격증명(JSON) 의 타입 — config.ts 의 fields 와 키가 일치해야 한다.

export interface UpbitCreds {
  accessKey: string;
  secretKey: string;
}

export interface KISCreds {
  appKey: string;
  appSecret: string;
  accountNo: string; // "12345678-01" 형태
}

export interface TossCreds {
  clientId: string;
  clientSecret: string;
}

export interface FinnhubCreds {
  apiKey: string;
}

export interface EcosCreds {
  apiKey: string;
}

export type AnyCreds =
  | UpbitCreds
  | KISCreds
  | TossCreds
  | FinnhubCreds
  | EcosCreds;
