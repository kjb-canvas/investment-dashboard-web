// 통화·비율 포맷 헬퍼 — iOS CurrencyFormat 포팅.

/** KRW 금액을 그룹 구분자와 "원" 접미사로 포맷. 예: 279149692 → "279,149,692원" */
export function formattedKRW(value: number): string {
  return `${Math.round(value).toLocaleString("ko-KR")}원`;
}

/** 부호 포함 KRW. 예: 32323665 → "+32,323,665원", -1000 → "-1,000원" */
export function formattedSignedKRW(value: number): string {
  const sign = value >= 0 ? "+" : "-";
  return `${sign}${Math.round(Math.abs(value)).toLocaleString("ko-KR")}원`;
}

/** 부호 포함 퍼센트(소수점 2자리). 예: 13.1 → "+13.10%", -5.3 → "-5.30%" */
export function formattedPercent(value: number): string {
  const sign = value >= 0 ? "+" : "-";
  return `${sign}${Math.abs(value).toFixed(2)}%`;
}

/** 손익 색상 클래스(Tailwind). 양수 초록, 음수 빨강, 0 중립. */
export function profitColorClass(value: number): string {
  if (value > 0) return "text-emerald-400";
  if (value < 0) return "text-red-400";
  return "text-neutral-400";
}
