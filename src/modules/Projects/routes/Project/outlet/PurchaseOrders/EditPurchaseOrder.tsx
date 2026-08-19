import Permission from "../../../../../../common/auth/Permission"
import { adminTypes, lineAmount, roundMoney, totalFromRoundedLines } from "../../../../../../utils";
import { useApiAction, useCurrentUser, useFetch } from "../../../../../../hooks";
import { ErrorMessage } from "../../../../../../common/error";
import { purchaseOrderApi, resourceApi, resourcePurchaseOrderApi, supplierApi } from "../../../../../../data/apiUrl";
import type { PurchaseOrder, Resource, ResourcePurchaseOrder, Supplier } from "../../../../../../data/types";
import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { ReturnButton, SaveButton } from "../../../../../../common/button";
import { ConditionsSection, DeliveryInfoCard, DuplicateModal, ItemsTable, PaymentConditionsCard, PurchaseOrderHeader, SignaturesTable, SupplierSelectCard } from "./components";
import type { ItemRow } from "../../../../../../hooks/usePurchaseOrderForm";
import { ButtonContainer } from "../../../../../../common/form";
import { Button } from "../../../../../../components";
import { TiStarOutline } from "react-icons/ti";
import { Loading } from "../../../../../../common/loading";
import { FaRegCopy } from "react-icons/fa6";
import toast, { Toaster } from "react-hot-toast";

