import { Plus as FaPlus } from "lucide-react";
import { Button } from "../../components";
import { useModuleAction } from "../../permissions/AccessProvider";

interface AddButtonProps {
  onClick?: () => void;
  permission?: string;
}

export default function AddButton({ onClick, permission }: AddButtonProps) {
  const allowed = useModuleAction("manage", permission);
  if (!allowed) return null;
  return (
    <Button
      icon={<FaPlus />}
      label="Añadir"
      type="button"
      bgColor="#0047a3"
      bgHoverColor="#003366"
      onClick={onClick}
    />
  );
}
