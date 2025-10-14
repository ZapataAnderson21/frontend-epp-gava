import { useEffect, useState } from "react";
import { ButtonContainer } from "../../../common/form";
import { Button } from "../../../components";
import { FaArrowLeft, FaPencil } from "react-icons/fa6";

export default function HeaderActions({ projectId }: { projectId: string }) {

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const [permission, setPermission] = useState(false);

  useEffect(() => {
    if (!user) return;

    if (["GERENTE", "ADMINISTRADORA", "SISTEMAS"].includes(user.userType)) {
      setPermission(true);
    }
  }, [user]);

  if (!user) {
    return <div className="text-red-500">Iniciar sesión.</div>;
  }

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
        { permission &&
          <Button
          icon={<FaPencil />}
          label="Editar"
          href={`/admin/projects/edit/${projectId}`}
          onClick={() => {}}
          bgColor="#1d293d"
          bgHoverColor="#000000"
        />
        }
      </ButtonContainer>
    </div>
  );
}
