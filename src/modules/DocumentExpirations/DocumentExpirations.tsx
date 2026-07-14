import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import Permission from "../../common/auth/Permission";
import { ErrorMessage } from "../../common/error";
import { LoadingSkeletonTable } from "../../common/loading";
import { Panel } from "../../common/panel";
import { expiringDocumentsApi } from "../../data/apiUrl";
import type {
  ExpiringDocument,
  ExpiringDocumentCategory,
  ExpiringDocumentHistory,
  ExpiringDocumentListResponse,
  ExpiringDocumentStatus,
} from "../../data/types";
import { useApiAction, useCurrentUser, useFetch } from "../../hooks";
import { documentExpirationTypes } from "../../utils";

type PageTab = "documents" | "categories";

const emptyCategoryForm = {
  name: "",
  description: "",
  alertDaysFirst: "30",
  alertDaysSecond: "15",
  alertDaysThird: "7",
  notificationEmails: "",
  emailNotificationsEnabled: true,
};

const emptyDocumentForm = {
  categoryId: "",
  title: "",
  documentCode: "",
  referenceType: "",
  referenceDescription: "",
  storageSpace: "",
  storagePath: "",
  storageDescription: "",
  issueDate: "",
  expirationDate: "",
  notes: "",
};

const statusLabels: Record<ExpiringDocumentStatus, string> = {
  expired: "Vencido",
  upcoming: "Próximo a vencer",
  valid: "Vigente",
};

const statusStyles: Record<ExpiringDocumentStatus, string> = {
  expired: "bg-red-100 text-red-700",
  upcoming: "bg-amber-100 text-amber-700",
  valid: "bg-emerald-100 text-emerald-700",
};

