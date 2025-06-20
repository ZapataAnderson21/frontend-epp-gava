import { useState } from "react";
import { IoIosCloseCircle } from "react-icons/io";
import { IoTriangleSharp } from "react-icons/io5";

export default function Info() {

  const [isOpen, setIsOpen] = useState(true);

  const handleClose = () => {
    setIsOpen(false);
  };

  return (
    <div className={`${isOpen ? "absolute" : "hidden"} bottom-4 right-4`}>
      <div className="relative flex w-32">
        <div className="absolute bg-[#eaa630] rounded-xl top-[-64px] left-[-240px] text-white text-[14px] p-2 flex items-center"> 
          <span className="flex flex-row items-start px-3 py-2 justify-center w-60 z-10">
            Recuerda que si el requerimiento es para mañana, la hora límite para registrarlo es hasta la 1:00 PM. 
          </span>
          <IoTriangleSharp className=" absolute text-[#eaa630] size-24 bottom-[-20px] rotate-25 right-0" />
        </div>
        <button onClick={handleClose} className="absolute top-1 right-1 cursor-pointer text-[#d80027] hover:text-[#c80008] hover:scale-105">
           <IoIosCloseCircle size={20} />
        </button>
        <img src="/buho-gava.webp" alt="Búho GAVA" className="w-full" />
      </div>
    </div>
  );
}