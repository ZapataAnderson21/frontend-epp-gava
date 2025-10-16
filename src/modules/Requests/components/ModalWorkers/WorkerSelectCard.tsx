import { useState } from "react";
import SelectCard from "../SelectCard"; 
import ModalWorkers from "./ModalWorkers";
import type { Worker, RequestWorker } from "../../../../data/types";

interface RequestTypeCardProps {
  icon: React.ReactNode;
  title: string;
  groupId: number;
  onSelected: (workers: Worker[], reqs: RequestWorker[]) => void;
}

export default function WorkerSelectCard({ icon, title, groupId, onSelected }: RequestTypeCardProps) {

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
      <ModalWorkers title={title} groupId={groupId} isOpen={isOpen} onSelected={onSelected} onClose={handleClose} />
    </>
  );
}
