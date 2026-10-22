import { isValidSalesId } from "~~/shared/query";
import type { SalesOrder } from "~~/shared/types";

// GET /api/orders/:id — single order detail.
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id") ?? "";
  if (!isValidSalesId(id)) {
    throw createError({ statusCode: 400, statusMessage: "Bad request", message: "Invalid order number." });
  }

  const res = await salesApi<SalesOrder | { data: SalesOrder }>(`/${encodeURIComponent(id)}`);
  // Accept either a bare object or a { data } envelope.
  return ("data" in res && res.data && typeof res.data === "object" ? res.data : res) as SalesOrder;
});
