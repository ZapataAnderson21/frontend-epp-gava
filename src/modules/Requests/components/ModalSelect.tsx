import { CircleX as IoIosCloseCircle } from "lucide-react";

interface ModalElementsProps {
  title: string;
  isOpen?: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export default function ModalSelect({ title, isOpen, onClose, children }: ModalElementsProps) {

  if (!isOpen) return null;

  return (
    <div className="fixed flex items-center justify-center top-0 left-0 w-full h-full bg-[rgba(0,0,0,0.3)] z-20 p-4">
      <div className="relative bg-white rounded-lg shadow-lg p-6 w-full max-w-5xl">
        <div className="absolute top-3 right-3 cursor-pointer text-[#d80027] hover:text-gray-800" onClick={onClose}>
          <IoIosCloseCircle size={24} />
        </div>
        <h1 className="text-xl text-gray-800 font-bold mb-4 px-3">{title}</h1>
        {children}
      </div>
    </div>
  );
} 