import {
  PackageOpen as FaBoxOpen,
  CalendarCheck as FaCalendarCheck,
  ChartColumn as FaChartColumn,
  ClipboardCheck as FaClipboardCheck,
  Boxes as FaCubes,
  FileChartColumn as FaFileInvoiceDollar,
  FileText as FaFileLines,
  Banknote as FaMoneyBillWave,
  Network as FaProjectDiagram,
  Truck as FaTruck,
  UsersRound as FaUserGroup,
  UserRoundCog as FaUserTie,
  Users as FaUsers,
  LogOut as IoLogOut,
  Settings as IoMdSettings,
  PanelLeftClose,
  TriangleAlert as RiAlertFill,
} from "lucide-react";

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import SidebarItem from "./SidebarItem";

import { AnimatePresence, motion } from "framer-motion";
import Permission from "../common/auth/Permission";
import { NotificationBell } from "../components";
import { userApi } from "../data/apiUrl";
import { useCurrentUser } from "../hooks";
import { useApiAction } from "../hooks/useApiAction";

import UserSettingsModal from "./UserSettingsModal";

interface SidebarProps {
  isOpen: boolean;
  isMobile?: boolean;
  setIsOpen?: (value: boolean) => void;
  onClose: () => void;
}

export default function Sidebar({
  isOpen,
  isMobile,
  setIsOpen,
  onClose,
}: SidebarProps) {
  const { user, refetch } = useCurrentUser();
  const [currentUser, setCurrentUser] = useState(user);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isUserSettingsOpen, setIsUserSettingsOpen] = useState(false);
  const navigate = useNavigate();

  const { execute: logoutAction, loading: loggingOut } = useApiAction<null>();
  const handleLogout = async () => {
    const response = await logoutAction(`${userApi}logout`, "POST");
    if (response.statusCode === 200) {
      localStorage.removeItem("user");
      navigate("/");
    }
  };

  useEffect(() => {
    setCurrentUser(user);
  }, [user]);

  const baseDelay = 0.1;
  const perItemDelay = 0.075;

  return (
    <>
      <section
        id="app-sidebar"
        aria-label="Menú lateral"
        aria-hidden={!isOpen}
        inert={!isOpen}
        className={`fixed top-0 z-30 h-dvh w-[260px] bg-white text-gray-500 transition-[left,visibility] duration-300 ease-in-out motion-reduce:transition-none ${
          isOpen
            ? "visible left-0 shadow-md"
            : "invisible -left-[260px] pointer-events-none"
        }`}
      >
        <div className="sidebar-scrollbar flex flex-col justify-between h-full overflow-y-auto">
          <div className="flex flex-col gap-2 py-3 px-4">
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: baseDelay }}
              className="flex flex-row items-center justify-between gap-2 mt-3 mb-4"
            >
              <img
                src="/logo-gava.png"
                alt="Logo"
                className="min-w-0 w-40 h-14 object-contain"
              />
              <button
                id="sidebar-close-button"
                type="button"
                aria-label="Cerrar menú lateral"
                aria-controls="app-sidebar"
                aria-expanded={isOpen}
                title="Cerrar menú lateral"
                onClick={onClose}
                className="inline-flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-lg text-[#0047a3] transition-colors hover:bg-[#eff5ff] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0047a3]"
              >
                <PanelLeftClose className="size-5" aria-hidden="true" />
              </button>
            </motion.div>

            <SidebarItem
              icon={<FaChartColumn />}
              label="Dashboard"
              href="/admin/dashboard"
              exactActivePaths={["/admin"]}
              index={1}
              baseDelay={baseDelay}
              perItemDelay={perItemDelay}
              onClick={() => isMobile && setIsOpen?.(false)}
            />
            <SidebarItem
              icon={<FaProjectDiagram />}
              label="Proyectos"
              href="/admin/projects"
              index={2}
              baseDelay={baseDelay}
              perItemDelay={perItemDelay}
              onClick={() => isMobile && setIsOpen?.(false)}
            />
            <Permission user={user} permission="suppliers.view">
              <SidebarItem
                icon={<FaTruck />}
                label="Proveedores"
                href="/admin/suppliers"
                index={3}
                baseDelay={baseDelay}
                perItemDelay={perItemDelay}
                onClick={() => isMobile && setIsOpen?.(false)}
              />
            </Permission>
            <SidebarItem
              icon={<FaFileLines />}
              label="Requerimientos"
              href="/admin/requests"
              index={4}
              baseDelay={baseDelay}
              perItemDelay={perItemDelay}
              onClick={() => isMobile && setIsOpen?.(false)}
            />
            <SidebarItem
              icon={<FaFileInvoiceDollar />}
              label="Cotizaciones"
              href="/admin/quotations"
              index={5}
              baseDelay={baseDelay}
              perItemDelay={perItemDelay}
              onClick={() => isMobile && setIsOpen?.(false)}
            />
            <SidebarItem
              icon={<FaUserGroup />}
              label="Clientes"
              href="/admin/clients"
              index={6}
              baseDelay={baseDelay}
              perItemDelay={perItemDelay}
              onClick={() => isMobile && setIsOpen?.(false)}
            />
            <SidebarItem
              icon={<FaCubes />}
              label="Inventario"
              href="/admin/inventory"
              activePaths={["/admin/elements"]}
              index={7}
              baseDelay={baseDelay}
              perItemDelay={perItemDelay}
              onClick={() => isMobile && setIsOpen?.(false)}
            />

            <Permission user={user} permission="resources.view">
              <SidebarItem
                icon={<FaBoxOpen />}
                label="Recursos Ord. Compra"
                href="/admin/resources"
                index={7}
                baseDelay={baseDelay}
                perItemDelay={perItemDelay}
                onClick={() => isMobile && setIsOpen?.(false)}
              />
            </Permission>

            <SidebarItem
              icon={<FaUserTie />}
              label="Usuarios"
              href="/admin/users"
              index={8}
              baseDelay={baseDelay}
              perItemDelay={perItemDelay}
              onClick={() => isMobile && setIsOpen?.(false)}
            />
            <SidebarItem
              icon={<IoMdSettings />}
              label="Roles y permisos"
              href="/admin/permissions"
              index={8}
              baseDelay={baseDelay}
              perItemDelay={perItemDelay}
              onClick={() => isMobile && setIsOpen?.(false)}
            />
            <SidebarItem
              icon={<RiAlertFill />}
              label="Emergencias"
              href="/admin/emergencies"
              index={9}
              baseDelay={baseDelay}
              perItemDelay={perItemDelay}
              onClick={() => isMobile && setIsOpen?.(false)}
            />
            <SidebarItem
              icon={<FaUsers />}
              label="Trabajadores"
              href="/admin/workers"
              index={10}
              baseDelay={baseDelay}
              perItemDelay={perItemDelay}
              onClick={() => isMobile && setIsOpen?.(false)}
            />

            <Permission user={user} permission="payroll.view">
              <SidebarItem
                icon={<FaMoneyBillWave />}
                label="Planillas"
                href="/admin/payrolls"
                index={11}
                baseDelay={baseDelay}
                perItemDelay={perItemDelay}
                onClick={() => isMobile && setIsOpen?.(false)}
              />
            </Permission>

            <Permission user={user} permission="evaluations.view">
              <SidebarItem
                icon={<FaClipboardCheck />}
                label="Eval. mensuales"
                href="/admin/worker-monthly-evaluations"
                index={11}
                baseDelay={baseDelay}
                perItemDelay={perItemDelay}
                onClick={() => isMobile && setIsOpen?.(false)}
              />
            </Permission>

            <Permission user={user} permission="documents.view">
              <SidebarItem
                icon={<FaCalendarCheck />}
                label="Vencimientos"
                href="/admin/document-expirations"
                index={12}
                baseDelay={baseDelay}
                perItemDelay={perItemDelay}
                onClick={() => isMobile && setIsOpen?.(false)}
              />
            </Permission>
          </div>

          <div className="flex flex-col border-t border-gray-300 py-4 px-4">
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.3,
                delay: baseDelay + 10 * perItemDelay,
              }}
              className="flex items-center gap-3 p-2 rounded-lg bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
              onClick={() => setIsUserMenuOpen((v) => !v)}
            >
              <div className="flex items-center justify-center border-2 border-[#0047a3] rounded-full size-10 overflow-hidden flex-shrink-0">
                <img
                  src="/buho-gava.webp"
                  alt="Avatar"
                  className="size-10 object-cover"
                />
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-gray-700 font-semibold text-xs truncate">
                  {currentUser?.name} {currentUser?.lastName}
                </span>
                <span className="text-[#0047a3] text-2xs font-bold uppercase">
                  {currentUser?.userType}
                </span>
              </div>
              <NotificationBell />
            </motion.div>

            <AnimatePresence initial={false}>
              {isUserMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden mt-2"
                >
                  <SidebarItem
                    icon={<IoMdSettings />}
                    label="Configuracion"
                    onClick={() => {
                      setIsUserSettingsOpen(true);
                      setIsUserMenuOpen(false);
                      if (isMobile) setIsOpen?.(false);
                    }}
                    index={0}
                    baseDelay={0}
                    perItemDelay={0}
                  />
                  <SidebarItem
                    icon={<IoLogOut />}
                    label={loggingOut ? "Saliendo..." : "Salir"}
                    onClick={handleLogout}
                    index={0}
                    baseDelay={0}
                    perItemDelay={0}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </section>
      <UserSettingsModal
        open={isUserSettingsOpen}
        user={currentUser ?? null}
        onClose={() => setIsUserSettingsOpen(false)}
        onUpdated={(updated) => {
          setCurrentUser(updated);
          refetch();
        }}
      />
    </>
  );
}
