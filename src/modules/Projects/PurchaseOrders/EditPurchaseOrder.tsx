import Permission from "../../../common/auth/Permission"
import { adminTypes } from "../../../utils";
import { useApiAction, useCurrentUser, useFetch } from "../../../hooks";
import { ErrorMessage } from "../../../common/error";
import { purchaseOrderApi, resourceApi, resourcePurchaseOrderApi, supplierApi } from "../../../data/apiUrl";
import type { PurchaseOrder, Resource, ResourcePurchaseOrder, Supplier } from "../../../data/types";
import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { ReturnButton, SaveButton } from "../../../common/button";
import { ConditionsSection, DeliveryInfoCard, DuplicateModal, ItemsTable, PaymentConditionsCard, PurchaseOrderHeader, SignaturesTable, SupplierSelectCard } from "./components";
import type { ItemRow } from "../../../hooks/usePurchaseOrderForm";
import { ButtonContainer, SaveModal } from "../../../common/form";
import { Button } from "../../../components";
import { TiStarOutline } from "react-icons/ti";
import { Loading } from "../../../common/loading";
import { FaRegCopy } from "react-icons/fa6";

export default function EditPurchaseOrder() {
  const { id: purchaseOrderId } = useParams<{ id: string }>();

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

  // ---- modal ----
  const [openSaveModal, setOpenSaveModal] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [errorFlag, setErrorFlag] = useState<boolean>(false);
  const [onOk, setOnOk] = useState<() => void>(() => () => {});
  const closeSaveModal = () => setOpenSaveModal(false);

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
    // Mapear filas + ids
    const itemRows: ItemRow[] = resourcePurchaseOrders.map(rpo => ({
      resourceId: rpo.resourceId,
      description: rpo.resource?.description || "",
      unit: rpo.resource?.unit || "",
      quantity: String(rpo.quantity ?? ""),
      unitSalesPrice: String(rpo.unitSalesPrice ?? ""),
      unitPurchasePrice: String(rpo.unitPurchasePrice ?? ""),
      subtotal: (rpo.quantity || 0) * (rpo.unitPurchasePrice || 0),
    }));
    setItems(itemRows);
    setRpoIds(resourcePurchaseOrders.map(r => r.resourcePurchaseOrderId));
  }, [resourcePurchaseOrders]);

  // ---- navegación ----
  const navigateToPurchaseOrders = () => {
    navigate(`/admin/purchase-orders?projectId=${purchaseOrder?.projectId}`);
  };

  // ---- helpers de items ----
  const handleItemChange = (index: number, field: string, value: any) => {
    setItems(prev => {
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

      const qty = Number(next[index].quantity) || 0;
      const up = Number(next[index].unitPurchasePrice) || 0;
      next[index].subtotal = qty * up;
      return next;
    });
  };

  const addItem = (rowIndex?: number) => {
    const newRow: ItemRow = {
      resourceId: 0,
      description: "",
      unit: "",
      quantity: "",
      unitPurchasePrice: "",
      unitSalesPrice: "",
      subtotal: 0,
    };
    setItems(prev => {
      if (rowIndex == null || rowIndex < 0 || rowIndex >= prev.length) {
        return [...prev, newRow];
      }
      const next = [...prev];
      next.splice(rowIndex + 1, 0, newRow);
      return next;
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
      if (prev.length === 1) return [{ resourceId: 0, description: "", unit: "", quantity: "", unitPurchasePrice: "", unitSalesPrice: "", subtotal: 0 }];
      const next = [...prev];
      next.splice(index, 1);
      return next;
    });
    setRpoIds(prev => {
      if (prev.length === 1) return [null];
      const next = [...prev];
      next.splice(index, 1);
      return next;
    });
  };

  // ---- montos ----
  const sale_amount = useMemo(
    () => items.reduce((acc, it) => acc + (Number(it.unitSalesPrice) || 0) * (Number(it.quantity) || 0), 0),
    [items]
  );

  const purchase_amount = useMemo(
    () => items.reduce((acc, it) => acc + ((Number(it.unitPurchasePrice) || 0) * (Number(it.quantity) || 0)), 0),
    [items]
  );

  // ---- helpers condiciones ----
  const addGeneralCondition = () => setGeneralConditions(p => [...p, ""]);
  const removeGeneralCondition = (idx: number) => setGeneralConditions(p => (p.length === 1 ? [""] : p.filter((_, i) => i !== idx)));
  const handleGeneralChange = (idx: number, value: string) => setGeneralConditions(p => p.map((v, i) => (i === idx ? value : v)));

  const addQualityCondition = () => setQualityConditions(p => [...p, ""]);
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
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<boolean> => {
    
    e.preventDefault();

    // 2) Usar la validación local
    const { ok, msgs, fieldErrors } = validateAndCollect();

    // 3) Sincronizar errores a los inputs (estado React)
    setErrorSupplier(fieldErrors.supplier);
    setErrorPaymentMethod(fieldErrors.paymentMethod);
    setErrorPaymentConditions(fieldErrors.paymentConditions);
    setErrorPurchaseOrderType(fieldErrors.purchaseOrderType);
    setErrorDni(fieldErrors.dni);

    if (!ok) {
      // 4) Construir mensaje y RECIÉN abrir modal
      setErrorFlag(true);
      setSuccessMessage([msgs].join(" "));
      setOnOk(() => () => setOpenSaveModal(false));
      setOpenSaveModal(true);
      return false;
    }

    // Si todo ok, puedes mostrar “Procesando…” y seguir con el guardado
    setErrorFlag(false);
    setSuccessMessage("Procesando…");
    setOnOk(() => () => setOpenSaveModal(false));
    setOpenSaveModal(true);

    try {
      // 1) Actualizar cabecera OC
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
        supplierId: Number(supplierId),
        quotation,
        purchaseOrderType,
      };

      const resp = await execute(`${purchaseOrderApi}${purchaseOrderId}`, "PATCH", body);
      if (resp.statusCode < 200 || resp.statusCode >= 300) {
        setErrorFlag(true);
        setSuccessMessage(resp.message || "No se pudo actualizar la orden de compra." );
        return false;
      }

      // 2) Sincronizar ítems (POST/PATCH/DELETE)
      // Conjunto de ids originales
      const originalIds = new Set<number>((resourcePurchaseOrders || []).map(r => r.resourcePurchaseOrderId));
      const keptIds = new Set<number>();

      // Crear/actualizar los actuales
      for (let i = 0; i < items.length; i++) {
        const row = items[i];
        const id = rpoIds[i] ?? null;

        const payload = {
          resourceId: Number(row.resourceId),
          purchaseOrderId: Number(purchaseOrderId),
          quantity: Number(row.quantity) || 0,
          unitSalesPrice: Number(row.unitSalesPrice) || 0,
          unitPurchasePrice: Number(row.unitPurchasePrice) || 0,
        };

        if (id) {
          // PATCH existente
          const upd = await execute(`${resourcePurchaseOrderApi}${id}`, "PATCH", payload);
          if (upd.statusCode >= 200 && upd.statusCode < 300) {
            keptIds.add(id);
          } else {
            setErrorFlag(true);
            setSuccessMessage("Hubo errores al actualizar algunos ítems." );
          }
        } else {
          // POST nuevo
          const crt = await execute(`${resourcePurchaseOrderApi}`, "POST", payload);
          if (crt.statusCode >= 200 && crt.statusCode < 300) {
            // opcional: refrescar id en memoria si quieres
          } else {
            setErrorFlag(true);
            setSuccessMessage("Hubo errores al crear algunos ítems." );
          }
        }
      }

      // Eliminar los que ya no existen en el formulario
      for (const oid of originalIds) {
        if (!keptIds.has(oid)) {
          await execute(`${resourcePurchaseOrderApi}${oid}`, "DELETE");
        }
      }

      setErrorFlag(false);
      setSuccessMessage("Orden de compra actualizada exitosamente." );
      setOnOk(() => () => navigateToPurchaseOrders());
      return true;
    } catch (err: any) {
      setErrorFlag(true);
      setSuccessMessage(err?.message || "Error desconocido al actualizar." );
      setOnOk(() => () => setOpenSaveModal(false));
      return false;
    }
  };

  const handleAuthorize = async () => {
    const saved = await handleSubmit(new Event("submit") as unknown as React.FormEvent<HTMLFormElement>);
    if (!saved) return;
    if (errorFlag) return;

    setOpenSaveModal(true);
    setErrorFlag(false);
    setSuccessMessage("");
    setOnOk(() => () => closeSaveModal());

    const resp = await execute(`${purchaseOrderApi}${purchaseOrderId}`, "PATCH", {
      status: "authorized",
    });

    if (resp.statusCode === 200) {
      setSuccessMessage("Orden de compra autorizada." );
      setOnOk(() => () => navigateToPurchaseOrders());
    } else {
      setErrorFlag(true);
      setSuccessMessage(resp.message || "No se pudo autorizar la orden." );
    }
  };

  const { execute: duplicatePurchaseOrder, loading: isDuplicating } = useApiAction<PurchaseOrder>();

  const handleDuplicate = async (projectId: number) => {
    try {
      const response = await duplicatePurchaseOrder(
        `${purchaseOrderApi}${purchaseOrderId}/duplicate`,
        'POST',
        { projectId }
      );
      
      if (response.statusCode >= 200 && response.statusCode < 300) {
        setIsModalOpen(false);
        navigate(`/admin/purchase-orders?projectId=${projectId}`);
      }
    } catch (error) {
      console.error('Error duplicating purchase order:', error);
    }
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
      <div className="flex flex-col p-4">
        <div className="flex w-full items-center justify-between">
          <div className="w-fit">
            <ReturnButton onClick={navigateToPurchaseOrders} />
          </div>
          <div className="w-fit flex flex-row gap-2">
            <Button
              icon={<FaRegCopy />}
              label="Duplicar"
              bgColor="#9f7aea"
              bgHoverColor="#7c3aed"
              type="button"
              onClick={() => setIsModalOpen(true)}
            />
          </div>
        </div>
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
                onAddRow={() => addItem()}
                onRemoveRow={removeItem}
                supplierCurrency={supplier?.currency}
                saleAmount={sale_amount}
                purchaseAmount={purchase_amount}
              />

              <SignaturesTable />

              <ConditionsSection
                title="CONDICIONES COMERCIALES"
                values={generalConditions}
                onAdd={addGeneralCondition}
                onRemove={removeGeneralCondition}
                onChange={handleGeneralChange}
                placeholderBase="Condición"
              />

              <ConditionsSection
                title="CONDICIONES DE CALIDAD"
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
            </ButtonContainer>
          </form>
        </div>
      </div>

      {openSaveModal && (
        <SaveModal
          onOk={onOk}
          message={successMessage}
          error={errorFlag}
        />
      )}
      <DuplicateModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleDuplicate}
        isLoading={isDuplicating}
      />
    </Permission>
  )
}
