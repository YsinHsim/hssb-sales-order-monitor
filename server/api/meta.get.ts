import type { Facet, MetaResponse } from "~~/shared/types";

interface UpstreamMeta {
  facets?: { statuses?: Facet[]; sites?: Facet[] };
}

// GET /api/meta — filter options (statuses and sites) from the API's own self-docs,
// so dropdowns are never hard-coded. Cached for 10 minutes since facets rarely change.
export default defineCachedEventHandler(
  async (): Promise<MetaResponse> => {
    const meta = await salesApi<UpstreamMeta>("/meta");
    return {
      statuses: meta.facets?.statuses ?? [],
      sites: meta.facets?.sites ?? [],
    };
  },
  { name: "sales-meta", maxAge: 60 * 10, swr: true },
);
