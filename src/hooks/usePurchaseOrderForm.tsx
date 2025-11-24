import { useEffect, useMemo, useState } from "react";
import { useFetch, useApiAction } from "../hooks";
import type { Project, Resource, Supplier } from "../data/types";
import { projectApi, purchaseOrderApi, resourceApi, resourcePurchaseOrderApi, supplierApi } from "../data/apiUrl";
import toast from "react-hot-toast";

export type ItemRow = {
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

// --- TYPES ---
type FormErrors = Partial<{
  supplierId: string;
  paymentMethod: string;
  paymentConditions: string;
  purchaseOrderType: string;
  code: string;                 // <-- NUEVO
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
    useFetch<Project>(`${projectApi}${projectId}`, [projectId]);

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
  function validateAll(): { valid: boolean; errors: FormErrors; messages: string[] } {
    const nextErrors: FormErrors = {};
    const msgs: string[] = [];

    // code
    if (!code.trim()) {
      nextErrors.code = "Ingrese un código.";
      msgs.push("Ingresa el código de la orden.");
    }

    // proveedor
    if (!selectSupplierId) {
      nextErrors.supplierId = "Seleccione un proveedor.";
      msgs.push("Selecciona un proveedor.");
    }

    // método de pago
    if (!paymentMethod) {
      nextErrors.paymentMethod = "Seleccione un método de pago.";
      msgs.push("Selecciona el método de pago.");
    }

    // condiciones de pago
    if (!paymentConditions) {
      nextErrors.paymentConditions = "Defina las condiciones de pago.";
      msgs.push("Define las condiciones de pago.");
    }

    // tipo (materiales/servicios)
    if (!purchaseOrderType) {
      nextErrors.purchaseOrderType = "Seleccione materiales o servicios.";
      msgs.push("Elige el tipo de pedido (materiales o servicios).");
    }

    // DNI
    if (dniCarePerson && !/^\d{8}$/.test(dniCarePerson)) {
      nextErrors.dniCarePerson = "El DNI debe tener 8 dígitos.";
      msgs.push("El DNI de atención debe tener 8 dígitos.");
    }

    // Ítems
    const itemErrors: ItemErrors[] = items.map((row) => {
      const ie: ItemErrors = {};
      if (!row.resourceId) ie.resourceId = "Requerido.";
      if (!(Number(row.quantity) > 0)) ie.quantity = "Mayor a 0.";
      if (!(Number(row.unitPurchasePrice) >= 0)) ie.unitPurchasePrice = "No negativo.";
      if (!(Number(row.unitSalesPrice) >= 0)) ie.unitSalesPrice = "No negativo.";
      return ie;
    });

    const hasValidItem = items.some(
      (r) =>
        r.resourceId > 0 &&
        Number(r.quantity) > 0 &&
        Number(r.unitPurchasePrice) >= 0 &&
        Number(r.unitSalesPrice) >= 0
    );

    if (!hasValidItem) {
      msgs.push("Agrega al menos un ítem con recurso, cantidad > 0 y precios ≥ 0.");
    }

    if (itemErrors.some((ie) => Object.keys(ie).length > 0)) {
      nextErrors.items = itemErrors;
    }

    const valid = msgs.length === 0;
    return { valid, errors: nextErrors, messages: msgs };
  }

  const navigateToList = () => navigate(`/admin/purchase-orders?projectId=${projectId}`);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // VALIDACIÓN granular
    const { valid, errors: found, messages } = validateAll();
    setErrors(found);
    setValidationMessages(messages);

    if (!valid) {
      toast.error(
        <div>
          <strong>Falta completar:</strong>
          <ul className="list-disc pl-4 mt-1">
            {messages.map((m, i) => <li key={i}>{m}</li>)}
          </ul>
        </div>,
        { duration: 5000 }
      );
      return;
    }

    const createPurchaseOrder = async () => {
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

      if (ocResp.statusCode !== 201) {
        throw new Error(ocResp.message || "Error al crear la orden de compra");
      }

      const purchaseOrderId = Number(ocResp.data.purchaseOrderId);

      for (const it of items) {
        const payload = {
          resourceId: Number(it.resourceId),
          purchaseOrderId: Number(purchaseOrderId),
          quantity: Number(it.quantity),
          unitSalesPrice: Number(it.unitSalesPrice),
          unitPurchasePrice: Number(it.unitPurchasePrice),
        };

        const itemResp = await execute(`${resourcePurchaseOrderApi}`, "POST", payload);

        if (itemResp.statusCode !== 201) {
          throw new Error(itemResp.message || "Error al agregar los ítems");
        }
      }

      return ocResp;
    };

    toast.promise(
      createPurchaseOrder(),
      {
        loading: 'Creando orden de compra...',
        success: (result) => {
          setTimeout(() => navigateToList(), 1200);
          return result.message || 'Orden de compra creada con éxito';
        },
        error: (err) => err.message || 'Error al crear la orden de compra',
      }
    );
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

    // validation
    errors,
    validationMessages,

    // submit & UI
    saving, handleSubmit,
  };
}
