<script setup lang="ts">
import { Check, Copy, TriangleAlert, X } from "lucide-vue-next";
import { formatCurrency, formatDate, formatDateTime } from "~~/shared/format";
import type { SalesOrder } from "~~/shared/types";

const props = defineProps<{ id: string | null }>();
const emit = defineEmits<{ close: [] }>();

const open = computed(() => Boolean(props.id));

const order = ref<SalesOrder | null>(null);
const status = ref<"idle" | "pending" | "success" | "error">("idle");
const error = ref<{ statusCode?: number } | null>(null);

// Ignore responses for an order the user has already navigated away from.
let requestSeq = 0;
async function refresh() {
  const id = props.id;
  if (!id) return;
  const seq = ++requestSeq;
  status.value = "pending";
  error.value = null;
  try {
    const res = await $fetch<SalesOrder>(`/api/orders/${encodeURIComponent(id)}`);
    if (seq !== requestSeq) return;
    order.value = res;
    status.value = "success";
  } catch (e) {
    if (seq !== requestSeq) return;
    order.value = null;
    error.value = { statusCode: (e as { statusCode?: number }).statusCode };
    status.value = "error";
  }
}

watch(
  () => props.id,
  (id) => {
    if (id) refresh();
    else requestSeq++;
  },
  { immediate: true },
);

const panel = ref<HTMLElement | null>(null);
watch(open, async (isOpen) => {
  if (isOpen) {
    await nextTick();
    panel.value?.focus();
  }
});

function onKey(e: KeyboardEvent) {
  if (e.key === "Escape" && open.value) emit("close");
}
onMounted(() => window.addEventListener("keydown", onKey));
onBeforeUnmount(() => window.removeEventListener("keydown", onKey));

const { copy, copiedKey, failedKey } = useCopy();

// Rows with `copy: true` render as click-to-copy buttons.
const rows = computed(() => {
  const o = order.value;
  if (!o) return [];
  const list: [string, string | null, boolean?][] = [
    ["Customer account", o.CustAccount, true],
    ["Customer ref (PO)", o.CustomerRef, true],
    ["Branch / site", o.InventSiteId],
    ["Sales group", o.SalesGroup],
    ["Sales type", o.SalesType],
    ["Sales taker", o.SalesTaker],
    ["Document status", o.DocumentStatus],
    ["Release status", o.ReleaseStatus],
    ["Sales district", o.SalesDistrictDescription],
    ["Delivery district", o.HAR_DeliveryDistrictDescription],
    ["Order date", formatDateTime(o.CreatedDateTime1)],
    ["Requested ship date", formatDate(o.ShippingDateRequested)],
    ["Last modified", formatDateTime(o.ModifiedDateTime1)],
  ];
  return list.map(([label, value, copyable]) => ({ label, value, copyable: Boolean(copyable && value) }));
});
</script>

