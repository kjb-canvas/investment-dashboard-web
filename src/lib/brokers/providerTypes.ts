// 브로커 계좌 제공자 규약.
// 각 브로커 모듈은 "복호화된 자격증명 → Promise<Account[]>" 함수를 구현한다.
// 토큰 발급이 필요한 브로커(KIS/Toss)는 함수 내부에서 처리한다(호출마다 신규 토큰 OK).

import type { Account } from "../domain/account";

export type AccountProvider<C> = (creds: C) => Promise<Account[]>;

/** 한 브로커 조회 결과 (부분 실패 허용용). */
export interface ProviderOutcome {
  broker: string;
  accounts: Account[];
  error?: string;
}
