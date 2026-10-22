import { FetchError } from "ofetch";

/**
 * Thin server-side client for the upstream mock API.
 * - Adds the x-assessment-key header from runtime config (never sent to the browser).
 * - Applies a timeout and one retry on network/5xx errors.
 * - Maps upstream failures to clean HTTP errors for the frontend.
 */
export async function salesApi<T>(path: string, query?: Record<string, unknown>): Promise<T> {
  const { salesApiBase, salesApiKey } = useRuntimeConfig();

  if (!salesApiKey) {
    throw createError({
      statusCode: 500,
      statusMessage: "Server misconfigured",
      message: "NUXT_SALES_API_KEY is not set on the server.",
    });
  }

  try {
    return await $fetch<T>(`${salesApiBase}${path}`, {
      query,
      headers: { "x-assessment-key": salesApiKey, accept: "application/json" },
      timeout: 10_000,
      retry: 1,
      retryDelay: 300,
      retryStatusCodes: [408, 429, 500, 502, 503, 504],
    });
  } catch (err) {
    if (err instanceof FetchError) {
      const status = err.response?.status;
      if (status === 404) {
        throw createError({ statusCode: 404, statusMessage: "Not found", message: "Order not found." });
      }
      if (status === 401 || status === 403) {
        // Our key was rejected; that's a server problem, not the user's.
        throw createError({ statusCode: 502, statusMessage: "Bad gateway", message: "Upstream API rejected the server credentials." });
      }
      if (status === 400) {
        throw createError({ statusCode: 400, statusMessage: "Bad request", message: err.data?.error ?? "Invalid request." });
      }
      throw createError({
        statusCode: status ? 502 : 504,
        statusMessage: status ? "Bad gateway" : "Gateway timeout",
        message: status ? `Upstream API returned ${status}.` : "Upstream API did not respond.",
      });
    }
    throw err;
  }
}
