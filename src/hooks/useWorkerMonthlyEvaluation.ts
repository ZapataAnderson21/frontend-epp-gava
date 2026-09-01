import {
  workerMonthlyEvaluationInstanceApi,
  workerMonthlyEvaluationPeriodApi,
  workerMonthlyEvaluationTemplateApi,
} from "../data/apiUrl";
import type {
  CreateMonthlyEvaluationTemplateDto,
  CreateWorkerMonthlyEvaluationDto,
  MonthlyEvaluationTemplate,
  WorkerMonthlyEvaluationPeriod,
  WorkerMonthlyEvaluationPeriodDetail,
  WorkerMonthlyEvaluationPeriodFilters,
  WorkerMonthlyEvaluationPeriodStatusPayload,
  UpdateWorkerMonthlyEvaluationResponsesDto,
  WorkerMonthlyEvaluation,
  WorkerMonthlyEvaluationFilters,
} from "../data/types";
import { useApiAction } from "./useApiAction";
import { useFetch } from "./useFetch";

function buildInstanceListUrl(filters?: WorkerMonthlyEvaluationFilters): string {
  const params = new URLSearchParams();

  if (filters?.workerId) params.set("workerId", String(filters.workerId));
  if (filters?.month) params.set("month", String(filters.month));
  if (filters?.year) params.set("year", String(filters.year));

  const queryString = params.toString();
  return queryString
    ? `${workerMonthlyEvaluationInstanceApi}?${queryString}`
    : workerMonthlyEvaluationInstanceApi;
}

function buildPeriodListUrl(filters?: WorkerMonthlyEvaluationPeriodFilters): string {
  const params = new URLSearchParams();

  if (filters?.month) params.set("month", String(filters.month));
  if (filters?.year) params.set("year", String(filters.year));
  if (filters?.sequence) params.set("sequence", String(filters.sequence));

  const queryString = params.toString();
  return queryString
    ? `${workerMonthlyEvaluationPeriodApi}?${queryString}`
    : workerMonthlyEvaluationPeriodApi;
}

function buildPeriodDetailUrl(
  period?: WorkerMonthlyEvaluationPeriodStatusPayload,
): string {
  if (!period?.month || !period?.year) {
    return "";
  }

  const sequence = period.sequence ?? 1;
  const params = new URLSearchParams({
    month: String(period.month),
    year: String(period.year),
    sequence: String(sequence),
  });

  return `${workerMonthlyEvaluationPeriodApi}detail?${params.toString()}`;
}

export function useMonthlyEvaluationTemplates(extraDeps: unknown[] = []) {
  return useFetch<MonthlyEvaluationTemplate[]>(
    workerMonthlyEvaluationTemplateApi,
    extraDeps,
  );
}

export function useMonthlyEvaluationTemplate(
  templateId?: number,
  extraDeps: unknown[] = [],
) {
  const url = templateId
    ? `${workerMonthlyEvaluationTemplateApi}${templateId}`
    : workerMonthlyEvaluationTemplateApi;

  return useFetch<MonthlyEvaluationTemplate>(url, [templateId, ...extraDeps]);
}

export function useWorkerMonthlyEvaluations(
  filters?: WorkerMonthlyEvaluationFilters,
  extraDeps: unknown[] = [],
) {
  const url = buildInstanceListUrl(filters);
  return useFetch<WorkerMonthlyEvaluation[]>(url, [
    filters?.workerId,
    filters?.month,
    filters?.year,
    ...extraDeps,
  ]);
}

export function useWorkerMonthlyEvaluationPeriods(
  filters?: WorkerMonthlyEvaluationPeriodFilters,
  extraDeps: unknown[] = [],
) {
  const url = buildPeriodListUrl(filters);
  return useFetch<WorkerMonthlyEvaluationPeriod[]>(url, [
    filters?.month,
    filters?.year,
    filters?.sequence,
    ...extraDeps,
  ]);
}

export function useWorkerMonthlyEvaluationPeriodDetail(
  period?: WorkerMonthlyEvaluationPeriodStatusPayload,
  extraDeps: unknown[] = [],
) {
  const url = buildPeriodDetailUrl(period);
  return useFetch<WorkerMonthlyEvaluationPeriodDetail>(url, [
    period?.month,
    period?.year,
    period?.sequence,
    ...extraDeps,
  ]);
}

export function useWorkerMonthlyEvaluationById(
  workerMonthlyEvaluationId?: number,
  extraDeps: unknown[] = [],
) {
  const url = workerMonthlyEvaluationId
    ? `${workerMonthlyEvaluationInstanceApi}${workerMonthlyEvaluationId}`
    : workerMonthlyEvaluationInstanceApi;

  return useFetch<WorkerMonthlyEvaluation>(url, [
    workerMonthlyEvaluationId,
    ...extraDeps,
  ]);
}

export function useWorkerMonthlyEvaluationActions() {
  const { execute, loading, error, response } = useApiAction<unknown>();

  const createTemplate = async (payload: CreateMonthlyEvaluationTemplateDto) => {
    return execute(workerMonthlyEvaluationTemplateApi, "POST", payload);
  };

  const updateTemplate = async (
    templateId: number,
    payload: CreateMonthlyEvaluationTemplateDto,
  ) => {
    return execute(
      `${workerMonthlyEvaluationTemplateApi}${templateId}`,
      "PATCH",
      payload,
    );
  };

  const duplicateTemplate = async (templateId: number) => {
    return execute(
      `${workerMonthlyEvaluationTemplateApi}${templateId}/duplicate`,
      "POST",
    );
  };

  const createEvaluation = async (payload: CreateWorkerMonthlyEvaluationDto) => {
    return execute(workerMonthlyEvaluationInstanceApi, "POST", payload);
  };

  const updateEvaluationResponses = async (
    workerMonthlyEvaluationId: number,
    payload: UpdateWorkerMonthlyEvaluationResponsesDto,
  ) => {
    return execute(
      `${workerMonthlyEvaluationInstanceApi}${workerMonthlyEvaluationId}/responses`,
      "PATCH",
      payload,
    );
  };

  const openEvaluation = async (workerMonthlyEvaluationId: number) => {
    return execute(
      `${workerMonthlyEvaluationInstanceApi}${workerMonthlyEvaluationId}/open`,
      "PATCH",
    );
  };

  const closeEvaluation = async (workerMonthlyEvaluationId: number) => {
    return execute(
      `${workerMonthlyEvaluationInstanceApi}${workerMonthlyEvaluationId}/close`,
      "PATCH",
    );
  };

  const openPeriod = async (payload: WorkerMonthlyEvaluationPeriodStatusPayload) => {
    return execute(`${workerMonthlyEvaluationPeriodApi}open`, "PATCH", payload);
  };

  const closePeriod = async (
    payload: WorkerMonthlyEvaluationPeriodStatusPayload,
  ) => {
    return execute(`${workerMonthlyEvaluationPeriodApi}close`, "PATCH", payload);
  };

  return {
    createTemplate,
    updateTemplate,
    duplicateTemplate,
    createEvaluation,
    updateEvaluationResponses,
    openEvaluation,
    closeEvaluation,
    openPeriod,
    closePeriod,
    loading,
    error,
    response,
  };
}
