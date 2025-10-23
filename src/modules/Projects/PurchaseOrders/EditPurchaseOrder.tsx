import Permission from "../../../common/auth/Permission"
import { adminTypes } from "../../../utils";
import { useApiAction, useCurrentUser, useFetch } from "../../../hooks";
import { ErrorMessage } from "../../../common/error";
import { purchaseOrderApi, resourceApi, resourcePurchaseOrderApi, supplierApi } from "../../../data/apiUrl";
import type { PurchaseOrder, Resource, ResourcePurchaseOrder, Supplier } from "../../../data/types";
import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { ReturnButton, SaveButton } from "../../../common/button";
import { ConditionsSection, DeliveryInfoCard, ItemsTable, PaymentConditionsCard, PurchaseOrderHeader, SignaturesTable, SupplierSelectCard } from "./components";
import type { ItemRow } from "../../../hooks/usePurchaseOrderForm";
import { ButtonContainer, SaveModal } from "../../../common/form";
import { Button } from "../../../components";
import { TiStarOutline } from "react-icons/ti";

export default function EditPurchaseOrder() {
  const { id: purchaseOrderId } = useParams<{ id: string }>();

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
  const [purchaseOrderType, setPurchaseOrderType] = useState<string>();
  const [items, setItems] = useState<ItemRow[]>([]);
  const [generalConditions, setGeneralConditions] = useState<string[]>([]);
  const [qualityConditions, setQualityConditions] = useState<string[]>([]);

  const [errorDni, setErrorDni] = useState<string | undefined>(undefined);
  const [errorSupplier, setErrorSupplier] = useState<string | undefined>(undefined);
  const [errorPaymentMethod, setErrorPaymentMethod] = useState<string | undefined>(undefined);
  const [errorPaymentConditions, setErrorPaymentConditions] = useState<string | undefined>(undefined);
  const [errorPurchaseOrderType, setErrorPurchaseOrderType] = useState<string | undefined>(undefined);

  const { user } = useCurrentUser();
  const { data: purchaseOrder, loading, error } = useFetch<PurchaseOrder>(`${purchaseOrderApi}${purchaseOrderId}`);
  const { data: suppliers, loading: suppliersLoading, error: suppliersError } = useFetch<Supplier[]>(`${supplierApi}`);
  const { data: resourcePurchaseOrders, loading: resourcePuchaseOrdersLoading, error: resourcePurchaseOrdersError } = useFetch<ResourcePurchaseOrder[]>(`${resourcePurchaseOrderApi}purchase-order/${purchaseOrderId}`);
  const { data: resources, loading: resourcesLoading, error: resourcesError } = useFetch<Resource[]>(`${resourceApi}`);

  const { execute, loading: saving } = useApiAction();

  const [openSaveModal, setOpenSaveModal] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [errorFlag, setErrorFlag] = useState<boolean>(false);
  const [onOk, setOnOk] = useState<() => void>(() => () => {});

  const navigate = useNavigate();

  useEffect(() => {
    if (purchaseOrder) {
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
      setPaymentConditions1(purchaseOrder.paymentConditions);
      setPaymentConditions(purchaseOrder.paymentConditions);
      setPurchaseOrderType(purchaseOrder.purchaseOrderType);
      if (resourcePurchaseOrders) {
        const itemRows: ItemRow[] = resourcePurchaseOrders.map(rpo => ({
          resourceId: rpo.resourceId,
          description: rpo.resource?.description || "",
          unit: rpo.resource?.unit || "",
          quantity: rpo.quantity.toString(),
          unitSalesPrice: rpo.unitSalesPrice.toString(),
          unitPurchasePrice: rpo.unitPurchasePrice.toString(),
          subtotal: rpo.quantity * rpo.unitPurchasePrice,
        }));
        setItems(itemRows);
      }
      setGeneralConditions(purchaseOrder.generalConditions ? purchaseOrder.generalConditions.split("|") : []);
      setQualityConditions(purchaseOrder.qualityConditions ? purchaseOrder.qualityConditions.split("|") : []);
    }
  }, [purchaseOrder]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Submit logic here
  }

  const navigateToPurchaseOrders = () => {
    navigate(`/admin/purchase-orders?projectId=${purchaseOrder?.projectId}`);
  }

  const handleItemChange = (index: number, field: string, value: any) => {
    // Handle item change logic here
  }

  const addItem = () => {
    // Add item logic here
  }

  const removeItem = (index: number) => {
    // Remove item logic here
  }

  const sale_amount = useMemo(() => {
    // Calculate sale amount logic here
    return 0;
  }, [/* dependencies */]);

  const purchase_amount = useMemo(() => {
    // Calculate purchase amount logic here
    return 0;
  }, [/* dependencies */]);

  const addGeneralCondition = () => {
    // Add general condition logic here
  }

  const removeGeneralCondition = (index: number) => {
    // Remove general condition logic here
  }

  const handleGeneralChange = (index: number, value: string) => {
    // Handle general condition change logic here
  }

  const addQualityCondition = () => {
    // Add quality condition logic here
  }

  const removeQualityCondition = (index: number) => {
    // Remove quality condition logic here
  }

  const handleQualityChange = (index: number, value: string) => {
    // Handle quality condition change logic here
  }

  const handleAuthorize = () => {
    execute(`${purchaseOrderApi}${purchaseOrderId}`, "PATCH", {
      status: "authorized"
    })
  }

  return (
    <Permission user={user} allow={adminTypes} fallback={<ErrorMessage errorMessage="No tienes permiso para ver esta página." />} >
      <div className="flex flex-col p-4">
        <div className="w-fit">
          <ReturnButton onClick={navigateToPurchaseOrders} />
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
                supplier={supplier}
                paymentMethod={paymentMethod}
                setPaymentMethod={setPaymentMethod}
                paymentConditions={paymentConditions}
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
    </Permission>
  )
}