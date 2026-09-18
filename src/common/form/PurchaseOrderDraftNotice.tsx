import type { usePurchaseOrderDraft } from "../../hooks/usePurchaseOrderDraft";

export default function PurchaseOrderDraftNotice({
  draft,
  requirement = false,
}: {
  requirement?: boolean;
  draft: ReturnType<typeof usePurchaseOrderDraft>;
}) {
  const messages = {
    empty: requirement
      ? "Al empezar a completar el requerimiento, se guardará un borrador automáticamente."
      : "Al empezar a completar la orden, se guardará un borrador automáticamente.",
    local: "Borrador guardado en este navegador. Pendiente de sincronizar.",
    syncing: "Borrador guardado en este navegador. Sincronizando…",
    synced:
      "Borrador sincronizado. Puedes retomarlo con tu usuario desde otra computadora.",
    session:
      "Tu sesión venció. El borrador permanece en este navegador; inicia sesión para sincronizarlo.",
    error:
      "No se pudo sincronizar. El borrador permanece en este navegador y se reintentará automáticamente.",
    conflict:
      "Hay otra versión del borrador en el servidor. Elige cuál conservar antes de continuar.",
    invalid:
      "El borrador no tiene un formato compatible. No se sobrescribirá; contacta al administrador.",
  };
  return (
    <div
      className="rounded border border-sky-200 bg-sky-50 p-3 text-sm text-slate-700"
      role="status"
      aria-live="polite"
    >
      <p>
        {draft.storageFailed
          ? "El navegador no permite guardar el borrador local. No cierres esta página hasta que se sincronice con el servidor."
          : messages[draft.status]}
      </p>
      <p className="mt-1">
        {requirement
          ? "El borrador automático no envía el requerimiento. Usa Guardar cuando esté completo."
          : "El borrador no emite la orden. Usa Guardar cuando esté completa."}
      </p>
      {draft.status === "conflict" && (
        <div className="mt-2 flex gap-4">
          <button
            type="button"
            className="underline"
            onClick={() => draft.resolve(false)}
          >
            Conservar lo que tengo aquí
          </button>
          <button
            type="button"
            className="underline"
            onClick={() => draft.resolve(true)}
          >
            Recuperar la versión del servidor
          </button>
        </div>
      )}
      {["error", "session"].includes(draft.status) && (
        <button type="button" className="mt-2 underline" onClick={draft.retry}>
          Reintentar sincronización
        </button>
      )}
    </div>
  );
}
