import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { purchaseOrderApi } from "../../data/apiUrl";
import { useFetch } from "../../hooks/useFetch";

import PurchaseOrderRenumberModal from './PurchaseOrderRenumberModal';
import { useAccess } from '../../permissions/AccessProvider';

interface DirectoryOrder {
  purchaseOrderId: number;
  code: string;
  projectId: number;
  project: { name: string };
  supplier: { name: string };
}

const normalize = (text: string) => text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase();

export default function PurchaseOrderDirectoryModal({ onClose }: { onClose: () => void }) {
  const { can } = useAccess();
  const [renumberOpen, setRenumberOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [search, setSearch] = useState("");
  const { data, loading, error, refetch } = useFetch<DirectoryOrder[]>(`${purchaseOrderApi}directory`);

  useEffect(() => {
    const dialog = dialogRef.current;
    const previousOverflow = document.body.style.overflow;
    dialog?.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      dialog?.close();
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  const query = normalize(search.trim());
  const orders = (data ?? []).filter(order => normalize(`${order.code} ${order.project.name} ${order.supplier.name}`).includes(query));

  return <>{renumberOpen && <PurchaseOrderRenumberModal onClose={() => setRenumberOpen(false)} onApplied={refetch} />}{createPortal(
    <dialog ref={dialogRef} aria-labelledby="order-directory-title" onCancel={onClose}
      onKeyDown={event => { if (event.key === "Escape") { event.preventDefault(); onClose(); } }}
      onClick={event => { if (event.target === event.currentTarget) onClose(); }}
      className="m-auto w-[calc(100%_-_2rem)] max-w-5xl rounded-xl bg-white p-0 text-gray-900 shadow-xl backdrop:bg-black/50">
      <div className="flex max-h-[85dvh] flex-col p-5">
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 id="order-directory-title" className="text-xl font-bold">Todas las órdenes de compra</h2>
          <button type="button" onClick={onClose} className="rounded-md border px-3 py-2 hover:bg-gray-100">Cerrar</button>
        </div>
        {(can('orders.renumber') || can('orders.renumberHistory')) && <button type="button" className="mb-3 self-start rounded border px-3 py-2" onClick={() => setRenumberOpen(true)}>Numeración de OC</button>}
        <input type="search" aria-label="Buscar órdenes de compra" placeholder="Buscar por código, proyecto o proveedor"
          value={search} onChange={event => setSearch(event.target.value)} className="mb-4 w-full rounded-md border border-gray-300 p-3" />
        {loading || (!data && !error) ? <p role="status">Cargando órdenes...</p> : error ? (
          <div role="alert"><p>No se pudieron cargar las órdenes: {error}</p><button type="button" onClick={refetch} className="mt-2 underline">Reintentar</button></div>
        ) : (
          <div className="min-h-0 overflow-auto rounded-md border border-gray-200">
            <div className="sticky top-0 grid grid-cols-3 gap-3 bg-gray-100 p-3 text-xs font-bold uppercase" aria-hidden="true">
              <span>Código</span><span>Proyecto</span><span>Proveedor</span>
            </div>
            {orders.map(order => (
              <Link key={order.purchaseOrderId} to={`/admin/projects/${order.projectId}/purchase-orders/${order.purchaseOrderId}`}
                className="grid grid-cols-3 gap-3 border-t border-gray-100 p-3 text-sm hover:bg-blue-50 focus-visible:bg-blue-50 focus-visible:outline-[#0047a3]">
                <span className="break-words font-semibold">{order.code}</span>
                <span className="break-words">{order.project.name}</span>
                <span className="break-words">{order.supplier.name}</span>
              </Link>
            ))}
            {!orders.length && <p className="p-6 text-center text-sm text-gray-500">{query ? "No hay órdenes que coincidan con la búsqueda." : "No hay órdenes de compra registradas."}</p>}
          </div>
        )}
      </div>
    </dialog>, document.body,
  )}</>;
}
