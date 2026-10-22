const currency = new Intl.NumberFormat("en-MY", {
  style: "currency",
  currency: "MYR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const integer = new Intl.NumberFormat("en-MY");

const date = new Intl.DateTimeFormat("en-MY", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "Asia/Kuala_Lumpur",
});

const dateTime = new Intl.DateTimeFormat("en-MY", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Asia/Kuala_Lumpur",
});

export const formatCurrency = (value: number | null | undefined): string =>
  typeof value === "number" && Number.isFinite(value) ? currency.format(value) : "—";

export const formatCount = (value: number | null | undefined): string =>
  typeof value === "number" && Number.isFinite(value) ? integer.format(value) : "—";

const parse = (value: string | null | undefined): Date | null => {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
};

/** Dates are shown in Malaysia time (UTC+8), since the API returns UTC timestamps. */
export const formatDate = (value: string | null | undefined): string => {
  const d = parse(value);
  return d ? date.format(d) : "—";
};

export const formatDateTime = (value: string | null | undefined): string => {
  const d = parse(value);
  return d ? dateTime.format(d) : "—";
};

export type StatusTone = "open" | "invoiced" | "delivered" | "cancelled" | "other";

export const statusTone = (status: string | null | undefined): StatusTone => {
  switch ((status ?? "").toLowerCase()) {
    case "open order":
      return "open";
    case "invoiced":
      return "invoiced";
    case "delivered":
      return "delivered";
    case "cancelled":
    case "canceled":
      return "cancelled";
    default:
      return "other";
  }
};
