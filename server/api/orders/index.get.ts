import { sanitizeOrdersQuery } from "~~/shared/query";
import type { OrdersResponse } from "~~/shared/types";

// GET /api/orders?page&pageSize&status&site&q&sort&order
// Proxies the paginated list + summary. Only whitelisted, clamped params are forwarded.
export default defineEventHandler(async (event) => {
  const query = sanitizeOrdersQuery(getQuery(event));
  const res = await salesApi<OrdersResponse>("", { ...query });

  setResponseHeader(event, "cache-control", "private, max-age=0, must-revalidate");

  return {
    summary: res.summary,
    page: res.page,
    pageSize: res.pageSize,
    total: res.total,
    totalPages: res.totalPages,
    sort: res.sort,
    order: res.order,
    data: res.data,
  } satisfies OrdersResponse;
});
