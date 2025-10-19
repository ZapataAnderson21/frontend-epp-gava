

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