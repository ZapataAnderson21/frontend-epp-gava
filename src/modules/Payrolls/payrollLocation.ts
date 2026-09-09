import type { GeneralPayrollProject } from "./types";

export function payrollLocationName(location: GeneralPayrollProject): string {
  return location.locationType === "services"
    ? "Servicios"
    : (location.project?.name ??
        location.locationName ??
        "Proyecto no disponible");
}
