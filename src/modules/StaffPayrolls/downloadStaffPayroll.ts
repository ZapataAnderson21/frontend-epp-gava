import { staffPayrollApi } from "../../data/apiUrl";
import getAuthHeaders from "../../hooks/getAuthHeaders";

export async function downloadStaffPayroll(year: number, month: number) {
  const response = await fetch(
    staffPayrollApi + "periods/" + year + "/" + month + "/export",
    { credentials: "include", headers: getAuthHeaders() },
  );
  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(payload?.message ?? "No se pudo exportar la planilla.");
  }
  const blob = await response.blob();
  const disposition = response.headers.get("content-disposition") ?? "";
  const fileName =
    disposition.match(/filename="?([^"]+)"?/i)?.[1] ??
    "control_mensual_staff_" +
      year +
      "-" +
      String(month).padStart(2, "0") +
      ".xlsx";
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}
