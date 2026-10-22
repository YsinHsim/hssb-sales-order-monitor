import { describe, expect, it } from "vitest";
import { formatCount, formatCurrency, formatDate, statusTone } from "../shared/format";

describe("formatCurrency", () => {
  it("formats MYR with 2 decimals", () => {
    expect(formatCurrency(998244.3)).toBe("RM\u00a0998,244.30");
  });

  it("shows a dash for missing values", () => {
    expect(formatCurrency(null)).toBe("—");
    expect(formatCurrency(Number.NaN)).toBe("—");
  });
});

describe("formatCount", () => {
  it("adds thousands separators", () => {
    expect(formatCount(1200)).toBe("1,200");
  });
});

describe("formatDate", () => {
  it("converts UTC to Malaysia time", () => {
    // 20:00 UTC on 30 Sep is 04:00 on 1 Oct in Malaysia.
    expect(formatDate("2026-09-30T20:00:00.000Z")).toBe("01 Oct 2026");
  });

  it("handles bad input", () => {
    expect(formatDate("not a date")).toBe("—");
    expect(formatDate(null)).toBe("—");
  });
});

describe("statusTone", () => {
  it("maps API statuses", () => {
    expect(statusTone("Open order")).toBe("open");
    expect(statusTone("INVOICED")).toBe("invoiced");
    expect(statusTone("Delivered")).toBe("delivered");
    expect(statusTone("Cancelled")).toBe("cancelled");
    expect(statusTone("Something new")).toBe("other");
  });
});
