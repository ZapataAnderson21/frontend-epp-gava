import type { PurchaseOrder } from "../../../../../../../../data/types";

interface TableViewPOProps {
  purchaseOrder: PurchaseOrder;
  seeSalesPrices: boolean;
}

export default function TableViewPO({ purchaseOrder, seeSalesPrices }: TableViewPOProps) {
  const toNumber = (value: number | string | null | undefined) => {
    if (value === null || value === undefined) return 0;
    return typeof value === "number" ? value : Number(value);
  };

  const currencySymbol = purchaseOrder?.supplier?.currency.toUpperCase() === "PEN" ? "S/." : "$";

  const formatPrice = (value: number | string | null | undefined, decimals = 2) => {
    const numeric = toNumber(value);
    const safe = Number.isFinite(numeric) ? numeric : 0;
    return safe.toFixed(decimals);
  };

  const subtotalCompra = purchaseOrder?.resources?.reduce((total, item) => {
    return total + (toNumber(item.unitPurchasePrice) * toNumber(item.quantity));
  }, 0);

  const subtotalVenta = purchaseOrder?.resources?.reduce((total, item) => {
    return total + (toNumber(item.unitSalesPrice) * toNumber(item.quantity));
  }, 0);

  const colSpan = (qty: number) => (seeSalesPrices ? qty : qty - 2);

  return (
    <div className='overflow-x-auto'>
      <table className='text-center w-full'>
        <thead className='bg-[#14519d] border-1 border-[#14519d] text-white'>
          <tr>
            <th className='p-2 border-r-1 border-[#f3f4f6] text-nowrap'>ID</th>
            <th className='p-2 border-r-1 border-[#f3f4f6] text-nowrap'>DESCRIPCIÓN</th>
            <th className='p-2 border-r-1 border-[#f3f4f6] text-nowrap'>UND</th>
            <th className='p-2 border-r-1 border-[#f3f4f6] text-nowrap'>CANT</th>
            <th className='p-2 border-r-1 border-[#f3f4f6] text-nowrap'>V UNIT</th>
            <th className='p-2 border-r-1 border-[#f3f4f6] text-nowrap'>V PARC</th>
            {seeSalesPrices && <th className='p-2 border-r-1 border-[#f3f4f6] text-nowrap'>V UNIT VENT</th>}
            {seeSalesPrices && <th className='p-2 text-nowrap'>V PARC VENT</th>}
          </tr>
        </thead>
        <tbody className='border-1 border-gray-400'>
          {purchaseOrder?.resources?.reverse().map((item, index) => (
            <tr key={index}>
              <td className='p-2 border-1 border-gray-400'>{index+1}</td>
              <td className='p-2 border-1 border-gray-400 text-nowrap'>{item.resource?.description}</td>
              <td className='p-2 border-1 border-gray-400 text-nowrap'>{item.resource?.unit}</td>
              <td className='p-2 border-1 border-gray-400 text-nowrap'>{item.quantity}</td>
              <td className='p-2 border-1 border-gray-400 text-nowrap'>{currencySymbol}{formatPrice(item.unitPurchasePrice, 4)}</td>
              <td className='p-2 border-1 border-gray-400 bg-gray-100 text-nowrap'>{currencySymbol}{formatPrice(toNumber(item.quantity) * toNumber(item.unitPurchasePrice), 2)}</td>
              {seeSalesPrices && <td className='p-2 border-1 border-gray-400 text-nowrap'>{currencySymbol}{formatPrice(item.unitSalesPrice, 2)}</td>}
              {seeSalesPrices && <td className='p-2 border-1 border-gray-400 bg-gray-100 text-nowrap'>{currencySymbol}{formatPrice(toNumber(item.quantity) * toNumber(item.unitSalesPrice), 2)}</td>}
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={seeSalesPrices ? colSpan(5) : colSpan(7)} className='p-2 pr-8 font-bold text-right table-cell'>SUBTOTAL</td>
            <td className='p-2 border-1 border-gray-400 bg-gray-100'>{currencySymbol} {formatPrice(subtotalCompra, 2)}</td>
            { seeSalesPrices && <td></td> }
            { seeSalesPrices && <td className='p-2 border-1 border-gray-400 bg-gray-100'>{currencySymbol} {formatPrice(subtotalVenta, 2)}</td>}
          </tr>
          <tr>
            <td colSpan={seeSalesPrices ? colSpan(5) : colSpan(7)} className='p-2 pr-8 font-bold text-right table-cell'>IGV</td>
            <td className='p-2 border-1 border-gray-400 bg-gray-100'>{currencySymbol} {formatPrice(subtotalCompra ? subtotalCompra * 0.18 : 0, 2)}</td>
            { seeSalesPrices && <td></td> }
            { seeSalesPrices && <td className='p-2 border-1 border-gray-400 bg-gray-100'>{currencySymbol} {formatPrice(subtotalVenta ? subtotalVenta * 0.18 : 0, 2)}</td>}
          </tr>
          <tr>
            <td colSpan={seeSalesPrices ? colSpan(5) : colSpan(7)} className='p-2 pr-8 font-bold text-right table-cell'>TOTAL</td>
            <td className='p-2 border-1 border-gray-400 bg-gray-800 text-white'>{currencySymbol} {formatPrice(subtotalCompra ? subtotalCompra * 1.18 : 0, 2)}</td>
            { seeSalesPrices && <td></td> }
            { seeSalesPrices && <td className='p-2 border-1 border-gray-400 text-white bg-gray-800'>{currencySymbol} {formatPrice(subtotalVenta ? subtotalVenta * 1.18 : 0, 2)}</td>}
          </tr>
        </tfoot>
      </table>
    </div>
  );
}