import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { elementApi } from "../../data/apiUrl";
import { useApiAction } from "../../hooks";
import { ReturnButton, SaveButton } from "../../common/button";
import { ButtonContainer, Form, InputForm, SelectForm, TextAreaForm } from "../../common/form";
import toast, { Toaster } from "react-hot-toast";

interface ElementResponse {
  name: string;
  type: string;
  description: string;
}

export default function NewEpp() {
  const typeRoot = new URLSearchParams(window.location.search).get("type") || "";

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState(typeRoot);

  const navigate = useNavigate();
  const { execute, loading } = useApiAction<ElementResponse>();
  
  const navigateToElements = () => {
    if (type) {
      navigate(`/admin/elements/type/${type}`);
    } else {
      navigate("/admin/elements/type/all");
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const elementData = { name, type, description };

    toast.promise(
      execute(elementApi, "POST", elementData),
      {
        loading: 'Creando elemento...',
        success: (result) => {
          setTimeout(() => navigateToElements(), 1200);
          return result.message || 'Elemento creado con éxito';
        },
        error: (err) => err.message || 'Error al crear el elemento',
      }
    );
  };

  return (
    <>
      <Toaster position="top-center" reverseOrder={false} />
      <Form name="REGISTRAR ELEMENTO" handleSubmit={handleSubmit}>
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
          
        <SelectForm label="Tipo" name="type" value={type} onChange={(value) => setType(value as string)}
          options={[
            { value: "epp", label: "Elementos de Protección Personal (EPP)" },
            { value: "operative", label: "Elementos Operativos" }
          ]}
        />

        <ButtonContainer>
          <ReturnButton onClick={() => navigate(`/admin/elements/type/${type}`)} />
          <SaveButton loading={loading} />
        </ButtonContainer>
      </Form>
    </>
  );
}
