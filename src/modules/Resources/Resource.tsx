import { useEffect, useState } from "react";
import { ButtonContainer, Form, InputForm, SaveModal, TextAreaForm } from "../../common/form";
import { useNavigate } from "react-router-dom";
import { useApiAction, useFetch } from "../../hooks";
import { resourceApi } from "../../data/apiUrl";
import type { CategoryResource, Resource } from "../../data/types";
import CategoryPickerModal from "./Category/CategoryPickerModal";
import { LoadingSkeletonForm } from "../../common/loading";
import { ErrorMessage } from "../../common/error";
import { ReturnButton, SaveButton } from "../../common/button";


interface ResourceResponse {
  resourceId: number;
  name: string;
  description: string;
  categoryResourceId: number;
  unit: string;
}

export default function Resource() {
  
  const idParam = window.location.pathname.split("/").pop();

  const {data: resource, loading: loadingResource, error: errorResource} = useFetch<Resource>(resourceApi + idParam);

  const [resourceId, setResourceId] = useState(0);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [unit, setUnit] = useState("");
  const [categoryResourceId, setCategoryResourceId] = useState(0);
  const [categorySelected, setCategorySelected] = useState<CategoryResource | null>(null);
  const [openCatModal, setOpenCatModal] = useState(false);

  const [openSaveModal, setOpenSaveModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [error, setError] = useState(false);
  const [onOk, setOnOk] = useState<() => void>(() => () => {});

  const navigate = useNavigate();

  useEffect(() => {
    if (resource) {
      setResourceId(resource.resourceId);
      setName(resource.name);
      setDescription(resource.description);
      setUnit(resource.unit);
      setCategoryResourceId(resource.categoryResourceId);
      setCategorySelected(resource.categoryResource || null);
    }
  }, [resource]);

  // * acción PATCH
  const { execute, loading: saving } = useApiAction<ResourceResponse>();

  const closeModalAndReset = () => {
    setOpenSaveModal(false);
    setError(false);
  };

  const navigateToResources = () => {
    navigate("/admin/resources");
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setOpenSaveModal(true);

    const payload = {
      name,
      description,
      unit,
      categoryResourceId,
    };

    const response = await execute(resourceApi + resourceId, "PATCH", payload);

    setSuccessMessage(response.message);

    if (response.statusCode !== 200) {
      setError(true);
      setOnOk(() => () => closeModalAndReset());
    } else {
      setError(false);
      setOnOk(() => () => navigateToResources());
    }
  };

  if (loadingResource) return <LoadingSkeletonForm numberRows={4} />;

  if (errorResource) return <ErrorMessage errorMessage={errorResource} />;

  return (
    <>
      <Form name="REGISTRAR RECURSO" handleSubmit={handleSubmit}>
        <InputForm label="Nombre" name="name" type="text" value={name} onChange={(e) => setName(e.target.value)} optional={false} />
        <InputForm label="Unidad" name="unit" type="text" value={unit} onChange={(e) => setUnit(e.target.value)} optional={false} />
        <TextAreaForm label="Descripción" name="description" value={description} onChange={(e) => setDescription(e.target.value)} optional={true} />

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

      {openSaveModal && (
        <SaveModal onOk={onOk} message={successMessage || "Error al crear el recurso"} error={error} />
      )}

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