import { Button } from "../../components";
import { Plus as FaPlus } from "lucide-react";

interface AddButtonProps {
  onClick?: () => void;
}

export default function AddButton({ onClick }: AddButtonProps) {
  return (
    <Button
      icon={<FaPlus />}
      label="Añadir"
      type="button"
      bgColor="#0047a3" 
      bgHoverColor="#003366"
      onClick={onClick}
    />
  )
}
