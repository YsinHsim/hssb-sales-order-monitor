<script setup lang="ts">
import { Ban, CircleDollarSign, Clock, PackageCheck, ShoppingCart } from "lucide-vue-next";
import { formatCount, formatCurrency } from "~~/shared/format";
import type { OrdersSummary } from "~~/shared/types";

const props = defineProps<{
  summary: OrdersSummary | null | undefined;
  pending: boolean;
  error: boolean;
  /** Status filter currently applied to the list, used to highlight the matching card. */
  activeStatus?: string;
}>();
const emit = defineEmits<{ retry: []; pickStatus: [status: string | undefined] }>();

const pct = (n: number) => {
  const total = props.summary?.total_orders ?? 0;
  return total ? `${Math.round((n / total) * 100)}% of orders` : "";
};

const isActive = (status: string) => props.activeStatus?.toLowerCase() === status.toLowerCase();

interface Card {
  key: string;
  label: string;
  value: string;
  hint: string;
  icon: typeof ShoppingCart;
  tone: string;
  /** Clicking the card filters by this status; `null` clears the status filter. */
  filter?: string | null;
  /** Clickable sub-filters shown inside the card (Completed = Invoiced + Delivered). */
  chips?: { status: string; label: string }[];
  active: boolean;
}

const cards = computed<Card[]>(() => {
  const s = props.summary;
  if (!s) return [];
  const completed = s.invoiced_orders + s.delivered_orders;
  return [
    {
      key: "total",
      label: "Total orders",
      value: formatCount(s.total_orders),
      hint: "All branches",
      icon: ShoppingCart,
      tone: "text-slate-700 bg-slate-100",
      filter: null,
      active: !props.activeStatus,
    },
    {
      key: "open",
      label: "Open / pending",
      value: formatCount(s.open_orders),
      hint: pct(s.open_orders),
      icon: Clock,
      tone: "text-amber-700 bg-amber-50",
      filter: "Open order",
      active: isActive("Open order"),
    },
    {
      // The API's status filter takes a single value, so this card offers one chip per status.
      key: "completed",
      label: "Completed",
      value: formatCount(completed),
      hint: "",
      icon: PackageCheck,
      tone: "text-emerald-700 bg-emerald-50",
      chips: [
        { status: "Invoiced", label: `${formatCount(s.invoiced_orders)} invoiced` },
        { status: "Delivered", label: `${formatCount(s.delivered_orders)} delivered` },
      ],
      active: isActive("Invoiced") || isActive("Delivered"),
    },
    {
      key: "cancelled",
      label: "Cancelled",
      value: formatCount(s.cancelled_orders),
      hint: pct(s.cancelled_orders),
      icon: Ban,
      tone: "text-rose-700 bg-rose-50",
      filter: "Cancelled",
      active: isActive("Cancelled"),
    },
    {
      key: "value",
      label: "Total order value",
      value: formatCurrency(s.total_order_value),
      hint: "Sum of SO amount",
      icon: CircleDollarSign,
      tone: "text-brand-700 bg-brand-50",
      active: false,
    },
  ];
});

const clickable = (card: Card) => card.filter !== undefined;

function cardTitle(card: Card) {
  if (card.filter === null) return "Show all statuses";
  if (card.filter) return `Filter list by ${card.filter}`;
  return undefined;
}
</script>

<template>
  <section aria-labelledby="kpi-heading">
    <h2 id="kpi-heading" class="sr-only">Dashboard summary</h2>

    <div
      v-if="error && !summary"
      class="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800"
      role="alert"
    >
      <span>Couldn't load the dashboard summary.</span>
      <button type="button" class="rounded-md bg-white px-3 py-1.5 font-medium ring-1 ring-rose-200 hover:bg-rose-100" @click="emit('retry')">
        Retry
      </button>
    </div>

    <div v-else class="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-[repeat(4,minmax(0,1fr))_minmax(0,1.5fr)]">
      <template v-if="pending && !summary">
        <div v-for="i in 5" :key="i" class="h-[104px] animate-pulse rounded-xl border border-slate-200 bg-white" :class="{ 'col-span-2 lg:col-span-1': i === 5 }" />
      </template>
      <template v-else>
        <component
          :is="clickable(card) ? 'button' : 'div'"
          v-for="card in cards"
          :key="card.key"
          :type="clickable(card) ? 'button' : undefined"
          :aria-pressed="clickable(card) ? card.active : undefined"
          class="rounded-xl border bg-white p-4 text-left shadow-xs"
          :class="[
            card.key === 'value' ? 'col-span-2 lg:col-span-1' : '',
            card.active ? 'border-brand-500 ring-2 ring-brand-500/20' : 'border-slate-200',
            clickable(card) ? 'cursor-pointer transition hover:border-slate-300 hover:shadow-sm focus-visible:outline-2 focus-visible:outline-brand-500' : '',
          ]"
          :title="cardTitle(card)"
          @click="clickable(card) && emit('pickStatus', card.filter ?? undefined)"
        >
          <div class="flex items-start justify-between gap-2">
            <p class="text-xs font-medium uppercase tracking-wide text-slate-500">{{ card.label }}</p>
            <span class="grid size-8 shrink-0 place-items-center rounded-lg" :class="card.tone">
              <component :is="card.icon" class="size-4" aria-hidden="true" />
            </span>
          </div>
          <p class="tabular mt-1 truncate text-xl font-semibold text-slate-900 sm:text-2xl">{{ card.value }}</p>
          <div v-if="card.chips" class="mt-1 flex flex-wrap gap-1.5">
            <button
              v-for="chip in card.chips"
              :key="chip.status"
              type="button"
              class="rounded-full px-2 py-0.5 text-xs ring-1 ring-inset transition focus-visible:outline-2 focus-visible:outline-brand-500"
              :class="isActive(chip.status) ? 'bg-emerald-600 text-white ring-emerald-600' : 'bg-emerald-50 text-emerald-800 ring-emerald-600/20 hover:bg-emerald-100'"
              :aria-pressed="isActive(chip.status)"
              :title="`Filter list by ${chip.status}`"
              @click="emit('pickStatus', chip.status)"
            >
              {{ chip.label }}
            </button>
          </div>
          <p v-else class="mt-0.5 text-xs leading-snug text-slate-500">{{ card.hint }}</p>
        </component>
      </template>
    </div>
  </section>
</template>
