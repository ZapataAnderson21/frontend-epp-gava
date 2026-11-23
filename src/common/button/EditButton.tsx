import { Pencil as FaPencil } from "lucide-react";
import ActionButton from "../../components/ActionButton";
import { useModuleAction } from "../../permissions/AccessProvider";

interface EditButtonProps {
  onClick: () => void;
  disabled?: boolean;
  permission?: string;
  label?: string;
}

export default function EditButton({
  onClick,
  disabled,
  permission,
  label = "Editar",
}: EditButtonProps) {
  const allowed = useModuleAction("manage", permission);
  if (!allowed) return null;
  return (
    <ActionButton
      icon={<FaPencil />}
      label={label}
      onClick={onClick}
      disabled={disabled}
      variant="ghost"
    />
  );
}
