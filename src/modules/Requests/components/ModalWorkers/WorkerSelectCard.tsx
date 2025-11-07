import { useState } from "react";
import SelectCard from "../SelectCard"; 
import ModalWorkers from "./ModalWorkers";
import type { Worker, RequestWorker } from "../../../../data/types";

interface RequestTypeCardProps {
  icon: React.ReactNode;
  title: string;
  workerType: string;
  onSelected: (workers: Worker[], reqs: RequestWorker[]) => void;
}

export default function WorkerSelectCard({ icon, title, workerType, onSelected }: RequestTypeCardProps) {

  const [isOpen, setIsOpen] = useState(false);

  const handleClick = () => {
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  return (
    <>
      <SelectCard icon={icon} title={title} onClick={handleClick} />
      <ModalWorkers title={title} workerType={workerType} isOpen={isOpen} onSelected={onSelected} onClose={handleClose} />
    </>
  );
}
