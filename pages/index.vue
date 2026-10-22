<script setup lang="ts">
import { ChevronDown, RefreshCw, SlidersHorizontal } from "lucide-vue-next";
import type { MetaResponse, OrdersResponse } from "~~/shared/types";

const { query, update, toggleSort, reset, hasFilters } = useOrderFilters();

// Dashboard summary: the API's summary block is dataset-wide (it does not change
// with filters), so fetch it once with the smallest possible page.
const {
  data: summaryRes,
  status: summaryStatus,
  error: summaryError,
  refresh: refreshSummary,
} = useFetch<OrdersResponse>("/api/orders", { query: { pageSize: 1 }, key: "summary", lazy: true });

// Filter options (statuses, sites) come from the API's /meta endpoint.
const { data: meta, error: metaError } = useFetch<MetaResponse>("/api/meta", { key: "meta", lazy: true });

// Order list: refetches whenever the URL query changes. Nuxt cancels the
// in-flight request when a newer one starts, so fast typing can't show stale results.
const {
  data: list,
  status: listStatus,
  error: listError,
  refresh: refreshList,
} = useFetch<OrdersResponse>("/api/orders", { query, key: "orders", lazy: true });

const listPending = computed(() => listStatus.value === "pending" || listStatus.value === "idle");
const listErrorMessage = computed(() => {
  const e = listError.value;
  if (!e) return null;
  return e.statusCode && e.statusCode >= 500
    ? "The order service is unavailable right now. Please try again shortly."
    : e.data?.message || e.message || "Something went wrong.";
});

// If the user lands on a page beyond the last one (e.g. filters shrank the result), jump back.
// `immediate` also covers data that arrived during SSR; the redirect runs only in the browser.
watch(
  list,
  (res) => {
    if (import.meta.client && res && res.data.length === 0 && res.total > 0 && query.value.page > res.totalPages) {
      update({ page: res.totalPages }, { resetPage: false });
    }
  },
  { immediate: true },
);

const selectedId = ref<string | null>(null);

const listTop = ref<HTMLElement | null>(null);
function goToPage(page: number) {
  update({ page }, { resetPage: false });
  listTop.value?.scrollIntoView({ behavior: "smooth", block: "start" });
}

const refreshing = ref(false);
async function refreshAll() {
  refreshing.value = true;
  try {
    await Promise.all([refreshSummary(), refreshList()]);
  } finally {
    refreshing.value = false;
  }
}

const statusLabel = computed(() => {
  const parts = [query.value.status, query.value.site, query.value.q ? `“${query.value.q}”` : undefined].filter(Boolean);
  return parts.length ? parts.join(" · ") : "All orders";
});

// Filter panel can be collapsed; the choice is remembered per browser.
// Read after mount so server and client render the same markup first.
const FILTERS_KEY = "hssb.filtersOpen";
const filtersOpen = ref(true);
onMounted(() => {
  try {
    filtersOpen.value = localStorage.getItem(FILTERS_KEY) !== "0";
  } catch {
    // storage unavailable (private mode etc.): keep the default
  }
});
function toggleFilters() {
  filtersOpen.value = !filtersOpen.value;
  try {
    localStorage.setItem(FILTERS_KEY, filtersOpen.value ? "1" : "0");
  } catch {
    // ignore
  }
}
const activeFilterCount = computed(() => [query.value.q, query.value.status, query.value.site].filter(Boolean).length);
</script>

<template>
  <div class="min-h-dvh">
    <header class="border-b border-slate-200 bg-white">
      <div class="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <div class="flex items-center gap-3">
          <img src="/favicon.svg" alt="" class="size-9" />
          <div>
            <h1 class="text-base font-semibold leading-tight text-slate-900 sm:text-lg">Sales Order Monitoring</h1>
            <p class="text-xs text-slate-500">Orders across all branches</p>
          </div>
        </div>
        <button
          type="button"
          class="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
          :disabled="refreshing"
          @click="refreshAll"
        >
          <RefreshCw class="size-4" :class="{ 'animate-spin': refreshing }" aria-hidden="true" />
          <span class="hidden sm:inline">Refresh</span>
        </button>
      </div>
    </header>

    <main class="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6">
      <KpiCards
        :summary="summaryRes?.summary"
        :pending="summaryStatus === 'pending' || summaryStatus === 'idle'"
        :error="Boolean(summaryError)"
        :active-status="query.status"
        @retry="refreshSummary()"
        @pick-status="(s) => update({ status: s })"
      />

      <section ref="listTop" class="scroll-mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs" aria-labelledby="orders-heading">
        <div class="border-b border-slate-200 p-4">
          <div class="flex items-center justify-between gap-3">
            <div class="flex min-w-0 items-baseline gap-3">
              <h2 id="orders-heading" class="shrink-0 font-semibold text-slate-900">Orders</h2>
              <p class="truncate text-sm text-slate-500" aria-live="polite">{{ statusLabel }}</p>
            </div>
            <button
              type="button"
              class="inline-flex h-9 shrink-0 items-center gap-2 rounded-lg border px-3 text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-brand-500"
              :class="filtersOpen ? 'border-slate-300 bg-slate-50 text-slate-700 hover:bg-slate-100' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'"
              :aria-expanded="filtersOpen"
              aria-controls="order-filters"
              @click="toggleFilters"
            >
              <SlidersHorizontal class="size-4" aria-hidden="true" />
              <span>{{ filtersOpen ? "Hide filters" : "Show filters" }}</span>
              <span
                v-if="activeFilterCount"
                class="grid size-5 place-items-center rounded-full bg-brand-600 text-xs font-semibold text-white"
                :aria-label="`${activeFilterCount} active`"
              >{{ activeFilterCount }}</span>
              <ChevronDown class="size-4 transition-transform" :class="{ 'rotate-180': filtersOpen }" aria-hidden="true" />
            </button>
          </div>
          <OrderFilters
            v-show="filtersOpen"
            id="order-filters"
            class="mt-4"
            :q="query.q"
            :status="query.status"
            :site="query.site"
            :statuses="meta?.statuses ?? []"
            :sites="meta?.sites ?? []"
            :meta-error="Boolean(metaError)"
            :has-filters="hasFilters"
            @search="(q) => update({ q })"
            @status="(status) => update({ status })"
            @site="(site) => update({ site })"
            @reset="reset"
          />
        </div>

        <OrdersTable
          :orders="list?.data ?? []"
          :pending="listPending"
          :error="listErrorMessage"
          :sort="query.sort"
          :order="query.order"
          :has-filters="hasFilters"
          :page-size="query.pageSize"
          @sort="toggleSort"
          @open="(id) => (selectedId = id)"
          @retry="refreshList()"
          @reset="reset"
        />

        <div v-if="list && !listError && list.total > 0" class="border-t border-slate-200 p-4">
          <OrdersPagination
            :page="query.page"
            :page-size="query.pageSize"
            :total="list.total"
            :total-pages="list.totalPages"
            :disabled="listPending"
            @page="goToPage"
            @page-size="(pageSize) => update({ pageSize })"
          />
        </div>
      </section>

      <footer class="pb-4 text-center text-xs text-slate-400">
        Data: HSSB assessment mock API (fictional). Amounts in MYR, dates in Malaysia time (UTC+8).
      </footer>
    </main>

    <OrderDetail :id="selectedId" @close="selectedId = null" />
  </div>
</template>
