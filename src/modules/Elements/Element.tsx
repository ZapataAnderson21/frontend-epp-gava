import { useEffect, useState } from "react";
import RedButton from "../../common/form/RedButton";
import { type UpdateElementDto, type ElementType } from "../../data/types";
import { useNavigate, useParams } from "react-router-dom";
import LoadingSkeletonForm from "../../common/loading/LoadingSkeletonForm";
import SaveModal from "../../common/form/SaveModal";
import { useFetch } from "../../hooks/useFetch";
import { useApiAction } from "../../hooks/useApiAction";
import { elementApi } from "../../data/apiUrl";
import { ButtonContainer, ButtonSubmit, Form, InputForm, SelectForm, TextAreaForm } from "../../common/form";

export default function Element() {
  const elementId = Number(useParams<{ id: string }>().id ?? 0);
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [type, setType] = useState("");
  const [description, setDescription] = useState("");

  const [openSaveModal, setOpenSaveModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [error, setError] = useState(false);
  const [onOk, setOnOk] = useState<() => void>(() => () => {});

  const { data: element, loading, error: fetchError } = useFetch<ElementType>(`${elementApi}${elementId}`);

  const { execute: updateElement, loading: updating } = useApiAction<ElementType>();

  useEffect(() => {
    if (element) {
      setName(element.name);
      setType(element.type);
      setDescription(element.description);
    }
  }, [element]);

  const closeModalAndReset = () => {
    setSuccessMessage("");
    setError(false);
    setOpenSaveModal(false);
  };

  const navigateToElements = () => {
    setSuccessMessage("");
    setError(false);
    setOpenSaveModal(false);
    navigate(`/admin/elements/type/${type}/`);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setOpenSaveModal(true);

    const updatedData: UpdateElementDto = { name, type, description };
    const response = await updateElement(`${elementApi}${elementId}`, "PATCH", updatedData);

    setSuccessMessage(response.message);

    if (response.statusCode !== 200) {
      setError(true);
      setOnOk(() => () => closeModalAndReset());
    } else {
      setError(false);
      setOnOk(() => () => navigateToElements());
    }
  };

  if (loading) return <LoadingSkeletonForm numberRows={3} />;
  if (fetchError) return <div className="text-red-500">{fetchError}</div>;

  return (
    <>
      <Form name={`ELEMENTO ${elementId}`} handleSubmit={handleUpdate}>
        <InputForm
          label="Nombre"
          name="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          optional={false}
        />

        <SelectForm 
          label="Tipo" 
          name="type" 
          value={type}
          onChange={(value) => setType(value as string)}
          options={[
            { value: "security", label: "Elementos de Protección Personal (EPP)" },
            { value: "operative", label: "Elementos Operativos" }
          ]}
        />

        <TextAreaForm
          label="Descripción"
          name="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          optional={false}
        />

         <ButtonContainer>
          <RedButton href={`/admin/elements/type/${type}`} name="Regresar" />
          <ButtonSubmit loading={updating} label="Actualizar" loadingLabel="Actualizando..." />
        </ButtonContainer>
      </Form>

      {openSaveModal && (
        <SaveModal onOk={onOk} message={successMessage} error={error} />
      )}
    </>
  );
}
