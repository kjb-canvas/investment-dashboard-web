// 증권사/데이터 소스별 필요한 API 키 정의 — iOS SettingsViewModel 의 BrokerCredential 포팅.
// secret_enc 에는 아래 fields 를 JSON 으로 묶어 암호화 저장한다.

export type CredentialSourceId =
  | "upbit"
  | "kis"
  | "tossSecurities"
  | "finnhub"
  | "ecos"
  | "nhInvestment";

export interface CredentialField {
  key: string; // JSON 키
  label: string; // 화면 라벨
  type?: "text" | "password";
}

export interface CredentialSource {
  id: CredentialSourceId;
  name: string;
  description: string;
  fields: CredentialField[];
  issueUrl?: string;
  supported: boolean;
  unsupportedNote?: string;
}

export const CREDENTIAL_SOURCES: CredentialSource[] = [
  {
    id: "upbit",
    name: "업비트 (코인)",
    description: "코인 잔고 조회. JWT 인증.",
    issueUrl: "https://upbit.com/mypage/open_api_management",
    supported: true,
    fields: [
      { key: "accessKey", label: "Access Key", type: "password" },
      { key: "secretKey", label: "Secret Key", type: "password" },
    ],
  },
  {
    id: "kis",
    name: "한국투자증권 (KIS)",
    description: "국내외 주식 잔고. REST OpenAPI.",
    issueUrl: "https://apiportal.koreainvestment.com",
    supported: true,
    fields: [
      { key: "appKey", label: "App Key", type: "password" },
      { key: "appSecret", label: "App Secret", type: "password" },
      { key: "accountNo", label: "계좌번호 (8-2자리)", type: "text" },
    ],
  },
  {
    id: "tossSecurities",
    name: "토스증권",
    description: "주식 잔고. OAuth2 Client Credentials.",
    issueUrl: "https://developers.tossinvest.com",
    supported: true,
    fields: [
      { key: "clientId", label: "Client ID", type: "password" },
      { key: "clientSecret", label: "Client Secret", type: "password" },
    ],
  },
  {
    id: "finnhub",
    name: "Finnhub (미국 시세·배당)",
    description: "미국주식 현재가 및 배당 일정.",
    issueUrl: "https://finnhub.io/dashboard",
    supported: true,
    fields: [{ key: "apiKey", label: "API Key", type: "password" }],
  },
  {
    id: "ecos",
    name: "한국은행 ECOS (환율)",
    description: "USD/KRW 환율. 실패 시 공개 환율로 폴백.",
    issueUrl: "https://ecos.bok.or.kr/api",
    supported: true,
    fields: [{ key: "apiKey", label: "인증키", type: "password" }],
  },
  {
    id: "nhInvestment",
    name: "NH투자증권 (나무)",
    description:
      "Windows 전용 WMCA API. 본인 PC 의 브릿지 프로그램이 잔고를 올려줍니다(웹에서 직접 연동 불가).",
    supported: false,
    unsupportedNote:
      "NH 는 Windows DLL 전용이라 클라우드에서 직접 호출할 수 없습니다. 별도 PC 브릿지(pynamuh 기반)로 연동 예정.",
    fields: [],
  },
];

export function getSource(id: string): CredentialSource | undefined {
  return CREDENTIAL_SOURCES.find((s) => s.id === id);
}
