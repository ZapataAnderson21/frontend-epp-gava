import { useState } from "react";
import { ButtonContainer, Form, InputForm, TextAreaForm } from "../../common/form";
import toast, { Toaster } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { useApiAction } from "../../hooks";
import { resourceApi } from "../../data/apiUrl";
import type { CategoryResource } from "../../data/types";
import CategoryPickerModal from "./Category/CategoryPickerModal";
import { ReturnButton, SaveButton } from "../../common/button";


interface ResourceResponse {
  resourceId: number;
  name: string;
  description: string;
  categoryResourceId: number;
  unit: string;
}

export default function NewResource() {
  
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [unit, setUnit] = useState("");
  const [categoryResourceId, setCategoryResourceId] = useState(0);
  const [categorySelected, setCategorySelected] = useState<CategoryResource | null>(null);
  const [openCatModal, setOpenCatModal] = useState(false);

  const navigate = useNavigate();

  // * acción POST
  const { execute, loading: saving } = useApiAction<ResourceResponse>();

  const navigateToResources = () => {
    navigate("/admin/resources");
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Validación
    const errors: string[] = [];
    if (!name.trim()) errors.push("El nombre es requerido");
    if (!unit.trim()) errors.push("La unidad es requerida");
    if (categoryResourceId === 0) errors.push("Debe seleccionar una categoría");

    if (errors.length > 0) {
      toast.error(
        <div>
          <strong>Errores de validación:</strong>
          <ul className="list-disc list-inside">
            {errors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      );
      return;
    }

    const payload = {
      name,
      description,
      unit,
      categoryResourceId,
    };

    await toast.promise(
      execute(resourceApi, "POST", payload),
      {
        loading: "Creando recurso...",
        success: (response) => {
          setTimeout(() => navigateToResources(), 1200);
          return response.message || "Recurso creado exitosamente";
        },
        error: (err) => err.message || "Error al crear recurso",
      }
    );
  };

  return (
    <>
      <Form name="REGISTRAR RECURSO" handleSubmit={handleSubmit}>
        <InputForm label="Nombre" name="name" type="text" value={name} onChange={(e) => setName(e.target.value)} optional={false} />
        <InputForm label="Unidad" name="unit" type="text" value={unit} onChange={(e) => setUnit(e.target.value)} optional={false} />
        <TextAreaForm label="Descripción" name="description" value={description} onChange={(e) => setDescription(e.target.value)} optional={false} />

        {/* Reemplazo del SelectForm */}
        <div className="w-full">
          <label className="block font-bold mb-1">Seleccionar categoría</label>
          <div className="flex w-full gap-2">
            <button
              type="button"
              onClick={() => setOpenCatModal(true)}
              className="flex  w-full px-3 py-2 rounded-md border border-gray-400 bg-white hover:bg-gray-50"
            >
              {categorySelected ? categorySelected.name : "Elegir categoría"}
            </button>
          </div>
        </div>

        <ButtonContainer>
          <ReturnButton onClick={() => navigateToResources()} />
          <SaveButton loading={saving} />
        </ButtonContainer>
      </Form>
      <Toaster position="top-center" />

      {/* Modal de categorías */}
      <CategoryPickerModal
        open={openCatModal}
        onClose={() => setOpenCatModal(false)}
        onSelect={(cat) => {
          setCategorySelected(cat);
          setCategoryResourceId(cat.categoryResourceId);
        }}
      />
    </>
  );
}