import { IoIosCloseCircle } from "react-icons/io";
import HeaderModal from "./HeaderModal";
import ContentModal from "./ContentModal";

interface ModalElementsProps {
  typeElement: string;
  isOpen?: boolean;
  onClose: () => void;
}

export default function ModalElements({ typeElement, isOpen, onClose }: ModalElementsProps) {

  if (!isOpen) return null;

  let title = "";

  switch (typeElement) {
    case "security":
      title = "Elementos de Seguridad";
      break;
    case "operative":
      title = "Elementos Operativos";
      break;
    default:
      title = "Elementos";
  }

  return (



    <div className="absolute flex items-center justify-center top-0 left-0 w-full h-full bg-[rgba(0,0,0,0.3)] z-20 p-4">
      <div className="relative bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
        <div className="absolute top-3 right-3 cursor-pointer text-[#d80027] hover:text-gray-800" onClick={onClose}>
          <IoIosCloseCircle size={24} />
        </div>
        <h1 className="text-2xl text-gray-800 font-bold mb-4">{title}</h1>
        <HeaderModal />
        <ContentModal typeElement={typeElement} />
      </div>
    </div>
  );
} 