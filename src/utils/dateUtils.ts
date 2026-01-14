import { format } from 'date-fns';
import { es } from 'date-fns/locale';
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
  if (isNaN(parsedDate.getTime())) return "--";
  return formatInTimeZone(parsedDate, 'America/Lima', 'dd/MM/yyyy - HH:mm');
}

export function formatYMD(date: string | undefined): string {
  if (!date) return "--";
  // Extraer la fecha directamente del string ISO para evitar desfase por zona horaria
  if (date.includes('T')) {
    return date.split('T')[0];
  }
  // Si ya viene como YYYY-MM-DD, devolverlo tal cual
  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return date;
  }
  // Fallback: usar formatInTimeZone
  const parsedDate = new Date(date);
  if (isNaN(parsedDate.getTime())) return "--";
  return formatInTimeZone(parsedDate, 'America/Lima', 'yyyy-MM-dd');
}

export function toDatetimeLocalValue(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  // formato requerido por <input type="datetime-local"> usando zona horaria de Lima
  return formatInTimeZone(d, 'America/Lima', "yyyy-MM-dd'T'HH:mm");
}

export function toDateLocalValue(iso?: string): string {
  if (!iso) return "";
  // Extraer la fecha directamente del string ISO para evitar desfase por zona horaria
  if (iso.includes('T')) {
    return iso.split('T')[0];
  }
  // Si ya viene como YYYY-MM-DD, devolverlo tal cual
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
    return iso;
  }
  // Fallback: usar formatInTimeZone
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return formatInTimeZone(d, 'America/Lima', 'yyyy-MM-dd');
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


export function formatToLongMonthDate(dateStr: string): string {
  if (!dateStr) return "";

  const date = dateStr.split('T')[0];

  const [year, month, day] = date.split('-').map(Number);

  const monthText = format(new Date(year, month - 1, 1), "MMMM", { locale: es });

  return `${day} de ${monthText}`;
}
