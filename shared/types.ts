// Shapes of the upstream mock API (only the fields this app relies on are typed strictly).

export interface SalesOrder {
  SalesId: string;
  SalesName: string;
  CustAccount: string;
  InventSiteId: string;
  SalesStatus: string;
  DocumentStatus: string | null;
  CreatedDateTime1: string;
  ModifiedDateTime1: string | null;
  ShippingDateRequested: string | null;
  HAR_TotalSOAmount: number;
  HAR_InvoicedAmount: number | null;
  HAR_BalanceAmount: number | null;
  SalesTaker: string | null;
  CustomerRef: string | null;
  SalesType: string | null;
  SalesGroup: string | null;
  SalesDistrictDescription: string | null;
  HAR_DeliveryDistrictDescription: string | null;
  ReleaseStatus: string | null;
  DOT_SONotes: string | null;
  [key: string]: unknown;
}

export interface OrdersSummary {
  total_orders: number;
  filtered_orders: number;
  open_orders: number;
  invoiced_orders: number;
  delivered_orders: number;
  cancelled_orders: number;
  total_order_value: number;
}

export interface OrdersResponse {
  summary: OrdersSummary;
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  sort: string;
  order: "asc" | "desc";
  data: SalesOrder[];
}

export interface Facet {
  value: string;
  count: number;
}

export interface MetaResponse {
  statuses: Facet[];
  sites: Facet[];
}

export const SORT_FIELDS = [
  "SalesId",
  "CreatedDateTime1",
  "HAR_TotalSOAmount",
  "SalesStatus",
  "InventSiteId",
] as const;
export type SortField = (typeof SORT_FIELDS)[number];

export const PAGE_SIZES = [10, 25, 50, 100] as const;

export interface OrdersQuery {
  page: number;
  pageSize: number;
  status?: string;
  site?: string;
  q?: string;
  sort?: SortField;
  order?: "asc" | "desc";
}
