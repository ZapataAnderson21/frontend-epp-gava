import { SelectForm, InputForm } from "../../../../common/form";
import type { Supplier } from "../../../../data/types";

interface Props {
  paymentConditions1: string;
  setPaymentConditions1: (v: string) => void;
  supplier?: Supplier;
  paymentMethod: string;
  setPaymentMethod: (v: string) => void;
  paymentConditions: string;
  setPaymentConditions: (v: string) => void;  // 👈 nuevo
  errorPaymentMethod?: string;                // 👈 nuevo
  errorPaymentConditions?: string;            // 👈 nuevo
}

export default function PaymentConditionsCard({...props}: Props) {
  const {
    paymentConditions1, setPaymentConditions1,
    supplier, paymentMethod, setPaymentMethod,
    paymentConditions, setPaymentConditions,
    errorPaymentMethod, errorPaymentConditions,
  } = props;

  return (
    <div>
      <h1 className="text-xl font-bold">CONDICIONES DE PAGO</h1>
      <div className="flex flex-col gap-4 shadow-md shadow-gray-300">
        <div className="border-b-1 border-gray-200 px-4 py-2">
          <div className="flex flex-col gap-1">
            <div className="flex flex-row items-center gap-2">
              <select
                className="p-[10px] border bg-gray-50 border-gray-400 rounded-md"
                value={paymentConditions1}
                onChange={(e) => setPaymentConditions1(e.target.value)}
              >
                <option value="" disabled>Seleccionar...</option>
                <option value="Crédito">Crédito</option>
                <option value="Contado">Contado</option>
              </select>
              <p>-</p>
              <div>
                {paymentConditions1 ? (
                  <input
                    className={`w-full p-2 border rounded-md bg-gray-50 ${errorPaymentConditions ? "border-red-600" : "border-gray-400"}`}
                    onChange={(e) => setPaymentConditions(`${paymentConditions1} - ${e.target.value}`)}
                    placeholder="p.ej., 30 días / contra entrega / etc."
                  />
                ) : (
                  <p className="text-gray-500 font-normal text-sm">(Seleccione primero una condición)</p>
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
                { value: "deposit", label: "Depósito a Cta. cte." },
                { value: "transfer", label: "Transferencia Cta. cte." },
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
