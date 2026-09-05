import { useEffect, useRef, useState } from "react";
import Sidebar from "./Sidebar";
import { Outlet } from "react-router-dom";
import { PanelLeftOpen } from "lucide-react";

const SIDEBAR_PREFERENCE_KEY = "sir-gava:sidebar-collapsed";
const MOBILE_QUERY = "(max-width: 767px)";

export default function Home() {
  const [isMobile, setIsMobile] = useState(
    () => window.matchMedia(MOBILE_QUERY).matches,
  );
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isDesktopCollapsed, setIsDesktopCollapsed] = useState(() => {
    try {
      return localStorage.getItem(SIDEBAR_PREFERENCE_KEY) === "true";
    } catch {
      return false;
    }
  });
  const openButtonRef = useRef<HTMLButtonElement>(null);
  const isOpen = isMobile ? isMobileOpen : !isDesktopCollapsed;

  const setIsOpen = (open: boolean) => {
    if (isMobile) setIsMobileOpen(open);
    else setIsDesktopCollapsed(!open);
  };

  useEffect(() => {
    const mediaQuery = window.matchMedia(MOBILE_QUERY);
    const handleResize = (event: MediaQueryListEvent) => {
      setIsMobile(event.matches);
      setIsMobileOpen(false);
    };
    mediaQuery.addEventListener("change", handleResize);
    return () => mediaQuery.removeEventListener("change", handleResize);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_PREFERENCE_KEY, String(isDesktopCollapsed));
    } catch {
      // The control still works when browser storage is unavailable.
    }
  }, [isDesktopCollapsed]);

  useEffect(() => {
    if (!isMobile || !isMobileOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMobileOpen(false);
        requestAnimationFrame(() =>
          openButtonRef.current?.focus({ preventScroll: true }),
        );
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isMobile, isMobileOpen]);

  const closeSidebar = () => {
    setIsOpen(false);
    requestAnimationFrame(() =>
      openButtonRef.current?.focus({ preventScroll: true }),
    );
  };

  return (
    <>
      {isMobile && isOpen && (
        <button
          type="button"
          aria-label="Cerrar menú lateral"
          tabIndex={-1}
          className="fixed inset-0 z-20 cursor-pointer bg-black/20"
          onClick={closeSidebar}
        />
      )}
      <Sidebar
        isOpen={isOpen}
        isMobile={isMobile}
        setIsOpen={setIsOpen}
        onClose={closeSidebar}
      />
      <div
        inert={isMobile && isOpen}
        className={`min-w-0 w-full transition-[padding-left] duration-300 ease-in-out motion-reduce:transition-none ${
          !isMobile && isOpen ? "pl-[260px]" : "pl-0"
        }`}
      >
        {!isOpen && (
          <div className="sticky top-0 z-10 flex items-center bg-white px-4 py-2">
            <button
              ref={openButtonRef}
              type="button"
              aria-label="Abrir menú lateral"
              aria-controls="app-sidebar"
              aria-expanded={false}
              title="Abrir menú lateral"
              onClick={() => {
                setIsOpen(true);
                requestAnimationFrame(() =>
                  document.getElementById("sidebar-close-button")?.focus({ preventScroll: true }),
                );
              }}
              className="inline-flex size-10 cursor-pointer items-center justify-center rounded-lg border border-gray-200 bg-white text-[#0047a3] shadow-sm transition-colors hover:bg-[#eff5ff] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0047a3]"
            >
              <PanelLeftOpen className="size-5" aria-hidden="true" />
            </button>
          </div>
        )}
        <Outlet />
      </div>
    </>
  );
}
