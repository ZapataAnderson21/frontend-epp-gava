import { ButtonContainer } from "../../../common/form";
import { Button } from "../../../components";
import { FaArrowLeft, FaPencil } from "react-icons/fa6";

export default function HeaderActions() {

  return (
    <div className="flex items-center gap-3">
      <ButtonContainer>
        <Button
          icon={<FaArrowLeft />}
          label="Regresar"
          href="/admin/projects"
          onClick={() => {}}
          bgColor = "#d80027"
          bgHoverColor = "#c80008"
        />
      </ButtonContainer>
    </div>
  );
}
