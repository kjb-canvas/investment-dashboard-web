// 분석 기간 단위 — iOS InvestAppCore/Domain/AnalysisPeriod.swift 포팅.

export type AnalysisPeriod =
  | "today"
  | "total"
  | "week"
  | "month"
  | "quarter"
  | "year";

export const ALL_PERIODS: AnalysisPeriod[] = [
  "today",
  "week",
  "month",
  "quarter",
  "year",
  "total",
];

/** 화면 표시용 한글 이름. */
export function periodDisplayName(p: AnalysisPeriod): string {
  switch (p) {
    case "today":
      return "오늘";
    case "total":
      return "전체";
    case "week":
      return "1주일";
    case "month":
      return "1개월";
    case "quarter":
      return "3개월";
    case "year":
      return "1년";
  }
}

export interface DateRange {
  start: Date;
  end: Date;
}

/**
 * 기간의 시작/종료 시각.
 * - total 은 전체 기간이므로 null 을 반환한다.
 * - today 는 오늘 0시 ~ 현재.
 * - 나머지는 (현재 - 기간) ~ 현재.
 */
export function dateRange(p: AnalysisPeriod, now: Date = new Date()): DateRange | null {
  const end = now;
  switch (p) {
    case "total":
      return null;
    case "today": {
      const start = new Date(now);
      start.setHours(0, 0, 0, 0);
      return { start, end };
    }
    case "week": {
      const start = new Date(now);
      start.setDate(start.getDate() - 7);
      return { start, end };
    }
    case "month": {
      const start = new Date(now);
      start.setMonth(start.getMonth() - 1);
      return { start, end };
    }
    case "quarter": {
      const start = new Date(now);
      start.setMonth(start.getMonth() - 3);
      return { start, end };
    }
    case "year": {
      const start = new Date(now);
      start.setFullYear(start.getFullYear() - 1);
      return { start, end };
    }
  }
}
