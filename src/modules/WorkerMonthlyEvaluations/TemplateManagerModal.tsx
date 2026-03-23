import { useMemo, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import { IoCloseCircle } from "react-icons/io5";
import { ErrorMessage } from "../../common/error";
import { Loading } from "../../common/loading";
import {
  useMonthlyEvaluationTemplates,
  useWorkerMonthlyEvaluationActions,
} from "../../hooks";
import type {
  CreateMonthlyEvaluationTemplateDto,
  MonthlyEvaluationQuestionType,
  MonthlyEvaluationTemplate,
  MonthlyEvaluationTemplateVersion,
} from "../../data/types";

interface TemplateManagerModalProps {
  onClose: () => void;
  onUpdated: () => void;
}

type QuestionDraft = {
  id: number;
  prompt: string;
  questionType: MonthlyEvaluationQuestionType;
  isRequired: boolean;
};

type SectionDraft = {
  id: number;
  title: string;
  questions: QuestionDraft[];
};

type EditorMode = "create" | "edit";

type EditorState = {
  name: string;
  description: string;
  observedMaxScore: number;
  regularMaxScore: number;
  sections: SectionDraft[];
  nextId: number;
};

const EMPTY_QUESTION: QuestionDraft = {
  id: 0,
  prompt: "",
  questionType: "score",
  isRequired: true,
};

const DEFAULT_OBSERVED_MAX = 20;
const DEFAULT_REGULAR_MAX = 35;

function moveItem<T>(items: T[], fromIndex: number, toIndex: number): T[] {
  if (toIndex < 0 || toIndex >= items.length) return items;

  const copy = [...items];
  const [moved] = copy.splice(fromIndex, 1);
  copy.splice(toIndex, 0, moved);
  return copy;
}

function getTemplateVersion(template?: MonthlyEvaluationTemplate): MonthlyEvaluationTemplateVersion | undefined {
  return template?.currentVersion ?? template?.versions?.[0];
}

function buildEmptyEditorState(): EditorState {
  return {
    name: "",
    description: "",
    observedMaxScore: DEFAULT_OBSERVED_MAX,
    regularMaxScore: DEFAULT_REGULAR_MAX,
    sections: [
      {
        id: 1,
        title: "Seccion principal",
        questions: [{ ...EMPTY_QUESTION, id: 2 }],
      },
    ],
    nextId: 3,
  };
}

function buildEditorSnapshot(state: {
  name: string;
  description: string;
  observedMaxScore: number;
  regularMaxScore: number;
  sections: SectionDraft[];
}): string {
  return JSON.stringify({
    name: state.name.trim(),
    description: state.description.trim(),
    observedMaxScore: state.observedMaxScore,
    regularMaxScore: state.regularMaxScore,
    sections: state.sections.map((section) => ({
      title: section.title.trim(),
      questions: section.questions.map((question) => ({
        prompt: question.prompt.trim(),
        questionType: question.questionType,
        isRequired: question.isRequired,
      })),
    })),
  });
}

function buildEditorFromTemplate(template: MonthlyEvaluationTemplate): EditorState {
  const version = getTemplateVersion(template);

  const sections = version?.sections ?? [];
  let idSeed = 1;

  const sectionDrafts: SectionDraft[] = sections.length
    ? sections.map((section) => ({
        id: idSeed++,
        title: section.title,
        questions:
          section.questions?.length
            ? section.questions.map((question) => ({
                id: idSeed++,
                prompt: question.prompt,
                questionType: question.questionType,
                isRequired: question.isRequired,
              }))
            : [{ ...EMPTY_QUESTION, id: idSeed++ }],
      }))
    : [
        {
          id: idSeed++,
          title: "Seccion principal",
          questions: [{ ...EMPTY_QUESTION, id: idSeed++ }],
        },
      ];

  return {
    name: template.name ?? "",
    description: template.description ?? "",
    observedMaxScore: version?.observedMaxScore ?? template.observedMaxScore ?? DEFAULT_OBSERVED_MAX,
    regularMaxScore: version?.regularMaxScore ?? template.regularMaxScore ?? DEFAULT_REGULAR_MAX,
    sections: sectionDrafts,
    nextId: idSeed,
  };
}

export default function TemplateManagerModal({ onClose, onUpdated }: TemplateManagerModalProps) {
  const { data: templates, loading, error, refetch } = useMonthlyEvaluationTemplates();
  const {
    createTemplate,
    updateTemplate,
    duplicateTemplate,
    loading: saving,
  } = useWorkerMonthlyEvaluationActions();

  const initial = buildEmptyEditorState();

  const [editorMode, setEditorMode] = useState<EditorMode>("create");
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);

  const [name, setName] = useState(initial.name);
  const [description, setDescription] = useState(initial.description);
  const [observedMaxScore, setObservedMaxScore] = useState<number>(initial.observedMaxScore);
  const [regularMaxScore, setRegularMaxScore] = useState<number>(initial.regularMaxScore);
  const [nextId, setNextId] = useState<number>(initial.nextId);
  const [sections, setSections] = useState<SectionDraft[]>(initial.sections);

  const [baseSnapshot, setBaseSnapshot] = useState(() => buildEditorSnapshot(initial));
  const [confirmNewOpen, setConfirmNewOpen] = useState(false);

  const currentSnapshot = useMemo(
    () =>
      buildEditorSnapshot({
        name,
        description,
        observedMaxScore,
        regularMaxScore,
        sections,
      }),
    [name, description, observedMaxScore, regularMaxScore, sections],
  );

  const isDirty = currentSnapshot !== baseSnapshot;

  const applyEditorState = (state: EditorState) => {
    setName(state.name);
    setDescription(state.description);
    setObservedMaxScore(state.observedMaxScore);
    setRegularMaxScore(state.regularMaxScore);
    setSections(state.sections);
    setNextId(state.nextId);

    const snapshot = buildEditorSnapshot(state);
    setBaseSnapshot(snapshot);
  };

  const resetToNewEditor = () => {
    const state = buildEmptyEditorState();
    setEditorMode("create");
    setSelectedTemplateId(null);
    applyEditorState(state);
  };

  const loadTemplateToEditor = (template: MonthlyEvaluationTemplate) => {
    const state = buildEditorFromTemplate(template);
    setEditorMode("edit");
    setSelectedTemplateId(template.monthlyEvaluationTemplateId);
    applyEditorState(state);
  };

  const useNextId = () => {
    const id = nextId;
    setNextId((prev) => prev + 1);
    return id;
  };

  const addSection = () => {
    const sectionId = useNextId();
    const questionId = useNextId();
    setSections((prev) => [
      ...prev,
      {
        id: sectionId,
        title: "Seccion principal",
        questions: [{ ...EMPTY_QUESTION, id: questionId }],
      },
    ]);
  };

  const removeSection = (sectionId: number) => {
    const confirmed = window.confirm("Seguro que deseas quitar esta seccion?");
    if (!confirmed) return;

    setSections((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((section) => section.id !== sectionId);
    });
  };

  const moveSection = (sectionIndex: number, direction: -1 | 1) => {
    setSections((prev) => moveItem(prev, sectionIndex, sectionIndex + direction));
  };

  const setSectionTitle = (sectionId: number, title: string) => {
    setSections((prev) =>
      prev.map((section) => (section.id === sectionId ? { ...section, title } : section)),
    );
  };

  const addQuestion = (sectionId: number) => {
    const questionId = useNextId();

    setSections((prev) =>
      prev.map((section) => {
        if (section.id !== sectionId) return section;

        return {
          ...section,
          questions: [...section.questions, { ...EMPTY_QUESTION, id: questionId }],
        };
      }),
    );
  };

  const removeQuestion = (sectionId: number, questionId: number) => {
    const confirmed = window.confirm("Seguro que deseas quitar esta pregunta?");
    if (!confirmed) return;

    setSections((prev) =>
      prev.map((section) => {
        if (section.id !== sectionId) return section;
        if (section.questions.length <= 1) return section;

        return {
          ...section,
          questions: section.questions.filter((question) => question.id !== questionId),
        };
      }),
    );
  };

  const moveQuestion = (sectionId: number, questionIndex: number, direction: -1 | 1) => {
    setSections((prev) =>
      prev.map((section) => {
        if (section.id !== sectionId) return section;

        return {
          ...section,
          questions: moveItem(section.questions, questionIndex, questionIndex + direction),
        };
      }),
    );
  };

  const setQuestion = (
    sectionId: number,
    questionId: number,
    updater: (prev: QuestionDraft) => QuestionDraft,
  ) => {
    setSections((prev) =>
      prev.map((section) => {
        if (section.id !== sectionId) return section;

        return {
          ...section,
          questions: section.questions.map((question) =>
            question.id === questionId ? updater(question) : question,
          ),
        };
      }),
    );
  };

  const buildSectionsPayload = () => {
    const normalizedSections = sections
      .map((section) => ({
        title: section.title.trim(),
        questions: section.questions
          .map((question) => ({
            prompt: question.prompt.trim(),
            questionType: question.questionType,
            isRequired: question.isRequired,
          }))
          .filter((question) => question.prompt.length > 0),
      }))
      .filter((section) => section.title.length > 0);

    if (normalizedSections.length === 0) {
      toast.error("Agrega al menos una seccion con titulo.");
      return null;
    }

    const sectionWithoutQuestions = normalizedSections.find(
      (section) => section.questions.length === 0,
    );

    if (sectionWithoutQuestions) {
      toast.error(`La seccion \"${sectionWithoutQuestions.title}\" no tiene preguntas validas.`);
      return null;
    }

    return normalizedSections;
  };

  const persistEditor = async () => {
    if (!name.trim()) {
      toast.error("El nombre de la plantilla es obligatorio.");
      return false;
    }

    const payloadSections = buildSectionsPayload();
    if (!payloadSections) return false;

    const payload: CreateMonthlyEvaluationTemplateDto = {
      name: name.trim(),
      description: description.trim() || undefined,
      observedMaxScore,
      regularMaxScore,
      sections: payloadSections,
    };

    const action =
      editorMode === "edit" && selectedTemplateId
        ? updateTemplate(selectedTemplateId, payload)
        : createTemplate(payload);

    await toast.promise(action, {
      loading: editorMode === "edit" ? "Guardando cambios..." : "Creando plantilla...",
      success: editorMode === "edit" ? "Plantilla actualizada" : "Plantilla creada",
      error: (err) => err.message || "No se pudo guardar la plantilla",
    });

    await refetch();
    onUpdated();

    setBaseSnapshot(currentSnapshot);
    return true;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const saved = await persistEditor();
    if (!saved) return;

    if (editorMode === "create") {
      resetToNewEditor();
    }
  };

  const handleDuplicate = async (templateId: number) => {
    await toast.promise(duplicateTemplate(templateId), {
      loading: "Duplicando plantilla...",
      success: "Plantilla duplicada",
      error: (err) => err.message || "No se pudo duplicar la plantilla",
    });

    await refetch();
    onUpdated();
  };

  const handleSelectTemplate = (template: MonthlyEvaluationTemplate) => {
    loadTemplateToEditor(template);
  };

  const handleNewClick = () => {
    if (!isDirty) {
      resetToNewEditor();
      return;
    }

    setConfirmNewOpen(true);
  };

  const handleDiscardAndNew = () => {
    setConfirmNewOpen(false);
    resetToNewEditor();
  };

  const handleSaveAndNew = async () => {
    const saved = await persistEditor();
    if (!saved) return;

    setConfirmNewOpen(false);
    resetToNewEditor();
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl w-[min(1200px,96vw)] h-[85vh] p-6 overflow-y-auto relative">
        <Loading />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl w-[min(1200px,96vw)] h-[85vh] p-6 overflow-y-auto relative">
        <ErrorMessage errorMessage={error} />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl w-[min(1200px,96vw)] h-[85vh] p-6 overflow-y-auto relative">
      <h2 className="text-2xl font-extrabold mb-5">Gestion de plantillas</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="border border-gray-200 rounded-md p-4">
          <h3 className="font-bold mb-3">Plantillas existentes</h3>

          {!templates?.length ? (
            <p className="text-gray-500">No hay plantillas registradas.</p>
          ) : (
            <div className="flex flex-col gap-2 max-h-[60vh] overflow-y-auto">
              {templates.map((template) => {
                const selected =
                  editorMode === "edit" &&
                  selectedTemplateId === template.monthlyEvaluationTemplateId;

                const version = getTemplateVersion(template);
                const observed = version?.observedMaxScore ?? template.observedMaxScore ?? "-";
                const regular = version?.regularMaxScore ?? template.regularMaxScore ?? "-";

                return (
                  <button
                    type="button"
                    key={template.monthlyEvaluationTemplateId}
                    className={`border rounded-md p-3 flex flex-col gap-2 text-left ${
                      selected ? "border-[#0047a3] bg-blue-50" : "border-gray-200 bg-white"
                    }`}
                    onClick={() => handleSelectTemplate(template)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold">{template.name}</p>
                        <p className="text-sm text-gray-500">
                          {template.description || "Sin descripcion"}
                        </p>
                      </div>
                      <button
                        type="button"
                        className="px-3 py-1 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold"
                        onClick={(event) => {
                          event.stopPropagation();
                          handleDuplicate(template.monthlyEvaluationTemplateId);
                        }}
                        disabled={saving}
                      >
                        Duplicar
                      </button>
                    </div>

                    <div className="text-xs text-gray-600">
                      Escalas: observada {observed} / regular {regular}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        <section className="border border-gray-200 rounded-md p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold">
              {editorMode === "edit" ? "Editar plantilla" : "Crear nueva plantilla"}
            </h3>
            <button
              type="button"
              className="px-3 py-1 rounded-md bg-gray-200 hover:bg-gray-300 text-sm font-semibold"
              onClick={handleNewClick}
            >
              Nueva
            </button>
          </div>

          <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
            <div className="flex flex-col gap-1">
              <label className="font-semibold">Nombre</label>
              <input
                type="text"
                className="border border-gray-300 rounded-sm p-2"
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-semibold">Descripcion</label>
              <textarea
                className="border border-gray-300 rounded-sm p-2"
                rows={2}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="font-semibold">Maximo observado</label>
                <input
                  type="number"
                  min={1}
                  className="border border-gray-300 rounded-sm p-2"
                  value={observedMaxScore}
                  onChange={(event) => setObservedMaxScore(Number(event.target.value) || 0)}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-semibold">Maximo regular</label>
                <input
                  type="number"
                  min={1}
                  className="border border-gray-300 rounded-sm p-2"
                  value={regularMaxScore}
                  onChange={(event) => setRegularMaxScore(Number(event.target.value) || 0)}
                />
              </div>
            </div>

            <div className="flex flex-col gap-2 border border-gray-100 rounded-md p-3">
              <div className="flex items-center justify-between">
                <p className="font-semibold">Secciones y preguntas</p>
                <button
                  type="button"
                  className="px-3 py-1 rounded-md bg-gray-200 hover:bg-gray-300 text-sm font-semibold"
                  onClick={addSection}
                >
                  Agregar seccion
                </button>
              </div>

              {sections.map((section, sectionIndex) => (
                <div key={section.id} className="border border-gray-200 rounded-md p-3 flex flex-col gap-3">
                  <div className="flex items-end gap-2">
                    <div className="flex-1 flex flex-col gap-1">
                      <label className="font-semibold">Titulo de seccion</label>
                      <input
                        type="text"
                        className="border border-gray-300 rounded-sm p-2"
                        value={section.title}
                        onChange={(event) => setSectionTitle(section.id, event.target.value)}
                      />
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        className="px-2 py-1 rounded-md bg-gray-100 hover:bg-gray-200 text-sm"
                        onClick={() => moveSection(sectionIndex, -1)}
                        disabled={sectionIndex === 0}
                      >
                        Subir
                      </button>
                      <button
                        type="button"
                        className="px-2 py-1 rounded-md bg-gray-100 hover:bg-gray-200 text-sm"
                        onClick={() => moveSection(sectionIndex, 1)}
                        disabled={sectionIndex === sections.length - 1}
                      >
                        Bajar
                      </button>
                      <button
                        type="button"
                        className="px-2 py-1 rounded-md bg-red-100 hover:bg-red-200 text-red-700 text-sm"
                        onClick={() => removeSection(section.id)}
                        disabled={sections.length === 1}
                      >
                        Quitar
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-sm">Preguntas</p>
                    <button
                      type="button"
                      className="px-3 py-1 rounded-md bg-gray-200 hover:bg-gray-300 text-sm font-semibold"
                      onClick={() => addQuestion(section.id)}
                    >
                      Agregar pregunta
                    </button>
                  </div>

                  {section.questions.map((question, questionIndex) => (
                    <div key={question.id} className="border border-gray-200 rounded-md p-3 flex flex-col gap-2">
                      <div className="flex flex-col gap-1">
                        <label className="font-semibold">Pregunta</label>
                        <input
                          type="text"
                          className="border border-gray-300 rounded-sm p-2"
                          value={question.prompt}
                          onChange={(event) =>
                            setQuestion(section.id, question.id, (prev) => ({
                              ...prev,
                              prompt: event.target.value,
                            }))
                          }
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="flex flex-col gap-1">
                          <label className="font-semibold">Tipo</label>
                          <select
                            className="border border-gray-300 rounded-sm p-2"
                            value={question.questionType}
                            onChange={(event) =>
                              setQuestion(section.id, question.id, (prev) => ({
                                ...prev,
                                questionType: event.target.value as MonthlyEvaluationQuestionType,
                              }))
                            }
                          >
                            <option value="score">Puntaje</option>
                            <option value="text">Texto</option>
                          </select>
                        </div>

                        <div className="flex items-end">
                          <label className="inline-flex items-center gap-2 font-semibold">
                            <input
                              type="checkbox"
                              checked={question.isRequired}
                              onChange={(event) =>
                                setQuestion(section.id, question.id, (prev) => ({
                                  ...prev,
                                  isRequired: event.target.checked,
                                }))
                              }
                            />
                            Obligatoria
                          </label>
                        </div>
                      </div>

                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          className="px-2 py-1 rounded-md bg-gray-100 hover:bg-gray-200 text-sm"
                          onClick={() => moveQuestion(section.id, questionIndex, -1)}
                          disabled={questionIndex === 0}
                        >
                          Subir
                        </button>
                        <button
                          type="button"
                          className="px-2 py-1 rounded-md bg-gray-100 hover:bg-gray-200 text-sm"
                          onClick={() => moveQuestion(section.id, questionIndex, 1)}
                          disabled={questionIndex === section.questions.length - 1}
                        >
                          Bajar
                        </button>
                        <button
                          type="button"
                          className="px-2 py-1 rounded-md bg-red-100 hover:bg-red-200 text-red-700 text-sm"
                          onClick={() => removeQuestion(section.id, question.id)}
                          disabled={section.questions.length === 1}
                        >
                          Quitar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="px-4 py-2 rounded-md bg-[#0047a3] hover:bg-[#003366] text-white font-semibold"
                disabled={saving}
              >
                {saving
                  ? "Guardando..."
                  : editorMode === "edit"
                    ? "Guardar cambios"
                    : "Crear plantilla"}
              </button>
            </div>
          </form>
        </section>
      </div>

      {confirmNewOpen ? (
        <div className="fixed inset-0 z-[60] bg-black/40 flex items-center justify-center">
          <div className="bg-white rounded-lg w-[min(480px,92vw)] p-5 shadow-lg">
            <h3 className="text-xl font-extrabold mb-2">Cambios sin guardar</h3>
            <p className="text-gray-700 mb-4">
              Hay cambios sin guardar en la plantilla actual. Deseas guardar antes de crear una nueva?
            </p>

            <div className="flex flex-wrap justify-end gap-2">
              <button
                type="button"
                className="px-4 py-2 rounded-md bg-gray-200 hover:bg-gray-300 font-semibold"
                onClick={() => setConfirmNewOpen(false)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="px-4 py-2 rounded-md bg-red-600 hover:bg-red-700 text-white font-semibold"
                onClick={handleDiscardAndNew}
                disabled={saving}
              >
                Salir sin guardar
              </button>
              <button
                type="button"
                className="px-4 py-2 rounded-md bg-[#0047a3] hover:bg-[#003366] text-white font-semibold"
                onClick={handleSaveAndNew}
                disabled={saving}
              >
                Guardar y continuar
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <button type="button" className="absolute right-3 top-3" onClick={onClose}>
        <IoCloseCircle className="size-8" />
      </button>

      <Toaster position="top-center" />
    </div>
  );
}
