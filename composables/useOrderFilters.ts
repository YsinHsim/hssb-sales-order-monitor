import { sanitizeOrdersQuery } from "~~/shared/query";
import type { OrdersQuery, SortField } from "~~/shared/types";

/**
 * Filters, sorting and pagination live in the URL query string, so a filtered
 * view can be bookmarked/shared and survives refresh and back/forward.
 */
export function useOrderFilters() {
  const route = useRoute();
  const router = useRouter();

  const query = computed<OrdersQuery>(() => sanitizeOrdersQuery(route.query));

  function update(patch: Partial<OrdersQuery>, { resetPage = true } = {}) {
    const next: Record<string, string | undefined> = {};
    const merged = { ...query.value, ...patch };
    if (resetPage && !("page" in patch)) merged.page = 1;

    if (merged.q) next.q = merged.q;
    if (merged.status) next.status = merged.status;
    if (merged.site) next.site = merged.site;
    if (merged.sort) {
      next.sort = merged.sort;
      next.order = merged.order ?? "asc";
    }
    if (merged.page > 1) next.page = String(merged.page);
    if (merged.pageSize !== 25) next.pageSize = String(merged.pageSize);

    return router.replace({ query: next });
  }

  function toggleSort(field: SortField) {
    const { sort, order } = query.value;
    if (sort !== field) return update({ sort: field, order: field === "SalesId" ? "asc" : "desc" });
    if (order === "desc") return update({ sort: field, order: "asc" });
    return update({ sort: undefined, order: undefined }); // third click clears sorting
  }

  function reset() {
    return router.replace({ query: {} });
  }

  const hasFilters = computed(() => Boolean(query.value.q || query.value.status || query.value.site));

  return { query, update, toggleSort, reset, hasFilters };
}
