import { useState } from "react";
import { ButtonContainer, Form, InputForm, SaveModal, SelectForm, TextAreaForm } from "../../common/form";
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

  const [openSaveModal, setOpenSaveModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [error, setError] = useState(false);
  const [onOk, setOnOk] = useState<() => void>(() => () => {});

  const navigate = useNavigate();

  // * acción POST
  const { execute, loading: saving } = useApiAction<ResourceResponse>();

  const closeModalAndReset = () => {
    setOpenSaveModal(false);
    setError(false);
  };

  const navigateToSuppliers = () => {
    navigate("/admin/suppliers");
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setOpenSaveModal(true);

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

    const response = await execute(supplierApi, "POST", payload);

    setSuccessMessage(response.message);

    if (response.statusCode !== 201) {
      setError(true);
      setOnOk(() => () => closeModalAndReset());
    } else {
      setError(false);
      setOnOk(() => () => navigateToSuppliers());
    }
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
        <InputForm label="Número de cuenta" name="accountNumber" type="text" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} optional={false} />
        <InputForm label="Banco" name="bank" type="text" value={bank} onChange={(e) => setBank(e.target.value)} optional={false} />
        <SelectForm label="Moneda" name="currency" options={currencyOptions} value={currency} onChange={(value) => setCurrency(value)} />


        <ButtonContainer>
          <ReturnButton onClick={() => navigateToSuppliers()} />
          <SaveButton loading={saving} />
        </ButtonContainer>
      </Form>

      {openSaveModal && (
        <SaveModal onOk={onOk} message={successMessage || "Error al crear el proveedor."} error={error} />
      )}
    </>
  );
}