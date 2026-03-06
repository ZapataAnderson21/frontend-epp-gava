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
  documentType: "ruc" | "dni";
  ruc: string;
  dni: string;
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
  const [documentType, setDocumentType] = useState<"ruc" | "dni">("ruc");
  const [ruc, setRuc] = useState("");
  const [dni, setDni] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [bank, setBank] = useState("");
  const [currency, setCurrency] = useState("");

  const [errorPhone, setErrorPhone] = useState("");
  const [errorRuc, setErrorRuc] = useState("");
  const [errorDni, setErrorDni] = useState("");
  const [errorAccountNumber, setErrorAccountNumber] = useState("");

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
    if (email.trim() && !email.includes("@")) errors.push("El email no tiene formato válido");
    if (documentType === "ruc" && !ruc.trim()) errors.push("El RUC es requerido");
    if (documentType === "dni" && !dni.trim()) errors.push("El DNI es requerido");
    if (!accountNumber.trim()) errors.push("El número de cuenta es requerido");
    if (!bank.trim()) errors.push("El banco es requerido");
    if (!currency) errors.push("Debe seleccionar una moneda");
    if (phone.length !== 9) {
      errors.push("El teléfono debe tener exactamente 9 dígitos");
      setErrorPhone("El teléfono debe tener exactamente 9 dígitos");
    } else {
      setErrorPhone("");
    }
    if (documentType === "ruc") {
      if (ruc.length !== 11) {
        errors.push("El RUC debe tener exactamente 11 dígitos");
        setErrorRuc("El RUC debe tener exactamente 11 dígitos");
      } else {
        setErrorRuc("");
      }
    } else {
      setErrorRuc("");
    }
    if (documentType === "dni") {
      if (dni.length !== 8) {
        errors.push("El DNI debe tener exactamente 8 dígitos");
        setErrorDni("El DNI debe tener exactamente 8 dígitos");
      } else {
        setErrorDni("");
      }
    } else {
      setErrorDni("");
    }
    if (accountNumber.length < 13) {
      errors.push("El número de cuenta debe tener al menos 13 dígitos");
      setErrorAccountNumber("El número de cuenta debe tener al menos 13 dígitos");
    } else {
      setErrorAccountNumber("");
    }

    if (errors.length > 0) {
      // Mostrar cada error de validación en un toast separado
      errors.forEach((err: string, index: number) => {
        setTimeout(() => {
          toast.error(err, {
            duration: 4000,
          });
        }, index * 100); // Pequeño delay entre cada toast para que se vean en secuencia
      });
      return;
    }

    const payload = {
      name,
      contactName,
      phone,
      email,
      address,
      documentType,
      ...(documentType === "ruc" ? { ruc } : { dni }),
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
        error: (err) => {
          // Dividir el mensaje de error por comas y mostrar cada uno en un toast separado
          const errorMessage = err.message || "Error al crear proveedor";
          const errorMessages = errorMessage.split(',').map((msg: string) => msg.trim()).filter((msg: string) => msg.length > 0);
          
          // Mostrar cada error en un toast separado
          errorMessages.forEach((msg: string, index: number) => {
            setTimeout(() => {
              toast.error(msg, {
                duration: 4000,
              });
            }, index * 100); // Pequeño delay entre cada toast para que se vean en secuencia
          });
          
          // Retornar el primer error para el toast.promise principal
          return errorMessages[0] || "Error al crear proveedor";
        },
      }
    );
  };

  type DocumentType = "ruc" | "dni";

  const currencyOptions = [
    { value: "USD", label: "Dólares" },
    { value: "PEN", label: "Soles Peruanos" },
    { value: "EUR", label: "Euros" }
  ];

  const documentTypeOptions: { value: DocumentType; label: string }[] = [
    { value: "ruc", label: "RUC" },
    { value: "dni", label: "DNI" }
  ];

  return (
    <>
      <Form name="REGISTRAR PROVEEDOR" handleSubmit={handleSubmit}>
        <InputForm label="Nombre" name="name" type="text" value={name} onChange={(e) => setName(e.target.value)} optional={false} />
        <InputForm label="Nombre de contacto" name="contactName" type="text" value={contactName} onChange={(e) => setContactName(e.target.value)} optional={false} />
        <InputForm label="Teléfono" name="phone" type="text" value={phone} onChange={(e) => {setErrorPhone(''); const v = e.target.value; if (/^\d{0,9}$/.test(v)) setPhone(v); }} optional={false} maxLength={9} error={errorPhone} />
        <InputForm label="Email" name="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} optional={true} />
        <TextAreaForm label="Dirección" name="address" value={address} onChange={(e) => setAddress(e.target.value)} optional={true} />
        <SelectForm<DocumentType> label="Tipo de documento" name="documentType" options={documentTypeOptions} value={documentType} onChange={(value) => { setDocumentType(value); setErrorRuc(""); setErrorDni(""); if (value === "ruc") { setDni(""); } else { setRuc(""); } }} />
        {documentType === "ruc" ? (
          <InputForm label="RUC" name="ruc" type="text" value={ruc} onChange={(e) => {setErrorRuc(""); const v = e.target.value; if (/^\d{0,11}$/.test(v)) setRuc(v); }} optional={false} maxLength={11} error={errorRuc} />
        ) : (
          <InputForm label="DNI" name="dni" type="text" value={dni} onChange={(e) => {setErrorDni(""); const v = e.target.value; if (/^\d{0,8}$/.test(v)) setDni(v); }} optional={false} maxLength={8} error={errorDni} />
        )}
        <InputForm label="Número de cuenta" name="accountNumber" type="text" value={accountNumber} onChange={(e) => {setErrorAccountNumber(''); const v = e.target.value; if (/^\d*$/.test(v)) setAccountNumber(v); }} optional={false} maxLength={20} error={errorAccountNumber} />
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