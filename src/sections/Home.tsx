import { useEffect, useState } from "react";
import Header from "./Header";
import Sidebar from "./Sidebar";
import { Outlet } from "react-router-dom";
import { IoMenu } from "react-icons/io5";

export default function Home() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const toggleSidebar = () => {
    setIsOpen((prev) => !prev);
  };

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
      <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] w-full">
        {isMobile && (
          <Sidebar isOpen={isOpen} isMobile={isMobile} setIsOpen={setIsOpen} />
        )}

        {isMobile && (
          <div
            className={`fixed top-22
                      ${isOpen ? "left-[180px] rounded-tl-md rounded-bl-md" : "left-0 rounded-tr-md rounded-br-md"} z-40 flex items-center justify-center bg-[#0047a3] size-10 text-white text-2xl cursor-pointer transition-all duration-300`}
            onClick={toggleSidebar}
          >
            <IoMenu />
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
    </>
  );
}
