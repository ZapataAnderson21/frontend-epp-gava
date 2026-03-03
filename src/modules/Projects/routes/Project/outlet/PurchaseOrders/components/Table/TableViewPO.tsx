import type { PurchaseOrder } from "../../../../../../../../data/types";

interface TableViewPOProps {
  purchaseOrder: PurchaseOrder;
  seePurchasePrices: boolean;
}

export default function TableViewPO({ purchaseOrder, seePurchasePrices }: TableViewPOProps) {
  const toNumber = (value: number | string | null | undefined) => {
    if (value === null || value === undefined) return 0;
    return typeof value === "number" ? value : Number(value);
  };

  const currencySymbol = purchaseOrder?.supplier?.currency.toUpperCase() === "PEN" ? "S/." : "$";

  const formatPrice = (value: number | string | null | undefined) => {
    const numeric = toNumber(value);
    const safe = Number.isFinite(numeric) ? numeric : 0;
    return safe.toFixed(2);
  };

  const subtotalCompra = purchaseOrder?.resources?.reduce((total, item) => {
    return total + (toNumber(item.unitPurchasePrice) * toNumber(item.quantity));
  }, 0);

  const subtotalVenta = purchaseOrder?.resources?.reduce((total, item) => {
    return total + (toNumber(item.unitSalesPrice) * toNumber(item.quantity));
  }, 0);

  const colSpan = (qty: number) => {
    return seePurchasePrices ? qty : qty - 2;
  }

  return (
    <div className='overflow-x-auto'>
      <table className='text-center w-full'>
        <thead className='bg-[#14519d] border-1 border-[#14519d] text-white'>
          <tr>
            <th className='p-2 border-r-1 border-[#f3f4f6] text-nowrap'>ID</th>
            <th className='p-2 border-r-1 border-[#f3f4f6] text-nowrap'>DESCRIPCIÓN</th>
            <th className='p-2 border-r-1 border-[#f3f4f6] text-nowrap'>UND</th>
            <th className='p-2 border-r-1 border-[#f3f4f6] text-nowrap'>CANT</th>
            {seePurchasePrices && <th className='p-2 border-r-1 border-[#f3f4f6] text-nowrap'>V UNIT</th>}
            {seePurchasePrices && <th className='p-2 border-r-1 border-[#f3f4f6] text-nowrap'>V PARC</th>}
            <th className='p-2 border-r-1 border-[#f3f4f6] text-nowrap'>V UNIT {seePurchasePrices ? 'VENT' : ''}</th>
            <th className='p-2 text-nowrap'>V PARC {seePurchasePrices ? 'VENT' : ''}</th>
          </tr>
        </thead>
        <tbody className='border-1 border-gray-400'>
          {purchaseOrder?.resources?.map((item, index) => (
            <tr key={index}>
              <td className='p-2 border-1 border-gray-400'>{index+1}</td>
              <td className='p-2 border-1 border-gray-400 text-nowrap'>{item.resource?.description}</td>
              <td className='p-2 border-1 border-gray-400 text-nowrap'>{item.resource?.unit}</td>
              <td className='p-2 border-1 border-gray-400 text-nowrap'>{item.quantity}</td>
              { seePurchasePrices && <td className='p-2 border-1 border-gray-400 text-nowrap'>{currencySymbol}{formatPrice(item.unitPurchasePrice)}</td>}
              { seePurchasePrices && <td className='p-2 border-1 border-gray-400 bg-gray-100 text-nowrap'>{currencySymbol}{formatPrice(toNumber(item.quantity) * toNumber(item.unitPurchasePrice))}</td>}
              <td className='p-2 border-1 border-gray-400 text-nowrap'>{currencySymbol}{formatPrice(item.unitSalesPrice)}</td>
              <td className='p-2 border-1 border-gray-400 bg-gray-100 text-nowrap'>{currencySymbol}{formatPrice(toNumber(item.quantity) * toNumber(item.unitSalesPrice))}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={seePurchasePrices ? colSpan(5) : colSpan(7)} className='p-2 pr-8 font-bold text-right table-cell'>SUBTOTAL</td>
            { seePurchasePrices && <td className='p-2 border-1 border-gray-400 bg-gray-100'>{currencySymbol} {formatPrice(subtotalCompra)}</td>}
            { seePurchasePrices && <td></td> }
            <td className='p-2 border-1 border-gray-400 bg-gray-100'>{currencySymbol} {formatPrice(subtotalVenta)}</td>
          </tr>
          <tr>
            <td colSpan={seePurchasePrices ? colSpan(5) : colSpan(7)} className='p-2 pr-8 font-bold text-right table-cell'>IGV</td>
            { seePurchasePrices && <td className='p-2 border-1 border-gray-400 bg-gray-100'>{currencySymbol} {formatPrice(subtotalCompra ? subtotalCompra * 0.18 : 0)}</td>}
            { seePurchasePrices && <td></td> }
            <td className='p-2 border-1 border-gray-400 bg-gray-100'>{currencySymbol} {formatPrice(subtotalVenta ? subtotalVenta * 0.18 : 0)}</td>
          </tr>
          <tr>
            <td colSpan={seePurchasePrices ? colSpan(5) : colSpan(7)} className='p-2 pr-8 font-bold text-right table-cell'>TOTAL</td>
            { seePurchasePrices && <td className='p-2 border-1 border-gray-400 bg-gray-800 text-white'>{currencySymbol} {formatPrice(subtotalCompra ? subtotalCompra * 1.18 : 0)}</td> }
            { seePurchasePrices && <td></td> }
            <td className='p-2 border-1 border-gray-400 text-white bg-gray-800'>{currencySymbol} {formatPrice(subtotalVenta ? subtotalVenta * 1.18 : 0)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}