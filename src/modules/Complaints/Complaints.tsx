import { useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import { FaRegClock, FaTriangleExclamation } from "react-icons/fa6";

import { HeaderPanel, Panel } from "../../common/panel";
import { complaintApi } from "../../data/apiUrl";
import { useApiAction, useFetch } from "../../hooks";

interface Complaint {
  complaintId: number;
  claim: string;
  description: string;
  createdAt: string;
}

export default function Complaints() {
  const [claim, setClaim] = useState("");
  const [description, setDescription] = useState("");
  const { data, loading: loadingHistory, error, refetch } =
    useFetch<Complaint[]>(complaintApi);
  const { execute, loading } = useApiAction<Complaint>();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalizedClaim = claim.trim();
    const normalizedDescription = description.trim();

    if (normalizedClaim.length < 5) {
      toast.error("El reclamo debe tener al menos 5 caracteres.");
      return;
    }

    if (normalizedDescription.length < 10) {
      toast.error("La descripción debe tener al menos 10 caracteres.");
      return;
    }

    await toast.promise(
      execute(complaintApi, "POST", {
        claim: normalizedClaim,
        description: normalizedDescription,
      }),
      {
        loading: "Registrando reclamo...",
        success: (response) => {
          setClaim("");
          setDescription("");
          refetch();
          return response.message || "Reclamo registrado exitosamente.";
        },
        error: (requestError) =>
          requestError.message || "No se pudo registrar el reclamo.",
      },
    );
  };

  return (
    <Panel>
      <HeaderPanel name="Libro de reclamaciones" />

      <div className="grid w-full grid-cols-1 gap-8 xl:grid-cols-[minmax(0,620px)_1fr]">
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-5 rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
        >
          <div className="rounded-lg border-l-4 border-[#0047a3] bg-blue-50 p-4 text-sm text-gray-700">
            Registra el motivo del reclamo y detalla lo ocurrido. Ambos campos
            son obligatorios y el registro quedará asociado a tu usuario.
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="claim" className="font-semibold text-gray-700">
              Reclamo
            </label>
            <textarea
              id="claim"
              name="claim"
              value={claim}
              maxLength={200}
              rows={3}
              required
              onChange={(event) => setClaim(event.target.value)}
              className="resize-y rounded-md border border-gray-400 p-3 focus:outline-[#0047a3]"
              placeholder="Resume el motivo de tu reclamo"
            />
            <span className="text-right text-xs text-gray-500">
              {claim.length}/200
            </span>
          </div>

          <div className="flex flex-col gap-2">
            <label
              htmlFor="description"
              className="font-semibold text-gray-700"
            >
              Descripción
            </label>
            <textarea
              id="description"
              name="description"
              value={description}
              maxLength={2000}
              rows={7}
              required
              onChange={(event) => setDescription(event.target.value)}
              className="resize-y rounded-md border border-gray-400 p-3 focus:outline-[#0047a3]"
              placeholder="Describe los hechos, fechas y cualquier información relevante"
            />
            <span className="text-right text-xs text-gray-500">
              {description.length}/2000
            </span>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-fit rounded-md bg-[#0047a3] px-5 py-3 font-semibold text-white transition-colors hover:bg-[#003366] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Registrando..." : "Registrar reclamo"}
          </button>
        </form>

        <section className="flex min-w-0 flex-col gap-4">
          <h2 className="text-xl font-bold text-gray-800">Mis reclamos</h2>

          {loadingHistory && <p className="text-gray-500">Cargando historial...</p>}

          {!loadingHistory && error && (
            <div className="flex items-center gap-2 rounded-lg bg-red-50 p-4 text-red-700">
              <FaTriangleExclamation />
              <span>{error}</span>
            </div>
          )}

          {!loadingHistory && !error && (data?.length ?? 0) === 0 && (
            <div className="rounded-lg border border-dashed border-gray-300 p-6 text-center text-gray-500">
              Aún no has registrado reclamos.
            </div>
          )}

          {!loadingHistory && !error && data?.map((item) => (
            <article
              key={item.complaintId}
              className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
            >
              <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                <h3 className="font-bold text-[#0047a3]">{item.claim}</h3>
                <span className="flex items-center gap-2 text-xs text-gray-500">
                  <FaRegClock />
                  {new Date(item.createdAt).toLocaleString("es-PE")}
                </span>
              </div>
              <p className="whitespace-pre-wrap text-sm leading-6 text-gray-700">
                {item.description}
              </p>
            </article>
          ))}
        </section>
      </div>

      <Toaster position="top-center" />
    </Panel>
  );
}
