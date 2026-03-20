import {
  workerMonthlyEvaluationInstanceApi,
  workerMonthlyEvaluationTemplateApi,
} from "../data/apiUrl";
import type {
  CreateMonthlyEvaluationTemplateDto,
  CreateWorkerMonthlyEvaluationDto,
  MonthlyEvaluationTemplate,
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

export function useMonthlyEvaluationTemplates(extraDeps: any[] = []) {
  return useFetch<MonthlyEvaluationTemplate[]>(
    workerMonthlyEvaluationTemplateApi,
    extraDeps,
  );
}

export function useMonthlyEvaluationTemplate(
  templateId?: number,
  extraDeps: any[] = [],
) {
  const url = templateId
    ? `${workerMonthlyEvaluationTemplateApi}${templateId}`
    : workerMonthlyEvaluationTemplateApi;

  return useFetch<MonthlyEvaluationTemplate>(url, [templateId, ...extraDeps]);
}

export function useWorkerMonthlyEvaluations(
  filters?: WorkerMonthlyEvaluationFilters,
  extraDeps: any[] = [],
) {
  const url = buildInstanceListUrl(filters);
  return useFetch<WorkerMonthlyEvaluation[]>(url, [
    filters?.workerId,
    filters?.month,
    filters?.year,
    ...extraDeps,
  ]);
}

export function useWorkerMonthlyEvaluationById(
  workerMonthlyEvaluationId?: number,
  extraDeps: any[] = [],
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
  const { execute, loading, error, response } = useApiAction<any>();

  const createTemplate = async (payload: CreateMonthlyEvaluationTemplateDto) => {
    return execute(workerMonthlyEvaluationTemplateApi, "POST", payload);
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

  return {
    createTemplate,
    duplicateTemplate,
    createEvaluation,
    updateEvaluationResponses,
    openEvaluation,
    closeEvaluation,
    loading,
    error,
    response,
  };
}
