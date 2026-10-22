<script setup lang="ts">
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronRight, Inbox, TriangleAlert } from "lucide-vue-next";
import { formatCurrency, formatDate } from "~~/shared/format";
import type { SalesOrder, SortField } from "~~/shared/types";

const props = defineProps<{
  orders: SalesOrder[];
  pending: boolean;
  error: string | null;
  sort?: SortField;
  order?: "asc" | "desc";
  hasFilters: boolean;
  pageSize: number;
}>();
const emit = defineEmits<{ sort: [field: SortField]; open: [id: string]; retry: []; reset: [] }>();

const columns: { key: string; label: string; sort?: SortField; align?: "right"; class?: string }[] = [
  { key: "id", label: "Order no.", sort: "SalesId" },
  { key: "customer", label: "Customer" },
  { key: "site", label: "Branch / site", sort: "InventSiteId" },
  { key: "date", label: "Order date", sort: "CreatedDateTime1" },
  { key: "status", label: "Status", sort: "SalesStatus" },
  { key: "amount", label: "Amount", sort: "HAR_TotalSOAmount", align: "right" },
];

const ariaSort = (field?: SortField) =>
  field && props.sort === field ? (props.order === "desc" ? "descending" : "ascending") : undefined;

// Show skeleton rows only on first load; on refetch keep old rows visible but dimmed.
const showSkeleton = computed(() => props.pending && props.orders.length === 0 && !props.error);
const skeletonRows = computed(() => Math.min(props.pageSize, 10));

// The desktop table scrolls inside a fixed-height box; start each new result set at the top.
const scroller = ref<HTMLElement | null>(null);
watch(
  () => props.orders,
  () => scroller.value?.scrollTo({ top: 0 }),
);
</script>

