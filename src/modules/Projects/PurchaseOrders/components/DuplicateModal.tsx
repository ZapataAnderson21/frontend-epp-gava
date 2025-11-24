import { useState } from "react";
import { SelectForm } from "../../../../common/form";
import { Button } from "../../../../components";
import { FaArrowLeft, FaRegCopy } from "react-icons/fa6";
import { projectApi } from "../../../../data/apiUrl";
import type { Project } from "../../../../data/types";
import { useFetch } from "../../../../hooks";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (projectId: number) => void;
  isLoading?: boolean;
}

export default function DuplicateModal({ isOpen, onClose, onSubmit, isLoading }: Props) {
  const [projectId, setProjectId] = useState<number>(0);
  const [error, setError] = useState<string>("");
  const { data: projects } = useFetch<Project[]>(`${projectApi}status/active`, []);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (projectId === 0) {
      setError("El ID del proyecto es requerido");
      return;
    }

    const id = Number(projectId);
    if (isNaN(id) || id <= 0) {
      setError("El ID del proyecto debe ser un número válido");
      return;
    }

    setError("");
    onSubmit(id);
  };

  const handleClose = () => {
    setProjectId(0);
    setError("");
    onClose();
  };

  if (!isOpen) return null;

  if (!projects) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(0,0,0,0.5)]">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Duplicar Orden de Compra</h2>
        
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <SelectForm
            label="Proyecto"
            name="projectId"
            value={projectId}
            onChange={(value) => setProjectId(Number(value))}
            options={[
              ...projects.map((project) => ({
                value: project.projectId,
                label: project.name,
              })),
            ]}
            error={Boolean(error)}
          />

          <div className="flex gap-2 justify-end">
            <Button
              icon={<FaArrowLeft />}
              type="button"
              label="Cancelar"
              bgColor="oklch(57.7% 0.245 27.325)"
              bgHoverColor="oklch(50.5% 0.213 27.518)"
              onClick={handleClose}
            />
            <Button
              icon={<FaRegCopy />}
              label="Duplicar"
              bgColor="#9f7aea"
              bgHoverColor="#7c3aed"
              type="submit"
              disabled={isLoading}
            />
          </div>
        </form>
      </div>
    </div>
  );
}
