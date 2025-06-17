import { useEffect, useState } from "react";
import Header from "./Header";
import Sidebar from "./Sidebar";
import { Outlet } from "react-router-dom";
import Play  from "../icons/Play";

export default function Home() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const toggleSidebar = () => {
    setIsOpen(prev => !prev);
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
    <div className={`relative grid grid-cols-1 grid-rows-[auto_1fr] w-full min-h-screen`}>
      
      <Header />

      <section className={`relative col-span-1 row-span-1 w-full h-full`}>
        
        {isMobile && (
          <div
            className={`absolute top-[40%] ${isOpen ? "left-[168px] rounded-tl-md rounded-bl-md" : "left-0 rounded-tr-md rounded-br-md"} z-20 flex items-center justify-center bg-[#0047a3] w-8 h-10 text-white text-4xl cursor-pointer transition-all duration-300`}
            onClick={toggleSidebar}
          >
            {isOpen ? <div className="rotate-180" ><Play /></div> : <Play />}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] w-full h-full">
          
          <Sidebar isOpen={isOpen} isMobile={isMobile} />

          <div className={`col-span-1 w-full ${(isOpen && isMobile) && "blur-[1px]"} transition-all duration-300 ease-in-out`}>
            <Outlet />
          </div>
        </div>
      </section>
    </div>
  );
}
