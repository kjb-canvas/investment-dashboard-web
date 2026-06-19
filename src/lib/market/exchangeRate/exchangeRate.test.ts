// 환율 순수 파서 단위 테스트 — iOS ExchangeRateTests.swift 픽스처 포팅 (네트워크 없음).

import { describe, it, expect } from "vitest";
import {
  parseEcosResponse,
  parseFallbackResponse,
  type BokResponse,
  type ERAPIResponse,
} from "./parser";

describe("parseEcosResponse", () => {
  it("decodes newest row by TIME", () => {
    const json: BokResponse = {
      StatisticSearch: {
        row: [
          { TIME: "20260617", DATA_VALUE: "1375.0" },
          { TIME: "20260618", DATA_VALUE: "1380.5" },
        ],
      },
    };
    expect(parseEcosResponse(json)).toBeCloseTo(1380.5, 3);
  });

  it("skips empty DATA_VALUE and returns next valid", () => {
    const json: BokResponse = {
      StatisticSearch: {
        row: [
          { TIME: "20260618", DATA_VALUE: " " },
          { TIME: "20260617", DATA_VALUE: "1375.0" },
        ],
      },
    };
    expect(parseEcosResponse(json)).toBeCloseTo(1375.0, 3);
  });

  it("throws on error envelope (RESULT present)", () => {
    const json: BokResponse = {
      RESULT: { CODE: "INFO-200", MESSAGE: "해당하는 데이터가 없습니다." },
    };
    expect(() => parseEcosResponse(json)).toThrow(/INFO-200/);
  });

  it("throws when no valid rows", () => {
    const json: BokResponse = {
      StatisticSearch: { row: [{ TIME: "20260618", DATA_VALUE: " " }] },
    };
    expect(() => parseEcosResponse(json)).toThrow();
  });

  it("throws when StatisticSearch missing", () => {
    expect(() => parseEcosResponse({} as BokResponse)).toThrow();
  });
});

describe("parseFallbackResponse", () => {
  it("decodes KRW rate", () => {
    const json: ERAPIResponse = {
      result: "success",
      rates: { KRW: 1380.5, EUR: 0.92 },
    };
    expect(parseFallbackResponse(json)).toBeCloseTo(1380.5, 3);
  });

  it("throws when result not success", () => {
    const json: ERAPIResponse = { result: "error", rates: {} };
    expect(() => parseFallbackResponse(json)).toThrow();
  });

  it("throws when KRW key missing", () => {
    const json: ERAPIResponse = { result: "success", rates: { EUR: 0.92 } };
    expect(() => parseFallbackResponse(json)).toThrow();
  });
});
