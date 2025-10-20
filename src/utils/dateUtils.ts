

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