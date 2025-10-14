import { useEffect, useMemo, useState } from "react";
import { useFetch, useApiAction } from "../hooks";
import type { ProjectType, Resource, Supplier } from "../data/types";
import { projectApi, purchaseOrderApi, resourceApi, resourcePurchaseOrderApi, supplierApi } from "../data/apiUrl";

type ItemRow = {
  resourceId: number;
  description: string;
  unit: string;
  quantity: string;          // input controlado
  unitPurchasePrice: string; // input controlado
  unitSalesPrice: string;    // input controlado
  subtotal: number;          // calculado
};

type ItemErrors = Partial<{
  resourceId: string;
  quantity: string;
  unitPurchasePrice: string;
  unitSalesPrice: string;
}>;

type FormErrors = Partial<{
  supplierId: string;
  paymentMethod: string;
  paymentConditions: string;
  purchaseOrderType: string;
  code: string;
  destination: string;
  deliveryLocation: string;
  carePerson: string;
  dniCarePerson: string;
  items: ItemErrors[];
}>;

interface Params {
  projectId: string;
  navigate: (path: string) => void;
}

export function usePurchaseOrderForm({ projectId, navigate }: Params) {
  // --- fetch ---
  const { data: project, loading: projectLoading, error: projectError } =
    useFetch<ProjectType>(`${projectApi}${projectId}`, [projectId]);

  const { data: suppliers, loading: suppliersLoading, error: suppliersError } =
    useFetch<Supplier[]>(supplierApi, []);

  const [selectSupplierId, setSelectSupplierId] = useState<number>(0);

  const { data: supplier } =
    useFetch<Supplier>(selectSupplierId ? `${supplierApi}${selectSupplierId}` : "", [selectSupplierId]);

  const { data: resources, loading: resourcesLoading, error: resourcesError } =
    useFetch<Resource[]>(`${resourceApi}`, []);

  const { execute, loading: saving } = useApiAction<any>();

  // --- form state (sin localStorage) ---
  const [code, setCode] = useState("");
  const [deliveryLocation, setDeliveryLocation] = useState("");
  const [destination, setDestination] = useState("");
  const [paymentConditions, setPaymentConditions] = useState("");
  const [paymentConditions1, setPaymentConditions1] = useState("");
  const [generalConditions, setGeneralConditions] = useState<string[]>([""]);
  const [qualityConditions, setQualityConditions] = useState<string[]>([""]);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [carePerson, setCarePerson] = useState("");
  const [dniCarePerson, setDniCarePerson] = useState("");
  const [observations, setObservations] = useState("");
  const [quotation, setQuotation] = useState("");
  const [purchaseOrderType, setPurchaseOrderType] = useState("");

  const [items, setItems] = useState<ItemRow[]>([
    { resourceId: 0, description: "", unit: "", quantity: "", unitPurchasePrice: "", unitSalesPrice: "", subtotal: 0 },
  ]);

  // --- ERRORS state ---
  const [errors, setErrors] = useState<FormErrors>({});
  const [validationMessages, setValidationMessages] = useState<string[]>([]);

  // helpers condiciones
  const addGeneralCondition = () => setGeneralConditions((p) => [...p, ""]);
  const removeGeneralCondition = (idx: number) =>
    setGeneralConditions((p) => (p.length === 1 ? [""] : p.filter((_, i) => i !== idx)));
  const handleGeneralChange = (idx: number, value: string) =>
    setGeneralConditions((p) => p.map((v, i) => (i === idx ? value : v)));

  const addQualityCondition = () => setQualityConditions((p) => [...p, ""]);
  const removeQualityCondition = (idx: number) =>
    setQualityConditions((p) => (p.length === 1 ? [""] : p.filter((_, i) => i !== idx)));
  const handleQualityChange = (idx: number, value: string) =>
    setQualityConditions((p) => p.map((v, i) => (i === idx ? value : v)));

  // items helpers
  const handleItemChange = (index: number, field: keyof ItemRow, value: any) => {
    setItems((prev) => {
      const next = [...prev];

      if (field === "resourceId") {
        const selected = resources?.find((r) => r.resourceId === Number(value));
        if (selected) {
          next[index] = {
            ...next[index],
            resourceId: selected.resourceId,
            description: selected.description,
            unit: selected.unit,
          };
        } else {
          // si limpian el select
          next[index] = { ...next[index], resourceId: 0, description: "", unit: "" };
        }
      } else {
        (next[index] as any)[field] = value;
      }

      const qty = Number(next[index].quantity) || 0;
      const up = Number(next[index].unitPurchasePrice) || 0;
      next[index].subtotal = qty * up;

      return next;
    });
  };

  const addItem = (rowIndex?: number) => {
    const newRow: ItemRow = {
      resourceId: 0, description: "", unit: "", quantity: "", unitPurchasePrice: "", unitSalesPrice: "", subtotal: 0,
    };
    setItems((prev) => {
      if (rowIndex == null || rowIndex < 0 || rowIndex >= prev.length) return [...prev, newRow];
      const next = [...prev];
      next.splice(rowIndex + 1, 0, newRow);
      return next;
    });
  };

  const removeItem = (rowIndex: number) => {
    setItems((prev) => {
      if (prev.length === 1)
        return [{ resourceId: 0, description: "", unit: "", quantity: "", unitPurchasePrice: "", unitSalesPrice: "", subtotal: 0 }];
      return prev.filter((_, i) => i !== rowIndex);
    });
  };

  // paymentConditions compuesto (si cambian la 1ra parte y no hay detalle, queda vacío)
  useEffect(() => {
    if (!paymentConditions1) {
      setPaymentConditions("");
      return;
    }
  }, [paymentConditions1]);

  // montos
  const sale_amount = useMemo(
    () => items.reduce((acc, it) => acc + (Number(it.unitSalesPrice) || 0) * (Number(it.quantity) || 0), 0),
    [items]
  );
  const purchase_amount = useMemo(
    () => items.reduce((acc, it) => acc + (Number(it.subtotal) || 0), 0),
    [items]
  );

  // --- VALIDATION ---
  const isPositive = (v: string) => Number(v) > 0;
  const isNonNegative = (v: string) => Number(v) >= 0;
  const hasAtLeastOneCompleteItem = (rows: ItemRow[]) =>
    rows.some(
      (r) =>
        r.resourceId > 0 &&
        isPositive(r.quantity) &&
        isNonNegative(r.unitPurchasePrice) &&
        isNonNegative(r.unitSalesPrice)
    );

  function validateAll(): { valid: boolean; errors: FormErrors; messages: string[] } {
    const nextErrors: FormErrors = {};
    const msgs: string[] = [];

    // Campos de cabecera
    if (!selectSupplierId) {
      nextErrors.supplierId = "Seleccione un proveedor.";
      msgs.push("Selecciona un proveedor.");
    }

    // Opcional: habilita/inhabilita reglas extras
    // if (!code.trim()) { nextErrors.code = "Ingrese un código."; msgs.push("Ingresa el código de la orden."); }

    if (!paymentMethod) {
      nextErrors.paymentMethod = "Seleccione un método de pago. ";
      msgs.push("Selecciona el método de pago. ");
    }

    if (!paymentConditions) {
      nextErrors.paymentConditions = "Defina las condiciones de pago. ";
      msgs.push("Define las condiciones de pago. ");
    }

    if (purchaseOrderType === "") {
      nextErrors.purchaseOrderType = "Seleccione materiales o servicios. ";
      msgs.push("Elige el tipo de pedido (materiales o servicios). ");
    }

    if (dniCarePerson && !/^\d{8}$/.test(dniCarePerson)) {
      nextErrors.dniCarePerson = "El DNI debe tener 8 dígitos. ";
      msgs.push("El DNI de atención debe tener 8 dígitos. ");
    }

    // Items por fila
    const itemErrors: ItemErrors[] = items.map((row) => {
      const ie: ItemErrors = {};
      if (!row.resourceId) ie.resourceId = "Requerido. ";
      if (!isPositive(row.quantity)) ie.quantity = "Mayor a 0. ";
      if (!isNonNegative(row.unitPurchasePrice)) ie.unitPurchasePrice = "No negativo. ";
      if (!isNonNegative(row.unitSalesPrice)) ie.unitSalesPrice = "No negativo. ";
      return ie;
    });

    // Si ninguna fila completa
    if (!hasAtLeastOneCompleteItem(items)) {
      msgs.push("Agrega al menos un ítem con recurso, cantidad mayor a 0 y precios mayor o igual a 0. ");
    }

    // Si existe alguna fila con errores, los añadimos al form
    if (itemErrors.some((ie) => Object.keys(ie).length > 0)) {
      nextErrors.items = itemErrors;
    }

    const valid = msgs.length === 0;
    return { valid, errors: nextErrors, messages: msgs };
  }

  // modal & submit
  const [openSaveModal, setOpenSaveModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorFlag, setErrorFlag] = useState(false);
  const [onOk, setOnOk] = useState<() => void>(() => () => {});
  const closeSaveModal = () => setOpenSaveModal(false);
  const navigateToList = () => navigate(`/admin/purchase-orders?projectId=${projectId}`);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setOpenSaveModal(true);

    // VALIDACIÓN granular
    const { valid, errors: found, messages } = validateAll();
    setErrors(found);
    setValidationMessages(messages);

    if (!valid) {
      setSuccessMessage(["Falta completar:", ...messages.map((m) => `• ${m}`)].join("\n"));
      setErrorFlag(true);
      setOnOk(() => () => closeSaveModal());
      return;
    }

    const body = {
      code,
      deliveryLocation,
      destination,
      paymentConditions,
      generalConditions: generalConditions.join("| "),
      qualityConditions: qualityConditions.join("| "),
      paymentMethod,
      saleAmount: sale_amount * 1.18,
      purchaseAmount: purchase_amount,
      carePerson,
      dniCarePerson,
      observations,
      projectId: Number(projectId),
      supplierId: selectSupplierId!,
      quotation,
      purchaseOrderType,
    };

    const ocResp = await execute(`${purchaseOrderApi}`, "POST", body);
    setSuccessMessage(ocResp.message || "Orden creada correctamente.");

    if (ocResp.statusCode !== 201) {
      setErrorFlag(true);
      setOnOk(() => () => closeSaveModal());
      return;
    }

    const purchaseOrderId = Number(ocResp.data.purchaseOrderId);

    for (const it of items) {
      const payload = {
        resourceId: Number(it.resourceId),
        purchaseOrderId,
        quantity: Number(it.quantity),
        unitSalesPrice: Number(it.unitSalesPrice),
        unitPurchasePrice: Number(it.unitPurchasePrice),
      };

      const itemResp = await execute(`${resourcePurchaseOrderApi}`, "POST", payload);
      setSuccessMessage(itemResp.message);
      setOnOk(() => () => navigateToList());

      if (itemResp.statusCode !== 201) {
        setErrorFlag(true);
        return;
      }
    }
  };

  return {
    // data
    project, projectLoading, projectError,
    suppliers, suppliersLoading, suppliersError,
    supplier, resources, resourcesLoading, resourcesError,

    // selections
    selectSupplierId, setSelectSupplierId,

    // form fields
    code, setCode,
    deliveryLocation, setDeliveryLocation,
    destination, setDestination,
    paymentConditions, setPaymentConditions,
    paymentConditions1, setPaymentConditions1,
    paymentMethod, setPaymentMethod,
    carePerson, setCarePerson,
    dniCarePerson, setDniCarePerson,
    observations, setObservations,
    quotation, setQuotation,
    purchaseOrderType, setPurchaseOrderType,

    // conditions
    generalConditions, addGeneralCondition, removeGeneralCondition, handleGeneralChange,
    qualityConditions, addQualityCondition, removeQualityCondition, handleQualityChange,

    // items
    items, handleItemChange, addItem, removeItem,
    sale_amount, purchase_amount,

    // validation (nuevo)
    errors,
    validationMessages,

    // submit & UI
    saving, handleSubmit,
    openSaveModal, onOk, successMessage, errorFlag, closeSaveModal,
  };
}
