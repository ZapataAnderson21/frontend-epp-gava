import { useNavigate, useParams } from "react-router-dom";
import { useCurrentUser, useFetch } from "../hooks";
import { type Project } from "../data/types";
import { payrollApi, projectApi } from "../data/apiUrl";
import { ReturnButton } from "../common/button";
import { HeaderPanel, Panel } from "../common/panel";
import { ErrorMessage } from "../common/error";
import { adminTypes } from "../utils";
import Permission from "../common/auth/Permission";
import { CgSpinner } from "react-icons/cg";
import { motion } from "framer-motion";
import PayrollsTable from "./PayrollsTable";
import CalendarButton from "../common/button/CalendarButton";

export default function Payrolls() {
  const { user } = useCurrentUser();

  const { id: projectId } = useParams<{ id: string }>();

  const {data: project, loading} = useFetch<Project>(`${projectApi}${projectId}`, [projectId]);
  const {data: laborersAmount, loading: laborersAmountLoading} = useFetch<number>(`${payrollApi}${projectId}/laborers`, [projectId]);
  const {data: techniciansAmount, loading: techniciansAmountLoading} = useFetch<number>(`${payrollApi}${projectId}/technicians`, [projectId]);
  const totalAmount  = (laborersAmount || 0) + (techniciansAmount || 0);

  if (!projectId || isNaN(Number(projectId)) || Number(projectId) <= 0)  return <ErrorMessage errorMessage="No se encontró el proyecto." />;


  const navigate = useNavigate();

  return (
    <Permission user={user} allow={adminTypes} fallback={<ErrorMessage errorMessage="No tienes permiso para ver esta sección." />}>
      <Panel>
        <HeaderPanel name={project ? `Planillas de ${project.name}` : loading ? "Cargando..." :  "Proyecto no encontrado"}>
            <div className="flex flex-row gap-2 justify-end">
              <ReturnButton onClick={() => {navigate(`/admin/projects/${projectId}`)}} />
              <CalendarButton />
            </div>
        </HeaderPanel>

        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mt-4 w-full mb-8">
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }} 
            style={{boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)"}}
            className="border border-gray-100 text-lg font-bold p-4 rounded-md col-span-1 flex flex-col gap-2"
          >
            <h4 className="text-xl font-bold">
              Obreros
            </h4>
            <p className="flex-1 text-2xl font-extrabold">
              {laborersAmountLoading ? <CgSpinner className="animate-spin" /> : `S/ ${Number(laborersAmount)?.toFixed(2) || "0.00"}`}
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
              Técnicos
            </h4>
            <p className="flex-1 text-2xl font-extrabold">
              {techniciansAmountLoading ? <CgSpinner className="animate-spin" /> : `S/ ${Number(techniciansAmount)?.toFixed(2) || "0.00"}`}
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
              Total
            </h4>
            <p className="flex-1 text-2xl font-extrabold">
              {laborersAmountLoading || techniciansAmountLoading ? <CgSpinner className="animate-spin" /> : `S/ ${Number(totalAmount)?.toFixed(2) || "0.00"}`}
            </p>
          </motion.div>
        </section>

        {project && <PayrollsTable project={project} />}
      </Panel>
    </Permission>
  );
}