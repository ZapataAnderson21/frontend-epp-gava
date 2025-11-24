import { useSearchParams, useNavigate } from "react-router-dom";
import { CgSpinner } from "react-icons/cg";
import { ErrorMessage } from "../../../common/error";
import { ButtonContainer } from "../../../common/form";
import SaveModal from "../../../common/form/SaveModal";

import { usePurchaseOrderForm } from "../../../hooks/usePurchaseOrderForm";
import { PurchaseOrderHeader, SupplierSelectCard, DeliveryInfoCard, PaymentConditionsCard, ItemsTable, ConditionsSection, SignaturesTable } from "./components";
import { ReturnButton, SaveButton } from "../../../common/button";
import Permission from "../../../common/auth/Permission";
import { adminTypes } from "../../../utils";
import { useCurrentUser } from "../../../hooks";
import { Select } from "../../../components";

export default function NewPurchaseOrder() {
  const { user } = useCurrentUser();
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get("projectId") ?? "";
  const navigate = useNavigate();

  const {
    // data
    project, projectLoading, projectError,
    suppliers, suppliersLoading, suppliersError,
    supplier, resources, resourcesLoading, resourcesError,

    // selections
    selectSupplierId, setSelectSupplierId,

    // form fields
    code, setCode,
    destination, setDestination,
    deliveryLocation, setDeliveryLocation,
    carePerson, setCarePerson,
    dniCarePerson, setDniCarePerson,
    observations, setObservations,
    quotation, setQuotation,
    purchaseOrderType, setPurchaseOrderType,
    paymentMethod, setPaymentMethod,
    paymentConditions1, setPaymentConditions1,

    //validate errors
    errors,
    validationMessages,
    setPaymentConditions,

    // conditions
    generalConditions, addGeneralCondition, removeGeneralCondition, handleGeneralChange,
    qualityConditions, addQualityCondition, removeQualityCondition, handleQualityChange,

    // items
    items, handleItemChange, addItem, removeItem,
    sale_amount, purchase_amount,

    // submit & UI
    saving, handleSubmit,
    openSaveModal, onOk, successMessage, errorFlag,
  } = usePurchaseOrderForm({ projectId, navigate });

  const navigateToPurchaseOrders = () => {
    navigate(`/admin/purchase-orders?projectId=${projectId}`);
  }

  if (projectLoading || suppliersLoading || resourcesLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <CgSpinner className="size-18 aspect-square animate-spin" />
      </div>
    );
  }
  
  if (projectError) return <ErrorMessage errorMessage={projectError} />;
  if (suppliersError) return <ErrorMessage errorMessage={suppliersError} />;
  if (resourcesError) return <ErrorMessage errorMessage={resourcesError} />;

  return (
    <Permission user={user} allow={adminTypes} fallback={<ErrorMessage errorMessage="No tienes permiso para ver esta página." />} >
      <div className="flex flex-col p-4">
        <div className="w-fit">
          <ReturnButton onClick={navigateToPurchaseOrders} />
        </div>

        <div className="w-full flex flex-col items-center justify-center">
          <form onSubmit={handleSubmit} className="flex flex-col m-2 gap-6 lg:w-[85%] w-full md:border-1 border-gray-100 md:p-12 md:shadow-md shadow-gray-300">

            <PurchaseOrderHeader
              projectName={project?.name ?? ""}
              code={code}
              onChangeCode={setCode}
              errorCode={errors.code}
            />

            <div className="flex flex-col gap-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <SupplierSelectCard
                  suppliers={suppliers ?? []}
                  selectSupplierId={selectSupplierId}
                  onChangeSupplier={(id) => setSelectSupplierId(id)}
                  supplier={supplier ?? undefined}
                  quotation={quotation}
                  setQuotation={setQuotation}
                  errorSupplier={errors.supplierId}
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
                  dniError={errors.dniCarePerson}
                />
              </div>

              <PaymentConditionsCard
                paymentConditions1={paymentConditions1}
                setPaymentConditions1={setPaymentConditions1}
                supplier={supplier || undefined}
                paymentMethod={paymentMethod}
                setPaymentMethod={setPaymentMethod}
                setPaymentConditions={setPaymentConditions}
                errorPaymentMethod={errors.paymentMethod}
                errorPaymentConditions={errors.paymentConditions}
              />

              {/* Frase + selector de tipo de OC */}
              <div className="root-section rs2" style={{ borderTop: "0px", borderBottom: "0px" }}>
                <div className="section-info">
                  <div className="w-full">
                    <p><strong>Señores:</strong> {supplier && (<>{supplier.name}</>)} </p>
                    <div className="flex flex-row flex-wrap w-full items-center gap-2">
                      <p className="text-gray-700 font-bold">Sírvase a suministrarnos los </p>  
                      <Select
                        name="purchaseOrderType"
                        value={purchaseOrderType}
                        onChange={(val) => setPurchaseOrderType(val)}
                        options={[
                          { value: "materials", label: "materiales" },
                          { value: "services", label: "servicios" },
                        ]}
                        error={Boolean(errors.purchaseOrderType)}
                      />
                      <p className="text-gray-700 font-bold"> solicitados siguientes:</p>
                    </div>
                  </div>
                </div>
              </div>

              <ItemsTable
                items={items}
                resources={resources ?? []}
                onChange={handleItemChange}
                onAddRow={addItem}
                onRemoveRow={removeItem}
                supplierCurrency={supplier?.currency}
                saleAmount={sale_amount}
                purchaseAmount={purchase_amount}
                itemErrors={errors.items} 
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
            </ButtonContainer>
          </form>
        </div>
      </div>

      {openSaveModal && (
        <SaveModal
          onOk={onOk}
          message={errorFlag ? [...validationMessages.map(m => `${m}`)].join("\n") : successMessage}
          error={errorFlag}
      />
      )}
    </Permission>
  );
}
