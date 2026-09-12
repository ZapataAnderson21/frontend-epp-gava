import { useEffect, useMemo, useState } from "react";
import {
  Check,
  ChevronDown,
  Copy,
  Plus,
  Save,
  Search,
  ShieldCheck,
  X,
} from "lucide-react";
import { motion } from "framer-motion";
import { permissionsApi, useAccess } from "./AccessProvider";

type Module = {
  key: string;
  label: string;
  actions: string[];
  special: [string, string][];
};
type Role = {
  userTypeId: number;
  name: string;
  description: string;
  permissions: string[];
  version: number;
  _count?: { userUserTypes: number };
};
const labels: Record<string, string> = {
  view: "Ver",
  manage: "Gestionar",
  delete: "Eliminar",
  export: "Exportar",
};
const emptyRole = (): Role => ({
  userTypeId: 0,
  name: "",
  description: "",
  permissions: [],
  version: 1,
});

function Toggle({
  checked,
  disabled,
  label,
  onChange,
}: {
  checked: boolean;
  disabled: boolean;
  label: string;
  onChange: () => void;
}) {
  return (
    <motion.button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={onChange}
      whileTap={{ scale: 0.88 }}
      className={`inline-flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-lg border-2 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:opacity-50 ${checked ? "border-blue-700 bg-blue-700 text-white" : "border-slate-300 bg-white hover:border-blue-500"}`}
    >
      {checked && <Check className="size-5" aria-hidden="true" />}
    </motion.button>
  );
}

