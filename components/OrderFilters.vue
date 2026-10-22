<script setup lang="ts">
import { Search, X } from "lucide-vue-next";
import type { Facet } from "~~/shared/types";

const props = defineProps<{
  q?: string;
  status?: string;
  site?: string;
  statuses: Facet[];
  sites: Facet[];
  metaError: boolean;
  hasFilters: boolean;
}>();
const emit = defineEmits<{
  search: [q: string | undefined];
  status: [status: string | undefined];
  site: [site: string | undefined];
  reset: [];
}>();

// Local input state so typing is instant; the API call is debounced.
const text = ref(props.q ?? "");
watch(
  () => props.q,
  (q) => {
    if ((q ?? "") !== text.value.trim()) text.value = q ?? "";
  },
);

let timer: ReturnType<typeof setTimeout> | undefined;
watch(text, (value) => {
  clearTimeout(timer);
  timer = setTimeout(() => {
    const next = value.trim() || undefined;
    if (next !== props.q) emit("search", next);
  }, 350);
});
onBeforeUnmount(() => clearTimeout(timer));

function submitSearch() {
  clearTimeout(timer);
  const next = text.value.trim() || undefined;
  if (next !== props.q) emit("search", next);
}

function clearSearch() {
  clearTimeout(timer);
  text.value = "";
  emit("search", undefined);
}

function onReset() {
  clearTimeout(timer);
  text.value = "";
  emit("reset");
}

const selectClass =
  "h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 shadow-xs focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 disabled:bg-slate-50";
</script>

<template>
  <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_200px_200px_auto]">
    <label class="relative sm:col-span-2 lg:col-span-1">
      <span class="sr-only">Search orders</span>
      <Search class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
      <input
        v-model="text"
        type="search"
        inputmode="search"
        autocomplete="off"
        maxlength="100"
        placeholder="Search order no., customer, account, PO ref, sales taker…"
        class="h-10 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-9 text-sm shadow-xs placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
        @keydown.enter.prevent="submitSearch"
      />
      <button
        v-if="text"
        type="button"
        class="absolute right-2 top-1/2 grid size-6 -translate-y-1/2 place-items-center rounded text-slate-400 hover:bg-slate-100 hover:text-slate-600"
        aria-label="Clear search"
        @click="clearSearch"
      >
        <X class="size-4" />
      </button>
    </label>

    <label>
      <span class="sr-only">Branch / site</span>
      <select :class="selectClass" :value="site ?? ''" :disabled="metaError && !sites.length" @change="emit('site', ($event.target as HTMLSelectElement).value || undefined)">
        <option value="">All branches</option>
        <option v-for="s in sites" :key="s.value" :value="s.value">{{ s.value }} ({{ s.count }})</option>
        <option v-if="site && !sites.some((s) => s.value.toLowerCase() === site!.toLowerCase())" :value="site">{{ site }}</option>
      </select>
    </label>

    <label>
      <span class="sr-only">Status</span>
      <select :class="selectClass" :value="status ?? ''" :disabled="metaError && !statuses.length" @change="emit('status', ($event.target as HTMLSelectElement).value || undefined)">
        <option value="">All statuses</option>
        <option v-for="s in statuses" :key="s.value" :value="s.value">{{ s.value }} ({{ s.count }})</option>
        <option v-if="status && !statuses.some((s) => s.value.toLowerCase() === status!.toLowerCase())" :value="status">{{ status }}</option>
      </select>
    </label>

    <button
      type="button"
      class="h-10 rounded-lg border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 shadow-xs hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 sm:col-span-2 lg:col-span-1"
      :disabled="!hasFilters && !text"
      @click="onReset"
    >
      Reset
    </button>

    <p v-if="metaError" class="text-xs text-amber-700 sm:col-span-2 lg:col-span-4">
      Filter options couldn't be loaded. Search still works.
    </p>
  </div>
</template>
