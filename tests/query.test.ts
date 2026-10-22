import { describe, expect, it } from "vitest";
import { isValidSalesId, sanitizeOrdersQuery } from "../shared/query";

describe("sanitizeOrdersQuery", () => {
  it("applies defaults", () => {
    expect(sanitizeOrdersQuery({})).toEqual({ page: 1, pageSize: 25 });
  });

  it("clamps page and pageSize", () => {
    expect(sanitizeOrdersQuery({ page: "0", pageSize: "500" })).toMatchObject({ page: 1, pageSize: 100 });
    expect(sanitizeOrdersQuery({ page: "-3", pageSize: "0" })).toMatchObject({ page: 1, pageSize: 1 });
    expect(sanitizeOrdersQuery({ page: "abc" })).toMatchObject({ page: 1 });
  });

  it("trims text and drops empty values", () => {
    expect(sanitizeOrdersQuery({ q: "  Siti  ", status: "", site: "   " })).toEqual({ page: 1, pageSize: 25, q: "Siti" });
  });

  it("takes the first value of repeated params", () => {
    expect(sanitizeOrdersQuery({ site: ["B20", "C30"] })).toMatchObject({ site: "B20" });
  });

  it("limits search length", () => {
    expect(sanitizeOrdersQuery({ q: "x".repeat(500) }).q).toHaveLength(100);
  });

  it("only allows whitelisted sort fields", () => {
    expect(sanitizeOrdersQuery({ sort: "DROP TABLE", order: "desc" })).toEqual({ page: 1, pageSize: 25 });
    expect(sanitizeOrdersQuery({ sort: "HAR_TotalSOAmount", order: "DESC" })).toMatchObject({ sort: "HAR_TotalSOAmount", order: "desc" });
    expect(sanitizeOrdersQuery({ sort: "SalesId", order: "weird" })).toMatchObject({ sort: "SalesId", order: "asc" });
  });

  it("drops unknown params", () => {
    expect(sanitizeOrdersQuery({ foo: "bar", apiKey: "x" })).toEqual({ page: 1, pageSize: 25 });
  });
});

describe("isValidSalesId", () => {
  it("accepts order numbers", () => {
    expect(isValidSalesId("SO-MOCK-00001")).toBe(true);
  });

  it("rejects path tricks and junk", () => {
    expect(isValidSalesId("../meta")).toBe(false);
    expect(isValidSalesId("SO-1?x=1")).toBe(false);
    expect(isValidSalesId("")).toBe(false);
  });
});
