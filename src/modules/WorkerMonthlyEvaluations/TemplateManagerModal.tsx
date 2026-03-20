import { useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import { IoCloseCircle } from "react-icons/io5";
import { ErrorMessage } from "../../common/error";
import { Loading } from "../../common/loading";
import {
  useMonthlyEvaluationTemplates,
  useWorkerMonthlyEvaluationActions,
} from "../../hooks";
import type {
  MonthlyEvaluationQuestionType,
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

const EMPTY_QUESTION: QuestionDraft = {
  id: 0,
  prompt: "",
  questionType: "score",
  isRequired: true,
};

const EMPTY_SECTION: SectionDraft = {
  id: 0,
  title: "Sección principal",
  questions: [{ ...EMPTY_QUESTION }],
};

function moveItem<T>(items: T[], fromIndex: number, toIndex: number): T[] {
  if (toIndex < 0 || toIndex >= items.length) return items;

  const copy = [...items];
  const [moved] = copy.splice(fromIndex, 1);
  copy.splice(toIndex, 0, moved);
  return copy;
}

function createQuestion(idSeed: number): QuestionDraft {
  return {
    ...EMPTY_QUESTION,
    id: idSeed,
  };
}

function createSection(idSeed: number, questionSeed: number): SectionDraft {
  return {
    ...EMPTY_SECTION,
    id: idSeed,
    questions: [createQuestion(questionSeed)],
  };
}

export default function TemplateManagerModal({ onClose, onUpdated }: TemplateManagerModalProps) {
  const { data: templates, loading, error, refetch } = useMonthlyEvaluationTemplates();
  const { createTemplate, duplicateTemplate, loading: saving } = useWorkerMonthlyEvaluationActions();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [observedMaxScore, setObservedMaxScore] = useState<number>(20);
  const [regularMaxScore, setRegularMaxScore] = useState<number>(35);
  const [nextId, setNextId] = useState<number>(3);
  const [sections, setSections] = useState<SectionDraft[]>([createSection(1, 2)]);

  const useNextId = () => {
    const id = nextId;
    setNextId((prev) => prev + 1);
    return id;
  };

  const addSection = () => {
    const sectionId = useNextId();
    const questionId = useNextId();
    setSections((prev) => [...prev, createSection(sectionId, questionId)]);
  };

  const removeSection = (sectionId: number) => {
    const confirmed = window.confirm("¿Seguro que deseas quitar esta sección? Esta acción no se puede deshacer.");
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
          questions: [...section.questions, createQuestion(questionId)],
        };
      }),
    );
  };

  const removeQuestion = (sectionId: number, questionId: number) => {
    const confirmed = window.confirm("¿Seguro que deseas quitar esta pregunta? Esta acción no se puede deshacer.");
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

  const buildSections = () => {
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
      toast.error("Agrega al menos una sección con título.");
      return null;
    }

    const sectionWithoutQuestions = normalizedSections.find(
      (section) => section.questions.length === 0,
    );

    if (sectionWithoutQuestions) {
      toast.error(`La sección \"${sectionWithoutQuestions.title}\" no tiene preguntas válidas.`);
      return null;
    }

    return normalizedSections;
  };

  const handleCreateTemplate = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!name.trim()) {
      toast.error("El nombre de la plantilla es obligatorio.");
      return;
    }

    const payloadSections = buildSections();
    if (!payloadSections) return;

    await toast.promise(
      createTemplate({
        name: name.trim(),
        description: description.trim() || undefined,
        observedMaxScore,
        regularMaxScore,
        sections: payloadSections,
      }),
      {
        loading: "Creando plantilla...",
        success: () => {
          setName("");
          setDescription("");
          setSections([createSection(useNextId(), useNextId())]);
          refetch();
          onUpdated();
          return "Plantilla creada correctamente";
        },
        error: (err) => err.message || "No se pudo crear la plantilla",
      },
    );
  };

  const handleDuplicate = async (templateId: number) => {
    await toast.promise(duplicateTemplate(templateId), {
      loading: "Duplicando plantilla...",
      success: () => {
        refetch();
        onUpdated();
        return "Plantilla duplicada correctamente";
      },
      error: (err) => err.message || "No se pudo duplicar la plantilla",
    });
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl w-[min(1100px,96vw)] h-[85vh] p-6 overflow-y-auto relative">
        <Loading />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl w-[min(1100px,96vw)] h-[85vh] p-6 overflow-y-auto relative">
        <ErrorMessage errorMessage={error} />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl w-[min(1100px,96vw)] h-[85vh] p-6 overflow-y-auto relative">
      <h2 className="text-2xl font-extrabold mb-5">Gestión de plantillas</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="border border-gray-200 rounded-md p-4">
          <h3 className="font-bold mb-3">Plantillas existentes</h3>

          {!templates?.length ? (
            <p className="text-gray-500">No hay plantillas registradas.</p>
          ) : (
            <div className="flex flex-col gap-2 max-h-[60vh] overflow-y-auto">
              {templates.map((template) => (
                <div
                  key={template.monthlyEvaluationTemplateId}
                  className="border border-gray-200 rounded-md p-3 flex flex-col gap-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold">{template.name}</p>
                      <p className="text-sm text-gray-500">{template.description || "Sin descripción"}</p>
                    </div>
                    <button
                      type="button"
                      className="px-3 py-1 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold"
                      onClick={() => handleDuplicate(template.monthlyEvaluationTemplateId)}
                      disabled={saving}
                    >
                      Duplicar
                    </button>
                  </div>

                  <div className="text-xs text-gray-600">
                    Escalas: observada {template.observedMaxScore} / regular {template.regularMaxScore}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="border border-gray-200 rounded-md p-4">
          <h3 className="font-bold mb-3">Crear nueva plantilla</h3>

          <form className="flex flex-col gap-3" onSubmit={handleCreateTemplate}>
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
              <label className="font-semibold">Descripción</label>
              <textarea
                className="border border-gray-300 rounded-sm p-2"
                rows={2}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="font-semibold">Máximo observado</label>
                <input
                  type="number"
                  min={1}
                  className="border border-gray-300 rounded-sm p-2"
                  value={observedMaxScore}
                  onChange={(event) => setObservedMaxScore(Number(event.target.value) || 0)}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-semibold">Máximo regular</label>
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
                  Agregar sección
                </button>
              </div>

              {sections.map((section, sectionIndex) => (
                <div key={section.id} className="border border-gray-200 rounded-md p-3 flex flex-col gap-3">
                  <div className="flex items-end gap-2">
                    <div className="flex-1 flex flex-col gap-1">
                      <label className="font-semibold">Título de sección</label>
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
                            <option value="score">score</option>
                            <option value="text">text</option>
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
                {saving ? "Guardando..." : "Crear plantilla"}
              </button>
            </div>
          </form>
        </section>
      </div>

      <button type="button" className="absolute right-3 top-3" onClick={onClose}>
        <IoCloseCircle className="size-8" />
      </button>

      <Toaster position="top-center" />
    </div>
  );
}
