import { describe, expect, it } from "vitest";
import { makeUpbitToken } from "./auth";
import {
  krwCashBalance,
  makeUpbitHoldings,
  mapUpbitAccount,
} from "./mapper";
import type { UpbitAccount, UpbitTicker } from "./models";

function account(
  currency: string,
  balance: string,
  avg: string,
  locked = "0",
): UpbitAccount {
  return {
    currency,
    balance,
    locked,
    avg_buy_price: avg,
    avg_buy_price_modified: false,
    unit_currency: "KRW",
  };
}

describe("UpbitMapper.makeUpbitHoldings", () => {
  it("combines balance and ticker, excluding KRW cash", () => {
    const accounts = [
      account("BTC", "0.01", "95000000", "0.00520187"),
      account("KRW", "1000000", "0"), // 현금은 제외돼야 함
    ];
    const tickers: UpbitTicker[] = [
      { market: "KRW-BTC", trade_price: 100_000_000 },
    ];

    const holdings = makeUpbitHoldings(accounts, tickers);

    expect(holdings).toHaveLength(1);
    const btc = holdings[0];
    expect(btc.symbol).toBe("BTC");
    expect(btc.quantity).toBeCloseTo(0.01520187, 9);
    expect(btc.currentPrice).toBeCloseTo(100_000_000, 3);
    expect(btc.averageCost).toBeCloseTo(95_000_000, 3);
    expect(btc.market).toBe("crypto");
    expect(btc.currency).toBe("krw");
  });

  it("falls back to avg price when ticker missing", () => {
    const holdings = makeUpbitHoldings([account("ETH", "2", "3000000")], []);
    expect(holdings).toHaveLength(1);
    expect(holdings[0].currentPrice).toBeCloseTo(3_000_000, 3);
    // 현재가를 못 찾으면 평단가 사용 → 손익 0
    const pl =
      holdings[0].quantity * holdings[0].currentPrice -
      holdings[0].quantity * holdings[0].averageCost;
    expect(pl).toBeCloseTo(0, 3);
  });

  it("excludes zero quantity holdings", () => {
    const holdings = makeUpbitHoldings(
      [account("DOGE", "0", "100", "0")],
      [],
    );
    expect(holdings).toHaveLength(0);
  });
});

describe("UpbitMapper.krwCashBalance", () => {
  it("sums fiat only", () => {
    const accounts = [
      account("KRW", "1000000", "0", "500000"),
      account("BTC", "1", "100"),
    ];
    expect(krwCashBalance(accounts)).toBeCloseTo(1_500_000, 3);
  });
});

describe("mapUpbitAccount", () => {
  it("returns a single upbit crypto wallet account", () => {
    const acc = mapUpbitAccount(
      [account("BTC", "1", "95000000")],
      [{ market: "KRW-BTC", trade_price: 100_000_000 }],
    );
    expect(acc.broker).toBe("upbit");
    expect(acc.accountType).toBe("cryptoWallet");
    expect(acc.name).toBe("업비트");
    expect(acc.holdings).toHaveLength(1);
  });
});

describe("makeUpbitToken (JWT HS256)", () => {
  it("has three segments", () => {
    const token = makeUpbitToken("ak", "sk");
    expect(token.split(".")).toHaveLength(3);
  });

  it("header is HS256 / JWT", () => {
    const token = makeUpbitToken("ak", "sk");
    const header = JSON.parse(
      Buffer.from(token.split(".")[0], "base64url").toString("utf8"),
    );
    expect(header.alg).toBe("HS256");
    expect(header.typ).toBe("JWT");
  });

  it("payload has access_key and nonce, no query_hash", () => {
    const token = makeUpbitToken("my-access", "sk", "fixed-nonce");
    const payload = JSON.parse(
      Buffer.from(token.split(".")[1], "base64url").toString("utf8"),
    );
    expect(payload.access_key).toBe("my-access");
    expect(payload.nonce).toBe("fixed-nonce");
    expect(payload.query_hash).toBeUndefined();
    expect(payload.query_hash_alg).toBeUndefined();
  });
});
