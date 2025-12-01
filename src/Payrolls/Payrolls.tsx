import { useParams } from "react-router-dom";
import { useCurrentUser, useFetch } from "../hooks";
import { type Project } from "../data/types";
import { projectApi, workerApi } from "../data/apiUrl";
import { ErrorMessage } from "../common/error";
import { adminTypes } from "../utils";
import Permission from "../common/auth/Permission";
import { CgSpinner } from "react-icons/cg";
import { motion } from "framer-motion";
import PayrollsTable from "./PayrollsTable";
import CalendarButton from "../common/button/CalendarButton";
import { Loading } from "../common/loading";

export default function Payrolls() {
  const { user } = useCurrentUser();

  const { id: projectId } = useParams<{ id: string }>();

  const {data: project, loading} = useFetch<Project>(`${projectApi}${projectId}`, [projectId]);
  const {data: totals, loading: totalsLoading} = useFetch<{laborerAmount: number; technicianAmount: number; totalAmount: number}>(`${workerApi}totals/${projectId}`, [projectId]);

  if (!projectId || isNaN(Number(projectId)) || Number(projectId) <= 0)  return <ErrorMessage errorMessage="No se encontró el proyecto." />;

  if(loading) return <Loading /> 

  return (
    <Permission user={user} allow={adminTypes} fallback={<ErrorMessage errorMessage="No tienes permiso para ver esta sección." />}>
      <div className="flex flex-col max-w-full w-full gap-6">
        <div className="flex justify-end">
          <CalendarButton />
        </div>

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
              {totalsLoading ? <CgSpinner className="animate-spin" /> : `S/ ${Number(totals?.laborerAmount)?.toFixed(2) || "0.00"}`}
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
              {totalsLoading ? <CgSpinner className="animate-spin" /> : `S/ ${Number(totals?.technicianAmount)?.toFixed(2) || "0.00"}`}
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
              {totalsLoading ? <CgSpinner className="animate-spin" /> : `S/ ${Number(totals?.totalAmount)?.toFixed(2) || "0.00"}`}
            </p>
          </motion.div>
        </section>

        {project && <PayrollsTable projectId={Number(projectId)} />}
      </div>
    </Permission>
  );
}