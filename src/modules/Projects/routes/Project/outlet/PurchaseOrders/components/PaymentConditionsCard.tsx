import { SelectForm, InputForm } from "../../../../../../../common/form";
import type { Supplier } from "../../../../../../../data/types";

interface Props {
  paymentConditions1: string;
  setPaymentConditions1: (v: string) => void;
  paymentConditions2?: string;
  setPaymentConditions2?: (v: string) => void;
  supplier?: Supplier;
  paymentMethod: string;
  setPaymentMethod: (v: string) => void;
  setPaymentConditions: (v: string) => void;  // 👈 nuevo
  errorPaymentMethod?: string;                // 👈 nuevo
  errorPaymentConditions?: string;            // 👈 nuevo
}

export default function PaymentConditionsCard({...props}: Props) {
  const {
    paymentConditions1, setPaymentConditions1,
    paymentConditions2, setPaymentConditions2,
    supplier, paymentMethod, setPaymentMethod,
    setPaymentConditions,
    errorPaymentMethod, errorPaymentConditions,
  } = props;

  return (
    <div>
      <h1 className="text-xl font-bold">CONDICIONES DE PAGO</h1>
      <div className="flex flex-col gap-4 shadow-md shadow-gray-300">
        <div className="border-b-1 border-gray-200 px-4 py-2">
          <div className="flex flex-col gap-1">
            <div className="flex flex-row items-end gap-2">
              <div>
                <SelectForm
                  label="Condiciones de pago"
                  name="paymentConditions1"
                  value={paymentConditions1}
                  onChange={(val) => setPaymentConditions1(val)}
                  options={[
                    { value: "Crédito", label: "Crédito" },
                    { value: "Contado", label: "Contado" },
                  ]}
                  error={Boolean(errorPaymentConditions)}
                />
              </div>
              <p className="mb-2">-</p>
              <div className="max-w-[27rem] flex-1">
                {paymentConditions1 ? (
                  <input
                    className={`w-full p-2 border rounded-sm ${errorPaymentConditions ? "border-red-600" : "border-gray-400"} focus:outline-[#0047a3]`}
                    value={paymentConditions2}
                    onChange={(e) => {
                      setPaymentConditions2 && setPaymentConditions2(e.target.value);
                      setPaymentConditions(`${paymentConditions1} - ${e.target.value}`)
                    }}
                    placeholder="p.ej., 30 días / contra entrega / etc."
                  />
                ) : (
                  <p className="text-gray-500 font-normal text-sm mb-3">(Seleccione primero una condición)</p>
                )}
              </div>
            </div>
            {errorPaymentConditions && <p className="text-xs text-red-600">{errorPaymentConditions}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2 md:grid-cols-2 px-4 pb-4">
          <div>
            <SelectForm
              label="Método de pago"
              name="paymentMethod"
              value={paymentMethod}
              onChange={(val) => setPaymentMethod(val)}
              options={[
                { value: "deposit", label: "Depósito a cuenta corriente" },
                { value: "transfer", label: "Transferencia a cuenta corriente" },
              ]}
            />
            {errorPaymentMethod && <p className="text-xs text-red-600 mt-1">{errorPaymentMethod}</p>}
          </div>

          {supplier && (
            <InputForm
              name="bank"
              label="Cta cte."
              type="text"
              value={`${supplier.bank} (${supplier.currency}) - ${supplier.accountNumber}`}
              onChange={() => {}}
              disabled
            />
          )}
        </div>
      </div>
    </div>
  );
}
