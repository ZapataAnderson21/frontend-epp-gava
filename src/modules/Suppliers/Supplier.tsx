import { useEffect, useState } from "react";
import { ButtonContainer, ButtonSubmit, Form, InputForm, SaveModal, SelectForm, TextAreaForm } from "../../common/form";
import { useNavigate } from "react-router-dom";
import { useApiAction, useFetch } from "../../hooks";
import { supplierApi } from "../../data/apiUrl";
import type { Supplier } from "../../data/types";
import { LoadingSkeletonForm } from "../../common/loading";
import { ErrorMessage } from "../../common/error";
import { ReturnButton } from "../../common/button";


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

export default function Supplier() {
  const idParam = window.location.pathname.split("/").pop();

  const {data: supplier, loading: loadingSupplier, error: errorSupplier} = useFetch<Supplier>(supplierApi + idParam);
  
  const [supplierId, setSupplierId] = useState(0);
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

  useEffect(() => {
    if (supplier) {
      setSupplierId(supplier.supplierId);
      setName(supplier.name);
      setContactName(supplier.contactName);
      setPhone(supplier.phone);
      setEmail(supplier.email);
      setRuc(supplier.ruc);
      setAccountNumber(supplier.accountNumber);
      setBank(supplier.bank);
      setCurrency(supplier.currency);
      if(supplier.address) setAddress(supplier.address);
    }
  }, [supplier]);

  // * acción PATCH
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

    const response = await execute(supplierApi+supplierId, "PATCH", payload);

    setSuccessMessage(response.message);

    if (response.statusCode !== 200) {
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

  if (loadingSupplier) return <LoadingSkeletonForm numberRows={9} />;

  if (errorSupplier) return <ErrorMessage errorMessage={errorSupplier} />;

  return (
    <>
      <Form name={`PROVEEDOR ${supplierId}`} handleSubmit={handleSubmit}>
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
          <ButtonSubmit label="Actualizar" loading={saving} loadingLabel="Guardando..." />
        </ButtonContainer>
      </Form>

      {openSaveModal && (
        <SaveModal onOk={onOk} message={successMessage || "Error al crear el proveedor."} error={error} />
      )}
    </>
  );
}