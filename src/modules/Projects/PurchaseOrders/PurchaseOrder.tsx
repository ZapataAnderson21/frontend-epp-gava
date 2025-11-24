import { useNavigate, useParams } from "react-router-dom";
import Permission from "../../../common/auth/Permission"
import { ErrorMessage } from "../../../common/error"
import { useCurrentUser, useFetch, useApiAction } from "../../../hooks"
import { logisticsTypes } from "../../../utils";
import { ReturnButton } from "../../../common/button";
import { purchaseOrderApi } from "../../../data/apiUrl";
import type { PurchaseOrder } from "../../../data/types";
import { SignaturesTable, DuplicateModal } from "./components";
import { FaRegCopy, FaRegFilePdf } from "react-icons/fa6";
import { Button } from "../../../components";
import { useState } from "react";
import TableViewPO from "./components/Table/TableViewPO";

export default function PurchaseOrder() {
  
  const { user } = useCurrentUser();

  const { id: purchaseOrderId } = useParams<{ id: string }>();
  
  const { data: purchaseOrder } = useFetch<PurchaseOrder>(`${purchaseOrderApi}${purchaseOrderId}`);

  const [seePurchasePrices, setSeePurchasePrices] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const { execute: duplicatePurchaseOrder, loading: isDuplicating } = useApiAction<PurchaseOrder>();

  const navigate = useNavigate();

  const navigateToPurchaseOrders = () => {
    navigate(`/admin/purchase-orders?projectId=${purchaseOrder?.project?.projectId}`);
  }

  const handleDuplicate = async (projectId: number) => {
    try {
      const response = await duplicatePurchaseOrder(
        `${purchaseOrderApi}${purchaseOrderId}/duplicate`,
        'POST',
        { projectId }
      );
      
      if (response.statusCode >= 200 && response.statusCode < 300) {
        setIsModalOpen(false);
        navigate(`/admin/purchase-orders?projectId=${projectId}`);
      }
    } catch (error) {
      console.error('Error duplicating purchase order:', error);
    }
  };

  const handleDownloadPDF = async () => {
    if (!purchaseOrderId) return;

    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`${purchaseOrderApi}pdf/${purchaseOrderId}`, {
        method: 'GET',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!res.ok) throw new Error('No se pudo generar el PDF');

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = `orden-compra-${purchaseOrderId}.pdf`; // el mismo nombre que en el backend
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
    }
  };


  return (
    <Permission user={user} allow={logisticsTypes} fallback={<ErrorMessage errorMessage="No tienes permiso para ver esta página." />} >
      <div className="flex flex-col p-4">
        <div className="flex w-full items-center justify-between">
          <div className="w-fit">
            <ReturnButton onClick={navigateToPurchaseOrders} />
          </div>
          <div className="w-fit flex flex-row gap-2">
            <Button 
              icon={<FaRegFilePdf />}
              label="Descargar"
              bgColor="oklch(27.9% 0.041 260.031)"
              bgHoverColor="#000000"
              type="button"
              onClick={handleDownloadPDF}
            />
            <Button
              icon={<FaRegCopy />}
              label="Duplicar"
              bgColor="#9f7aea"
              bgHoverColor="#7c3aed"
              type="button"
              onClick={() => setIsModalOpen(true)}
            />
          </div>
        </div>
        <div className="w-full flex flex-col items-center justify-center">
          <div className="flex flex-col m-2 gap-6 lg:w-[85%] w-full md:border-1 border-gray-100 md:p-12 md:shadow-md shadow-gray-300">
            <div className="flex flex-col gap-8 text-center">
              <div className="flex flex-row flex-wrap items-center justify-center md:justify-between gap-8">
                <img className="max-h-45 md:max-h-56" src="/pdf-images/Logo-Cabecera-OC.png" alt="Logo" />
                <div className="flex flex-row gap-8 flex-wrap items-center justify-center">
                  <img className="h-12 md:h-18 lg:h-24" src="/pdf-images/Logo-ISO9001.jpg" alt="Certificado ISO"/>
                  <img className="h-12 md:h-18 lg:h-24" src="/pdf-images/Logo-SGS.png" alt="Certificado SGS"/>
                  <img className="h-12 md:h-18 lg:h-24" src="/pdf-images/Logo-HODELPE.jpg" alt="Certificado HODELPE"/>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <h1 className="font-extrabold text-xl">{purchaseOrder?.project?.name.toUpperCase()}</h1>
                <div className="flex flex-col lg:flex-row items-center justify-center gap-2 bg-[#14519d] text-white p-4 text-2xl font-bold">
                  <h1>ORDEN DE COMPRA {purchaseOrder?.code.toUpperCase()}</h1>
                </div>
                <p className="self-end">
                  <span className="font-bold">Fecha:</span> {new Date().toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="grid-cols-1 flex flex-col h-full">
                  <div className="bg-[#14519d] text-white p-4 border border-[#14519d]">
                    <h1 className="text-xl font-bold">DATOS DEL PROVEEDOR</h1>
                  </div>
                  <div className="flex flex-col gap-4 p-4 shadow-md border border-gray-300 h-full">
                    <p className="text-nowrap"> <span className="font-bold">Proveedor: </span>{purchaseOrder?.supplier?.name}</p>
                    <p className="text-nowrap"><span className="font-bold">RUC:</span> {purchaseOrder?.supplier?.ruc} </p>
                    <p className="text-nowrap"> <span className="font-bold">Contacto: </span>{purchaseOrder?.supplier?.contactName}</p>
                    <p className="text-nowrap"><span className="font-bold">Correo:</span> {purchaseOrder?.supplier?.email} </p>
                    <p className="text-nowrap"><span className="font-bold">Teléfono:</span> {purchaseOrder?.supplier?.phone} </p>
                    <p className="text-nowrap"><span className="font-bold">Cotización:</span> {purchaseOrder?.quotation} </p>
                  </div>
                </div>

                <div className="grid-cols-1 flex flex-col h-full">
                  <div className="bg-[#14519d] text-white p-4 border border-[#14519d]">
                    <h1 className="text-xl font-bold">DATOS DE ENTREGA O ENVÍO</h1>
                  </div>
                  <div className="flex flex-col gap-4 p-4 shadow-md border border-gray-300 h-full">
                    <p className="text-nowrap"> <span className="font-bold">Lugar de entrega: </span>{purchaseOrder?.deliveryLocation}</p>
                    <p className="text-nowrap"><span className="font-bold">Destino:</span> {purchaseOrder?.destination} </p>
                    <p className="text-nowrap"> <span className="font-bold">Atención: </span>{purchaseOrder?.carePerson}</p>
                    <p className="text-nowrap"><span className="font-bold">DNI:</span> {purchaseOrder?.dniCarePerson} </p>
                    <p className="text-nowrap"><span className="font-bold">Observación:</span> {purchaseOrder?.observations} </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-8">
                <div className="grid-cols-1 flex flex-col h-full">
                  <div className="bg-[#14519d] text-white p-4 border border-[#14519d]">
                    <h1 className="text-xl font-bold">DATOS DEL PROVEEDOR</h1>
                  </div>
                  <div className="flex flex-col gap-4 p-4 border-r border-l border-gray-300 h-full">
                    <p className="text-nowrap font-bold">{purchaseOrder?.paymentConditions}</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 shadow-md border border-gray-300 h-full">
                    <p className="text-nowrap"><span className="font-bold">Método de pago: </span>{purchaseOrder?.paymentMethod}</p>
                    <p className="text-nowrap"><span className="font-bold">Cta. cte: </span>{purchaseOrder?.supplier?.bank} ({purchaseOrder?.supplier?.currency}) - {purchaseOrder?.supplier?.accountNumber}</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <p className="text-nowrap"><span className="font-bold">Señores: </span>{purchaseOrder?.supplier?.name}</p>
                <p>Sírvase a suministrarnos los {purchaseOrder?.purchaseOrderType} solicitados siguientes:</p>

                <div className="flex items-center justify-end text-[13px] font-semibold">
                  <p 
                    className="cursor-pointer hover:scale-[101%] transition-transform duration-300 border rounded-lg py-1 px-2 bg-slate-700 text-white"
                    onClick={() => setSeePurchasePrices(!seePurchasePrices)}
                  >
                    {seePurchasePrices ? 'OCULTAR PRECIOS DE COMPRA' : 'MOSTRAR PRECIOS DE COMPRA'}
                  </p>
                </div>

                { purchaseOrder && <TableViewPO purchaseOrder={purchaseOrder} seePurchasePrices={seePurchasePrices} /> }

              </div>
              
              <SignaturesTable />

              <h3 className="text-lg font-bold">CONDICIONES COMERCIALES</h3>
              <ol className="list-decimal list-inside">
              {purchaseOrder?.generalConditions?.split('|').map((condition, index) => (
                <li key={index}>{condition}</li>
              ))}
              </ol>
              
              <h3 className="text-lg font-bold">CONDICIONES DE CALIDAD</h3>
              <ol className="list-decimal list-inside">
                {purchaseOrder?.qualityConditions?.split('|').map((condition, index) => (
                  <li key={index}>{condition}</li>
                ))}
                </ol>

            </div>

          </div>
        </div>
      </div>

      <DuplicateModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleDuplicate}
        isLoading={isDuplicating}
      />
    </Permission>
  )
}