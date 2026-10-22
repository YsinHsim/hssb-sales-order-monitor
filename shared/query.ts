import { SORT_FIELDS, type OrdersQuery, type SortField } from "./types";

type RawQuery = Record<string, unknown>;

const first = (v: unknown): string | undefined => {
  const value = Array.isArray(v) ? v[0] : v;
  if (value === undefined || value === null) return undefined;
  const s = String(value).trim();
  return s === "" ? undefined : s;
};

const toInt = (v: unknown, fallback: number, min: number, max: number): number => {
  const n = Number.parseInt(first(v) ?? "", 10);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(Math.max(n, min), max);
};

/**
 * Normalise an untrusted query string (from the browser URL or our own /api route)
 * into the parameters the upstream API accepts. Unknown keys are dropped,
 * numbers are clamped and free text is length-limited.
 */
export function sanitizeOrdersQuery(raw: RawQuery): OrdersQuery {
  const query: OrdersQuery = {
    page: toInt(raw.page, 1, 1, 100_000),
    pageSize: toInt(raw.pageSize, 25, 1, 100),
  };

  const status = first(raw.status);
  if (status) query.status = status.slice(0, 50);

  const site = first(raw.site);
  if (site) query.site = site.slice(0, 20);

  const q = first(raw.q);
  if (q) query.q = q.slice(0, 100);

  const sort = first(raw.sort);
  if (sort && (SORT_FIELDS as readonly string[]).includes(sort)) {
    query.sort = sort as SortField;
    query.order = first(raw.order)?.toLowerCase() === "desc" ? "desc" : "asc";
  }

  return query;
}

/** SalesId values look like SO-MOCK-00001; reject anything that could alter the upstream path. */
export function isValidSalesId(id: string): boolean {
  return /^[A-Za-z0-9-]{1,40}$/.test(id);
}
