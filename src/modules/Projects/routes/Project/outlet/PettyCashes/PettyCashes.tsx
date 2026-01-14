import { useState } from "react";
import { useParams } from "react-router-dom";
import { useCurrentUser, useFetch } from "../../../../../../hooks";
import { pettyCashApi } from "../../../../../../data/apiUrl";
import { AddButton } from "../../../../../../common/button";
import { ErrorMessage } from "../../../../../../common/error";
import { adminTypes } from "../../../../../../utils";
import { PettyCash, NewPettyCash, PettyCashTable }  from "./";
import Permission from "../../../../../../common/auth/Permission";
import { CgSpinner } from "react-icons/cg";
import { motion } from "framer-motion";

export default function PettyCashes() {
  const { user } = useCurrentUser();

  const { id: projectId } = useParams<{ id: string }>();

  const [reFetch, setReFetch] = useState(0);
  const {data: mealsAmount, loading: mealsAmountLoading} = useFetch<number>(`${pettyCashApi}sum/${projectId}/meals`, [projectId, reFetch]);
  const {data: fuelAmount, loading: fuelAmountLoading} = useFetch<number>(`${pettyCashApi}sum/${projectId}/fuel`, [projectId, reFetch]);
  const {data: transportAmount, loading: transportAmountLoading} = useFetch<number>(`${pettyCashApi}sum/${projectId}/transport`, [projectId, reFetch]);
  const {data: suppliesAmount, loading: suppliesAmountLoading} = useFetch<number>(`${pettyCashApi}sum/${projectId}/supplies`, [projectId, reFetch]);
  const {data: safetyEquipmentAmount, loading: safetyEquipmentAmountLoading} = useFetch<number>(`${pettyCashApi}sum/${projectId}/safety_equipment`, [projectId, reFetch]);
  const {data: servicesAmount, loading: servicesAmountLoading} = useFetch<number>(`${pettyCashApi}sum/${projectId}/services`, [projectId, reFetch]);
  const {data: otherAmount, loading: otherAmountLoading} = useFetch<number>(`${pettyCashApi}sum/${projectId}/other`, [projectId, reFetch]);
  const [showRightPanel, setShowRightPanel] = useState("");
  const [selectedPettyCashId, setSelectedPettyCashId] = useState<number | null>(null);

  const successAction = () => { setReFetch(prev => prev + 1); }

  if (!projectId || isNaN(Number(projectId)) || Number(projectId) <= 0)  return <ErrorMessage errorMessage="No se encontró el proyecto." />;

  const handleSeeDetail = (id: number) => {
    setSelectedPettyCashId(id);
    setShowRightPanel("detail");
  };

  const closeAction = () => {
    setShowRightPanel("");
    setSelectedPettyCashId(null);
  };

  return (
    <Permission user={user} allow={adminTypes} fallback={<ErrorMessage errorMessage="No tienes permiso para ver esta sección." />}>
      <div className="flex flex-col max-w-full w-full gap-6">

        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mt-4 w-full">
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }} 
            style={{boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)"}}
            className="border border-gray-100 text-lg font-bold p-4 rounded-md col-span-1 flex flex-col gap-2"
          >
            <h4 className="text-xl font-bold">
              Comidas
            </h4>
            <p className="flex-1 text-2xl font-extrabold">
              {mealsAmountLoading ? <CgSpinner className="animate-spin" /> : `S/ ${Number(mealsAmount)?.toFixed(2) || "0.00"}`}
            </p>
          </motion.div>

          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }} 
            style={{boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)"}}
            className="border border-gray-100 text-lg font-bold p-4 rounded-md col-span-1 flex flex-col gap-2"
          >
            <h4 className="text-xl font-bold">
              Combustible
            </h4>
            <p className="flex-1 text-2xl font-extrabold">
              {fuelAmountLoading ? <CgSpinner className="animate-spin" /> : `S/ ${Number(fuelAmount)?.toFixed(2) || "0.00"}`}
            </p>
          </motion.div>

          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }} 
            style={{boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)"}}
            className="border border-gray-100 text-lg font-bold p-4 rounded-md col-span-1 flex flex-col gap-2"
          >
            <h4 className="text-xl font-bold">
              Transporte
            </h4>
            <p className="flex-1 text-2xl font-extrabold">
              {transportAmountLoading ? <CgSpinner className="animate-spin" /> : `S/ ${Number(transportAmount)?.toFixed(2) || "0.00"}`}
            </p>
          </motion.div>

          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }} 
            style={{boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)"}}
            className="border border-gray-100 text-lg font-bold p-4 rounded-md col-span-1 flex flex-col gap-2"
          >
            <h4 className="text-xl font-bold">
              Suministros
            </h4>
            <p className="flex-1 text-2xl font-extrabold">
              {suppliesAmountLoading ? <CgSpinner className="animate-spin" /> : `S/ ${Number(suppliesAmount)?.toFixed(2) || "0.00"}`}
            </p>
          </motion.div>

          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }} 
            style={{boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)"}}
            className="border border-gray-100 text-lg font-bold p-4 rounded-md col-span-1 flex flex-col gap-2"
          >
            <h4 className="text-xl font-bold">
              Equipos de Seguridad
            </h4>
            <p className="flex-1 text-2xl font-extrabold">
              {safetyEquipmentAmountLoading ? <CgSpinner className="animate-spin" /> : `S/ ${Number(safetyEquipmentAmount)?.toFixed(2) || "0.00"}`}
            </p>
          </motion.div>

          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }} 
            style={{boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)"}}
            className="border border-gray-100 text-lg font-bold p-4 rounded-md col-span-1 flex flex-col gap-2"
          >
            <h4 className="text-xl font-bold">
              Servicios
            </h4>
            <p className="flex-1 text-2xl font-extrabold">
              {servicesAmountLoading ? <CgSpinner className="animate-spin" /> : `S/ ${Number(servicesAmount)?.toFixed(2) || "0.00"}`}
            </p>
          </motion.div>

          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }} 
            style={{boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)"}}
            className="border border-gray-100 text-lg font-bold p-4 rounded-md col-span-1 flex flex-col gap-2"
          >
            <h4 className="text-xl font-bold">
              Otros Gastos
            </h4>
            <p className="flex-1 text-2xl font-extrabold">
              {otherAmountLoading ? <CgSpinner className="animate-spin" /> : `S/ ${Number(otherAmount)?.toFixed(2) || "0.00"}`}
            </p>
          </motion.div>

        </section>

        <div className="flex justify-end">
          <AddButton onClick={() => setShowRightPanel("new")} />
        </div>

        <PettyCashTable projectId={projectId ? Number(projectId) : 0} reFetch={reFetch} onSee={handleSeeDetail} />
      
        {showRightPanel && (
          <div style={{boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)"}} className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
            {showRightPanel === "new" && (
              <NewPettyCash projectId={projectId ? Number(projectId) : 0} successAction={successAction} closeAction={closeAction} />
            )}
            {showRightPanel === "detail" && selectedPettyCashId && (
              <PettyCash pettyCashId={selectedPettyCashId} successAction={successAction} closeAction={closeAction} />
            )}
        </div>
        )}
      </div>
    </Permission>
  );
}