import { useNavigate } from "react-router-dom";
import { ReturnButton } from "../../../common/button";
import { ButtonContainer } from "../../../common/form";

export default function HeaderActions() {
  const navigate = useNavigate();

  return (
    <div className="flex items-center gap-3">
      <ButtonContainer>
        <ReturnButton onClick={() => navigate("/admin/projects")} />
      </ButtonContainer>
    </div>
  );
}
