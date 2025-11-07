import ModalSelect from "../ModalSelect";
import ContentWorkersModal from "./ContentWorkersModal";
import type { Worker, RequestWorker } from "../../../../data/types";

interface ModalElementsProps {
  title: string;
  workerType: string;
  isOpen?: boolean;
  onSelected: (workers: Worker[], reqs: RequestWorker[]) => void;
  onClose: () => void;
}

export default function ModalWorkers({ title, workerType, isOpen, onSelected, onClose }: ModalElementsProps) {

  if (!isOpen) return null;

  return (
    <ModalSelect title={title} isOpen={isOpen} onClose={onClose}>
      <ContentWorkersModal workerType={workerType} onSelected={onSelected} onClose={onClose} />
    </ModalSelect>
  );
} 