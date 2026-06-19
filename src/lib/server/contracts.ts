// 서버 데이터 오케스트레이션의 결과 규약 — 페이지/클라이언트가 소비하는 형태.
// (provider 구현에 의존하지 않도록 도메인 타입만 import)

import type { Account } from "../domain/account";

/** 한 소스 조회 실패 정보 (부분 실패 허용). */
export interface BrokerError {
  broker: string;
  error: string;
}

/** 홈/분석/포트폴리오가 공통으로 쓰는 집계 입력 데이터. */
export interface PortfolioData {
  accounts: Account[];
  usdToKrw: number;
  errors: BrokerError[];
  /** 데이터를 만든 시각(ISO). NH 등 캐시 소스의 신선도 표시에 사용. */
  fetchedAt: string;
}
