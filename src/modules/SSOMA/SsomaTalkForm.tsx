import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { projectApi } from "../../data/apiUrl";
import type { Project } from "../../data/types";
import { useFetch } from "../../hooks";
import { createSsomaTalk, getSsomaTalk, updateSsomaTalk } from "./ssomaApi";
import { validateTalkDraft } from "./ssomaRules";
import type { SsomaTalkDraft, SsomaTalkUpdate } from "./ssomaTypes";

const today = () => {
  const date = new Date();
  return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, "0"), String(date.getDate()).padStart(2, "0")].join("-");
};
const blankDraft = (): SsomaTalkDraft => ({ projectId: 0, talkDate: today(), topic: "", trainer: "", location: "", targetAudience: "", scheduledTime: "", durationMinutes: 5, observations: "", responsibleName: "", responsiblePosition: "" });

export default function SsomaTalkForm() {
  const { id } = useParams();
  const talkId = id ? Number(id) : null;
  const navigate = useNavigate();
  const { data: projects, loading: projectsLoading, error: projectsError } = useFetch<Project[]>(`${projectApi}status/active`);
  const [draft, setDraft] = useState(blankDraft);
  const [hydrated, setHydrated] = useState(!talkId);
  const [loadingTalk, setLoadingTalk] = useState(Boolean(talkId));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [validation, setValidation] = useState<string[]>([]);

  useEffect(() => {
    if (!talkId) return;
    const controller = new AbortController();
    getSsomaTalk(talkId, controller.signal).then((talk) => {
      if (talk.status !== "draft") throw new Error("Solo se pueden editar charlas en borrador.");
      setDraft({ projectId: talk.projectId, talkDate: talk.talkDate.slice(0, 10), topic: talk.topic, trainer: talk.trainer || "", location: talk.location || "", targetAudience: talk.targetAudience || "", scheduledTime: talk.scheduledTime ? talk.scheduledTime.slice(11, 16) : "", durationMinutes: talk.durationMinutes, observations: talk.observations || "", responsibleName: talk.responsibleName || "", responsiblePosition: talk.responsiblePosition || "" });
      setHydrated(true);
    }).catch((caught: unknown) => { if (!controller.signal.aborted) setError(caught instanceof Error ? caught.message : "No se pudo cargar la charla."); }).finally(() => { if (!controller.signal.aborted) setLoadingTalk(false); });
    return () => controller.abort();
  }, [talkId]);

  const availableProjects = useMemo(() => projects || [], [projects]);
  const setField = <K extends keyof SsomaTalkDraft>(key: K, value: SsomaTalkDraft[K]) => setDraft((current) => ({ ...current, [key]: value }));
  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const errors = validateTalkDraft(draft);
    setValidation(errors);
    setError("");
    if (errors.length) return;
    setSaving(true);
    try {
      const payload: SsomaTalkDraft = { ...draft, topic: draft.topic.trim(), trainer: draft.trainer?.trim() || null, location: draft.location?.trim() || null, targetAudience: draft.targetAudience?.trim() || null, scheduledTime: draft.scheduledTime || null, observations: draft.observations?.trim() || null, responsibleName: draft.responsibleName?.trim() || null, responsiblePosition: draft.responsiblePosition?.trim() || null };
      const editablePayload = Object.fromEntries(
        Object.entries(payload).filter(([key]) => key !== "projectId"),
      ) as SsomaTalkUpdate;
      const talk = talkId
        ? await updateSsomaTalk(talkId, editablePayload)
        : await createSsomaTalk(payload);
      navigate(`/admin/ssoma/${talk.ssomaTalkId}`, { replace: true });
    } catch (caught) { setError(caught instanceof Error ? caught.message : "No se pudo guardar la charla."); }
    finally { setSaving(false); }
  };

  if (loadingTalk || projectsLoading || !hydrated) return <div className="p-8 text-slate-600" role="status">Cargando información…</div>;

  return <main className="mx-auto w-full max-w-4xl p-4 sm:p-6">
    <Link to={talkId ? `/admin/ssoma/${talkId}` : "/admin/ssoma"} className="text-sm font-semibold text-blue-700 underline">← Volver</Link>
    <h1 className="mt-3 text-2xl font-bold text-slate-900">{talkId ? "Editar charla SSOMA" : "Nueva charla SSOMA"}</h1>
    <p className="mt-1 text-sm text-slate-600">Completa los datos reales de programación y responsables.</p>
    {(error || projectsError) && <div role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error || projectsError}</div>}
    {validation.length > 0 && <div role="alert" className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900"><p className="font-semibold">Revisa estos datos:</p><ul className="list-inside list-disc">{validation.map((item) => <li key={item}>{item}</li>)}</ul></div>}
    <form onSubmit={submit} className="mt-5 grid gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-2 sm:p-6">
      {!talkId && <label className="flex flex-col gap-1 text-sm font-medium text-slate-700 sm:col-span-2">Proyecto <select required value={draft.projectId || ""} onChange={(event) => setField("projectId", Number(event.target.value))} className="h-11 rounded-lg border border-slate-300 bg-white px-3"><option value="">Selecciona un proyecto</option>{availableProjects.map((project) => <option key={project.projectId} value={project.projectId}>{project.code} · {project.name}</option>)}</select></label>}
      <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">Fecha <input required type="date" value={draft.talkDate} onChange={(event) => setField("talkDate", event.target.value)} className="h-11 rounded-lg border border-slate-300 px-3" /></label>
      <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">Hora <input type="time" value={draft.scheduledTime || ""} onChange={(event) => setField("scheduledTime", event.target.value)} className="h-11 rounded-lg border border-slate-300 px-3" /></label>
      <label className="flex flex-col gap-1 text-sm font-medium text-slate-700 sm:col-span-2">Tema <input required maxLength={500} value={draft.topic} onChange={(event) => setField("topic", event.target.value)} className="h-11 rounded-lg border border-slate-300 px-3" /></label>
      <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">Facilitador <input maxLength={200} value={draft.trainer || ""} onChange={(event) => setField("trainer", event.target.value)} className="h-11 rounded-lg border border-slate-300 px-3" /></label>
      <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">Duración (minutos) <input type="number" min={1} max={1440} value={draft.durationMinutes ?? ""} onChange={(event) => setField("durationMinutes", event.target.value ? Number(event.target.value) : null)} className="h-11 rounded-lg border border-slate-300 px-3" /></label>
      <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">Lugar <input maxLength={2000} value={draft.location || ""} onChange={(event) => setField("location", event.target.value)} className="h-11 rounded-lg border border-slate-300 px-3" /></label>
      <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">Público objetivo <input maxLength={2000} value={draft.targetAudience || ""} onChange={(event) => setField("targetAudience", event.target.value)} className="h-11 rounded-lg border border-slate-300 px-3" /></label>
      <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">Responsable <input maxLength={200} value={draft.responsibleName || ""} onChange={(event) => setField("responsibleName", event.target.value)} className="h-11 rounded-lg border border-slate-300 px-3" /></label>
      <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">Cargo del responsable <input maxLength={200} value={draft.responsiblePosition || ""} onChange={(event) => setField("responsiblePosition", event.target.value)} className="h-11 rounded-lg border border-slate-300 px-3" /></label>
      <label className="flex flex-col gap-1 text-sm font-medium text-slate-700 sm:col-span-2">Observaciones <textarea maxLength={5000} rows={4} value={draft.observations || ""} onChange={(event) => setField("observations", event.target.value)} className="rounded-lg border border-slate-300 p-3" /></label>
      <div className="flex flex-col-reverse gap-2 sm:col-span-2 sm:flex-row sm:justify-end"><Link to={talkId ? `/admin/ssoma/${talkId}` : "/admin/ssoma"} className="inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-300 px-4 font-semibold">Cancelar</Link><button disabled={saving || Boolean(projectsError)} type="submit" className="min-h-11 rounded-lg bg-blue-700 px-5 font-semibold text-white disabled:opacity-60">{saving ? "Guardando…" : "Guardar borrador"}</button></div>
    </form>
  </main>;
}
