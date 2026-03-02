import { describe, it, expect } from "vitest";

/**
 * Test the pure helper functions inside proxy.service.ts.
 * Since they're not exported, we re-implement/extract the logic here to verify
 * the algorithms (buildCacheKey, buildUpstreamParams, sortMergedItems, mergeTotalData).
 *
 * In a future refactor these helpers should be exported for direct testing.
 */

// ── buildUpstreamParams logic ────────────────────────────────

const SPLIT_DATE_ENDPOINTS = new Set([
  "/agent/reportLottery.html",
  "/agent/reportFunds.html",
  "/agent/reportThirdGame.html",
  "/agent/betOrder.html",
]);

function buildUpstreamParams(
  input: Record<string, unknown>,
  path: string,
): Record<string, string> {
  const params: Record<string, string> = {};
  for (const [key, value] of Object.entries(input)) {
    if (key === "agentId") continue;
    if (value === undefined || value === null || value === "") continue;

    if (
      (key === "date" || key === "bet_time") &&
      SPLIT_DATE_ENDPOINTS.has(path)
    ) {
      // Split on " - " (space-dash-space) to avoid splitting dates like "2024-01-01"
      const parts = String(value).split(" - ");
      if (parts.length === 2) {
        params["start_date"] = parts[0].trim();
        params["end_date"] = parts[1].trim();
      }
      continue;
    }

    params[key] = String(value);
  }
  return params;
}

describe("buildUpstreamParams", () => {
  it("should strip agentId from params", () => {
    const result = buildUpstreamParams(
      { agentId: "a1", page: 1, limit: 10 },
      "/agent/user.html",
    );
    expect(result).not.toHaveProperty("agentId");
    expect(result).toEqual({ page: "1", limit: "10" });
  });

  it("should skip undefined/null/empty values", () => {
    const result = buildUpstreamParams(
      { page: 1, name: "", status: undefined, foo: null },
      "/agent/user.html",
    );
    expect(result).toEqual({ page: "1" });
  });

  it("should split date range for report endpoints", () => {
    const result = buildUpstreamParams(
      { date: "2024-01-01 - 2024-01-31" },
      "/agent/reportLottery.html",
    );
    expect(result).toEqual({
      start_date: "2024-01-01",
      end_date: "2024-01-31",
    });
    expect(result).not.toHaveProperty("date");
  });

  it("should NOT split date for non-report endpoints", () => {
    const result = buildUpstreamParams(
      { date: "2024-01-01 - 2024-01-31" },
      "/agent/user.html",
    );
    expect(result).toEqual({ date: "2024-01-01 - 2024-01-31" });
  });
});

// ── sortMergedItems logic ────────────────────────────────────

const NATURAL_SORT_KEY: Record<string, string> = {
  "/agent/user.html": "register_time",
  "/agent/inviteList.html": "create_time",
  "/agent/reportFunds.html": "date",
};

function sortMergedItems<T>(items: T[], path: string): T[] {
  const sortKey = NATURAL_SORT_KEY[path];
  if (!sortKey || items.length === 0) return items;

  return items.sort((a: any, b: any) => {
    const va = a[sortKey];
    const vb = b[sortKey];
    if (va == null && vb == null) return 0;
    if (va == null) return 1;
    if (vb == null) return -1;
    return String(vb).localeCompare(String(va));
  });
}

describe("sortMergedItems", () => {
  it("should sort by natural key descending (newest first)", () => {
    const items = [
      { register_time: "2024-01-01 10:00:00", name: "Alice" },
      { register_time: "2024-01-03 10:00:00", name: "Charlie" },
      { register_time: "2024-01-02 10:00:00", name: "Bob" },
    ];

    const sorted = sortMergedItems(items, "/agent/user.html");
    expect(sorted[0].name).toBe("Charlie");
    expect(sorted[1].name).toBe("Bob");
    expect(sorted[2].name).toBe("Alice");
  });

  it("should return items unchanged for endpoints without sort key", () => {
    const items = [{ a: 1 }, { a: 2 }];
    const sorted = sortMergedItems(items, "/agent/bankList.html");
    expect(sorted).toEqual([{ a: 1 }, { a: 2 }]);
  });

  it("should handle null sort key values", () => {
    const items = [
      { register_time: null, name: "NoDate" },
      { register_time: "2024-01-01", name: "HasDate" },
    ];

    const sorted = sortMergedItems(items, "/agent/user.html");
    expect(sorted[0].name).toBe("HasDate");
    expect(sorted[1].name).toBe("NoDate");
  });
});

// ── mergeTotalData logic ─────────────────────────────────────

function mergeTotalData(
  results: Array<{ totalData?: Record<string, unknown> }>,
): Record<string, unknown> | undefined {
  const allTotals = results
    .map((r) => r.totalData)
    .filter(Boolean) as Record<string, unknown>[];
  if (allTotals.length === 0) return undefined;

  const merged: Record<string, unknown> = {};
  for (const td of allTotals) {
    for (const [key, val] of Object.entries(td)) {
      const num = parseFloat(String(val));
      if (!isNaN(num)) {
        merged[key] = ((merged[key] as number) || 0) + num;
      } else {
        merged[key] = val;
      }
    }
  }

  for (const [key, val] of Object.entries(merged)) {
    if (typeof val === "number") {
      merged[key] = val.toFixed(4);
    }
  }
  return merged;
}

describe("mergeTotalData", () => {
  it("should sum numeric fields from multiple agents", () => {
    const results = [
      { totalData: { total_bet: "100.50", total_win: "50.25" } },
      { totalData: { total_bet: "200.00", total_win: "80.00" } },
    ];

    const merged = mergeTotalData(results);
    expect(merged).toEqual({
      total_bet: "300.5000",
      total_win: "130.2500",
    });
  });

  it("should return undefined when no totalData", () => {
    const results = [{ totalData: undefined }, {}];
    expect(mergeTotalData(results)).toBeUndefined();
  });

  it("should keep non-numeric fields as-is", () => {
    const results = [
      { totalData: { currency: "VND", total: "100" } },
      { totalData: { currency: "VND", total: "200" } },
    ];

    const merged = mergeTotalData(results);
    expect(merged?.currency).toBe("VND");
    expect(merged?.total).toBe("300.0000");
  });
});

// ── isReferenceRequest logic ─────────────────────────────────

function isReferenceRequest(
  path: string,
  input: Record<string, unknown>,
): boolean {
  if (path === "/agent/getLottery") return true;
  if (path === "/agent/getRebateOddsPanel.html") return true;
  if (path === "/agent/bet.html" && input.play_type) return true;
  return false;
}

describe("isReferenceRequest", () => {
  it("should return true for lottery dropdown", () => {
    expect(isReferenceRequest("/agent/getLottery", {})).toBe(true);
  });

  it("should return true for rebate odds panel", () => {
    expect(isReferenceRequest("/agent/getRebateOddsPanel.html", {})).toBe(true);
  });

  it("should return true for bet with play_type (dropdown)", () => {
    expect(
      isReferenceRequest("/agent/bet.html", { play_type: "ssc" }),
    ).toBe(true);
  });

  it("should return false for normal bet list", () => {
    expect(isReferenceRequest("/agent/bet.html", { page: 1 })).toBe(false);
  });

  it("should return false for user list", () => {
    expect(isReferenceRequest("/agent/user.html", {})).toBe(false);
  });
});