export default function RolePermissions() {
  const { can, refresh } = useAccess();
  const editable = can("roles.manage");
  const [roles, setRoles] = useState<Role[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [dependencies, setDependencies] = useState<Record<string, string[]>>(
    {},
  );
  const [selected, setSelected] = useState<Role | null>(null);
  const [draft, setDraft] = useState<Role | null>(null);
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const dirty = !!draft && JSON.stringify(draft) !== JSON.stringify(selected);

  async function api(path: string, method = "GET", body?: unknown) {
    const response = await fetch(`${permissionsApi}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    const json = await response.json();
    if (!response.ok)
      throw new Error(
        Array.isArray(json.message)
          ? json.message.join(" ")
          : json.message || "No se pudo guardar.",
      );
    return json;
  }
  async function load() {
    try {
      setLoading(true);
      setError("");
      const result = (await api("roles")) as {
        data: {
          roles: Role[];
          modules: Module[];
          dependencies: Record<string, string[]>;
        };
      };
      setRoles(result.data.roles);
      setModules(result.data.modules);
      setDependencies(result.data.dependencies);
      const initial = result.data.roles[0] ?? null;
      setSelected(initial);
      setDraft(initial ? structuredClone(initial) : null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Error de conexión");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    void load();
  }, []);
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (dirty) {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  function choose(role: Role, duplicate = false) {
    if (
      dirty &&
      !window.confirm("Hay cambios sin guardar. ¿Quieres descartarlos?")
    )
      return;
    setError("");
    setMessage("");
    if (duplicate) {
      setSelected(emptyRole());
      setDraft({
        ...emptyRole(),
        name: `${role.name.slice(0, 70)} COPIA`,
        description: role.description,
        permissions: [...role.permissions],
      });
    } else {
      setSelected(role);
      setDraft(structuredClone(role));
    }
  }
  function toggle(module: Module, action: string) {
    if (!draft) return;
    const key = `${module.key}.${action}`;
    const next = new Set(draft.permissions);
    if (next.has(key)) {
      const related = [...next].filter((p) => dependencies[p]?.includes(key));
      if (
        related.length &&
        !window.confirm(
          `Este permiso es necesario para ${related.length} acciones. También se desactivarán. ¿Continuar?`,
        )
      )
        return;
      related.forEach((p) => next.delete(p));
      next.delete(key);
    } else {
      next.add(key);
      dependencies[key]?.forEach((dependency) => next.add(dependency));
    }
    setDraft({ ...draft, permissions: [...next].sort() });
  }
  const changes = useMemo(() => {
    const before = selected?.permissions ?? [];
    const after = draft?.permissions ?? [];
    return {
      added: after.filter((p) => !before.includes(p)),
      removed: before.filter((p) => !after.includes(p)),
    };
  }, [selected, draft]);
  function labelFor(key: string) {
    const [moduleKey, action] = key.split(".");
    const module = modules.find((item) => item.key === moduleKey);
    return `${module?.label ?? moduleKey}: ${labels[action] ?? module?.special.find(([value]) => value === action)?.[1] ?? action}`;
  }
  async function save() {
    if (!draft || !draft.name.trim()) {
      setError("Escribe un nombre para el rol.");
      return;
    }
    if (
      !window.confirm(
        `Guardar cambios en ${draft.name}: ${changes.added.length} permisos concedidos y ${changes.removed.length} revocados. Se aplicarán a todos los usuarios de este rol.`,
      )
    )
      return;
    setBusy(true);
    setError("");
    try {
      const result = (await api(
        draft.userTypeId ? `roles/${draft.userTypeId}` : "roles",
        draft.userTypeId ? "PUT" : "POST",
        {
          name: draft.name,
          description: draft.description,
          permissions: draft.permissions,
          ...(draft.userTypeId ? { version: draft.version } : {}),
        },
      )) as { data: Role };
      const saved = { ...result.data, _count: draft._count };
      setRoles((current) =>
        [
          ...current.filter((role) => role.userTypeId !== saved.userTypeId),
          saved,
        ].sort((a, b) => a.name.localeCompare(b.name)),
      );
      setSelected(saved);
      setDraft(structuredClone(saved));
      setMessage(
        "Permisos guardados. Los accesos se aplican en el servidor desde la próxima solicitud.",
      );
      refresh();
      window.dispatchEvent(new Event("permissions-changed"));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No se pudo guardar");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-[1600px] p-4 text-slate-800 md:p-8">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="rounded-2xl bg-blue-50 p-3 text-blue-700">
            <ShieldCheck />
          </span>
          <div>
            <h1 className="text-2xl font-bold">Roles y permisos</h1>
            <p className="mt-1 text-sm text-slate-500">
              Define qué puede consultar y hacer cada rol.
            </p>
          </div>
        </div>
        {editable && (
          <button
            type="button"
            disabled={busy}
            onClick={() => choose(emptyRole())}
            className="flex items-center gap-2 rounded-xl bg-blue-700 px-4 py-2.5 font-semibold text-white"
          >
            <Plus className="size-5" />
            Nuevo rol
          </button>
        )}
      </header>
      {error && (
        <div
          role="alert"
          className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-red-800"
        >
          {error}{" "}
          <button
            type="button"
            onClick={() => {
              if (!dirty || window.confirm("¿Descartar cambios y recargar?"))
                void load();
            }}
            className="ml-2 underline"
          >
            Recargar
          </button>
        </div>
      )}
      {message && (
        <div
          role="status"
          className="mb-4 rounded-xl bg-emerald-50 p-4 text-emerald-800"
        >
          {message}
        </div>
      )}
      {loading ? (
        <p role="status">Cargando roles…</p>
      ) : (
        <div className="grid items-start gap-5 lg:grid-cols-[250px_minmax(0,1fr)]">
          <aside className="rounded-2xl border border-slate-200 bg-white p-3">
            <h2 className="px-3 py-2 text-xs font-bold uppercase tracking-wide text-slate-500">
              Roles disponibles
            </h2>
            {roles.map((role) => (
              <button
                type="button"
                key={role.userTypeId}
                disabled={busy}
                onClick={() => choose(role)}
                className={`mb-1 w-full rounded-xl p-3 text-left transition-colors ${draft?.userTypeId === role.userTypeId ? "bg-blue-50 text-blue-800" : "hover:bg-slate-50"}`}
              >
                <span className="block break-words text-sm font-bold">
                  {role.name}
                </span>
                <span className="mt-1 block text-xs text-slate-500">
                  {role._count?.userUserTypes ?? 0} usuarios ·{" "}
                  {role.permissions.length} permisos
                </span>
              </button>
            ))}
          </aside>
          {draft && (
            <section className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="space-y-4 border-b border-slate-200 p-5">
                <div className="flex items-start gap-3">
                  <label className="flex-1 text-sm font-semibold">
                    Nombre del rol
                    <input
                      value={draft.name}
                      disabled={!editable || busy}
                      maxLength={80}
                      onChange={(event) =>
                        setDraft({ ...draft, name: event.target.value })
                      }
                      className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                    />
                  </label>
                  {editable && draft.userTypeId > 0 && (
                    <button
                      type="button"
                      onClick={() => choose(draft, true)}
                      disabled={busy}
                      className="mt-6 flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    >
                      <Copy className="size-4" />
                      Duplicar
                    </button>
                  )}
                </div>
                <label className="block text-sm font-semibold">
                  Descripción
                  <textarea
                    rows={2}
                    maxLength={500}
                    disabled={!editable || busy}
                    value={draft.description}
                    onChange={(event) =>
                      setDraft({ ...draft, description: event.target.value })
                    }
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-normal"
                  />
                </label>
                <label className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2">
                  <Search className="size-4 text-slate-500" />
                  <input
                    aria-label="Buscar módulos"
                    placeholder="Buscar un módulo…"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    className="w-full bg-transparent outline-none"
                  />
                </label>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[580px] text-sm">
                  <thead className="bg-slate-50 text-slate-600">
                    <tr>
                      <th className="p-4 text-left">Módulo</th>
                      {Object.values(labels).map((label) => (
                        <th key={label} className="p-3 text-center">
                          {label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {modules
                      .filter((module) =>
                        module.label
                          .toLocaleLowerCase()
                          .includes(search.toLocaleLowerCase()),
                      )
                      .map((module) => (
                        <ModuleRows
                          key={module.key}
                          module={module}
                          draft={draft}
                          disabled={!editable || busy}
                          expanded={expanded.includes(module.key)}
                          expand={() =>
                            setExpanded((current) =>
                              current.includes(module.key)
                                ? current.filter((key) => key !== module.key)
                                : [...current, module.key],
                            )
                          }
                          toggle={(action) => toggle(module, action)}
                        />
                      ))}
                  </tbody>
                </table>
              </div>
              <footer className="border-t border-slate-200 bg-slate-50 p-5">
                <p className="text-sm text-slate-600">
                  Ver incluye búsquedas y filtros. Los permisos no omiten
                  validaciones del negocio.
                </p>
                {dirty && (
                  <details className="mt-3 text-sm">
                    <summary className="cursor-pointer font-semibold">
                      Cambios pendientes: +{changes.added.length} / −
                      {changes.removed.length}
                    </summary>
                    <ul className="mt-2 space-y-1">
                      {changes.added.map((key) => (
                        <li key={key} className="text-emerald-700">
                          + {labelFor(key)}
                        </li>
                      ))}
                      {changes.removed.map((key) => (
                        <li key={key} className="text-red-700">
                          − {labelFor(key)}
                        </li>
                      ))}
                    </ul>
                  </details>
                )}
                {editable && (
                  <div className="mt-4 flex flex-wrap justify-end gap-3">
                    <button
                      type="button"
                      disabled={!dirty || busy}
                      onClick={() =>
                        setDraft(
                          selected ? structuredClone(selected) : emptyRole(),
                        )
                      }
                      className="flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 disabled:opacity-40"
                    >
                      <X className="size-4" />
                      Descartar cambios
                    </button>
                    <button
                      type="button"
                      disabled={!dirty || busy}
                      onClick={() => void save()}
                      className="flex items-center gap-2 rounded-xl bg-blue-700 px-4 py-2.5 font-semibold text-white disabled:opacity-40"
                    >
                      <Save className="size-4" />
                      {busy ? "Guardando…" : "Guardar cambios"}
                    </button>
                  </div>
                )}
              </footer>
            </section>
          )}
        </div>
      )}
    </main>
  );
}

function ModuleRows({
  module,
  draft,
  disabled,
  expanded,
  expand,
  toggle,
}: {
  module: Module;
  draft: Role;
  disabled: boolean;
  expanded: boolean;
  expand: () => void;
  toggle: (action: string) => void;
}) {
  return (
    <>
      <tr className="border-t border-slate-100">
        <td className="p-4 font-semibold">
          <span className="block">{module.label}</span>
          {module.special.length > 0 && (
            <button
              type="button"
              onClick={expand}
              aria-expanded={expanded}
              className="mt-1 inline-flex items-center gap-1 text-xs font-normal text-blue-700"
            >
              Acciones especiales
              <ChevronDown
                className={`size-4 transition-transform ${expanded ? "rotate-180" : ""}`}
              />
            </button>
          )}
        </td>
        {Object.keys(labels).map((action) => (
          <td key={action} className="p-3 text-center">
            {module.actions.includes(action) ? (
              <Toggle
                checked={draft.permissions.includes(`${module.key}.${action}`)}
                disabled={disabled}
                label={`${module.label}: ${labels[action]}`}
                onChange={() => toggle(action)}
              />
            ) : (
              <span className="text-slate-300">—</span>
            )}
          </td>
        ))}
      </tr>
      {expanded && (
        <tr>
          <td colSpan={5} className="bg-blue-50/50 px-5 py-4">
            <div className="flex flex-wrap gap-5">
              {module.special.map(([action, label]) => (
                <div key={action} className="flex items-center gap-2">
                  <Toggle
                    checked={draft.permissions.includes(
                      `${module.key}.${action}`,
                    )}
                    disabled={disabled}
                    label={`${module.label}: ${label}`}
                    onChange={() => toggle(action)}
                  />
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
