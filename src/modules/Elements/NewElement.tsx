import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { elementApi } from "../../data/apiUrl";
import { useApiAction } from "../../hooks";
import { ButtonContainer, ButtonSubmit, Form, InputForm, SelectForm, TextAreaForm, RedButton, SaveModal } from "../../common/form";

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

  const [openSaveModal, setOpenSaveModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [error, setError] = useState(false);
  const [onOk, setOnOk] = useState<() => void>(() => () => {});

  const navigate = useNavigate();
  const { execute, loading } = useApiAction<ElementResponse>();
  
  const closeModalAndReset = () => {
    setOpenSaveModal(false);
    setError(false);
  };

  const navigateToElements = () => {
    if (type) {
      navigate(`/admin/elements/type/${type}`);
    } else {
      navigate("/admin/elements/type/all");
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setOpenSaveModal(true);

    const elementData = { name, type, description };

    const response = await execute(elementApi, "POST", elementData);

    setSuccessMessage(response.message);

    if (response.statusCode !== 201) {
      setError(true);
      setOnOk(() => () => closeModalAndReset());
    } else {
      setError(false);
      setOnOk(() => () => navigateToElements());
    }
  };

  return (
    <>
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
          <RedButton href={`/admin/elements/type/${type}`} name="Cancelar" />
          <ButtonSubmit loading={loading} label="Registrar" loadingLabel="Guardando..." />
        </ButtonContainer>
      </Form>

      {openSaveModal && (
        <SaveModal onOk={onOk} message={successMessage} error={error} />
      )}
    </>
  );
}
