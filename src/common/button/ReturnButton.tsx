import { ArrowLeft as FaArrowLeft } from "lucide-react";
import { Button } from "../../components";

interface ReturnButtonProps {
  onClick: () => void;
  disabled?: boolean;
}

export default function ReturnButton({ onClick, disabled }: ReturnButtonProps) {
  return (
    <Button
      icon={<FaArrowLeft />}
      label="Regresar"
      onClick={onClick}
      bgColor="oklch(57.7% 0.245 27.325)"
      bgHoverColor="oklch(50.5% 0.213 27.518)"
      type="button"
      disabled={disabled}
    />
  );
}
