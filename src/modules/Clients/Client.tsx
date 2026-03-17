import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import { ReturnButton, SaveButton } from "../../common/button";
import { ErrorMessage } from "../../common/error";
import { ButtonContainer, Form, InputForm, TextAreaForm } from "../../common/form";
import { LoadingSkeletonForm } from "../../common/loading";
import { clientApi } from "../../data/apiUrl";
import type { Client } from "../../data/types";
import { useApiAction, useFetch } from "../../hooks";

export default function Client() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: client, loading, error } = useFetch<Client>(`${clientApi}${id ?? ""}`);
  const { execute, loading: saving } = useApiAction<Client>();

  const [name, setName] = useState("");
  const [contactName, setContactName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [ruc, setRuc] = useState("");

  const [errorPhone, setErrorPhone] = useState("");
  const [errorRuc, setErrorRuc] = useState("");

  useEffect(() => {
    if (!client) return;

    setName(client.name);
    setContactName(client.contactName);
    setPhone(client.phone ?? "");
    setEmail(client.email ?? "");
    setAddress(client.address ?? "");
    setRuc(client.ruc);
  }, [client]);

  const navigateToClients = () => navigate("/admin/clients");

  const validate = () => {
    const errors: string[] = [];

    if (!name.trim()) errors.push("La razón social es obligatoria.");
    if (!contactName.trim()) errors.push("El contacto es obligatorio.");

    if (!ruc.trim()) {
      errors.push("El RUC es obligatorio.");
      setErrorRuc("El RUC es obligatorio.");
    } else if (!/^\d{11}$/.test(ruc)) {
      errors.push("El RUC debe tener exactamente 11 dígitos.");
      setErrorRuc("El RUC debe tener exactamente 11 dígitos.");
    } else {
      setErrorRuc("");
    }

    if (phone.trim().length > 0 && !/^\d{9}$/.test(phone)) {
      errors.push("El teléfono debe tener exactamente 9 dígitos.");
      setErrorPhone("El teléfono debe tener exactamente 9 dígitos.");
    } else {
      setErrorPhone("");
    }

    if (email.trim().length > 0 && !email.includes("@")) {
      errors.push("El email no tiene formato válido.");
    }

    return errors;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!id) {
      toast.error("No se pudo identificar el cliente.");
      return;
    }

    const errors = validate();
    if (errors.length > 0) {
      errors.forEach((err, idx) => {
        setTimeout(() => toast.error(err), idx * 100);
      });
      return;
    }

    const payload = {
      name: name.trim(),
      contactName: contactName.trim(),
      ruc: ruc.trim(),
      ...(phone.trim() ? { phone: phone.trim() } : { phone: null }),
      ...(email.trim() ? { email: email.trim() } : { email: null }),
      ...(address.trim() ? { address: address.trim() } : { address: null }),
    };

    await toast.promise(execute(`${clientApi}${id}`, "PATCH", payload), {
      loading: "Actualizando cliente...",
      success: (response) => {
        setTimeout(() => navigateToClients(), 1200);
        return response.message || "Cliente actualizado exitosamente";
      },
      error: (err) => err.message || "Error al actualizar cliente",
    });
  };

  if (loading) return <LoadingSkeletonForm numberRows={6} />;
  if (error) return <ErrorMessage errorMessage={error} />;

  return (
    <>
      <Form name={`CLIENTE ${client?.clientId ?? ""}`} handleSubmit={handleSubmit}>
        <InputForm
          label="Razón social"
          name="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          optional={false}
        />

        <InputForm
          label="Contacto"
          name="contactName"
          type="text"
          value={contactName}
          onChange={(e) => setContactName(e.target.value)}
          optional={false}
        />

        <InputForm
          label="RUC"
          name="ruc"
          type="text"
          value={ruc}
          onChange={(e) => {
            setErrorRuc("");
            const value = e.target.value;
            if (/^\d{0,11}$/.test(value)) setRuc(value);
          }}
          optional={false}
          maxLength={11}
          error={errorRuc}
        />

        <InputForm
          label="Teléfono"
          name="phone"
          type="text"
          value={phone}
          onChange={(e) => {
            setErrorPhone("");
            const value = e.target.value;
            if (/^\d{0,9}$/.test(value)) setPhone(value);
          }}
          optional={true}
          maxLength={9}
          error={errorPhone}
        />

        <InputForm
          label="Email"
          name="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          optional={true}
        />

        <TextAreaForm
          label="Dirección"
          name="address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          optional={true}
        />

        <ButtonContainer>
          <ReturnButton onClick={navigateToClients} />
          <SaveButton loading={saving} />
        </ButtonContainer>
      </Form>
      <Toaster position="top-center" />
    </>
  );
}
