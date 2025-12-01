import { useNavigate } from "react-router-dom";
import { ReturnButton } from "../../../common/button";
import { ButtonContainer } from "../../../common/form";
import { FaPencil } from "react-icons/fa6";
import { Button } from "../../../components";

interface HeaderActionsProps {
  projectId: number
}

export default function HeaderActions({projectId}: HeaderActionsProps) {
  const navigate = useNavigate();

  return (
    <div className="flex items-center gap-3">
      <ButtonContainer>
        <ReturnButton onClick={() => navigate("/admin/projects")} />
        <Button
          icon={<FaPencil />}
          label="Editar"
          onClick={() => navigate(`/admin/projects/edit/${projectId}`)}
          bgColor="#fbbf24"
          bgHoverColor="#f59e0b"
          type="button"
        />
      </ButtonContainer>
    </div>
  );
}