<template>
  <div class="relative">
    <!-- Error state -->
    <div v-if="error && !pending" class="flex flex-col items-center gap-3 px-6 py-16 text-center" role="alert">
      <span class="grid size-12 place-items-center rounded-full bg-rose-50 text-rose-600">
        <TriangleAlert class="size-6" aria-hidden="true" />
      </span>
      <div>
        <p class="font-medium text-slate-900">Couldn't load orders</p>
        <p class="mt-1 text-sm text-slate-500">{{ error }}</p>
      </div>
      <button type="button" class="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700" @click="emit('retry')">
        Try again
      </button>
    </div>

    <!-- Empty state -->
    <div v-else-if="!pending && orders.length === 0" class="flex flex-col items-center gap-3 px-6 py-16 text-center">
      <span class="grid size-12 place-items-center rounded-full bg-slate-100 text-slate-500">
        <Inbox class="size-6" aria-hidden="true" />
      </span>
      <div>
        <p class="font-medium text-slate-900">No orders found</p>
        <p class="mt-1 text-sm text-slate-500">
          {{ hasFilters ? "No orders match your search or filters." : "There are no orders to show." }}
        </p>
      </div>
      <button
        v-if="hasFilters"
        type="button"
        class="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        @click="emit('reset')"
      >
        Clear filters
      </button>
    </div>

    <template v-else>
      <!-- Desktop / tablet: table -->
      <div
        ref="scroller"
        class="hidden max-h-[min(65vh,640px)] overflow-auto overscroll-contain md:block"
        :class="{ 'opacity-60 transition-opacity': pending && !showSkeleton }"
        :aria-busy="pending"
        tabindex="-1"
      >
        <table class="w-full text-left text-sm">
          <thead class="sticky top-0 z-10 bg-slate-50 text-xs uppercase tracking-wide text-slate-500 shadow-[inset_0_-1px_0_var(--color-slate-200)]">
            <tr>
              <th
                v-for="col in columns"
                :key="col.key"
                scope="col"
                class="whitespace-nowrap px-4 py-3 font-medium"
                :class="col.align === 'right' ? 'text-right' : ''"
                :aria-sort="ariaSort(col.sort)"
              >
                <button
                  v-if="col.sort"
                  type="button"
                  class="inline-flex items-center gap-1 rounded uppercase hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-brand-500"
                  :class="{ 'text-slate-900': sort === col.sort }"
                  @click="emit('sort', col.sort!)"
                >
                  {{ col.label }}
                  <ArrowUp v-if="sort === col.sort && order !== 'desc'" class="size-3.5" aria-hidden="true" />
                  <ArrowDown v-else-if="sort === col.sort" class="size-3.5" aria-hidden="true" />
                  <ArrowUpDown v-else class="size-3.5 opacity-40" aria-hidden="true" />
                </button>
                <span v-else>{{ col.label }}</span>
              </th>
              <th scope="col" class="w-8"><span class="sr-only">Open</span></th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <template v-if="showSkeleton">
              <tr v-for="i in skeletonRows" :key="i">
                <td v-for="c in columns.length + 1" :key="c" class="px-4 py-3.5">
                  <div class="h-4 animate-pulse rounded bg-slate-100" :class="c === 2 ? 'w-40' : 'w-20'" />
                </td>
              </tr>
            </template>
            <tr
              v-for="o in orders"
              v-else
              :key="o.SalesId"
              class="cursor-pointer hover:bg-slate-50 focus-visible:bg-brand-50 focus-visible:outline-none"
              tabindex="0"
              @click="emit('open', o.SalesId)"
              @keydown.enter="emit('open', o.SalesId)"
            >
              <td class="whitespace-nowrap px-4 py-3 font-mono text-xs font-medium text-brand-700">{{ o.SalesId }}</td>
              <td class="max-w-[280px] px-4 py-3">
                <p class="truncate font-medium text-slate-900">{{ o.SalesName || "—" }}</p>
                <p class="truncate text-xs text-slate-500">{{ o.CustAccount }}</p>
              </td>
              <td class="whitespace-nowrap px-4 py-3 text-slate-700">{{ o.InventSiteId || "—" }}</td>
              <td class="whitespace-nowrap px-4 py-3 text-slate-700">{{ formatDate(o.CreatedDateTime1) }}</td>
              <td class="px-4 py-3"><StatusBadge :status="o.SalesStatus" /></td>
              <td class="tabular whitespace-nowrap px-4 py-3 text-right font-medium text-slate-900">{{ formatCurrency(o.HAR_TotalSOAmount) }}</td>
              <td class="pr-3 text-slate-300"><ChevronRight class="size-4" aria-hidden="true" /></td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Mobile: cards -->
      <ul class="divide-y divide-slate-100 md:hidden" :class="{ 'opacity-60': pending && !showSkeleton }" :aria-busy="pending">
        <template v-if="showSkeleton">
          <li v-for="i in skeletonRows" :key="i" class="space-y-2 p-4">
            <div class="h-4 w-1/2 animate-pulse rounded bg-slate-100" />
            <div class="h-3 w-3/4 animate-pulse rounded bg-slate-100" />
          </li>
        </template>
        <li v-for="o in orders" v-else :key="o.SalesId">
          <button type="button" class="block w-full p-4 text-left active:bg-slate-50" @click="emit('open', o.SalesId)">
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0">
                <p class="truncate font-medium text-slate-900">{{ o.SalesName || "—" }}</p>
                <p class="mt-0.5 font-mono text-xs text-brand-700">{{ o.SalesId }}</p>
              </div>
              <p class="tabular shrink-0 font-semibold text-slate-900">{{ formatCurrency(o.HAR_TotalSOAmount) }}</p>
            </div>
            <div class="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
              <StatusBadge :status="o.SalesStatus" />
              <span>{{ o.InventSiteId }}</span>
              <span>{{ formatDate(o.CreatedDateTime1) }}</span>
            </div>
          </button>
        </li>
      </ul>
    </template>
  </div>
</template>
