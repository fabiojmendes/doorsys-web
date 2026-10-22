export function localDate(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function validDate(value: string | null): value is string {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00`);
  return !Number.isNaN(date.getTime()) && localDate(date) === value;
}

export function logFilters(search: URLSearchParams) {
  const start = search.get("startDate");
  const end = search.get("endDate");
  const startDate = validDate(start) ? start : localDate();
  const endDate = validDate(end) ? end : localDate();
  const error =
    startDate > endDate
      ? "The end date must be on or after the start date."
      : undefined;
  return {
    startDate,
    endDate,
    customerId: search.get("customerId") || "",
    deviceId: search.get("deviceId") || "",
    error,
  };
}

export function logQuery(filters: ReturnType<typeof logFilters>) {
  return {
    startDate: new Date(`${filters.startDate}T00:00:00`).toISOString(),
    endDate: new Date(`${filters.endDate}T23:59:59.999`).toISOString(),
    customerId: filters.customerId || null,
    deviceId: filters.deviceId || null,
  };
}
