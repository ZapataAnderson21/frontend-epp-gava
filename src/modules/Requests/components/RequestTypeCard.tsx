import { useState } from "react";
import ModalElements from "./ModalElements/ModalElements";

interface RequestTypeCardProps {
  icon: React.ReactNode;
  title: string;
  typeElement: string;
}

export default function RequestTypeCard({ icon, title, typeElement }: RequestTypeCardProps) {
  
  const [isOpen, setIsOpen] = useState(false);

  const handleClick = () => {
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  return (
    <>
      <div className="border p-8 rounded-md shadow-md flex flex-col items-center 
                    bg-[#f5f7ff] justify-center gap-2 cursor-pointer hover:shadow-lg hover:scale-105 
                    transition-shadow duration-200 hover:text-[#0047a3]" onClick={handleClick}>
        {icon}
        <h3 className="text-lg font-semibold">{title}</h3>
      </div>
      <ModalElements typeElement={typeElement} isOpen={isOpen} onClose={handleClose} />
    </>
  );
}
