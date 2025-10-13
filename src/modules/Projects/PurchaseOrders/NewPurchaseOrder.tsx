import { useSearchParams, useNavigate } from "react-router-dom";
import { CgSpinner } from "react-icons/cg";
import { FaArrowLeft } from "react-icons/fa6";

import { Button } from "../../../components";
import { ErrorMessage } from "../../../common/error";
import { ButtonContainer, ButtonSubmit } from "../../../common/form";
import SaveModal from "../../../common/form/SaveModal";

import { usePurchaseOrderForm } from "../../../hooks/usePurchaseOrderForm";
import { PurchaseOrderHeader, SupplierSelectCard, DeliveryInfoCard, PaymentConditionsCard, ItemsTable, ConditionsSection, SignaturesTable } from "./components";

export default function NewPurchaseOrder() {
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
    paymentConditions,

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
    <>
      <div className="flex flex-col p-4">
        <Button
          icon={<FaArrowLeft />}
          label="Regresar"
          href={`/admin/purchase-orders?projectId=${projectId}`}
          onClick={() => {}}
          bgColor="#d80027"
          bgHoverColor="#c80008"
        />

        <div className="w-full flex flex-col items-center justify-center">
          <form onSubmit={handleSubmit} className="flex flex-col m-2 gap-6 lg:w-[85%] w-full md:border-1 border-gray-100 md:p-12 md:shadow-md shadow-gray-300">

            <PurchaseOrderHeader
              projectName={project?.name ?? ""}
              code={code}
              onChangeCode={setCode}
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
                paymentConditions={paymentConditions}
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
                          purchaseOrderTypeError={errors.purchaseOrderType}
                        />
                      </div>
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
              <Button
                icon={<FaArrowLeft />}
                label="Regresar"
                bgColor="#d80027"
                bgHoverColor="#c80008"
                href={`/admin/projects/${projectId}`}
                onClick={() => {}}
              />
              <ButtonSubmit label="Guardar" loading={saving} loadingLabel="Guardando..." />
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
    </>
  );
}
