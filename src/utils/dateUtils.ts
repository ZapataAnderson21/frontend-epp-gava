

export function formatDate(date: string | undefined): string {
  if (!date) return "--";
  const parsedDate = new Date(date);

  const format = (date: Date, formatString: string): string => {
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return formatString.replace("dd", day).replace("MM", month).replace("yyyy", String(year));
  }

  return format(parsedDate, "dd/MM/yyyy");
}

export function formatDateTime(date: string | undefined): string {
  if (!date) return "--";
  const parsedDate = new Date(date);

  const format = (date: Date, formatString: string): string => {
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return formatString
      .replace("dd", day)
      .replace("MM", month)
      .replace("yyyy", String(year))
      .replace("HH", hours)
      .replace("mm", minutes);
  }

  return format(parsedDate, "dd/MM/yyyy - HH:mm");
}

export function formatYMD(date: string | undefined): string {
  if (!date) return "--";
  const parsedDate = new Date(date);

  const format = (date: Date, formatString: string): string => {
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return formatString.replace("dd", day).replace("MM", month).replace("yyyy", String(year));
  }

  return format(parsedDate, "yyyy-MM-dd");
}


export function toDatetimeLocalValue(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (v: number) => String(v).padStart(2, "0");
  const yyyy = d.getFullYear();
  const MM = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const HH = pad(d.getHours());
  const mm = pad(d.getMinutes());
  // formato requerido por <input type="datetime-local">
  return `${yyyy}-${MM}-${dd}T${HH}:${mm}`;
}


export function localDatetimeToIso(datetimeLocal?: string): string | null {
  if (!datetimeLocal) return null;
  const d = new Date(datetimeLocal); // interpreta como hora local
  if (isNaN(d.getTime())) return null;
  return d.toISOString(); // => "YYYY-MM-DDTHH:mm:ss.sssZ"
}
