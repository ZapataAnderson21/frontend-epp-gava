import { useNavigate, useParams } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import { FaCreditCard, FaLocationDot, FaPencil, FaRegFilePdf } from "react-icons/fa6";
import { FaGlobe, FaPhoneAlt } from "react-icons/fa";
import { IoIosMail } from "react-icons/io";
import { Button } from "../../components";
import { ReturnButton } from "../../common/button";
import { ErrorMessage } from "../../common/error";
import { LoadingSkeletonForm } from "../../common/loading";
import { quotationApi } from "../../data/apiUrl";
import type { Quotation } from "../../data/types";
import { useFetch } from "../../hooks";

export default function Quotation() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: quotation, loading, error } = useFetch<Quotation>(`${quotationApi}${id ?? ""}`);

  const redirectUpdate = () => {
    if (!quotation) return;
    navigate(`/admin/quotations/edit/${quotation.quotationId}`);
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

  if (loading) return <LoadingSkeletonForm numberRows={8} />;
  if (error) return <ErrorMessage errorMessage={error} />;
  if (!quotation) return <ErrorMessage errorMessage="No se encontró la cotización." />;

  const commercialTerms = quotation.commercialTerms
    ? quotation.commercialTerms
        .split("|")
        .map((term) => term.trim())
        .filter(Boolean)
    : [];

  const displayDate = new Date(quotation.createdAt).toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return (
    <>
      <div className="flex flex-col w-full p-8">
        <div className="flex w-full items-center justify-between mb-6">
          <div className="w-fit">
            <ReturnButton onClick={() => navigate("/admin/quotations")} />
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
              icon={<FaPencil />}
              onClick={redirectUpdate}
              disabled={false}
              bgColor="#fbbf24"
              bgHoverColor="#f59e0b"
              type="button"
              label="Editar"
            />
          </div>
        </div>

        <div className="w-full flex flex-col items-center justify-center">
          <div className="flex flex-col gap-8 lg:w-[85%] w-full md:border border-gray-100 px-4 py-6 sm:px-6 md:px-10 md:py-10 lg:px-12 lg:py-12 md:shadow-md shadow-gray-300 bg-white rounded-sm">
            <div className="flex flex-col gap-8 text-center">
              <div className="flex flex-row flex-wrap items-center justify-center md:justify-between gap-8">
                <img className="max-h-45 md:max-h-56" src="/pdf-images/Logo-Cabecera-OC.png" alt="Logo" />
                <div className="flex flex-row gap-8 flex-wrap items-center justify-center">
                  <img className="h-12 md:h-18 lg:h-24" src="/pdf-images/Logo-ISO9001.jpg" alt="Certificado ISO" />
                  <img className="h-12 md:h-18 lg:h-24" src="/pdf-images/Logo-HODELPE.jpg" alt="Certificado HODELPE" />
                  <img className="h-12 md:h-18 lg:h-24" src="/pdf-images/Logo-SGS.png" alt="Certificado SGS" />
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <p className="text-[#03045a] font-bold italic text-xl">"Seguridad y Calidad a su Servicio"</p>
                <h1 className="text-[#c00000] font-extrabold text-2xl">COTIZACIÓN</h1>
                <div className="border-t-4 border-[#c00000]" />
                <h2 className="text-[#c00000] text-3xl font-bold">{quotation.code}</h2>
                <p className="self-end text-xl">
                  <span className="font-bold">Fecha:</span> {displayDate}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-2xl px-1">
              <p><span className="font-bold">Servicio:</span> {quotation.items?.[0]?.description ?? "-"}</p>
              <p><span className="font-bold">RUC:</span> {quotation.client?.ruc ?? "-"}</p>
              <p><span className="font-bold">Nombre del Cliente:</span> {quotation.client?.name ?? "-"}</p>
              <p><span className="font-bold">Atención:</span> {quotation.client?.contactName ?? "-"}</p>
            </div>

            <div className="overflow-x-auto rounded-sm">
              <table className="w-full text-xl">
                <thead className="bg-[#c90000] text-white">
                  <tr>
                    <th className="p-3 text-left">Ítem</th>
                    <th className="p-3 text-left">Descripción</th>
                    <th className="p-3 text-left">Unidad</th>
                    <th className="p-3 text-right">Cantidad</th>
                    <th className="p-3 text-right">V Venta Unit S/</th>
                    <th className="p-3 text-right">V Venta Parc S/</th>
                  </tr>
                </thead>
                <tbody>
                  {quotation.items?.map((item, index) => (
                    <tr key={item.quotationItemId ?? index} className="border-b border-gray-300">
                      <td className="p-3">{item.orderNumber ?? index + 1}</td>
                      <td className="p-3">{item.description}</td>
                      <td className="p-3">{item.unit}</td>
                      <td className="p-3 text-right">{Number(item.quantity).toFixed(2)}</td>
                      <td className="p-3 text-right">{Number(item.unitPrice).toFixed(2)}</td>
                      <td className="p-3 text-right">{Number(item.lineTotal).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end mt-1">
              <div className="w-full md:w-[48%] text-2xl">
                <div className="flex justify-between py-2 border-b border-gray-300 font-semibold">
                  <span>COSTO DIRECTO</span>
                  <span>{Number(quotation.costDirectAmount).toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-300 font-semibold">
                  <span>IGV ({Number(quotation.igvRate * 100).toFixed(0)}%)</span>
                  <span>{Number(quotation.igvAmount).toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-3 text-[#c00000] font-bold border-t-4 border-[#c00000]">
                  <span>TOTAL (S/)</span>
                  <span>{Number(quotation.totalAmount).toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="pt-1">
              <h3 className="text-2xl font-bold mb-2">Condiciones Comerciales:</h3>
              {commercialTerms.length > 0 ? (
                <ol className="list-decimal list-inside text-xl space-y-1">
                  {commercialTerms.map((term, idx) => (
                    <li key={`${term}-${idx}`}>{term}</li>
                  ))}
                </ol>
              ) : (
                <p className="text-xl">-</p>
              )}
            </div>

            <div className="bg-[#c90000] text-white p-8 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-xl">
                <div className="space-y-4">
                  <p className="font-bold text-xl">INFORMACIÓN BANCARIA:</p>
                  <p className="flex items-center gap-3"><FaCreditCard className="shrink-0" /><span><span className="font-bold">N° Cuenta BBVA:</span> 0011-0216-0100000630</span></p>
                  <p className="flex items-center gap-3"><FaCreditCard className="shrink-0" /><span><span className="font-bold">N° Cuenta Interbancaria:</span> 011216000100000630 92</span></p>
                  <p className="flex items-center gap-3"><FaCreditCard className="shrink-0" /><span><span className="font-bold">N° Cuenta de detracción B. NACIÓN:</span> 230-003181</span></p>
                </div>
                <div className="space-y-4">
                  <p className="font-bold text-xl">CONTACTO:</p>
                  <p className="flex items-center gap-3"><FaPhoneAlt className="shrink-0" /><span><span className="font-bold">Teléfono:</span> 978 994 903 / 950 528 865</span></p>
                  <p className="flex items-center gap-3"><FaGlobe className="shrink-0" /><span><span className="font-bold">Página web:</span> www.gavacycelectricidad.com</span></p>
                  <p className="flex items-center gap-3"><IoIosMail className="shrink-0 text-2xl" /><span><span className="font-bold">Correo:</span> logistica@gavacyc.com</span></p>
                </div>
              </div>
              <div className="mt-8 text-xl">
                <p className="font-bold text-xl mb-2">DIRECCIÓN:</p>
                <p className="flex items-start gap-3"><FaLocationDot className="shrink-0 mt-1" /><span>Calle Vicente de la Vega No 1488 - 5to piso, Chiclayo</span></p>
                <p className="flex items-start gap-3"><FaLocationDot className="shrink-0 mt-1" /><span>Mz C Dpto 206 Torre 4 Condominio Garden 360. Urb Las Palmeras del Chipre, Piura.</span></p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Toaster position="top-center" />
    </>
  );
}