export default function EditPurchaseOrder() {
  const { purchaseOrderId } = useParams<{ purchaseOrderId: string }>();

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // ---- estado de formulario ----
  const [code, setCode] = useState<string>("");
  const [supplierId, setSupplierId] = useState<number>(0);
  const [quotation, setQuotation] = useState<string>("");
  const [supplier, setSupplier] = useState<Supplier | undefined>(undefined);
  const [destination, setDestination] = useState<string>("");
  const [deliveryLocation, setDeliveryLocation] = useState<string>("");
  const [carePerson, setCarePerson] = useState<string>("");
  const [dniCarePerson, setDniCarePerson] = useState<string>("");
  const [observations, setObservations] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<string>("");
  const [paymentConditions1, setPaymentConditions1] = useState<string>("");
  const [paymentConditions, setPaymentConditions] = useState<string>("");
  const [paymentConditions2, setPaymentConditions2] = useState<string>("");
  const [purchaseOrderType, setPurchaseOrderType] = useState<string>("");


  const [items, setItems] = useState<ItemRow[]>([]);
  // rpoIds[i] = id del resourcePurchaseOrder asociado a la fila i (o null si es nuevo)
  const [rpoIds, setRpoIds] = useState<(number | null)[]>([]);

  const [generalConditions, setGeneralConditions] = useState<string[]>([""]);
  const [qualityConditions, setQualityConditions] = useState<string[]>([""]);

  // ---- errores ----
  const [errorDni, setErrorDni] = useState<string | undefined>(undefined);
  const [errorSupplier, setErrorSupplier] = useState<string | undefined>(undefined);
  const [errorPaymentMethod, setErrorPaymentMethod] = useState<string | undefined>(undefined);
  const [errorPaymentConditions, setErrorPaymentConditions] = useState<string | undefined>(undefined);
  const [errorPurchaseOrderType, setErrorPurchaseOrderType] = useState<string | undefined>(undefined);

  // ---- datos remotos ----
  const { user } = useCurrentUser();
  const { data: purchaseOrder, loading, error } = useFetch<PurchaseOrder>(`${purchaseOrderApi}${purchaseOrderId}`);
  const { data: suppliers, loading: suppliersLoading, error: suppliersError } = useFetch<Supplier[]>(`${supplierApi}`);
  const { data: resourcePurchaseOrders, loading: resourcePuchaseOrdersLoading, error: resourcePurchaseOrdersError } = useFetch<ResourcePurchaseOrder[]>(`${resourcePurchaseOrderApi}purchase-order/${purchaseOrderId}`);
  const { data: resources, loading: resourcesLoading, error: resourcesError } = useFetch<Resource[]>(`${resourceApi}`);

  const { execute, loading: saving } = useApiAction<any>();

  const navigate = useNavigate();

  // ---- hidratar el formulario al cargar ----
  useEffect(() => {
    if (!purchaseOrder) return;

    setCode(purchaseOrder.code);
    setSupplierId(purchaseOrder.supplierId);
    setQuotation(purchaseOrder.quotation ?? "");
    setSupplier(purchaseOrder.supplier);
    setDestination(purchaseOrder.destination);
    setDeliveryLocation(purchaseOrder.deliveryLocation);
    setCarePerson(purchaseOrder.carePerson);
    setDniCarePerson(purchaseOrder.dniCarePerson);
    setObservations(purchaseOrder.observations ?? "");
    setPaymentMethod(purchaseOrder.paymentMethod);
    setPaymentConditions1(purchaseOrder.paymentConditions.split(" - ")[0] || "");
    setPaymentConditions2(purchaseOrder.paymentConditions.split(" - ")[1] || "");
    setPaymentConditions(purchaseOrder.paymentConditions);
    setPurchaseOrderType(purchaseOrder.purchaseOrderType);

    const gc = purchaseOrder.generalConditions ? purchaseOrder.generalConditions.split("|") : [""];
    const qc = purchaseOrder.qualityConditions ? purchaseOrder.qualityConditions.split("|") : [""];
    setGeneralConditions(gc.length ? gc.map(s => s.trim()) : [""]);
    setQualityConditions(qc.length ? qc.map(s => s.trim()) : [""]);
  }, [purchaseOrder]);

  useEffect(() => {
    if (!resourcePurchaseOrders) return;
    const normalizeOrderNumbers = (rows: ItemRow[]) =>
      rows.map((row, index) => ({ ...row, orderNumber: index + 1 }));

    const sorted = [...resourcePurchaseOrders].sort((a, b) => {
      const ao = a.orderNumber ?? Number.MAX_SAFE_INTEGER;
      const bo = b.orderNumber ?? Number.MAX_SAFE_INTEGER;
      return ao - bo;
    });
    // Mapear filas + ids
    const itemRows: ItemRow[] = sorted.map((rpo, index) => ({
      orderNumber: rpo.orderNumber ?? index + 1,
      resourceId: rpo.resourceId,
      description: rpo.resource?.description || "",
      unit: rpo.resource?.unit || "",
      quantity: String(rpo.quantity ?? ""),
      unitSalesPrice: String(rpo.unitSalesPrice ?? ""),
      unitPurchasePrice: String(rpo.unitPurchasePrice ?? ""),
      subtotal: lineAmount(rpo.quantity, rpo.unitPurchasePrice),
    }));
    setItems(normalizeOrderNumbers(itemRows));
    setRpoIds(sorted.map(r => r.resourcePurchaseOrderId));
  }, [resourcePurchaseOrders]);

  // ---- navegación ----
  const navigateToPurchaseOrders = () => {
    navigate(`/admin/projects/${purchaseOrder?.projectId}/purchase-orders`);
  };

  // ---- helpers de items ----
  const handleItemChange = (index: number, field: string, value: any) => {
    setItems(prev => {
      const normalizeOrderNumbers = (rows: ItemRow[]) =>
        rows.map((row, idx) => ({ ...row, orderNumber: idx + 1 }));
      const next = [...prev];
      if (field === "resourceId") {
        const selected = resources?.find(r => r.resourceId === Number(value));
        if (selected) {
          next[index] = {
            ...next[index],
            resourceId: selected.resourceId,
            description: selected.description,
            unit: selected.unit,
          };
        } else {
          next[index] = { ...next[index], resourceId: 0, description: "", unit: "" };
        }
      } else {
        (next[index] as any)[field] = value;
      }

      next[index].subtotal = lineAmount(
        next[index].quantity,
        next[index].unitPurchasePrice,
      );
      return normalizeOrderNumbers(next);
    });
  };

  const addItem = (rowIndex?: number) => {
    const newRow: ItemRow = {
      orderNumber: 0,
      resourceId: 0,
      description: "",
      unit: "",
      quantity: "",
      unitPurchasePrice: "",
      unitSalesPrice: "",
      subtotal: 0,
    };
    setItems(prev => {
      const normalizeOrderNumbers = (rows: ItemRow[]) =>
        rows.map((row, idx) => ({ ...row, orderNumber: idx + 1 }));
      if (rowIndex == null || rowIndex < 0 || rowIndex >= prev.length) {
        return normalizeOrderNumbers([...prev, newRow]);
      }
      const next = [...prev];
      next.splice(rowIndex + 1, 0, newRow);
      return normalizeOrderNumbers(next);
    });
    setRpoIds(prev => {
      if (rowIndex == null || rowIndex < 0 || rowIndex >= prev.length) {
        return [...prev, null];
      }
      const next = [...prev];
      next.splice(rowIndex + 1, 0, null);
      return next;
    });
  };

  const removeItem = (index: number) => {
    setItems(prev => {
      const normalizeOrderNumbers = (rows: ItemRow[]) =>
        rows.map((row, idx) => ({ ...row, orderNumber: idx + 1 }));
      if (prev.length === 1) return [{ orderNumber: 1, resourceId: 0, description: "", unit: "", quantity: "", unitPurchasePrice: "", unitSalesPrice: "", subtotal: 0 }];
      const next = [...prev];
      next.splice(index, 1);
      return normalizeOrderNumbers(next);
    });
    setRpoIds(prev => {
      if (prev.length === 1) return [null];
      const next = [...prev];
      next.splice(index, 1);
      return next;
    });
  };

  const moveItem = (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= items.length) return;

    setItems(prev => {
      const next = [...prev];
      [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
      return next.map((row, idx) => ({ ...row, orderNumber: idx + 1 }));
    });
    setRpoIds(prev => {
      const next = [...prev];
      [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
      return next;
    });
  };

  // ---- montos ----
  const sale_amount = useMemo(
    () => totalFromRoundedLines(items, (it) => it.unitSalesPrice),
    [items]
  );

  const purchase_amount = useMemo(
    () => totalFromRoundedLines(items, (it) => it.unitPurchasePrice),
    [items]
  );

  // ---- helpers condiciones ----
  const addGeneralCondition = (value = "") => setGeneralConditions(p => [...p, value]);
  const removeGeneralCondition = (idx: number) => setGeneralConditions(p => (p.length === 1 ? [""] : p.filter((_, i) => i !== idx)));
  const handleGeneralChange = (idx: number, value: string) => setGeneralConditions(p => p.map((v, i) => (i === idx ? value : v)));

  const addQualityCondition = (value = "") => setQualityConditions(p => [...p, value]);
  const removeQualityCondition = (idx: number) => setQualityConditions(p => (p.length === 1 ? [""] : p.filter((_, i) => i !== idx)));
  const handleQualityChange = (idx: number, value: string) => setQualityConditions(p => p.map((v, i) => (i === idx ? value : v)));

  // Mantener paymentConditions coherente si editas la primera parte
  useEffect(() => {
    if (!paymentConditions1) {
      setPaymentConditions("");
    }
  }, [paymentConditions1]);

  // 1) Nueva función que valida y DEVUELVE mensajes + errores de campo
  const validateAndCollect = () => {
    const msgs: string[] = [];
    const fieldErrors = {
      code: undefined as string | undefined,
      supplier: undefined as string | undefined,
      paymentMethod: undefined as string | undefined,
      paymentConditions: undefined as string | undefined,
      purchaseOrderType: undefined as string | undefined,
      dni: undefined as string | undefined,
    };

    if (!supplierId) {
      fieldErrors.supplier = "Seleccione un proveedor. ";
      msgs.push("Selecciona un proveedor." );
    }
    if (!paymentMethod) {
      fieldErrors.paymentMethod = "Seleccione un método de pago. ";
      msgs.push("Selecciona el método de pago." );
    }
    if (!paymentConditions) {
      fieldErrors.paymentConditions = "Defina las condiciones de pago. ";
      msgs.push("Define las condiciones de pago." );
    }
    if (!purchaseOrderType) {
      fieldErrors.purchaseOrderType = "Seleccione materiales o servicios. ";
      msgs.push("Elige el tipo de pedido (materiales o servicios)." );
    }
    if (dniCarePerson && !/^\d{8}$/.test(dniCarePerson)) {
      fieldErrors.dni = "El DNI debe tener 8 dígitos. ";
      msgs.push("El DNI de atención debe tener 8 dígitos." );
    }
    if (code.trim() === "") {
      fieldErrors.code = "El código no puede estar vacío. ";
      msgs.push("El código de la orden de compra no puede estar vacío." );
    }

    const hasValidItem = items.some(r =>
      r.resourceId > 0 &&
      Number(r.quantity) > 0 &&
      Number(r.unitPurchasePrice) >= 0 &&
      Number(r.unitSalesPrice) >= 0
    );
    if (!hasValidItem) {
      msgs.push("Agrega al menos un ítem válido." );
    }

    return { ok: msgs.length === 0, msgs, fieldErrors };
  };

  // ---- submit ----
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Validación local
    const { ok, msgs, fieldErrors } = validateAndCollect();

    // Sincronizar errores a los inputs
    setErrorSupplier(fieldErrors.supplier);
    setErrorPaymentMethod(fieldErrors.paymentMethod);
    setErrorPaymentConditions(fieldErrors.paymentConditions);
    setErrorPurchaseOrderType(fieldErrors.purchaseOrderType);
    setErrorDni(fieldErrors.dni);

    if (!ok) {
      toast.error(
        <div>
          <strong>Falta completar:</strong>
          <ul className="list-disc pl-4 mt-1">
            {msgs.map((m, i) => <li key={i}>{m}</li>)}
          </ul>
        </div>,
        { duration: 5000 }
      );
      return;
    }

    const updatePurchaseOrder = async () => {
      // 1) Actualizar cabecera OC
      const body = {
        code,
        deliveryLocation,
        destination,
        paymentConditions,
        generalConditions: generalConditions.join("| "),
        qualityConditions: qualityConditions.join("| "),
        paymentMethod,
        saleAmount: roundMoney(sale_amount + roundMoney(sale_amount * 0.18)),
        purchaseAmount: purchase_amount,
        carePerson,
        dniCarePerson,
        observations,
        supplierId: Number(supplierId),
        quotation,
        purchaseOrderType,
      };

      const resp = await execute(`${purchaseOrderApi}${purchaseOrderId}`, "PATCH", body);
      if (resp.statusCode < 200 || resp.statusCode >= 300) {
        throw new Error(resp.message || "No se pudo actualizar la orden de compra.");
      }

      // 2) Sincronizar ítems (POST/PATCH/DELETE)
      const originalIds = new Set<number>((resourcePurchaseOrders || []).map(r => r.resourcePurchaseOrderId));
      const keptIds = new Set<number>(
        rpoIds.filter((id): id is number => id !== null),
      );

      // Eliminar primero las filas quitadas para liberar su resourceId antes
      // de que una fila nueva o reordenada intente utilizarlo.
      for (const originalId of originalIds) {
        if (!keptIds.has(originalId)) {
          const deleted = await execute(
            `${resourcePurchaseOrderApi}${originalId}`,
            "DELETE",
          );
          if (deleted.statusCode < 200 || deleted.statusCode >= 300) {
            throw new Error("Hubo errores al eliminar algunos ítems.");
          }
        }
      }

      // Crear/actualizar los actuales
      for (let i = 0; i < items.length; i++) {
        const row = items[i];
        const id = rpoIds[i] ?? null;

        const payload = {
          resourceId: Number(row.resourceId),
          purchaseOrderId: Number(purchaseOrderId),
          orderNumber: Number(row.orderNumber),
          quantity: Number(row.quantity) || 0,
          unitSalesPrice: Number(row.unitSalesPrice) || 0,
          unitPurchasePrice: Number(row.unitPurchasePrice) || 0,
        };

        if (id) {
          // PATCH existente
          const upd = await execute(`${resourcePurchaseOrderApi}${id}`, "PATCH", payload);
          if (upd.statusCode < 200 || upd.statusCode >= 300) {
            throw new Error("Hubo errores al actualizar algunos ítems.");
          }
        } else {
          // POST nuevo
          const crt = await execute(`${resourcePurchaseOrderApi}`, "POST", payload);
          if (crt.statusCode < 200 || crt.statusCode >= 300) {
            throw new Error("Hubo errores al crear algunos ítems.");
          }
        }
      }

      return resp;
    };

    toast.promise(
      updatePurchaseOrder(),
      {
        loading: 'Actualizando orden de compra...',
        success: (result) => {
          setTimeout(() => navigateToPurchaseOrders(), 1200);
          return result.message || 'Orden de compra actualizada con éxito';
        },
        error: (err) => err.message || 'Error al actualizar la orden de compra',
      }
    );
  };

  const handleAuthorize = async () => {
    // Validar antes de autorizar
    const { ok, msgs, fieldErrors } = validateAndCollect();

    setErrorSupplier(fieldErrors.supplier);
    setErrorPaymentMethod(fieldErrors.paymentMethod);
    setErrorPaymentConditions(fieldErrors.paymentConditions);
    setErrorPurchaseOrderType(fieldErrors.purchaseOrderType);
    setErrorDni(fieldErrors.dni);

    if (!ok) {
      toast.error(
        <div>
          <strong>Completa los campos antes de autorizar:</strong>
          <ul className="list-disc pl-4 mt-1">
            {msgs.map((m, i) => <li key={i}>{m}</li>)}
          </ul>
        </div>,
        { duration: 5000 }
      );
      return;
    }

    toast.promise(
      execute(`${purchaseOrderApi}${purchaseOrderId}`, "PATCH", {
        status: "authorized",
      }),
      {
        loading: 'Autorizando orden de compra...',
        success: (result) => {
          setTimeout(() => navigateToPurchaseOrders(), 1200);
          return result.message || 'Orden de compra autorizada con éxito';
        },
        error: (err) => err.message || 'Error al autorizar la orden de compra',
      }
    );
  };

  const { execute: duplicatePurchaseOrder, loading: isDuplicating } = useApiAction<PurchaseOrder>();

  const handleDuplicate = async (projectId: number) => {
    toast.promise(
      duplicatePurchaseOrder(
        `${purchaseOrderApi}${purchaseOrderId}/duplicate`,
        'POST',
        { projectId }
      ),
      {
        loading: 'Duplicando orden de compra...',
        success: (result) => {
          setIsModalOpen(false);
          setTimeout(() => navigate(`/admin/purchase-orders?projectId=${projectId}`), 1200);
          return result.message || 'Orden de compra duplicada con éxito';
        },
        error: (err) => {
          setIsModalOpen(false);
          return err.message || 'Error al duplicar la orden de compra';
        },
      }
    );
  };

  if (loading || suppliersLoading || resourcePuchaseOrdersLoading || resourcesLoading) {
    return <Loading />;
  }
  if (error) return <ErrorMessage errorMessage={error} />;
  if (suppliersError) return <ErrorMessage errorMessage={suppliersError} />;
  if (resourcePurchaseOrdersError) return <ErrorMessage errorMessage={resourcePurchaseOrdersError} />;
  if (resourcesError) return <ErrorMessage errorMessage={resourcesError} />;

  return (
    <Permission user={user} allow={adminTypes} fallback={<ErrorMessage errorMessage="No tienes permiso para ver esta página." />} >
      <Toaster position="top-center" reverseOrder={false} />
      <div className="flex flex-col justify-center w-full">
        <div className="w-full flex flex-col items-center justify-center">
          <form onSubmit={handleSubmit} className="flex flex-col m-2 gap-6 lg:w-[85%] w-full md:border-1 border-gray-100 md:p-12 md:shadow-md shadow-gray-300">
            <PurchaseOrderHeader
              projectName={purchaseOrder?.project?.name ?? ""}
              code={code}
              onChangeCode={setCode}
            />

            <div className="flex flex-col gap-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <SupplierSelectCard
                  suppliers={suppliers ?? []}
                  selectSupplierId={supplierId}
                  onChangeSupplier={(id) => setSupplierId(id)}
                  supplier={supplier}
                  quotation={quotation}
                  setQuotation={setQuotation}
                  errorSupplier={errorSupplier}
                />

                <DeliveryInfoCard
                  destination={destination}
                  setDestination={setDestination}
                  deliveryLocation={deliveryLocation}
                  setDeliveryLocation={setDeliveryLocation}
                  carePerson={carePerson}
                  setCarePerson={setCarePerson}
                  dniCarePerson={dniCarePerson}
                  setDniCarePerson={setDniCarePerson}
                  observations={observations}
                  setObservations={setObservations}
                  dniError={errorDni}
                />
              </div>

              <PaymentConditionsCard
                paymentConditions1={paymentConditions1}
                setPaymentConditions1={setPaymentConditions1}
                paymentConditions2={paymentConditions2}
                setPaymentConditions2={setPaymentConditions2}
                supplier={supplier}
                paymentMethod={paymentMethod}
                setPaymentMethod={setPaymentMethod}
                setPaymentConditions={setPaymentConditions}
                errorPaymentMethod={errorPaymentMethod}
                errorPaymentConditions={errorPaymentConditions}
              />

              <div className="root-section rs2" style={{ borderTop: "0px", borderBottom: "0px" }}>
                <div className="section-info">
                  <div className="w-full">
                    <p><strong>Señores:</strong> {supplier && (<>{supplier.name}</>)} </p>
                    <div className="flex flex-row flex-wrap w-full items-center gap-2">
                      <div className="w-fit">
                        <ConditionsSection.SelectInline
                          label="Sírvase a suministrarnos los "
                          name="purchaseOrderType"
                          value={purchaseOrderType}
                          onChange={setPurchaseOrderType}
                          options={[
                            { value: "materials", label: "materiales" },
                            { value: "services", label: "servicios" },
                          ]}
                          purchaseOrderTypeError={errorPurchaseOrderType}
                        />
                      </div>
                      <p className="text-gray-700 font-bold"> solicitados siguientes:</p>
                    </div>
                  </div>
                </div>
              </div>

              <ItemsTable
                items={items ?? []}
                resources={resources ?? []}
                onChange={handleItemChange}
                onAddRow={addItem}
                onRemoveRow={removeItem}
                onMoveRow={moveItem}
                supplierCurrency={supplier?.currency}
                saleAmount={sale_amount}
                purchaseAmount={purchase_amount}
              />

              <SignaturesTable />

              <ConditionsSection
                title="CONDICIONES COMERCIALES"
                conditionType="commercial"
                values={generalConditions}
                onAdd={addGeneralCondition}
                onRemove={removeGeneralCondition}
                onChange={handleGeneralChange}
                placeholderBase="Condición"
              />

              <ConditionsSection
                title="CONDICIONES DE CALIDAD"
                conditionType="quality"
                values={qualityConditions}
                onAdd={addQualityCondition}
                onRemove={removeQualityCondition}
                onChange={handleQualityChange}
                placeholderBase="Condición de Calidad"
              />
            </div>

            <ButtonContainer>
              <ReturnButton onClick={navigateToPurchaseOrders} />
              <SaveButton loading={saving} />
              <Button
                label="Autorizar"
                icon={<TiStarOutline />}
                bgColor="#EF9521"
                bgHoverColor="#C97816"
                type="button"
                onClick={handleAuthorize}
              />
              <Button
                icon={<FaRegCopy />}
                label="Duplicar"
                bgColor="#9f7aea"
                bgHoverColor="#7c3aed"
                type="button"
                onClick={() => setIsModalOpen(true)}
              />
            </ButtonContainer>
          </form>
        </div>
      </div>

      <DuplicateModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleDuplicate}
        isLoading={isDuplicating}
      />
    </Permission>
  )
}
