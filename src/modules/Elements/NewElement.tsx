import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { elementApi } from "../../data/apiUrl";
import { useApiAction } from "../../hooks";
import { ReturnButton, SaveButton } from "../../common/button";
import {
  ButtonContainer,
  Form,
  InputForm,
  SelectForm,
  TextAreaForm,
} from "../../common/form";
import toast, { Toaster } from "react-hot-toast";
import type { InventoryFamilyKey } from "./inventoryCatalog";
import {
  getInventoryBackendPayload,
  getInventoryCodeRequirementLabel,
  getInventoryFamilyConfig,
  getInventoryFamilyLabel,
  resolveInventoryRouteFamily,
} from "./inventoryCatalog";

interface ElementResponse {
  name: string;
  type: string;
  description: string;
  code?: string | null;
  categoryName?: string | null;
  controlType?: string;
}

export default function NewEpp() {
  const searchParams = new URLSearchParams(window.location.search);
  const familyRoot = resolveInventoryRouteFamily(searchParams.get("family") || searchParams.get("type"));
  const initialFamily: InventoryFamilyKey = familyRoot === "all" || familyRoot === "operative"
    ? "epp"
    : familyRoot;

  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [categoryName, setCategoryName] = useState("");
  const [description, setDescription] = useState("");
  const [family, setFamily] = useState<InventoryFamilyKey>(initialFamily);

  const navigate = useNavigate();
  const { execute, loading } = useApiAction<ElementResponse>();

  const familyConfig = getInventoryFamilyConfig(family);

  const navigateToElements = () => {
    navigate(`/admin/inventory/${family}`);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (familyConfig?.requiresCode && !code.trim()) {
      toast.error("El codigo es obligatorio para ESE y EM.");
      return;
    }

    const backendPayload = getInventoryBackendPayload(family);
    const elementData = {
      name,
      type: backendPayload.type,
      family: backendPayload.family,
      description,
      code: code.trim() || null,
      categoryName: categoryName.trim() || null,
      controlType: backendPayload.controlType,
    };

    toast.promise(execute(elementApi, "POST", elementData), {
      loading: "Creando item de inventario...",
      success: (result) => {
        setTimeout(() => navigateToElements(), 1200);
        return result.message || "Item creado con exito";
      },
      error: (err) => err.message || "Error al crear el item",
    });
  };

  return (
    <>
      <Toaster position="top-center" reverseOrder={false} />
      <Form name="REGISTRAR ITEM DE INVENTARIO" handleSubmit={handleSubmit}>
        <InputForm
          label="Nombre"
          name="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          optional={false}
        />

        <InputForm
          label="Codigo"
          name="code"
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          optional={!familyConfig?.requiresCode}
        />

        <InputForm
          label="Categoria"
          name="categoryName"
          type="text"
          value={categoryName}
          onChange={(e) => setCategoryName(e.target.value)}
          optional={true}
        />

        <TextAreaForm
          label="Descripcion"
          name="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          optional={false}
        />

        <SelectForm
          label="Familia"
          name="family"
          value={family}
          onChange={(value) => setFamily(value as InventoryFamilyKey)}
          options={[
            { value: "epp", label: "EPP - Elementos de proteccion personal" },
            { value: "epi", label: "EPI - Elementos de proteccion individual" },
            { value: "ese", label: "ESE - Equipos de seguridad y/o emergencia" },
            { value: "em", label: "EM - Equipos de medicion" },
            { value: "consumibles", label: "Consumibles SSOMA" },
          ]}
        />

        <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-900">
          <p className="font-semibold">
            {getInventoryFamilyLabel(family)}
          </p>
          <p>
            Codigo {getInventoryCodeRequirementLabel(family).toLowerCase()}.
          </p>
        </div>

        <ButtonContainer>
          <ReturnButton onClick={() => navigate("/admin/inventory")} />
          <SaveButton loading={loading} />
        </ButtonContainer>
      </Form>
    </>
  );
}
