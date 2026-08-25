import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import {
  FileText as FaRegFilePdf,
  LoaderCircle as AiOutlineLoading,
  Minus as FaMinus,
  Plus as FaPlus,
} from "lucide-react";

import { Button } from "../../components";
import { ReturnButton } from "../../common/button";
import { ErrorMessage } from "../../common/error";
import { LoadingSkeletonForm } from "../../common/loading";
import { clientApi, quotationApi } from "../../data/apiUrl";
import type { Client, Quotation, QuotationStatus } from "../../data/types";
import { useApiAction, useFetch } from "../../hooks";

type DraftItem = {
  orderNumber: number;
  description: string;
  unit: string;
  quantity: string;
  unitPrice: string;
};

const statusOptions: { value: QuotationStatus; label: string }[] = [
  { value: "draft", label: "Borrador" },
  { value: "sent", label: "Enviada" },
  { value: "approved", label: "Aprobada" },
  { value: "accepted", label: "Aceptada" },
];

const toMoney = (value: number) => Number(value.toFixed(2));

export default function EditQuotation() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: quotation, loading, error } = useFetch<Quotation>(`${quotationApi}${id ?? ""}`);
  const { data: clients, loading: loadingClients, error: clientsError } = useFetch<Client[]>(clientApi);
  const { execute, loading: saving } = useApiAction<Quotation>();

  const [clientId, setClientId] = useState<number>(0);
  const [status, setStatus] = useState<QuotationStatus>("draft");
  const [serviceDescription, setServiceDescription] = useState("");
  const [commercialTerms, setCommercialTerms] = useState("");
  const [items, setItems] = useState<DraftItem[]>([]);

  useEffect(() => {
    if (!quotation) return;

    setClientId(quotation.clientId);
    setStatus(quotation.status);
    setServiceDescription(quotation.serviceDescription ?? "");
    setCommercialTerms((quotation.commercialTerms ?? "").split("|").map((v) => v.trim()).filter(Boolean).join("\n"));
    setItems(
      (quotation.items && quotation.items.length > 0
        ? quotation.items
        : [{ orderNumber: 1, description: "", unit: "", quantity: 1, unitPrice: 0, lineTotal: 0 }]
      ).map((item, idx) => ({
        orderNumber: item.orderNumber ?? idx + 1,
        description: item.description,
        unit: item.unit,
        quantity: String(item.quantity),
        unitPrice: String(item.unitPrice),
      }))
    );
  }, [quotation]);

  const selectedClient = useMemo(
    () => (clients ?? []).find((client) => client.clientId === clientId),
    [clients, clientId]
  );

  const summary = useMemo(() => {
    const costDirectAmount = toMoney(
      items.reduce((sum, item) => {
        const quantity = Number(item.quantity) || 0;
        const unitPrice = Number(item.unitPrice) || 0;
        return sum + quantity * unitPrice;
      }, 0)
    );
    const igvRate = 0.18;
    const igvAmount = toMoney(costDirectAmount * igvRate);
    const totalAmount = toMoney(costDirectAmount + igvAmount);
    return { costDirectAmount, igvRate, igvAmount, totalAmount };
  }, [items]);

  const updateItem = (index: number, field: keyof DraftItem, value: string | number) => {
    setItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next.map((item, idx) => ({ ...item, orderNumber: idx + 1 }));
    });
  };

  const addItem = () => {
    setItems((prev) => [
      ...prev,
      { orderNumber: prev.length + 1, description: "", unit: "", quantity: "1", unitPrice: "0" },
    ]);
  };

  const removeItem = (index: number) => {
    setItems((prev) => {
      if (prev.length <= 1) {
        return [{ orderNumber: 1, description: "", unit: "", quantity: "1", unitPrice: "0" }];
      }
      return prev.filter((_, i) => i !== index).map((item, idx) => ({ ...item, orderNumber: idx + 1 }));
    });
  };

  const validate = () => {
    const errors: string[] = [];

    if (!clientId) errors.push("Debe seleccionar un cliente.");
    if (!serviceDescription.trim()) errors.push("La descripción del servicio es obligatoria.");

    items.forEach((item, index) => {
      const row = index + 1;
      if (!item.description.trim()) errors.push(`Item ${row}: la descripción es obligatoria.`);
      if (!item.unit.trim()) errors.push(`Item ${row}: la unidad es obligatoria.`);
      if (!Number.isFinite(Number(item.quantity)) || Number(item.quantity) <= 0) {
        errors.push(`Item ${row}: la cantidad debe ser mayor a 0.`);
      }
      if (!Number.isFinite(Number(item.unitPrice)) || Number(item.unitPrice) < 0) {
        errors.push(`Item ${row}: el precio unitario debe ser mayor o igual a 0.`);
      }
    });

    return errors;
  };

  const handleSave = async () => {
    if (!id) {
      toast.error("No se pudo identificar la cotización.");
      return;
    }

    const errors = validate();
    if (errors.length > 0) {
      errors.forEach((message, i) => setTimeout(() => toast.error(message), i * 80));
      return;
    }

    const normalizedTerms = commercialTerms
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .join("| ");

    const payload = {
      clientId,
      status,
      serviceDescription: serviceDescription.trim(),
      commercialTerms: normalizedTerms || undefined,
      items: items.map((item, index) => ({
        orderNumber: index + 1,
        description: item.description.trim(),
        unit: item.unit.trim(),
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
      })),
    };

    await toast.promise(execute(`${quotationApi}${id}`, "PATCH", payload), {
      loading: "Actualizando cotización...",
      success: (response) => {
        setTimeout(() => navigate(`/admin/quotations/${id}`), 1200);
        return response.message || "Cotización actualizada exitosamente";
      },
      error: (err) => err.message || "Error al actualizar cotización",
    });
  };

  const handleDownloadPDF = async () => {
    if (!id) return;

    try {
      const token = localStorage.getItem("accessToken");
      const res = await fetch(`${quotationApi}pdf/${id}`, {
        method: "GET",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!res.ok) throw new Error("No se pudo generar el PDF");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `COT-${quotation?.code ?? id}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      toast.error("No se pudo descargar el PDF.");
    }
  };

  if (loading || loadingClients) return <LoadingSkeletonForm numberRows={8} />;
  if (error) return <ErrorMessage errorMessage={error} />;
  if (clientsError) return <ErrorMessage errorMessage={clientsError} />;
  if (!quotation) return <ErrorMessage errorMessage="No se encontró la cotización." />;

  return (
    <>
      <div className="flex flex-col w-full p-8">
        <div className="flex w-full items-center justify-between mb-6">
          <div className="w-fit">
            <ReturnButton onClick={() => navigate(`/admin/quotations/${id}`)} />
          </div>
          <div className="w-fit flex flex-row gap-2">
            <Button
              icon={<FaRegFilePdf />}
              label="Exportar"
              bgColor="oklch(27.9% 0.041 260.031)"
              bgHoverColor="#000000"
              type="button"
              onClick={handleDownloadPDF}
            />
            <Button
              icon={saving ? <AiOutlineLoading className="animate-spin" /> : <FaRegFilePdf />}
              label={saving ? "Guardando..." : "Guardar"}
              bgColor="#0047a3"
              bgHoverColor="#003366"
              type="button"
              onClick={handleSave}
            />
          </div>
        </div>

        <div className="w-full flex flex-col items-center justify-center">
          <div className="flex flex-col gap-8 lg:w-[85%] w-full md:border border-gray-100 px-4 py-6 sm:px-6 md:px-10 md:py-10 lg:px-12 lg:py-12 md:shadow-md shadow-gray-300 bg-white rounded-sm">
            <div className="flex flex-col gap-4 text-center">
              <p className="text-[#03045a] font-bold italic text-lg">"Seguridad y Calidad a su Servicio"</p>
              <h1 className="text-[#c00000] font-extrabold text-xl">EDITAR COTIZACIÓN</h1>
              <div className="border-t-4 border-[#c00000]" />
              <h2 className="text-[#c00000] text-2xl font-bold">{quotation.code}</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-lg">
              <div className="flex flex-col gap-2">
                <label className="font-bold">Cliente:</label>
                <select
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-[#0047a3]"
                  value={clientId}
                  onChange={(e) => setClientId(Number(e.target.value))}
                >
                  <option value={0}>Selecciona un cliente</option>
                  {(clients ?? []).map((client) => (
                    <option key={client.clientId} value={client.clientId}>
                      {client.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <label className="font-bold">Estado:</label>
                <select
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-[#0047a3]"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as QuotationStatus)}
                >
                  {statusOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
              <p><span className="font-bold">RUC:</span> {selectedClient?.ruc ?? "-"}</p>
              <p><span className="font-bold">Atención:</span> {selectedClient?.contactName ?? "-"}</p>
            </div>

            <div className="pt-1">
              <h3 className="text-lg font-bold mb-2">Descripción del Servicio:</h3>
              <textarea
                className="w-full min-h-28 border border-gray-300 rounded p-3 focus:outline-[#0047a3]"
                value={serviceDescription}
                onChange={(e) => setServiceDescription(e.target.value)}
                placeholder="Detalle del servicio cotizado"
              />
            </div>

            <div className="overflow-x-auto rounded-sm">
              <table className="w-full text-base">
                <thead className="bg-[#c90000] text-white">
                  <tr>
                    <th className="p-3 text-left">Ítem</th>
                    <th className="p-3 text-left">Descripción</th>
                    <th className="p-3 text-left">Unidad</th>
                    <th className="p-3 text-right">Cantidad</th>
                    <th className="p-3 text-right">V Venta Unit S/</th>
                    <th className="p-3 text-right">V Venta Parc S/</th>
                    <th className="p-3 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => {
                    const lineTotal = (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0);
                    return (
                      <tr key={index} className="border-b border-gray-300">
                        <td className="p-3">{item.orderNumber}</td>
                        <td className="p-3">
                          <input
                            className="w-full border border-gray-300 rounded px-2 py-1"
                            value={item.description}
                            onChange={(e) => updateItem(index, "description", e.target.value)}
                          />
                        </td>
                        <td className="p-3">
                          <input
                            className="w-full border border-gray-300 rounded px-2 py-1"
                            value={item.unit}
                            onChange={(e) => updateItem(index, "unit", e.target.value)}
                          />
                        </td>
                        <td className="p-3 text-right">
                          <input
                            type="number"
                            step="0.0001"
                            min="0"
                            className="w-28 border border-gray-300 rounded px-2 py-1 text-right"
                            value={item.quantity}
                            onChange={(e) => updateItem(index, "quantity", e.target.value)}
                          />
                        </td>
                        <td className="p-3 text-right">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            className="w-28 border border-gray-300 rounded px-2 py-1 text-right"
                            value={item.unitPrice}
                            onChange={(e) => updateItem(index, "unitPrice", e.target.value)}
                          />
                        </td>
                        <td className="p-3 text-right">{toMoney(lineTotal).toFixed(2)}</td>
                        <td className="p-3 text-center">
                          <div className="flex justify-center gap-2">
                            <button type="button" className="bg-red-500 text-white p-2 rounded" onClick={() => removeItem(index)}>
                              <FaMinus />
                            </button>
                            <button type="button" className="bg-slate-800 text-white p-2 rounded" onClick={addItem}>
                              <FaPlus />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end mt-1">
              <div className="w-full md:w-[48%] text-lg">
                <div className="flex justify-between py-2 border-b border-gray-300 font-semibold">
                  <span>COSTO DIRECTO</span>
                  <span>{summary.costDirectAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-300 font-semibold">
                  <span>IGV ({Number(summary.igvRate * 100).toFixed(0)}%)</span>
                  <span>{summary.igvAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-3 text-[#c00000] font-bold border-t-4 border-[#c00000]">
                  <span>TOTAL (S/)</span>
                  <span>{summary.totalAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="pt-1">
              <h3 className="text-lg font-bold mb-2">Condiciones Comerciales:</h3>
              <textarea
                className="w-full min-h-36 border border-gray-300 rounded p-3 focus:outline-[#0047a3]"
                value={commercialTerms}
                onChange={(e) => setCommercialTerms(e.target.value)}
                placeholder="Una condición por línea"
              />
            </div>
          </div>
        </div>
      </div>
      <Toaster position="top-center" />
    </>
  );
}
