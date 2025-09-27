import { useEffect, useState } from "react";
import Header from "./Header";
import Sidebar from "./Sidebar";
import { Outlet } from "react-router-dom";
import Play from "../icons/Play";
import Unauthenticated from "./Unauthenticated";
import { useApiAction } from "../hooks/useApiAction";
import { userApi } from "../data/apiUrl";

export default function Home() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [unauthenticated, setUnauthenticated] = useState(false);

  const accessToken = localStorage.getItem("accessToken");
  const { execute } = useApiAction<boolean>();

  const toggleSidebar = () => {
    setIsOpen((prev) => !prev);
  };

  useEffect(() => {
    (async () => {
      if (!accessToken) {
        setUnauthenticated(true);
        return;
      }

      try {
        const result = await execute(`${userApi}validateToken`, "POST", { accessToken });

        // Si el token está en blacklist, backend devuelve true → no autenticado
        if (result.data === true) {
          setUnauthenticated(true);
        } else {
          setUnauthenticated(false);
        }
      } catch (err) {
        console.error("Error validating token:", err);
        setUnauthenticated(true);
      }
    })();
  }, [accessToken]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    handleResize();

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <>
      {unauthenticated ? (
        <div className="flex flex-col items-center justify-center w-full h-screen">
          <Unauthenticated />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] w-full">
          {isMobile && (
            <Sidebar isOpen={isOpen} isMobile={isMobile} setIsOpen={setIsOpen} />
          )}

          {isMobile && (
            <div
              className={`absolute top-80 
                        ${isOpen ? "left-[188px] rounded-tl-md rounded-bl-md" : "left-0 rounded-tr-md rounded-br-md"} z-40 flex items-center justify-center bg-[#0047a3] w-8 h-10 text-white text-4xl cursor-pointer transition-all duration-300`}
              onClick={toggleSidebar}
            >
              {isOpen ? (
                <div className="rotate-180">
                  <Play />
                </div>
              ) : (
                <Play />
              )}
            </div>
          )}
          <div
            className={`col-span-2 w-full ${(isOpen && isMobile) && "blur-[1px]"} 
                        transition-all duration-300 ease-in-out ${!isMobile ? "md:pl-[220px]" : ""}`}
          >
            {!isMobile && (
              <Sidebar isOpen={isOpen} isMobile={isMobile} setIsOpen={setIsOpen} />
            )}
            <Header />
            <Outlet />
          </div>
        </div>
      )}
    </>
  );
}
