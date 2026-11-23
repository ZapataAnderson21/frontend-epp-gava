import type { ProjectType } from "../../data/types";

export const PROJECT_TYPE_LABELS: Record<ProjectType, string> = {
  works: "Obras",
  services: "Servicios",
  consulting: "Consultorías",
};

export const PROJECT_TYPE_OPTIONS = (
  Object.entries(PROJECT_TYPE_LABELS) as Array<[ProjectType, string]>
).map(([value, label]) => ({ value, label }));

export const PROJECT_TYPE_FILTER_OPTIONS = [
  { value: "all", label: "Todos los tipos" },
  ...PROJECT_TYPE_OPTIONS,
] as const;

export function getProjectTypeLabel(type?: ProjectType | null) {
  return type ? PROJECT_TYPE_LABELS[type] : "—";
}
