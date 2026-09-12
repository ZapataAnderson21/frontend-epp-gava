import {
  LoaderCircle as CgSpinner,
  FileSpreadsheet as FaFileExcel,
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AddButton } from "../../common/button";
import { HeaderPanel, Panel } from "../../common/panel";
import { Button } from "../../components";
import ResourceTable from "./ResourceTable";

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
          const response = await fetch(`${resourceApi}export/excel`, {
            credentials: "include",
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
      <HeaderPanel name={`RECURSOS`}>
        <Button
          permission="resources.export"
          icon={
            exporting ? <CgSpinner className="animate-spin" /> : <FaFileExcel />
          }
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
