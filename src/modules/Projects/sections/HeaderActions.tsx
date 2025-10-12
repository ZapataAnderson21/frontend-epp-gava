import { ButtonContainer } from "../../../common/form";
import { Button } from "../../../components";
import { FaArrowLeft, FaPencil } from "react-icons/fa6";

export default function HeaderActions({ projectId }: { projectId: string }) {
  return (
    <div className="flex items-center gap-3">
      <ButtonContainer>
        <Button
          icon={<FaArrowLeft />}
          label="Regresar"
          href="/admin/projects"
          onClick={() => {}}
          bgColor="#FF0000"
          bgHoverColor="#CC0000"
        />
        <Button
          icon={<FaPencil />}
          label="Editar"
          href={`/admin/projects/edit/${projectId}`}
          onClick={() => {}}
          bgColor="#2563EB"
          bgHoverColor="#1D4ED8"
        />
      </ButtonContainer>
    </div>
  );
}
