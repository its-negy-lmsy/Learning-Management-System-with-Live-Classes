export function formatMoney(minorUnits: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format((minorUnits || 0) / 100);
}

export function formatCourseDate(value: string) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZone: "UTC" }).format(new Date(value));
}
