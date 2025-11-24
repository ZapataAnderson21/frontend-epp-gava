import { useState } from "react";
import { ButtonContainer, Form, InputForm, SelectForm, TextAreaForm } from "../../common/form";
import toast, { Toaster } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { useApiAction } from "../../hooks";
import { supplierApi } from "../../data/apiUrl";
import { ReturnButton, SaveButton } from "../../common/button";


interface ResourceResponse {
  supplierId: number;
  name: string;
  contactName: string;
  phone: string;
  email: string;
  address: string;
  ruc: string;
  accountNumber: string;
  bank: string;
  currency: string;
}

export default function NewSupplier() {
  
  const [name, setName] = useState("");
  const [contactName, setContactName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [ruc, setRuc] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [bank, setBank] = useState("");
  const [currency, setCurrency] = useState("");

  const navigate = useNavigate();

  // * acción POST
  const { execute, loading: saving } = useApiAction<ResourceResponse>();

  const navigateToSuppliers = () => {
    navigate("/admin/suppliers");
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Validación
    const errors: string[] = [];
    if (!name.trim()) errors.push("El nombre es requerido");
    if (!contactName.trim()) errors.push("El nombre de contacto es requerido");
    if (!phone.trim()) errors.push("El teléfono es requerido");
    if (!email.trim()) errors.push("El email es requerido");
    if (!ruc.trim()) errors.push("El RUC es requerido");
    if (!accountNumber.trim()) errors.push("El número de cuenta es requerido");
    if (!bank.trim()) errors.push("El banco es requerido");
    if (!currency) errors.push("Debe seleccionar una moneda");

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
      contactName,
      phone,
      email,
      address,
      ruc,
      accountNumber,
      bank,
      currency,
    };

    await toast.promise(
      execute(supplierApi, "POST", payload),
      {
        loading: "Creando proveedor...",
        success: (response) => {
          setTimeout(() => navigateToSuppliers(), 1200);
          return response.message || "Proveedor creado exitosamente";
        },
        error: (err) => err.message || "Error al crear proveedor",
      }
    );
  };

  const currencyOptions = [
    { value: "USD", label: "Dólares" },
    { value: "PEN", label: "Soles Peruanos" },
    { value: "EUR", label: "Euros" }
  ];

  return (
    <>
      <Form name="REGISTRAR PROVEEDOR" handleSubmit={handleSubmit}>
        <InputForm label="Nombre" name="name" type="text" value={name} onChange={(e) => setName(e.target.value)} optional={false} />
        <InputForm label="Nombre de contacto" name="contactName" type="text" value={contactName} onChange={(e) => setContactName(e.target.value)} optional={false} />
        <InputForm label="Teléfono" name="phone" type="text" value={phone} onChange={(e) => setPhone(e.target.value)} optional={false} />
        <InputForm label="Email" name="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} optional={false} />
        <TextAreaForm label="Dirección" name="address" value={address} onChange={(e) => setAddress(e.target.value)} optional={true} />
        <InputForm label="RUC" name="ruc" type="text" value={ruc} onChange={(e) => setRuc(e.target.value)} optional={false} />
        <InputForm label="Número de cuenta" name="accountNumber" type="text" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value.trim())} optional={false} />
        <InputForm label="Banco" name="bank" type="text" value={bank} onChange={(e) => setBank(e.target.value)} optional={false} />
        <SelectForm label="Moneda" name="currency" options={currencyOptions} value={currency} onChange={(value) => setCurrency(value)} />


        <ButtonContainer>
          <ReturnButton onClick={() => navigateToSuppliers()} />
          <SaveButton loading={saving} />
        </ButtonContainer>
      </Form>
      <Toaster position="top-center" />
    </>
  );
}