/**
 * Copy text to the clipboard and remember which item was copied, so the UI can
 * show a short "Copied" confirmation. Falls back to execCommand when the
 * async Clipboard API is unavailable (older browsers, non-HTTPS origins).
 */
export function useCopy(resetAfterMs = 1500) {
  const copiedKey = ref<string | null>(null);
  const failedKey = ref<string | null>(null);
  let timer: ReturnType<typeof setTimeout> | undefined;

  function fallbackCopy(text: string): boolean {
    const el = document.createElement("textarea");
    el.value = text;
    el.setAttribute("readonly", "");
    el.style.position = "fixed";
    el.style.opacity = "0";
    document.body.appendChild(el);
    el.select();
    try {
      return document.execCommand("copy");
    } finally {
      document.body.removeChild(el);
    }
  }

  async function copy(key: string, text: string) {
    let ok = false;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        ok = true;
      } else {
        ok = fallbackCopy(text);
      }
    } catch {
      ok = fallbackCopy(text);
    }

    clearTimeout(timer);
    copiedKey.value = ok ? key : null;
    failedKey.value = ok ? null : key;
    timer = setTimeout(() => {
      copiedKey.value = null;
      failedKey.value = null;
    }, resetAfterMs);
    return ok;
  }

  onBeforeUnmount(() => clearTimeout(timer));

  return { copy, copiedKey, failedKey };
}
