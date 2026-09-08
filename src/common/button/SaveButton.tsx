import { LoaderCircle as AiOutlineLoading, Save as FaSave } from "lucide-react";
import { Button } from "../../components";
import { useModuleAction } from "../../permissions/AccessProvider";

interface SaveButtonProps {
  loading: boolean;
  permission?: string;
  ownProfile?: boolean;
}

export default function SaveButton({
  loading,
  permission,
  ownProfile = false,
}: SaveButtonProps) {
  const allowed = useModuleAction("manage", permission);
  if (!allowed && !ownProfile) return null;
  return (
    <Button
      icon={
        loading ? <AiOutlineLoading className="animate-spin" /> : <FaSave />
      }
      label={loading ? "Guardando..." : "Guardar"}
      type="submit"
      disabled={loading}
      bgColor="#0047a3"
      bgHoverColor="#003366"
    />
  );
}
