<script setup lang="ts">
import { Ban, CircleDollarSign, Clock, PackageCheck, ShoppingCart } from "lucide-vue-next";
import { formatCount, formatCurrency } from "~~/shared/format";
import type { OrdersSummary } from "~~/shared/types";

const props = defineProps<{
  summary: OrdersSummary | null | undefined;
  pending: boolean;
  error: boolean;
}>();
const emit = defineEmits<{ retry: []; pickStatus: [status: string | undefined] }>();

const pct = (n: number) => {
  const total = props.summary?.total_orders ?? 0;
  return total ? `${Math.round((n / total) * 100)}% of orders` : "";
};

const cards = computed(() => {
  const s = props.summary;
  if (!s) return [];
  const completed = s.invoiced_orders + s.delivered_orders;
  return [
    { key: "total", label: "Total orders", value: formatCount(s.total_orders), hint: "All branches", icon: ShoppingCart, tone: "text-slate-700 bg-slate-100", status: undefined },
    { key: "open", label: "Open / pending", value: formatCount(s.open_orders), hint: pct(s.open_orders), icon: Clock, tone: "text-amber-700 bg-amber-50", status: "Open order" },
    {
      key: "completed",
      label: "Completed",
      value: formatCount(completed),
      hint: `${formatCount(s.invoiced_orders)} invoiced · ${formatCount(s.delivered_orders)} delivered`,
      icon: PackageCheck,
      tone: "text-emerald-700 bg-emerald-50",
      status: undefined,
    },
    { key: "cancelled", label: "Cancelled", value: formatCount(s.cancelled_orders), hint: pct(s.cancelled_orders), icon: Ban, tone: "text-rose-700 bg-rose-50", status: "Cancelled" },
    { key: "value", label: "Total order value", value: formatCurrency(s.total_order_value), hint: "Sum of SO amount", icon: CircleDollarSign, tone: "text-brand-700 bg-brand-50", status: undefined },
  ];
});
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
          :is="card.status ? 'button' : 'div'"
          v-for="card in cards"
          :key="card.key"
          :type="card.status ? 'button' : undefined"
          class="rounded-xl border border-slate-200 bg-white p-4 text-left shadow-xs"
          :class="[
            card.key === 'value' ? 'col-span-2 lg:col-span-1' : '',
            card.status ? 'transition hover:border-slate-300 hover:shadow-sm focus-visible:outline-2 focus-visible:outline-brand-500' : '',
          ]"
          :title="card.status ? `Filter list by ${card.status}` : undefined"
          @click="card.status && emit('pickStatus', card.status)"
        >
          <div class="flex items-start justify-between gap-2">
            <p class="text-xs font-medium uppercase tracking-wide text-slate-500">{{ card.label }}</p>
            <span class="grid size-8 shrink-0 place-items-center rounded-lg" :class="card.tone">
              <component :is="card.icon" class="size-4" aria-hidden="true" />
            </span>
          </div>
          <p class="tabular mt-1 truncate text-xl font-semibold text-slate-900 sm:text-2xl">{{ card.value }}</p>
          <p class="mt-0.5 text-xs leading-snug text-slate-500">{{ card.hint }}</p>
        </component>
      </template>
    </div>
  </section>
</template>
