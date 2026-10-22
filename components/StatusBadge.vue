<script setup lang="ts">
import { statusTone } from "~~/shared/format";

const props = defineProps<{ status: string | null | undefined }>();

const classes: Record<ReturnType<typeof statusTone>, string> = {
  open: "bg-amber-50 text-amber-800 ring-amber-600/20",
  invoiced: "bg-blue-50 text-blue-800 ring-blue-600/20",
  delivered: "bg-emerald-50 text-emerald-800 ring-emerald-600/20",
  cancelled: "bg-rose-50 text-rose-800 ring-rose-600/20",
  other: "bg-slate-100 text-slate-700 ring-slate-500/20",
};

const tone = computed(() => statusTone(props.status));
</script>

<template>
  <span
    class="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset"
    :class="classes[tone]"
  >
    <span class="size-1.5 rounded-full bg-current opacity-70" aria-hidden="true" />
    {{ status || "Unknown" }}
  </span>
</template>
