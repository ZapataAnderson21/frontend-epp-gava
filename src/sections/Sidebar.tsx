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
  ShoppingCart as FaShoppingCart,
  UsersRound as FaUserGroup,
  UserRoundCog as FaUserTie,
  Users as FaUsers,
  LogOut as IoLogOut,
  Settings as IoMdSettings,
  PanelLeftClose,
  ShieldCheck,
  FolderOpen as FaFolderOpen,
  BriefcaseBusiness as FaBriefcase,
  KeyRound as FaKeyRound,
} from "lucide-react";

import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import SidebarItem from "./SidebarItem";

import { AnimatePresence, motion } from "framer-motion";
import Permission from "../common/auth/Permission";
import { NotificationBell } from "../components";
import { userApi } from "../data/apiUrl";
import { useCurrentUser } from "../hooks";
import { useApiAction } from "../hooks/useApiAction";

import UserSettingsModal from "./UserSettingsModal";
import { useAccess } from "../permissions/AccessProvider";

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
  const { can } = useAccess();
  const { pathname } = useLocation();

  const accessesRouteActive =
    pathname.startsWith("/admin/users") ||
    pathname.startsWith("/admin/permissions");

  const [isAccessesOpen, setIsAccessesOpen] = useState(accessesRouteActive);

  const canViewAccesses = can("users.view") || can("roles.view");

  const commercialRouteActive =
    pathname.startsWith("/admin/quotations") ||
    pathname.startsWith("/admin/clients");

  const [isCommercialOpen, setIsCommercialOpen] = useState(commercialRouteActive);

  const canViewCommercial = can("quotations.view") || can("clients.view");

  const ssomaDocumentsRouteActive =
    pathname === "/admin/ssoma" ||
    pathname.startsWith("/admin/ssoma/");

  const ssomaRouteActive =
    pathname === "/admin/ssoma-resources" ||
    pathname.startsWith("/admin/ssoma-resources/") ||
    pathname.startsWith("/admin/requests") ||
    ssomaDocumentsRouteActive ||
    pathname.startsWith("/admin/worker-monthly-evaluations");

  const [isSsomaOpen, setIsSsomaOpen] =
    useState(ssomaRouteActive);

  const [isSsomaDocumentsOpen, setIsSsomaDocumentsOpen] =
    useState(ssomaDocumentsRouteActive);

  const canViewSsomaResources = can("inventory.view");
  const canViewSsomaRequests = can("requests.view");
  const canViewWorkClothing = can("workClothing.view");
  const canViewSsomaDocuments = can("ssoma.view") || canViewWorkClothing;
  const canViewSsomaEvaluations = can("evaluations.view");

  const canViewSsoma =
    canViewSsomaResources ||
    canViewSsomaRequests ||
    canViewSsomaDocuments ||
    canViewWorkClothing ||
    canViewSsomaEvaluations;

  const purchasesRouteActive =
    pathname.startsWith("/admin/purchase-orders") ||
    pathname.startsWith("/admin/suppliers") ||
    pathname.startsWith("/admin/resources") ||
    /\/admin\/projects\/[^/]+\/purchase-orders/.test(pathname);
  const [isPurchasesOpen, setIsPurchasesOpen] = useState(purchasesRouteActive);
  const canViewPurchases =
    can("suppliers.view") || can("resources.view") || can("orders.view");
  const payrollRouteActive =
    pathname.startsWith("/admin/payrolls") ||
    pathname.startsWith("/admin/staff-payroll") ||
    /\/admin\/projects\/[^/]+\/payrolls/.test(pathname);
  const [isPayrollOpen, setIsPayrollOpen] = useState(payrollRouteActive);
  const canViewStaffPayroll = can("staffPayroll.view") && can("finance.view");
  const canViewPayrolls = can("payroll.view") || canViewStaffPayroll;
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

  useEffect(() => {
    if (purchasesRouteActive) setIsPurchasesOpen(true);
  }, [purchasesRouteActive]);

  useEffect(() => {
   if (commercialRouteActive) {
      setIsCommercialOpen(true);
   }
  }, [commercialRouteActive]);

  useEffect(() => {
    if (ssomaRouteActive) {
      setIsSsomaOpen(true);
    }
  }, [ssomaRouteActive]);

  useEffect(() => {
    if (ssomaDocumentsRouteActive) {
      setIsSsomaDocumentsOpen(true);
    }
  }, [ssomaDocumentsRouteActive]);

  useEffect(() => {
    if (accessesRouteActive) {
     setIsAccessesOpen(true);
    }
  }, [accessesRouteActive]);

  useEffect(() => {
    if (payrollRouteActive) setIsPayrollOpen(true);
  }, [payrollRouteActive]);

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
            {canViewPurchases && (
              <div>
                <SidebarItem
                  icon={<FaShoppingCart />}
                  label="Compras"
                  isRoot
                  isOpen={isPurchasesOpen}
                  activePaths={[
                    "/admin/purchase-orders",
                    "/admin/suppliers",
                    "/admin/resources",
                    ...(/\/admin\/projects\/[^/]+\/purchase-orders/.test(
                      pathname,
                    )
                      ? [pathname]
                      : []),
                  ]}
                  ariaExpanded={isPurchasesOpen}
                  ariaControls="purchases-sidebar-menu"
                  index={3}
                  baseDelay={baseDelay}
                  perItemDelay={perItemDelay}
                  onClick={() => setIsPurchasesOpen((open) => !open)}
                />
                <AnimatePresence initial={false}>
                  {isPurchasesOpen && (
                    <motion.div
                      id="purchases-sidebar-menu"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="ml-4 overflow-hidden border-l border-gray-200 pl-2"
                    >
                      <SidebarItem
                        icon={<FaTruck />}
                        label="Proveedores"
                        href="/admin/suppliers"
                        onClick={() => isMobile && setIsOpen?.(false)}
                      />
                      <SidebarItem
                        icon={<FaBoxOpen />}
                        label="Recursos de OC"
                        href="/admin/resources"
                        onClick={() => isMobile && setIsOpen?.(false)}
                      />
                      <SidebarItem
                        icon={<FaFileLines />}
                        label="Órdenes de compra"
                        href="/admin/purchase-orders"
                        activePaths={
                          /\/admin\/projects\/[^/]+\/purchase-orders/.test(
                            pathname,
                          )
                            ? [pathname]
                            : []
                        }
                        onClick={() => isMobile && setIsOpen?.(false)}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {canViewCommercial && (
              <div>
                <SidebarItem
                  icon={<FaBriefcase />}
                  label="Negocios"
                  isRoot
                  isOpen={isCommercialOpen}
                  activePaths={[
                    "/admin/quotations",
                    "/admin/clients",
                  ]}
                  ariaExpanded={isCommercialOpen}
                  ariaControls="commercial-sidebar-menu"
                  index={5}
                  baseDelay={baseDelay}
                  perItemDelay={perItemDelay}
                  onClick={() =>
                    setIsCommercialOpen((open) => !open)
                  }
                />

                <AnimatePresence initial={false}>
                  {isCommercialOpen && (
                    <motion.div
                      id="commercial-sidebar-menu"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="ml-4 overflow-hidden border-l border-gray-200 pl-2"
                    >
                      {can("quotations.view") && (
                        <SidebarItem
                          icon={<FaFileInvoiceDollar />}
                          label="Cotizaciones"
                          href="/admin/quotations"
                          onClick={() =>
                            isMobile && setIsOpen?.(false)
                          }
                        />
                      )}

                      {can("clients.view") && (
                        <SidebarItem
                          icon={<FaUserGroup />}
                          label="Clientes"
                          href="/admin/clients"
                          onClick={() =>
                            isMobile && setIsOpen?.(false)
                          }
                        />
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            <Permission permission="inventory.view">
              <SidebarItem
                icon={<FaCubes />}
                label="Inventario"
                href="/admin/inventory"
                index={7}
                baseDelay={baseDelay}
                perItemDelay={perItemDelay}
                onClick={() => isMobile && setIsOpen?.(false)}
              />
            </Permission>

            {/* Módulo SSOMA */}
            {canViewSsoma && (
              <div>
                <SidebarItem
                  icon={<ShieldCheck />}
                  label="SSOMA"
                  isRoot
                  isOpen={isSsomaOpen}
                  activePaths={[
                    "/admin/ssoma-resources",
                    "/admin/requests",
                    "/admin/ssoma",
                    "/admin/ssoma/work-clothing",
                    "/admin/worker-monthly-evaluations",
                  ]}
                  ariaExpanded={isSsomaOpen}
                  ariaControls="ssoma-sidebar-menu"
                  index={8}
                  baseDelay={baseDelay}
                  perItemDelay={perItemDelay}
                  onClick={() => setIsSsomaOpen((open) => !open)}
                />

                <AnimatePresence initial={false}>
                  {isSsomaOpen && (
                    <motion.div
                      id="ssoma-sidebar-menu"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="ml-4 overflow-hidden border-l border-gray-200 pl-2"
                    >
                      {/* Recursos SSOMA */}
                      {canViewSsomaResources && (
                        <SidebarItem
                          icon={<FaBoxOpen />}
                          label="Recursos SSOMA"
                          href="/admin/ssoma-resources"
                          onClick={() =>
                            isMobile && setIsOpen?.(false)
                          }
                        />
                      )}

                      {/* Requerimientos */}
                      {canViewSsomaRequests && (
                        <SidebarItem
                          icon={<FaFileLines />}
                          label="Requerimientos"
                          href="/admin/requests"
                          onClick={() =>
                            isMobile && setIsOpen?.(false)
                          }
                        />
                      )}

                      {/* Documentos */}
                      {canViewSsomaDocuments && (
                        <div>
                          <SidebarItem
                            icon={<FaFolderOpen />}
                            label="Documentos"
                            isRoot
                            isOpen={isSsomaDocumentsOpen}
                            ariaExpanded={isSsomaDocumentsOpen}
                            ariaControls="ssoma-documents-menu"
                            onClick={() =>
                              setIsSsomaDocumentsOpen(
                                (open) => !open
                              )
                            }
                          />

                          <AnimatePresence initial={false}>
                            {isSsomaDocumentsOpen && (
                              <motion.div
                                id="ssoma-documents-menu"
                                initial={{ opacity: 0, height: 0 }}
                                animate={{
                                  opacity: 1,
                                  height: "auto",
                                }}
                                exit={{ opacity: 0, height: 0 }}
                                className="ml-3 overflow-hidden border-l border-gray-200 pl-2"
                              >
                                {/* Funcionalidades pendientes */}
                                <div
                                  className="flex items-center gap-2 rounded-lg px-2 py-2.5 text-xs text-gray-400"
                                  aria-label="ATS, próximamente"
                                >
                                  <FaFileLines className="size-4 shrink-0" />
                                  <span>ATS</span>
                                  <span className="ml-auto text-[10px]">
                                    Próx.
                                  </span>
                                </div>

                                {canViewWorkClothing && (
                                  <SidebarItem
                                    icon={<FaFileLines />}
                                    label="Entrega de Ropa de Trabajo"
                                    href="/admin/ssoma/work-clothing"
                                    onClick={() =>
                                      isMobile && setIsOpen?.(false)
                                    }
                                  />
                                )}

                                {/* Charlas existentes */}
                                <Permission
                                  user={user}
                                  permission="ssoma.view"
                                >
                                  <SidebarItem
                                    icon={<FaClipboardCheck />}
                                    label="Charlas"
                                    href="/admin/ssoma"
                                    onClick={() =>
                                      isMobile && setIsOpen?.(false)
                                    }
                                  />
                                </Permission>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      )}

                      {/* Evaluaciones mensuales */}
                      {canViewSsomaEvaluations && (
                        <SidebarItem
                          icon={<FaClipboardCheck />}
                          label="Evaluaciones Mensuales"
                          href="/admin/worker-monthly-evaluations"
                          onClick={() =>
                            isMobile && setIsOpen?.(false)
                          }
                        />
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
            {/* Fin módulo SSOMA */}


            <SidebarItem
              icon={<FaUsers />}
              label="Trabajadores"
              href="/admin/workers"
              index={10}
              baseDelay={baseDelay}
              perItemDelay={perItemDelay}
              onClick={() => isMobile && setIsOpen?.(false)}
            />

            {canViewPayrolls && (
              <div>
                <SidebarItem
                  icon={<FaMoneyBillWave />}
                  label="Planillas"
                  isRoot
                  isOpen={isPayrollOpen}
                  activePaths={[
                    "/admin/payrolls",
                    "/admin/staff-payroll",
                    ...(/\/admin\/projects\/[^/]+\/payrolls/.test(pathname)
                      ? [pathname]
                      : []),
                  ]}
                  ariaExpanded={isPayrollOpen}
                  ariaControls="payroll-sidebar-menu"
                  index={11}
                  baseDelay={baseDelay}
                  perItemDelay={perItemDelay}
                  onClick={() => setIsPayrollOpen((open) => !open)}
                />
                <AnimatePresence initial={false}>
                  {isPayrollOpen && (
                    <motion.div
                      id="payroll-sidebar-menu"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="ml-4 overflow-hidden border-l border-gray-200 pl-2"
                    >
                      {can("payroll.view") && (
                        <SidebarItem
                          icon={<FaCalendarCheck />}
                          label="Semanales — Técnicos y Obreros"
                          href="/admin/payrolls"
                          activePaths={
                            /\/admin\/projects\/[^/]+\/payrolls/.test(pathname)
                              ? [pathname]
                              : []
                          }
                          onClick={() => isMobile && setIsOpen?.(false)}
                        />
                      )}
                      {canViewStaffPayroll && (
                        <SidebarItem
                          icon={<FaUserTie />}
                          label="Mensuales — STAFF"
                          href="/admin/staff-payroll"
                          onClick={() => isMobile && setIsOpen?.(false)}
                        />
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

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
            {/* Módulo Accesos */}
            {canViewAccesses && (
              <div>
                <SidebarItem
                  icon={<FaKeyRound />}
                  label="Accesos"
                  isRoot
                  isOpen={isAccessesOpen}
                  activePaths={[
                    "/admin/users",
                    "/admin/permissions",
                  ]}
                  ariaExpanded={isAccessesOpen}
                  ariaControls="accesses-sidebar-menu"
                  index={8}
                  baseDelay={baseDelay}
                  perItemDelay={perItemDelay}
                  onClick={() =>
                    setIsAccessesOpen((open) => !open)
                  }
                />

                <AnimatePresence initial={false}>
                  {isAccessesOpen && (
                    <motion.div
                      id="accesses-sidebar-menu"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="ml-4 overflow-hidden border-l border-gray-200 pl-2"
                    >
                      {can("users.view") && (
                        <SidebarItem
                          icon={<FaUsers />}
                          label="Usuarios"
                          href="/admin/users"
                          onClick={() =>
                            isMobile && setIsOpen?.(false)
                          }
                        />
                      )}

                      {can("roles.view") && (
                        <SidebarItem
                          icon={<IoMdSettings />}
                          label="Roles y permisos"
                          href="/admin/permissions"
                          onClick={() =>
                            isMobile && setIsOpen?.(false)
                          }
                        />
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
            {/* Fin módulo Accesos */}
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
