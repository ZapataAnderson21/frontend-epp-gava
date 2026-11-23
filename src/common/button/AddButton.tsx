import { Plus as FaPlus } from "lucide-react";
import { Button } from "../../components";
import { useModuleAction } from "../../permissions/AccessProvider";

interface AddButtonProps {
  onClick?: () => void;
  permission?: string;
  label?: string;
}

export default function AddButton({
  onClick,
  permission,
  label = "Añadir",
}: AddButtonProps) {
  const allowed = useModuleAction("manage", permission);
  if (!allowed) return null;
  return (
    <Button
      icon={<FaPlus />}
      label={label}
      type="button"
      bgColor="#0047a3"
      bgHoverColor="#003366"
      onClick={onClick}
    />
  );
}
