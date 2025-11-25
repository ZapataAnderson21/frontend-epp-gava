import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useCurrentUser, useFetch } from "../hooks";
import { type Project, type Worker } from "../data/types";
import { projectApi, workerApi } from "../data/apiUrl";
import { ReturnButton } from "../common/button";
import { HeaderPanel, Panel } from "../common/panel";
import { ErrorMessage } from "../common/error";
import { logisticsTypes } from "../utils";
import Permission from "../common/auth/Permission";
import { formatDate } from "../utils/dateUtils"
import { FaSearch } from "react-icons/fa";
import { useMemo, useState, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { IoCloseCircle } from "react-icons/io5";
import InputCheck from "./components/InputCheck";

export default function Attendances() {
  const { user } = useCurrentUser();
  const [searchParams] = useSearchParams();
  const date = searchParams.get("date");
  const { id: projectId } = useParams<{ id: string }>();
  const { data: project } = useFetch<Project>(`${projectApi}${projectId}`, [projectId]);

  const [workerType, setWorkerType] = useState<string>("laborer");

  // NEW: término de búsqueda
  const [searchTerm, setSearchTerm] = useState<string>("");

  const { data: workers, loading: workersLoading } = useFetch<Worker[]>(
    `${workerApi}type/${workerType}`,
    [projectId, workerType]
  );

  if (!projectId || isNaN(Number(projectId)) || Number(projectId) <= 0)
    return <ErrorMessage errorMessage="No se encontró el proyecto." />;

  const navigate = useNavigate();

  const searchInputRef = useRef<HTMLInputElement>(null);

  // NEW: helper para normalizar cadenas (sin acentos y en minúsculas)
  const normalize = (s: string) =>
    (s || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "");

  // NEW: lista filtrada
  const filteredWorkers = useMemo(() => {
    if (!workers || !Array.isArray(workers)) return [];
    const q = normalize(searchTerm.trim());
    if (!q) return workers;
    return workers.filter(w => normalize(w.fullName).includes(q));
  }, [workers, searchTerm]);

  if(!date || date.length === 0 || date === 'undefined' || date==='') {
    return <ErrorMessage errorMessage="La fecha es requerida." />;
  }

  return (
    <Permission user={user} allow={logisticsTypes} fallback={<ErrorMessage errorMessage="No tienes permiso para ver esta sección." />}>
      <Panel>
        <HeaderPanel name='Registrar asistencias' >
          <div className="flex flex-row gap-2 justify-end">
            <ReturnButton onClick={() => { navigate(`/admin/projects/payrolls/${projectId}`) }} />
          </div>
        </HeaderPanel>

        <section className="flex flex-col gap-2 w-full">
          <p><span className="font-bold">Proyecto: </span> {project?.name}</p>
          <p><span className="font-bold">Fecha: </span> {formatDate(date?.toString())}</p>
        </section>

        <section className="flex flex-row w-full gap-16 mt-6">
          <div className="flex flex-col gap-2 w-full max-w-4xl">
            <div className="mb-4">
              <div className="relative grid grid-cols-2 bg-gray-100 rounded-xl font-extrabold text-lg">
                {/* OBREROS */}
                <button
                  onClick={() => { setWorkerType("laborer"); setSearchTerm(""); }}
                  className={`relative py-2 rounded-lg transition-colors duration-500 cursor-pointer ${
                    workerType === "laborer" ? "text-white" : "text-gray-700"
                  }`}
                  aria-pressed={workerType === "laborer"}
                >
                  {workerType === "laborer" && (
                    <motion.div
                      layoutId="workerTypePill"
                      className="absolute inset-0 rounded-lg bg-[#0047a3]"
                      transition={{ type: "spring", stiffness: 500, damping: 30, mass: 0.4 }}
                    />
                  )}
                  <span className="relative z-10">OBREROS</span>
                </button>

                {/* TÉCNICOS */}
                <button
                  onClick={() => { setWorkerType("technician"); setSearchTerm(""); }}
                  className={`relative py-2 rounded-lg transition-colors duration-500 cursor-pointer ${
                    workerType === "technician" ? "text-white" : "text-gray-700"
                  }`}
                  aria-pressed={workerType === "technician"}
                >
                  {workerType === "technician" && (
                    <motion.div
                      layoutId="workerTypePill"
                      className="absolute inset-0 rounded-lg bg-[#0047a3]"
                      transition={{ type: "spring", stiffness: 500, damping: 30, mass: 0.4 }}
                    />
                  )}
                  <span className="relative z-10">TÉCNICOS</span>
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-4 mb-4">
              <div className="flex flex-row border border-gray-300 rounded-md py-2 px-3 items-center gap-2">
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={`Buscar ${workerType === "laborer" ? "obreros" : "técnicos"}...`}
                  className="w-full outline-none"
                />

                {searchTerm ? (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchTerm("");
                      // Opcional: devuelve el foco al input
                      searchInputRef.current?.focus();
                    }}
                    className="cursor-pointer text-gray-400 hover:text-gray-600 transition-colors duration-300"
                  >
                    <IoCloseCircle size={20} />
                  </button>
                ) : (
                  <FaSearch className="size-4 text-gray-400" />
                )}
              </div>

              <div className="mt-2">
                {workersLoading ? (
                  <p>Cargando...</p>
                ) : (
                  <AnimatePresence mode="wait">
                    <motion.ul
                      key={`${workerType}-${searchTerm}`}
                      className="flex flex-col gap-2"
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                    >
                      {filteredWorkers && filteredWorkers.length > 0 ? (
                        filteredWorkers.map((worker, idx) => {
                          const baseDelay = 0.04;
                          const perItemDelay = 0.06;
                          const delay = baseDelay + idx * perItemDelay;
                          const attendanceForDateAndProject = worker.attendances?.find(wa => wa.date.split("T")[0] === date && wa.projectId === Number(projectId));
                          
                          console.log("Date:", date);
                          console.log("Worker:", worker);
                          
                          return (
                            <InputCheck attendanceId={attendanceForDateAndProject?.attendanceId} worker={worker} projectId={Number(projectId)} date={date} delay={delay} value={attendanceForDateAndProject ? true : false} />
                          );
                        })
                      ) : (
                        <motion.li
                          key="no-results"
                          custom={0.05}
                          className="transition-colors duration-700"
                        >
                          {searchTerm
                            ? `No se encontraron ${workerType === "laborer" ? "obreros" : "técnicos"} para “${searchTerm}”.`
                            : `No se encontraron ${workerType === "laborer" ? "obreros" : "técnicos"}.`}
                        </motion.li>
                      )}
                    </motion.ul>
                  </AnimatePresence>
                )}
              </div>
            </div>
          </div>
        </section>
      </Panel>
    </Permission>
  );
}
