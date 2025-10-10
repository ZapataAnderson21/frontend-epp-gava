import { useParams } from "react-router-dom";
import { HeaderPanel, Panel } from "../../common/panel";
import { useFetch } from "../../hooks";
import type { ProjectType } from "../../data/types";
import { projectApi } from "../../data/apiUrl";
import { ButtonContainer } from "../../common/form";
import { Button } from "../../components";
import { FaArrowLeft, FaEye, FaPencil } from "react-icons/fa6";
import { motion } from "framer-motion";

export default function Project() {

  const { id: projectId } = useParams<{ id: string }>();

  const {data: project, loading, error } = useFetch<ProjectType>(`${projectApi}${projectId}`, [projectId]);


  return (
    <Panel>
      <HeaderPanel name={`${project ? project?.name : ''}`} >
        <ButtonContainer>
          <Button
            icon={<FaArrowLeft />}
            label="Regresar"
            href="/admin/projects"
            onClick={() => {}}
            bgColor="#FF0000"
            bgHoverColor="#CC0000"
          />
          <Button
            icon={<FaPencil />}
            label="Editar"
            href={`/admin/projects/edit/${projectId}`}
            onClick={() => {}}
            bgColor="#2563EB"
            bgHoverColor="#1D4ED8"
          />
        </ButtonContainer>
      </HeaderPanel>

      <div className="w-full">
        <div className="flex flex-col gap-4">
          <h1 className="text-xl font-extrabold">Órdenes de compra</h1>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mt-4">
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              whileHover={{ scale: 1.015}}
              transition={{ type: "spring", stiffness: 260, damping: 20 }}
              className="border border-gray-300 shadow-xs text-xl p-4 rounded-xl col-span-1 flex flex-col gap-2"
            >
              <h4 className="font-bold">Ver Órdenes de compra:</h4>
              <div className="flex flex-row justify-between gap-4">
                <p className="text-4xl font-extrabold">{project?.purchaseOrders?.length ?? 0}</p>
                <motion.div className="flex justify-center items-center border p-3 rounded-xl border-gray-300 bg-gray-50 w-fit hover:scale-[105%] hover:bg-sky-50 duration-300 cursor-pointer">
                  <FaEye />
                </motion.div>
              </div>
            </motion.div>
            <div className="border text-xl border-gray-300 font-extrabold p-4 rounded-md col-span-1 flex flex-col gap-2">
              <h4 className="font-bold">Ingresos:</h4>
              <div className="flex flex-row gap-4">
                <p className="font-bold">Soles: <span>S/. 2400</span></p>
                <p className="font-bold">Dólares: <span>$ 1200</span></p>
              </div>
            </div>
            <div className="border text-lg border-gray-300 font-extrabold p-4 rounded-md col-span-1 flex flex-col gap-2">
              <h4 className="text-2xl">Egresos:</h4>
              <p className="font-bold">Soles: <span>S/. 2100</span></p>
              <p className="font-bold">Dólares: <span>$ 800</span></p>
            </div>
            <div className="border text-lg border-gray-300 font-extrabold p-4 rounded-md col-span-1 flex flex-col gap-2">
              <h4 className="text-2xl">Utilidades:</h4>
              <p className="font-bold">Soles: <span>S/. 300</span></p>
              <p className="font-bold">Dólares: <span>$ 400</span></p>
            </div>
          </div>
        </div>

      </div>
    </Panel>
  );
}