export default function DocumentExpirations() {
  const { user } = useCurrentUser();
  const [tab, setTab] = useState<PageTab>("documents");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [includeDeleted, setIncludeDeleted] = useState(false);
  const [showDocumentForm, setShowDocumentForm] = useState(false);
  const [documentForm, setDocumentForm] = useState(emptyDocumentForm);
  const [editingDocumentId, setEditingDocumentId] = useState<number | null>(null);
  const [categoryForm, setCategoryForm] = useState(emptyCategoryForm);
  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null);
  const [selectedHistoryId, setSelectedHistoryId] = useState<number | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const listQuery = useMemo(() => {
    const query = new URLSearchParams({ limit: "200" });
    if (search.trim()) query.set("search", search.trim());
    if (categoryFilter) query.set("categoryId", categoryFilter);
    if (statusFilter) query.set("status", statusFilter);
    if (includeDeleted) query.set("includeDeleted", "true");
    return query.toString();
  }, [search, categoryFilter, statusFilter, includeDeleted]);

  const { data: categories, loading: categoriesLoading, error: categoriesError, refetch: refetchCategories } =
    useFetch<ExpiringDocumentCategory[]>(`${expiringDocumentsApi}categories?includeDeleted=${includeDeleted}`, [includeDeleted]);
  const { data: documents, loading: documentsLoading, error: documentsError, refetch: refetchDocuments } =
    useFetch<ExpiringDocumentListResponse>(`${expiringDocumentsApi}?${listQuery}`, [listQuery]);
  const { data: history, loading: historyLoading } = useFetch<ExpiringDocumentHistory[]>(
    selectedHistoryId ? `${expiringDocumentsApi}${selectedHistoryId}/history` : "",
    [selectedHistoryId],
  );
  const { execute, loading: saving } = useApiAction<unknown>();

  const runAction = async (action: () => Promise<{ message: string }>) => {
    setMessage(null);
    setFormError(null);
    try {
      const response = await action();
      setMessage(response.message);
      refetchDocuments();
      refetchCategories();
      return true;
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "No se pudo completar la operación.");
      return false;
    }
  };

  const resetDocumentForm = () => {
    setDocumentForm(emptyDocumentForm);
    setEditingDocumentId(null);
    setShowDocumentForm(false);
  };

  const submitDocument = async (event: FormEvent) => {
    event.preventDefault();
    const payload = {
      ...documentForm,
      categoryId: Number(documentForm.categoryId),
      documentCode: documentForm.documentCode || undefined,
      storagePath: documentForm.storagePath || undefined,
      storageDescription: documentForm.storageDescription || undefined,
      issueDate: documentForm.issueDate || undefined,
      notes: documentForm.notes || undefined,
    };
    const ok = await runAction(() =>
      execute(
        editingDocumentId ? `${expiringDocumentsApi}${editingDocumentId}` : expiringDocumentsApi,
        editingDocumentId ? "PATCH" : "POST",
        payload,
      ),
    );
    if (ok) resetDocumentForm();
  };

  const editDocument = (document: ExpiringDocument) => {
    setDocumentForm({
      categoryId: String(document.categoryId),
      title: document.title,
      documentCode: document.documentCode ?? "",
      referenceType: document.referenceType,
      referenceDescription: document.referenceDescription,
      storageSpace: document.storageSpace,
      storagePath: document.storagePath ?? "",
      storageDescription: document.storageDescription ?? "",
      issueDate: document.issueDate?.slice(0, 10) ?? "",
      expirationDate: document.expirationDate.slice(0, 10),
      notes: document.notes ?? "",
    });
    setEditingDocumentId(document.expiringDocumentId);
    setShowDocumentForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const submitCategory = async (event: FormEvent) => {
    event.preventDefault();
    const payload = {
      name: categoryForm.name,
      description: categoryForm.description || undefined,
      alertDaysFirst: Number(categoryForm.alertDaysFirst),
      alertDaysSecond: Number(categoryForm.alertDaysSecond),
      alertDaysThird: Number(categoryForm.alertDaysThird),
      notificationEmails: categoryForm.notificationEmails.split(/[;,\n]/).map((email) => email.trim()).filter(Boolean),
      emailNotificationsEnabled: categoryForm.emailNotificationsEnabled,
    };
    const ok = await runAction(() =>
      execute(
        editingCategoryId ? `${expiringDocumentsApi}categories/${editingCategoryId}` : `${expiringDocumentsApi}categories`,
        editingCategoryId ? "PATCH" : "POST",
        payload,
      ),
    );
    if (ok) {
      setCategoryForm(emptyCategoryForm);
      setEditingCategoryId(null);
    }
  };

  const editCategory = (category: ExpiringDocumentCategory) => {
    setCategoryForm({
      name: category.name,
      description: category.description ?? "",
      alertDaysFirst: String(category.alertDaysFirst),
      alertDaysSecond: String(category.alertDaysSecond),
      alertDaysThird: String(category.alertDaysThird),
      notificationEmails: category.notificationEmails.join(", "),
      emailNotificationsEnabled: category.emailNotificationsEnabled,
    });
    setEditingCategoryId(category.expiringDocumentCategoryId);
  };

  return (
    <Permission user={user} allow={documentExpirationTypes} fallback={<ErrorMessage errorMessage="No tienes permisos para acceder a esta página." />}>
      <Panel>
        <div className="flex w-full flex-col gap-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-extrabold">Vencimientos documentales</h1>
              <p className="mt-1 text-sm text-gray-500">Registra la ubicación, controla las fechas y conserva el historial de cambios.</p>
            </div>
            {tab === "documents" ? (
              <button type="button" onClick={() => { resetDocumentForm(); setShowDocumentForm(true); }} className="rounded-md bg-[#0047a3] px-5 py-2.5 font-bold text-white hover:bg-[#00377e]">Nuevo documento</button>
            ) : null}
          </div>

          <div className="flex gap-5 border-b border-gray-300">
            <PageTabButton active={tab === "documents"} onClick={() => setTab("documents")}>Documentos</PageTabButton>
            <PageTabButton active={tab === "categories"} onClick={() => setTab("categories")}>Categorías y avisos</PageTabButton>
          </div>

          {message ? <div className="rounded-md bg-emerald-50 p-3 text-sm font-semibold text-emerald-700">{message}</div> : null}
          {formError ? <div className="rounded-md bg-red-50 p-3 text-sm font-semibold text-red-700">{formError}</div> : null}

          {tab === "documents" ? (
            <>
              {showDocumentForm ? (
                <DocumentForm
                  form={documentForm}
                  setForm={setDocumentForm}
                  categories={(categories ?? []).filter((category) => !category.deletedAt)}
                  editing={Boolean(editingDocumentId)}
                  saving={saving}
                  onSubmit={submitDocument}
                  onCancel={resetDocumentForm}
                />
              ) : null}

              <div className="grid gap-3 rounded-md border border-gray-200 bg-white p-4 md:grid-cols-4">
                <input className="rounded-md border border-gray-300 px-3 py-2" placeholder="Buscar documento, código o referencia" value={search} onChange={(event) => setSearch(event.target.value)} />
                <select className="rounded-md border border-gray-300 px-3 py-2" value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
                  <option value="">Todas las categorías</option>
                  {(categories ?? []).map((category) => <option key={category.expiringDocumentCategoryId} value={category.expiringDocumentCategoryId}>{category.name}</option>)}
                </select>
                <select className="rounded-md border border-gray-300 px-3 py-2" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                  <option value="">Todos los estados</option><option value="expired">Vencidos</option><option value="upcoming">Próximos</option><option value="valid">Vigentes</option>
                </select>
                <label className="flex items-center gap-2 rounded-md border border-gray-200 px-3 py-2 text-sm font-semibold"><input type="checkbox" checked={includeDeleted} onChange={(event) => setIncludeDeleted(event.target.checked)} /> Mostrar archivados</label>
              </div>

              {documentsLoading ? <LoadingSkeletonTable /> : documentsError ? <ErrorMessage errorMessage={documentsError} /> : (
                <DocumentTable
                  documents={documents?.items ?? []}
                  onEdit={editDocument}
                  onHistory={setSelectedHistoryId}
                  onArchive={(id) => runAction(() => execute(`${expiringDocumentsApi}${id}`, "DELETE"))}
                  onRestore={(id) => runAction(() => execute(`${expiringDocumentsApi}${id}/restore`, "POST"))}
                />
              )}
            </>
          ) : (
            <div className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
              <CategoryForm form={categoryForm} setForm={setCategoryForm} editing={Boolean(editingCategoryId)} saving={saving} onSubmit={submitCategory} onCancel={() => { setCategoryForm(emptyCategoryForm); setEditingCategoryId(null); }} />
              <div className="flex flex-col gap-3">
                <label className="flex w-fit items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm font-semibold"><input type="checkbox" checked={includeDeleted} onChange={(event) => setIncludeDeleted(event.target.checked)} /> Mostrar categorías archivadas</label>
              {categoriesLoading ? <LoadingSkeletonTable /> : categoriesError ? <ErrorMessage errorMessage={categoriesError} /> : (
                <div className="overflow-x-auto rounded-md border border-gray-200 bg-white">
                  <table className="w-full min-w-[700px] text-left text-sm">
                    <thead className="bg-gray-50 text-xs uppercase text-gray-500"><tr><th className="px-4 py-3">Categoría</th><th className="px-4 py-3">Avisos</th><th className="px-4 py-3">Destinatarios</th><th className="px-4 py-3">Documentos</th><th className="px-4 py-3">Acciones</th></tr></thead>
                    <tbody>{(categories ?? []).map((category) => (
                      <tr key={category.expiringDocumentCategoryId} className="border-t border-gray-100">
                        <td className="px-4 py-3"><p className="font-bold">{category.name} {category.deletedAt ? <span className="ml-1 rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-500">Archivada</span> : null}</p><p className="text-xs text-gray-500">{category.description || "Sin descripción"}</p></td>
                        <td className="px-4 py-3 font-semibold">{category.alertDaysFirst}, {category.alertDaysSecond} y {category.alertDaysThird} días</td>
                        <td className="px-4 py-3"><p className={category.emailNotificationsEnabled ? "text-emerald-700" : "text-gray-400"}>{category.emailNotificationsEnabled ? "Activos" : "Desactivados"}</p><p className="max-w-xs break-words text-xs text-gray-500">{category.notificationEmails.join(", ") || "Sin destinatarios"}</p></td>
                        <td className="px-4 py-3">{category._count?.documents ?? 0}</td>
                        <td className="px-4 py-3"><div className="flex gap-2">{category.deletedAt ? <ActionButton onClick={() => runAction(() => execute(`${expiringDocumentsApi}categories/${category.expiringDocumentCategoryId}/restore`, "POST"))}>Restaurar</ActionButton> : <><ActionButton onClick={() => editCategory(category)}>Editar</ActionButton><ActionButton danger disabled={Boolean(category._count?.documents)} onClick={() => runAction(() => execute(`${expiringDocumentsApi}categories/${category.expiringDocumentCategoryId}`, "DELETE"))}>Desactivar</ActionButton></>}</div></td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
              )}
              </div>
            </div>
          )}
        </div>
      </Panel>

      {selectedHistoryId ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setSelectedHistoryId(null)}>
          <div className="max-h-[80vh] w-full max-w-3xl overflow-auto rounded-lg bg-white p-6 shadow-xl" onClick={(event) => event.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between"><h2 className="text-xl font-extrabold">Historial del documento</h2><button type="button" onClick={() => setSelectedHistoryId(null)} className="text-2xl">×</button></div>
            {historyLoading ? <LoadingSkeletonTable /> : <HistoryList history={history ?? []} />}
          </div>
        </div>
      ) : null}
    </Permission>
  );
}

function DocumentForm({ form, setForm, categories, editing, saving, onSubmit, onCancel }: {
  form: typeof emptyDocumentForm;
  setForm: React.Dispatch<React.SetStateAction<typeof emptyDocumentForm>>;
  categories: ExpiringDocumentCategory[];
  editing: boolean;
  saving: boolean;
  onSubmit: (event: FormEvent) => void;
  onCancel: () => void;
}) {
  const change = (name: keyof typeof form, value: string) => setForm((current) => ({ ...current, [name]: value }));
  return (
    <form onSubmit={onSubmit} className="rounded-md border border-blue-100 bg-blue-50/40 p-5">
      <h2 className="mb-4 text-xl font-extrabold">{editing ? "Editar documento" : "Registrar documento"}</h2>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Field label="Categoría"><select required value={form.categoryId} onChange={(e) => change("categoryId", e.target.value)} className="input"><option value="">Seleccionar</option>{categories.map((category) => <option key={category.expiringDocumentCategoryId} value={category.expiringDocumentCategoryId}>{category.name}</option>)}</select></Field>
        <Field label="Nombre del documento"><input required value={form.title} onChange={(e) => change("title", e.target.value)} className="input" /></Field>
        <Field label="Código o número"><input value={form.documentCode} onChange={(e) => change("documentCode", e.target.value)} className="input" /></Field>
        <Field label="Tipo de referencia"><input required placeholder="Proyecto, trabajador, equipo..." value={form.referenceType} onChange={(e) => change("referenceType", e.target.value)} className="input" /></Field>
        <Field label="Especificar referencia"><input required value={form.referenceDescription} onChange={(e) => change("referenceDescription", e.target.value)} className="input" /></Field>
        <Field label="Espacio de almacenamiento"><input required placeholder="OneDrive, equipo local, espacio físico..." value={form.storageSpace} onChange={(e) => change("storageSpace", e.target.value)} className="input" /></Field>
        <Field label="Ruta de almacenamiento"><input placeholder="Ruta o enlace interno" value={form.storagePath} onChange={(e) => change("storagePath", e.target.value)} className="input" /></Field>
        <Field label="Descripción de ubicación"><input placeholder="Obligatoria si no hay ruta" value={form.storageDescription} onChange={(e) => change("storageDescription", e.target.value)} className="input" /></Field>
        <Field label="Fecha de emisión"><input type="date" value={form.issueDate} onChange={(e) => change("issueDate", e.target.value)} className="input" /></Field>
        <Field label="Fecha de vencimiento"><input required type="date" value={form.expirationDate} onChange={(e) => change("expirationDate", e.target.value)} className="input" /></Field>
        <Field label="Observaciones"><input value={form.notes} onChange={(e) => change("notes", e.target.value)} className="input" /></Field>
      </div>
      <p className="mt-3 text-xs font-semibold text-gray-500">Debes completar al menos la ruta o la descripción de ubicación.</p>
      <div className="mt-4 flex justify-end gap-2"><button type="button" onClick={onCancel} className="rounded-md border border-gray-300 px-4 py-2 font-bold">Cancelar</button><button disabled={saving} className="rounded-md bg-[#0047a3] px-4 py-2 font-bold text-white disabled:opacity-50">{saving ? "Guardando..." : "Guardar"}</button></div>
    </form>
  );
}

function CategoryForm({ form, setForm, editing, saving, onSubmit, onCancel }: {
  form: typeof emptyCategoryForm;
  setForm: React.Dispatch<React.SetStateAction<typeof emptyCategoryForm>>;
  editing: boolean;
  saving: boolean;
  onSubmit: (event: FormEvent) => void;
  onCancel: () => void;
}) {
  const change = (name: keyof typeof form, value: string | boolean) => setForm((current) => ({ ...current, [name]: value }));
  return (
    <form onSubmit={onSubmit} className="h-fit rounded-md border border-gray-200 bg-white p-5 shadow-sm">
      <h2 className="mb-4 text-xl font-extrabold">{editing ? "Editar categoría" : "Nueva categoría"}</h2>
      <div className="flex flex-col gap-3">
        <Field label="Nombre"><input required className="input" value={form.name} onChange={(e) => change("name", e.target.value)} /></Field>
        <Field label="Descripción"><textarea className="input min-h-20" value={form.description} onChange={(e) => change("description", e.target.value)} /></Field>
        <div className="grid grid-cols-3 gap-2"><Field label="1.er aviso"><input required type="number" min="1" className="input" value={form.alertDaysFirst} onChange={(e) => change("alertDaysFirst", e.target.value)} /></Field><Field label="2.º aviso"><input required type="number" min="1" className="input" value={form.alertDaysSecond} onChange={(e) => change("alertDaysSecond", e.target.value)} /></Field><Field label="3.er aviso"><input required type="number" min="0" className="input" value={form.alertDaysThird} onChange={(e) => change("alertDaysThird", e.target.value)} /></Field></div>
        <Field label="Destinatarios"><textarea className="input min-h-20" placeholder="correo1@gava.com, correo2@gava.com" value={form.notificationEmails} onChange={(e) => change("notificationEmails", e.target.value)} /></Field>
        <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={form.emailNotificationsEnabled} onChange={(e) => change("emailNotificationsEnabled", e.target.checked)} /> Enviar avisos por correo</label>
      </div>
      <div className="mt-4 flex justify-end gap-2">{editing ? <button type="button" onClick={onCancel} className="rounded-md border border-gray-300 px-4 py-2 font-bold">Cancelar</button> : null}<button disabled={saving} className="rounded-md bg-[#0047a3] px-4 py-2 font-bold text-white disabled:opacity-50">{saving ? "Guardando..." : "Guardar categoría"}</button></div>
    </form>
  );
}

function DocumentTable({ documents, onEdit, onHistory, onArchive, onRestore }: {
  documents: ExpiringDocument[];
  onEdit: (document: ExpiringDocument) => void;
  onHistory: (id: number) => void;
  onArchive: (id: number) => void;
  onRestore: (id: number) => void;
}) {
  return (
    <div className="overflow-x-auto rounded-md border border-gray-200 bg-white">
      <table className="w-full min-w-[1250px] text-left text-sm">
        <thead className="bg-gray-50 text-xs uppercase text-gray-500"><tr><th className="px-4 py-3">Vencimiento</th><th className="px-4 py-3">Documento</th><th className="px-4 py-3">Categoría</th><th className="px-4 py-3">Referencia</th><th className="px-4 py-3">Almacenamiento</th><th className="px-4 py-3">Estado</th><th className="px-4 py-3">Acciones</th></tr></thead>
        <tbody>{documents.map((document) => (
          <tr key={document.expiringDocumentId} className={`border-t border-gray-100 ${document.deletedAt ? "bg-gray-50 opacity-70" : ""}`}>
            <td className="whitespace-nowrap px-4 py-3 font-bold">{formatDate(document.expirationDate)}<p className="text-xs font-normal text-gray-500">{document.daysRemaining >= 0 ? `${document.daysRemaining} días` : `${Math.abs(document.daysRemaining)} días vencido`}</p></td>
            <td className="px-4 py-3"><p className="font-bold">{document.title}</p><p className="text-xs text-gray-500">{document.documentCode || "Sin código"}</p></td>
            <td className="px-4 py-3">{document.category.name}</td>
            <td className="px-4 py-3"><p className="font-semibold">{document.referenceType}</p><p className="max-w-xs text-xs text-gray-500">{document.referenceDescription}</p></td>
            <td className="px-4 py-3"><p className="font-semibold">{document.storageSpace}</p><p className="max-w-xs break-words text-xs text-gray-500">{document.storagePath || document.storageDescription}</p></td>
            <td className="px-4 py-3"><span className={`rounded-full px-3 py-1 text-xs font-bold ${statusStyles[document.status]}`}>{document.deletedAt ? "Archivado" : statusLabels[document.status]}</span></td>
            <td className="px-4 py-3"><div className="flex gap-2">{!document.deletedAt ? <><ActionButton onClick={() => onEdit(document)}>Editar</ActionButton><ActionButton danger onClick={() => onArchive(document.expiringDocumentId)}>Archivar</ActionButton></> : <ActionButton onClick={() => onRestore(document.expiringDocumentId)}>Restaurar</ActionButton>}<ActionButton onClick={() => onHistory(document.expiringDocumentId)}>Historial</ActionButton></div></td>
          </tr>
        ))}{!documents.length ? <tr><td colSpan={7} className="px-4 py-10 text-center text-gray-500">No se encontraron documentos.</td></tr> : null}</tbody>
      </table>
    </div>
  );
}

function HistoryList({ history }: { history: ExpiringDocumentHistory[] }) {
  const actions = { created: "Creado", updated: "Actualizado", deleted: "Archivado", restored: "Restaurado" };
  return <div className="flex flex-col gap-3">{history.map((entry) => <div key={entry.expiringDocumentHistoryId} className="rounded-md border border-gray-200 p-4"><div className="flex flex-wrap justify-between gap-2"><p className="font-bold">{actions[entry.action]}</p><p className="text-xs text-gray-500">{new Date(entry.createdAt).toLocaleString("es-PE")}</p></div><p className="text-sm text-gray-600">Por {entry.changedBy.name} {entry.changedBy.lastName}</p><details className="mt-2"><summary className="cursor-pointer text-xs font-bold text-[#0047a3]">Ver versión guardada</summary><pre className="mt-2 overflow-auto rounded bg-gray-50 p-3 text-xs">{JSON.stringify(entry.snapshot, null, 2)}</pre></details></div>)}{!history.length ? <p className="text-center text-gray-500">Sin historial.</p> : null}</div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="flex flex-col gap-1 text-sm font-semibold text-gray-700"><span>{label}</span>{children}</label>; }
function PageTabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) { return <button type="button" onClick={onClick} className={`pb-2 text-lg font-bold ${active ? "border-b-4 border-gray-900" : "text-gray-400"}`}>{children}</button>; }
function ActionButton({ onClick, children, danger = false, disabled = false }: { onClick: () => void; children: React.ReactNode; danger?: boolean; disabled?: boolean }) { return <button type="button" disabled={disabled} onClick={onClick} className={`rounded px-2 py-1 text-xs font-bold disabled:cursor-not-allowed disabled:opacity-40 ${danger ? "bg-red-50 text-red-700" : "bg-blue-50 text-[#0047a3]"}`}>{children}</button>; }
function formatDate(value: string) { const [year, month, day] = value.slice(0, 10).split("-"); return `${day}/${month}/${year}`; }
