export function money(value: number, currency = "PEN") {
  const amount = value.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return `${currency === "PEN" ? "S/" : currency} ${amount}`;
}

export function shortDate(value: string) {
  return new Date(`${value}T12:00:00Z`).toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function monthName(value: string) {
  return new Date(`${value}-01T12:00:00Z`).toLocaleDateString("es-PE", {
    month: "short",
    year: "2-digit",
    timeZone: "UTC",
  });
}
