import type { Supplier } from "../data/types";

type SupplierAccountDetails = Pick<
  Supplier,
  "accountNumber" | "bank" | "currency"
>;

export function formatSupplierAccountDetails(
  supplier?: SupplierAccountDetails | null,
) {
  const bank = supplier?.bank?.trim() ?? "";
  const currency = supplier?.currency?.trim() ?? "";
  const accountNumber = supplier?.accountNumber?.trim() ?? "";
  const bankDetails = [bank, currency ? `(${currency})` : ""]
    .filter(Boolean)
    .join(" ");

  return [bankDetails, accountNumber || "Cuenta no registrada"]
    .filter(Boolean)
    .join(" - ");
}