<template>
  <Teleport to="body">
    <Transition enter-from-class="opacity-0" leave-to-class="opacity-0" enter-active-class="transition-opacity duration-150" leave-active-class="transition-opacity duration-150">
      <div v-if="open" class="fixed inset-0 z-40 bg-slate-900/40" aria-hidden="true" @click="emit('close')" />
    </Transition>
    <Transition enter-from-class="translate-x-full" leave-to-class="translate-x-full" enter-active-class="transition-transform duration-200" leave-active-class="transition-transform duration-150">
      <aside
        v-if="open"
        ref="panel"
        tabindex="-1"
        role="dialog"
        aria-modal="true"
        aria-labelledby="order-detail-title"
        class="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-white shadow-xl focus:outline-none"
      >
        <header class="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div class="min-w-0">
            <p class="text-xs uppercase tracking-wide text-slate-500">Sales order</p>
            <h2 id="order-detail-title" class="truncate font-mono text-base font-semibold text-slate-900">{{ id }}</h2>
          </div>
          <button type="button" class="grid size-9 place-items-center rounded-lg text-slate-500 hover:bg-slate-100" aria-label="Close" @click="emit('close')">
            <X class="size-5" />
          </button>
        </header>

        <div class="flex-1 overflow-y-auto px-5 py-4">
          <div v-if="status === 'pending' || status === 'idle'" class="space-y-3">
            <div v-for="i in 8" :key="i" class="h-5 animate-pulse rounded bg-slate-100" />
          </div>

          <div v-else-if="error" class="flex flex-col items-center gap-3 py-12 text-center" role="alert">
            <TriangleAlert class="size-8 text-rose-500" aria-hidden="true" />
            <p class="text-sm text-slate-600">{{ error.statusCode === 404 ? "This order no longer exists." : "Couldn't load this order." }}</p>
            <button type="button" class="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700" @click="refresh()">Try again</button>
          </div>

          <template v-else-if="order">
            <div class="flex items-start justify-between gap-3">
              <p class="text-lg font-semibold text-slate-900">{{ order.SalesName }}</p>
              <StatusBadge :status="order.SalesStatus" />
            </div>

            <dl class="mt-4 grid grid-cols-3 gap-2 rounded-xl bg-slate-50 p-3 text-center">
              <div>
                <dt class="text-xs text-slate-500">Total</dt>
                <dd class="tabular text-sm font-semibold text-slate-900">{{ formatCurrency(order.HAR_TotalSOAmount) }}</dd>
              </div>
              <div>
                <dt class="text-xs text-slate-500">Invoiced</dt>
                <dd class="tabular text-sm font-semibold text-slate-900">{{ formatCurrency(order.HAR_InvoicedAmount) }}</dd>
              </div>
              <div>
                <dt class="text-xs text-slate-500">Balance</dt>
                <dd class="tabular text-sm font-semibold text-slate-900">{{ formatCurrency(order.HAR_BalanceAmount) }}</dd>
              </div>
            </dl>

            <p class="mt-4 text-xs text-slate-500">Tip: click a highlighted value to copy it.</p>
            <p class="sr-only" aria-live="polite">{{ copiedKey ? `${copiedKey} copied to clipboard` : "" }}</p>
            <dl class="mt-1 divide-y divide-slate-100 text-sm">
              <template v-for="row in rows" :key="row.label">
                <!-- Whole row is clickable; the button inside gives keyboard and screen-reader access. -->
                <div
                  v-if="row.copyable"
                  class="group -mx-2 flex cursor-pointer items-center justify-between gap-4 rounded-lg px-2 py-2.5 transition hover:bg-brand-50"
                  :title="`Click to copy ${row.label.toLowerCase()}`"
                  @click="copy(row.label, row.value!)"
                >
                  <dt class="text-slate-500 group-hover:text-brand-700">{{ row.label }}</dt>
                  <dd>
                    <button
                      type="button"
                      class="flex items-center gap-2 rounded-md font-medium text-slate-900 focus-visible:outline-2 focus-visible:outline-brand-500"
                      :aria-label="`Copy ${row.label}: ${row.value}`"
                      @click.stop="copy(row.label, row.value!)"
                    >
                      <span class="font-mono underline decoration-slate-300 decoration-dashed underline-offset-4 group-hover:decoration-brand-500">{{ row.value }}</span>
                      <span
                        class="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-medium transition"
                        :class="
                          copiedKey === row.label
                            ? 'bg-emerald-50 text-emerald-700'
                            : failedKey === row.label
                              ? 'bg-rose-50 text-rose-700'
                              : 'bg-slate-100 text-slate-500 group-hover:bg-brand-100 group-hover:text-brand-700'
                        "
                      >
                        <Check v-if="copiedKey === row.label" class="size-3.5" aria-hidden="true" />
                        <Copy v-else class="size-3.5" aria-hidden="true" />
                        {{ copiedKey === row.label ? "Copied" : failedKey === row.label ? "Failed" : "Copy" }}
                      </span>
                    </button>
                  </dd>
                </div>
                <div v-else class="flex justify-between gap-4 py-2.5">
                  <dt class="text-slate-500">{{ row.label }}</dt>
                  <dd class="text-right font-medium text-slate-900">{{ row.value || "—" }}</dd>
                </div>
              </template>
            </dl>

            <div v-if="order.DOT_SONotes" class="mt-4 rounded-lg border border-slate-200 p-3 text-sm text-slate-700">
              <p class="mb-1 text-xs uppercase tracking-wide text-slate-500">Notes</p>
              {{ order.DOT_SONotes }}
            </div>
          </template>
        </div>
      </aside>
    </Transition>
  </Teleport>
</template>
