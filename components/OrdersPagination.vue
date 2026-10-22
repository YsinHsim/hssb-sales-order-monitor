<script setup lang="ts">
import { ChevronLeft, ChevronRight } from "lucide-vue-next";
import { formatCount } from "~~/shared/format";
import { PAGE_SIZES } from "~~/shared/types";

const props = defineProps<{ page: number; pageSize: number; total: number; totalPages: number; disabled?: boolean }>();
const emit = defineEmits<{ page: [page: number]; pageSize: [size: number] }>();

const from = computed(() => (props.total === 0 ? 0 : (props.page - 1) * props.pageSize + 1));
const to = computed(() => Math.min(props.page * props.pageSize, props.total));

const btn =
  "inline-flex h-9 items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40";
</script>

<template>
  <nav class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between" aria-label="Pagination">
    <p class="text-sm text-slate-600">
      <template v-if="total">
        Showing <span class="tabular font-medium text-slate-900">{{ formatCount(from) }}–{{ formatCount(to) }}</span>
        of <span class="tabular font-medium text-slate-900">{{ formatCount(total) }}</span> orders
      </template>
      <template v-else>0 orders</template>
    </p>

    <div class="flex items-center gap-2">
      <label class="flex items-center gap-2 text-sm text-slate-600">
        <span class="hidden sm:inline">Rows</span>
        <select
          class="h-9 rounded-lg border border-slate-300 bg-white px-2 text-sm"
          :value="pageSize"
          aria-label="Rows per page"
          @change="emit('pageSize', Number(($event.target as HTMLSelectElement).value))"
        >
          <option v-for="s in PAGE_SIZES" :key="s" :value="s">{{ s }}</option>
        </select>
      </label>
      <button type="button" :class="btn" :disabled="disabled || page <= 1" aria-label="Previous page" @click="emit('page', page - 1)">
        <ChevronLeft class="size-4" aria-hidden="true" /><span class="hidden sm:inline">Prev</span>
      </button>
      <span class="tabular min-w-[4.5rem] text-center text-sm text-slate-600">{{ page }} / {{ Math.max(totalPages, 1) }}</span>
      <button type="button" :class="btn" :disabled="disabled || page >= totalPages" aria-label="Next page" @click="emit('page', page + 1)">
        <span class="hidden sm:inline">Next</span><ChevronRight class="size-4" aria-hidden="true" />
      </button>
    </div>
  </nav>
</template>
