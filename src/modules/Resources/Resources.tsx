import { HeaderPanel, Panel } from "../../common/panel";
import ResourceTable from "./ResourceTable";
import { useNavigate } from "react-router-dom";
import { AddButton } from "../../common/button";
import { Button } from "../../components";
import { useState } from "react";
import { CgSpinner } from "react-icons/cg";
import { FaFileExcel } from "react-icons/fa6";
import toast, { Toaster } from "react-hot-toast";
import { resourceApi } from "../../data/apiUrl";

export default function Resources() {
  const navigate = useNavigate();
  const [exporting, setExporting] = useState(false);

  const handleExportExcel = async () => {
    setExporting(true);
    try {
      await toast.promise(
        (async () => {
          const token = localStorage.getItem("accessToken");
          const response = await fetch(`${resourceApi}export/excel`, {
            headers: { Authorization: `Bearer ${token}` },
          });

          if (!response.ok) {
            throw new Error("No se pudo generar el Excel de recursos.");
          }

          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.download = "recursos_ordenes_compra.xlsx";
          document.body.appendChild(link);
          link.click();
          link.remove();
          window.URL.revokeObjectURL(url);
        })(),
        {
          loading: "Generando Excel...",
          success: "Excel descargado exitosamente.",
          error: (error) => error.message || "No se pudo generar el Excel.",
        },
      );
    } finally {
      setExporting(false);
    }
  };

  return (
    <Panel>
      <Toaster position="top-center" />
      <HeaderPanel name={`RECURSOS`} >
        <Button
          icon={exporting ? <CgSpinner className="animate-spin" /> : <FaFileExcel />}
          label={exporting ? "Exportando..." : "Exportar"}
          onClick={handleExportExcel}
          bgColor="#008080"
          bgHoverColor="#006666"
          type="button"
          disabled={exporting}
        />
        <AddButton onClick={() => navigate("/admin/resources/new")} />
      </HeaderPanel>

      <ResourceTable />

    </Panel>
  );
}
