import { useEffect, useState } from "react";
import { type UpdateElementDto, type ElementType } from "../../data/types";
import { useNavigate, useParams } from "react-router-dom";
import LoadingSkeletonForm from "../../common/loading/LoadingSkeletonForm";
import { useFetch } from "../../hooks/useFetch";
import { useApiAction } from "../../hooks/useApiAction";
import { elementApi } from "../../data/apiUrl";
import { ButtonContainer, Form, InputForm, SelectForm, TextAreaForm } from "../../common/form";
import { ReturnButton, SaveButton } from "../../common/button";
import toast, { Toaster } from "react-hot-toast";

export default function Element() {
  const elementId = Number(useParams<{ id: string }>().id ?? 0);
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [type, setType] = useState("");
  const [description, setDescription] = useState("");

  const { data: element, loading, error: fetchError } = useFetch<ElementType>(`${elementApi}${elementId}`);

  const { execute: updateElement, loading: updating } = useApiAction<ElementType>();

  useEffect(() => {
    if (element) {
      setName(element.name);
      setType(element.type);
      setDescription(element.description);
    }
  }, [element]);

  const navigateToElements = () => {
    navigate(`/admin/elements/type/${type}/`);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    const updatedData: UpdateElementDto = { name, type, description };

    toast.promise(
      updateElement(`${elementApi}${elementId}`, "PATCH", updatedData),
      {
        loading: 'Actualizando elemento...',
        success: (result) => {
          setTimeout(() => navigateToElements(), 1200);
          return result.message || 'Elemento actualizado con éxito';
        },
        error: (err) => err.message || 'Error al actualizar el elemento',
      }
    );
  };

  if (loading) return <LoadingSkeletonForm numberRows={3} />;
  if (fetchError) return <div className="text-red-500">{fetchError}</div>;

  return (
    <>
      <Toaster position="top-center" reverseOrder={false} />
      <Form name={`ELEMENTO ${elementId}`} handleSubmit={handleUpdate}>
        <InputForm
          label="Nombre"
          name="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          optional={false}
        />

        <TextAreaForm
          label="Descripción"
          name="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
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
        
         <ButtonContainer>
          <ReturnButton onClick={() => navigate(`/admin/elements/type/${type}`)} />
          <SaveButton loading={updating} />
        </ButtonContainer>
      </Form>
    </>
  );
}
