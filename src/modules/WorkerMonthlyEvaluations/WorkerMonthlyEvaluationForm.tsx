import { useEffect, useMemo, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import { IoCloseCircle } from "react-icons/io5";
import { ErrorMessage } from "../../common/error";
import { Loading } from "../../common/loading";
import { workerApi } from "../../data/apiUrl";
import {
  useFetch,
  useMonthlyEvaluationTemplates,
  useWorkerMonthlyEvaluationActions,
  useWorkerMonthlyEvaluationById,
} from "../../hooks";
import type {
  CreateMonthlyEvaluationResponseDto,
  MonthlyEvaluationQuestion,
  MonthlyEvaluationTemplate,
  Worker,
} from "../../data/types";

interface WorkerMonthlyEvaluationFormProps {
  mode: "create" | "edit";
  evaluationId?: number;
  initialWorkerId?: number;
  initialTemplateId?: number;
  initialYear?: number;
  initialMonth?: number;
  initialSequence?: number;
  lockPeriodFields?: boolean;
  onClose: () => void;
  onSaved: () => void;
}

type ResponseDraft = {
  score?: number;
  textAnswer?: string;
};

const currentDate = new Date();
const scoreOptions = [0, 1, 2, 3] as const;
const monthOptions = Array.from({ length: 12 }, (_, index) => ({
  value: index + 1,
  label: new Date(2000, index, 1).toLocaleDateString("es-PE", { month: "long" }),
}));

function getTemplateVersion(template?: MonthlyEvaluationTemplate) {
  return template?.currentVersion ?? template?.versions?.[0];
}

function isResponseFilled(question: MonthlyEvaluationQuestion, response?: ResponseDraft): boolean {
  if (!response) return false;

  if (question.questionType === "score") {
    return typeof response.score === "number";
  }

  return Boolean(response.textAnswer?.trim());
}

function formatMonthName(month?: number) {
  if (!month) return "-";
  return new Date(2000, month - 1, 1).toLocaleDateString("es-PE", { month: "long" });
}

export default function WorkerMonthlyEvaluationForm({
  mode,
  evaluationId,
  initialWorkerId,
  initialTemplateId,
  initialYear,
  initialMonth,
  lockPeriodFields = false,
  onClose,
  onSaved,
}: WorkerMonthlyEvaluationFormProps) {
  const { data: workers } = useFetch<Worker[]>(workerApi);
  const {
    data: templates,
    loading: loadingTemplates,
    error: templatesError,
  } = useMonthlyEvaluationTemplates();
  const {
    data: evaluation,
    loading: loadingEvaluation,
    error: evaluationError,
    refetch,
  } = useWorkerMonthlyEvaluationById(mode === "edit" ? evaluationId : undefined, [
    mode,
    evaluationId,
  ]);

  const { createEvaluation, updateEvaluationResponses, loading: saving } =
    useWorkerMonthlyEvaluationActions();

  const [workerId, setWorkerId] = useState<number>(initialWorkerId ?? 0);
  const [templateId, setTemplateId] = useState<number>(initialTemplateId ?? 0);
  const [year, setYear] = useState<number>(initialYear ?? currentDate.getFullYear());
  const [month, setMonth] = useState<number>(initialMonth ?? currentDate.getMonth() + 1);
  const [generalComment, setGeneralComment] = useState("");
  const [responses, setResponses] = useState<Record<number, ResponseDraft>>({});

  const selectedTemplate = useMemo(
    () => templates?.find((item) => item.monthlyEvaluationTemplateId === templateId),
    [templates, templateId],
  );

  const selectedTemplateVersion = useMemo(
    () => getTemplateVersion(selectedTemplate),
    [selectedTemplate],
  );

  const activeQuestions = useMemo(() => {
    if (mode === "edit") {
      return evaluation?.templateVersion?.sections.flatMap((section) => section.questions) ?? [];
    }

    return selectedTemplateVersion?.sections.flatMap((section) => section.questions) ?? [];
  }, [mode, evaluation, selectedTemplateVersion]);

  const isClosed = mode === "edit" && evaluation?.status === "closed";
  const isContextReadOnly = mode === "edit" || lockPeriodFields;

  const workerLabel = workers?.find((item) => item.workerId === workerId)?.fullName;

  useEffect(() => {
    if (mode !== "create") return;
    if (initialWorkerId) setWorkerId(initialWorkerId);
    if (initialTemplateId) setTemplateId(initialTemplateId);
    if (initialYear) setYear(initialYear);
    if (initialMonth) setMonth(initialMonth);
  }, [mode, initialWorkerId, initialTemplateId, initialYear, initialMonth]);

  useEffect(() => {
    if (mode !== "edit" || !evaluation) return;

    setWorkerId(evaluation.workerId);
    setYear(evaluation.year);
    setMonth(evaluation.month);
    setGeneralComment(evaluation.generalComment ?? "");

    const templateFromEvaluation = templates?.find((template) => {
      const version = getTemplateVersion(template);
      return (
        version?.monthlyEvaluationTemplateVersionId ===
        evaluation.monthlyEvaluationTemplateVersionId
      );
    });

    if (templateFromEvaluation) {
      setTemplateId(templateFromEvaluation.monthlyEvaluationTemplateId);
    }

    const initialResponses: Record<number, ResponseDraft> = {};
    for (const response of evaluation.responses) {
      initialResponses[response.monthlyEvaluationQuestionId] = {
        score: response.score,
        textAnswer: response.textAnswer,
      };
    }

    setResponses(initialResponses);
  }, [mode, evaluation, templates]);

  useEffect(() => {
    if (mode !== "create") return;
    setResponses({});
  }, [mode, templateId]);

  const setScore = (questionId: number, value: string) => {
    const parsed = value === "" ? undefined : Number(value);

    setResponses((prev) => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        score: parsed,
      },
    }));
  };

  const setTextAnswer = (questionId: number, value: string) => {
    setResponses((prev) => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        textAnswer: value,
      },
    }));
  };

  const validateAndBuildResponses = (): CreateMonthlyEvaluationResponseDto[] | null => {
    const validationErrors: string[] = [];
    const payloadResponses: CreateMonthlyEvaluationResponseDto[] = [];

    for (const question of activeQuestions) {
      const response = responses[question.monthlyEvaluationQuestionId];
      const filled = isResponseFilled(question, response);

      if (question.isRequired && !filled) {
        validationErrors.push(`La pregunta obligatoria "${question.prompt}" no fue respondida.`);
        continue;
      }

      if (!filled) {
        continue;
      }

      if (question.questionType === "score") {
        const score = response?.score;

        if (typeof score !== "number" || Number.isNaN(score) || score < 0 || score > 3) {
          validationErrors.push(`La pregunta "${question.prompt}" debe tener puntaje entre 0 y 3.`);
          continue;
        }

        payloadResponses.push({
          monthlyEvaluationQuestionId: question.monthlyEvaluationQuestionId,
          score,
        });
      } else {
        payloadResponses.push({
          monthlyEvaluationQuestionId: question.monthlyEvaluationQuestionId,
          textAnswer: response?.textAnswer?.trim() ?? "",
        });
      }
    }

    if (validationErrors.length > 0) {
      toast.error(
        <div>
          <strong>Errores de validacion:</strong>
          <ul className="list-disc list-inside">
            {validationErrors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>,
      );
      return null;
    }

    return payloadResponses;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const payloadResponses = validateAndBuildResponses();
    if (!payloadResponses) return;

    if (mode === "create") {
      const versionId = selectedTemplateVersion?.monthlyEvaluationTemplateVersionId;

      if (!workerId || !versionId || !year || !month) {
        toast.error("Completa trabajador, plantilla, anio y mes.");
        return;
      }

      await toast.promise(
        createEvaluation({
          workerId,
          monthlyEvaluationTemplateVersionId: versionId,
          year,
          month,
          sequence: 1,
          generalComment,
          responses: payloadResponses,
        }),
        {
          loading: "Creando evaluacion...",
          success: () => {
            onSaved();
            onClose();
            return "Evaluacion creada correctamente";
          },
          error: (err) => err.message || "No se pudo crear la evaluacion",
        },
      );

      return;
    }

    if (!evaluationId) return;

    await toast.promise(
      updateEvaluationResponses(evaluationId, {
        generalComment,
        responses: payloadResponses,
      }),
      {
        loading: "Actualizando respuestas...",
        success: () => {
          onSaved();
          refetch();
          return "Evaluacion actualizada correctamente";
        },
        error: (err) => err.message || "No se pudieron actualizar las respuestas",
      },
    );
  };

  if (loadingTemplates || (mode === "edit" && loadingEvaluation)) {
    return (
      <div className="bg-white rounded-xl w-[min(1100px,96vw)] h-[85vh] p-6 overflow-y-auto relative">
        <Loading />
      </div>
    );
  }

  if (templatesError || evaluationError) {
    return (
      <div className="bg-white rounded-xl w-[min(1100px,96vw)] h-[85vh] p-6 overflow-y-auto relative">
        <ErrorMessage errorMessage={templatesError || evaluationError || "Error inesperado"} />
      </div>
    );
  }

  const sections =
    mode === "edit"
      ? evaluation?.templateVersion?.sections ?? []
      : selectedTemplateVersion?.sections ?? [];

  return (
    <div className="bg-white rounded-xl w-[min(1100px,96vw)] h-[85vh] p-6 overflow-y-auto relative">
      <h2 className="text-2xl font-extrabold mb-4">
        {mode === "create" ? "Nueva evaluacion mensual" : `Evaluacion #${evaluationId}`}
      </h2>

      {mode === "edit" && evaluation ? (
        <div className="flex flex-wrap gap-3 mb-4">
          <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 font-semibold text-sm">
            Estado: {evaluation.status.toUpperCase()}
          </span>
          <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 font-semibold text-sm">
            Score: {evaluation.totalScore ?? 0} / {evaluation.maxScore ?? 0}
          </span>
          {evaluation.performanceLabel ? (
            <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 font-semibold text-sm">
              {evaluation.performanceLabel}
            </span>
          ) : null}
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {isContextReadOnly ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="border border-gray-200 rounded-md p-3 bg-gray-50">
              <p className="text-xs font-semibold text-gray-500">Trabajador</p>
              <p className="text-lg font-bold">{workerLabel || "-"}</p>
            </div>

            <div className="border border-gray-200 rounded-md p-3 bg-gray-50">
              <p className="text-xs font-semibold text-gray-500">Anio</p>
              <p className="text-lg font-bold">{year || "-"}</p>
            </div>

            <div className="border border-gray-200 rounded-md p-3 bg-gray-50">
              <p className="text-xs font-semibold text-gray-500">Mes</p>
              <p className="text-lg font-bold">{formatMonthName(month)}</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="flex flex-col gap-1">
              <label className="font-semibold">Trabajador</label>
              <select
                className="border border-gray-300 rounded-sm p-2"
                value={workerId || ""}
                onChange={(event) => setWorkerId(Number(event.target.value) || 0)}
              >
                <option value="">Selecciona trabajador</option>
                {workers?.map((worker) => (
                  <option key={worker.workerId} value={worker.workerId}>
                    {worker.fullName}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-semibold">Plantilla</label>
              <select
                className="border border-gray-300 rounded-sm p-2"
                value={templateId || ""}
                onChange={(event) => setTemplateId(Number(event.target.value))}
              >
                <option value="">Selecciona una plantilla</option>
                {templates?.map((template) => (
                  <option
                    key={template.monthlyEvaluationTemplateId}
                    value={template.monthlyEvaluationTemplateId}
                  >
                    {template.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-semibold">Anio</label>
              <input
                type="number"
                className="border border-gray-300 rounded-sm p-2"
                value={year}
                onChange={(event) => setYear(Number(event.target.value))}
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-semibold">Mes</label>
              <select
                className="border border-gray-300 rounded-sm p-2"
                value={month}
                onChange={(event) => setMonth(Number(event.target.value))}
              >
                {monthOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-3">
          <div className="flex flex-col gap-1">
            <label className="font-semibold">Comentario general</label>
            <textarea
              className="border border-gray-300 rounded-sm p-2"
              rows={2}
              value={generalComment}
              onChange={(event) => setGeneralComment(event.target.value)}
              disabled={isClosed}
            />
          </div>
        </div>

        {sections.length === 0 ? (
          <div className="border border-amber-200 bg-amber-50 text-amber-800 rounded-md p-3">
            {lockPeriodFields
              ? "Selecciona la plantilla del mes desde la vista de periodo para cargar preguntas."
              : "Selecciona una plantilla para cargar preguntas."}
          </div>
        ) : null}

        {sections.map((section) => (
          <section
            key={section.monthlyEvaluationSectionId}
            className="border border-gray-200 rounded-md shadow-sm bg-white"
          >
            <h3 className="font-bold text-lg mb-3 bg-slate-200 rounded-t-md px-3 py-2">
              {section.title}
            </h3>

            <div className="flex flex-col gap-4 px-4 pb-4">
              {section.questions.map((question) => {
                const draft = responses[question.monthlyEvaluationQuestionId];

                return (
                  <div key={question.monthlyEvaluationQuestionId} className="flex flex-col gap-2">
                    <label className="font-semibold">
                      {question.prompt}
                      {question.isRequired ? <span className="text-red-600 ml-1">*</span> : null}
                    </label>

                    {question.questionType === "score" ? (
                      <div className="flex flex-row flex-wrap items-center gap-5">
                        {scoreOptions.map((option) => {
                          const isSelected = draft?.score === option;

                          return (
                            <button
                              key={option}
                              type="button"
                              className={`flex items-center gap-2 rounded-md px-1 py-1 ${
                                isClosed ? "cursor-not-allowed opacity-60" : "cursor-pointer"
                              }`}
                              onClick={() =>
                                setScore(
                                  question.monthlyEvaluationQuestionId,
                                  isSelected ? "" : String(option),
                                )
                              }
                              disabled={isClosed}
                              aria-pressed={isSelected}
                            >
                              <span
                                className={`size-5 rounded-full border-2 flex items-center justify-center ${
                                  isSelected ? "border-[#0047a3]" : "border-gray-400"
                                }`}
                              >
                                <span
                                  className={`size-2.5 rounded-full ${
                                    isSelected ? "bg-[#0047a3]" : "bg-transparent"
                                  }`}
                                />
                              </span>
                              <span className="font-semibold text-gray-700">{option}</span>
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <textarea
                        className="border border-gray-300 rounded-sm p-2"
                        rows={2}
                        value={draft?.textAnswer ?? ""}
                        onChange={(event) =>
                          setTextAnswer(question.monthlyEvaluationQuestionId, event.target.value)
                        }
                        disabled={isClosed}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        ))}

        {mode === "edit" && evaluation?.scoreLegend?.length ? (
          <div className="border border-blue-100 bg-blue-50 rounded-md p-3 text-sm text-blue-800">
            <strong>Leyenda 0-3:</strong>
            <ul className="list-disc list-inside mt-2">
              {evaluation.scoreLegend.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          </div>
        ) : null}

        {mode === "edit" && evaluation?.performanceScale?.length ? (
          <div className="border border-emerald-100 bg-emerald-50 rounded-md p-3 text-sm text-emerald-800">
            <strong>Escala de desempeno:</strong>
            <ul className="list-disc list-inside mt-2">
              {evaluation.performanceScale.map((item, idx) => (
                <li key={idx}>{`${item.label}: ${item.min} - ${item.max}`}</li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="flex flex-wrap justify-end gap-2">
          <button
            type="submit"
            className="px-4 py-2 rounded-md bg-[#0047a3] hover:bg-[#003366] text-white font-semibold"
            disabled={saving || isClosed}
          >
            {saving ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </form>

      <button type="button" className="absolute right-3 top-3" onClick={onClose}>
        <IoCloseCircle className="size-8" />
      </button>

      <Toaster position="top-center" />
    </div>
  );
}
