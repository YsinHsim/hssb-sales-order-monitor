# Sales Order Monitoring

A small, responsive web app for a sales team to monitor sales orders across branches, built for the Harrisons Sabah Sdn Bhd IT Executive technical assessment.

- **Live app:** _https://YOUR-APP.vercel.app_ (replace after deploying)
- **Data source:** the provided read-only mock REST API (`https://hiring.harrisons.my/api/mock/sales-orders`), 1,200 fictional orders.

## Features

| Requirement | How it is met |
| --- | --- |
| Dashboard | Cards for total orders, open/pending, completed (invoiced + delivered, with the split shown), cancelled and total order value (MYR). Clicking *Open* or *Cancelled* filters the list. |
| Order listing | Order no. (`SalesId`), customer (`SalesName` + `CustAccount`), branch/site (`InventSiteId`), order date (`CreatedDateTime1`, shown in Malaysia time), status badge and amount (`HAR_TotalSOAmount`). Click a row for full order detail. |
| Search and filtering | Debounced search (order no., customer, account, PO ref, sales taker) plus branch/site and status dropdowns. Dropdown options and counts come from the API's `/meta` endpoint, not hard-coded. Server-side sorting on 5 columns, pagination with 10/25/50/100 rows. |
| API integration | All data comes from the API on every request. Nothing from the dataset is bundled in the UI. |
| UX | Skeleton loading, previous results dimmed while refetching, empty state with *Clear filters*, error states with *Try again* (list, dashboard, detail and filter options fail independently), table on desktop and cards on mobile. Filters live in the URL, so views can be bookmarked or shared and the back button works. |

## Tech stack

- **Nuxt 3** (Vue 3, TypeScript): pages, plus a **Nitro** server for the API proxy
- **Tailwind CSS v4**, `lucide-vue-next` icons
- **Vitest** for unit tests
- Deployed on **Vercel** (`nitro.preset = "vercel"`)

## Run locally

Requirements: Node.js 20+ (tested on 22.14).

```bash
git clone https://github.com/YOUR-USER/hssb-sales-order-monitor.git
cd hssb-sales-order-monitor
cp .env.example .env
npm install
npm run dev        # http://localhost:3000
```

Other scripts:

```bash
npm test           # unit tests
npm run build      # production build (.output/)
npm run preview    # serve the production build locally
```

### Environment variables

| Variable | Purpose |
| --- | --- |
| `NUXT_SALES_API_KEY` | Assessment API key, sent upstream as `x-assessment-key`. **Server-side only.** |
| `NUXT_SALES_API_BASE` | Optional. Defaults to `https://hiring.harrisons.my/api/mock/sales-orders`. |

### Deploy (Vercel)

1. Push the repo to GitHub and import it in Vercel (framework preset: Nuxt).
2. Add `NUXT_SALES_API_KEY` under Project → Settings → Environment Variables.
3. Deploy.

## Architecture and API integration

```
Browser (Vue)  ──►  Nuxt server routes (Nitro)  ──►  Mock REST API
                    /api/orders          ──►  GET /sales-orders?page&pageSize&status&site&q&sort&order
                    /api/orders/:id      ──►  GET /sales-orders/{SalesId}
                    /api/meta (cached)   ──►  GET /sales-orders/meta
```

**Why a server proxy (backend-for-frontend) and not calling the API from the browser?**
The API allows CORS, so the browser could call it directly. But that would ship the key in the JavaScript bundle. With the proxy:

- The key stays in a server environment variable and never reaches the client.
- Input is validated in one place (`shared/query.ts`): only known params are forwarded, `page`/`pageSize` are clamped (max 100), text is trimmed and length-limited, `sort` is checked against a whitelist and order IDs are pattern-checked so they can't change the upstream path.
- Upstream errors are mapped to clean responses (`server/utils/salesApi.ts`): 404 stays 404, a rejected key becomes 502 (a server problem, not the user's), timeouts become 504. There is a 10 s timeout and one retry for network errors and 5xx.
- `/meta` (statuses and sites) is cached for 10 minutes with stale-while-revalidate, since it rarely changes.

**Frontend data flow** (`pages/index.vue`):

- Filters, sort and page are stored in the URL query (`composables/useOrderFilters.ts`). The URL is the single source of truth, and `useFetch` refetches the list whenever it changes.
- Search is debounced by 350 ms, and Nuxt cancels the in-flight request when a newer one starts, so stale results can't overwrite newer ones. The order-detail panel uses a request counter for the same reason.
- The first page is rendered on the server (SSR), so the first paint already has data.
- The dashboard, filter options and list are three independent requests, so one failing doesn't blank the others.
- If a page number is past the end (e.g. from an old link), the app jumps to the last page.

**Project layout**

```
pages/index.vue              dashboard + list page
components/                  KpiCards, OrderFilters, OrdersTable, OrdersPagination, OrderDetail, StatusBadge
composables/useOrderFilters  URL-backed filter state
server/api/                  proxy routes
server/utils/salesApi.ts     upstream client (auth header, timeout, retry, error mapping)
shared/                      types, query sanitising, formatting (used by both client and server)
tests/                       Vitest unit tests
```

## Assumptions and limitations

- **Dashboard figures are for the whole dataset.** The API's `summary` block does not change with filters (only `filtered_orders` does), so the cards always show all-branch totals. The list header shows how many orders match the current filters. Totals per filter would need either an API change or fetching every matching page, which I chose not to do.
- "Completed" = Invoiced + Delivered; "Open/pending" = `Open order`. These are the only statuses in the dataset (per `/meta`); any new status is shown with a neutral badge.
- "Order date" uses `CreatedDateTime1`. Timestamps are UTC from the API and are shown in Malaysia time (UTC+8).
- The API is read-only, so the app is too (no create/edit).
- No login: out of scope for the brief. In production I'd put the app behind company SSO.
- No end-to-end tests, given the time limit. Unit tests cover the input sanitising and formatting logic; the UI was tested manually (see below).

## Testing

- `npm test`: unit tests for query sanitising (defaults, clamping, whitelist, ID validation) and formatting (MYR, Malaysia-time dates, status mapping).
- Manual checks against the live API: each status and site filter, search by order no./customer/PO ref, combined filters, sort on every column, pagination and page size, an out-of-range page in the URL, the empty state (`q=zzzz`), the detail panel, and error states (wrong API key gives the 502 path; the detail panel with an unknown ID gives 404). Layout checked at 375 px (mobile) and desktop widths.

## AI-use disclosure

- **Tool:** Claude Code (Anthropic, Claude Opus 5.5 model), used as a pair programmer.
- **What it did:** read the brief, probed the API with curl (which found that `summary` is dataset-wide and that out-of-range pages return empty data), proposed the proxy design, and generated most of the code, tests and this README.
- **What I did:** chose the stack and the server-proxy approach, reviewed every file, ran and checked the app in the browser, and adjusted <!-- list your own changes here -->.
- **How it was verified:** unit tests (`npm test`, 15 passing), a production build, manual browser checks on desktop and mobile (375 px) against the live API, and curl checks of the proxy's validation and error mapping (bad ID gives 400, unknown order gives 404, wrong key gives 502, missing key gives 500, `pageSize=999` is clamped to 100, unknown `sort` is ignored). I also confirmed the API key does not appear in the client bundle or the page HTML.
