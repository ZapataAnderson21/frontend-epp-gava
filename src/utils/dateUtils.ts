import { toZonedTime, formatInTimeZone } from 'date-fns-tz';

export function formatDate(date?: string): string {
  if (!date) return '--';

  // Si viene con hora (ISO completo), úsalo tal cual
  if (/\dT\d/.test(date)) {
    const d = new Date(date);
    if (isNaN(d.getTime())) return '--';
    return formatInTimeZone(d, 'America/Lima', 'dd/MM/yyyy');
  }

  // Si viene como 'YYYY-MM-DD', interprétalo como medianoche LOCAL de Lima
  const asUtc = toZonedTime(`${date}T00:00:00`, 'America/Lima');
  return formatInTimeZone(asUtc, 'America/Lima', 'dd/MM/yyyy');
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

export function toDateLocalValue(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (v: number) => String(v).padStart(2, "0");
  const yyyy = d.getFullYear();
  const MM = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  // formato requerido por <input type="date">
  return `${yyyy}-${MM}-${dd}`;
}

export function localDatetimeToIso(datetimeLocal?: string): string | null {
  if (!datetimeLocal) return null;
  const d = new Date(datetimeLocal); // interpreta como hora local
  if (isNaN(d.getTime())) return null;
  return d.toISOString(); // => "YYYY-MM-DDTHH:mm:ss.sssZ"
}

export function ymdToUtcMidnight(ymd: string) {
  // ymd = '2025-10-27'
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(Date.UTC(y, (m - 1), d, 0, 0, 0, 0));
}

/** Convierte 'YYYY-MM-DD' interpretándolo como 00:00 en Lima -> UTC */
export function ymdLocalMidnightToUtc(ymd: string, tz = 'America/Lima'): Date {
  // ymd '2025-11-20' se interpreta como '2025-11-20 00:00:00' en Lima
  const localDate = new Date(`${ymd}T00:00:00`);
  return toZonedTime(localDate, tz);
}

/** Devuelve 'dd/MM/yyyy' visto en Lima */
export function formatDateInLima(d: Date): string {
  return new Intl.DateTimeFormat('es-PE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'America/Lima',
  }).format(d);
}

/** Si prefieres devolver un YYYY-MM-DD estable (sin TZ) */
export function formatYmdInLima(d: Date): string {
  return formatInTimeZone(d, 'America/Lima', 'yyyy-MM-dd');
}
