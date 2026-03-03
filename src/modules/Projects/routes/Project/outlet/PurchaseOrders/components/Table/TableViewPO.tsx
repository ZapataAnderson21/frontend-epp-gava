import type { PurchaseOrder } from "../../../../../../../../data/types";

interface TableViewPOProps {
  purchaseOrder: PurchaseOrder;
  seePurchasePrices: boolean;
}

export default function TableViewPO({ purchaseOrder, seePurchasePrices }: TableViewPOProps) {

  const subtotalCompra = purchaseOrder?.resources?.reduce((total, item) => {
    return total + (item.unitPurchasePrice * item.quantity);
  }, 0);

  const subtotalVenta = purchaseOrder?.resources?.reduce((total, item) => {
    return total + (item.unitSalesPrice * item.quantity);
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
              { seePurchasePrices && <td className='p-2 border-1 border-gray-400 text-nowrap'>{purchaseOrder?.supplier?.currency.toUpperCase() === 'PEN' ? 'S/.' : '$'}{item.unitPurchasePrice.toFixed(2)}</td>}
              { seePurchasePrices && <td className='p-2 border-1 border-gray-400 bg-gray-100 text-nowrap'>{purchaseOrder?.supplier?.currency.toUpperCase() === 'PEN' ? 'S/.' : '$'}{(item.quantity*item.unitPurchasePrice).toFixed(2)}</td>}
              <td className='p-2 border-1 border-gray-400 text-nowrap'>{purchaseOrder?.supplier?.currency.toUpperCase() === 'PEN' ? 'S/.' : '$'}{item.unitSalesPrice.toFixed(2)}</td>
              <td className='p-2 border-1 border-gray-400 bg-gray-100 text-nowrap'>{purchaseOrder?.supplier?.currency.toUpperCase() === 'PEN' ? 'S/.' : '$'}{(item.quantity*item.unitSalesPrice).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={seePurchasePrices ? colSpan(5) : colSpan(7)} className='p-2 pr-8 font-bold text-right table-cell'>SUBTOTAL</td>
            { seePurchasePrices && <td className='p-2 border-1 border-gray-400 bg-gray-100'>{purchaseOrder?.supplier?.currency.toUpperCase() === 'PEN' ? 'S/.' : '$'} {subtotalCompra?.toFixed(2)}</td>}
            { seePurchasePrices && <td></td> }
            <td className='p-2 border-1 border-gray-400 bg-gray-100'>{purchaseOrder?.supplier?.currency.toUpperCase() === 'PEN' ? 'S/.' : '$'} {subtotalVenta?.toFixed(2)}</td>
          </tr>
          <tr>
            <td colSpan={seePurchasePrices ? colSpan(5) : colSpan(7)} className='p-2 pr-8 font-bold text-right table-cell'>IGV</td>
            { seePurchasePrices && <td className='p-2 border-1 border-gray-400 bg-gray-100'>{purchaseOrder?.supplier?.currency.toUpperCase() === 'PEN' ? 'S/.' : '$'} {(subtotalCompra ? (subtotalCompra * 0.18).toFixed(2) : 0)}</td>}
            { seePurchasePrices && <td></td> }
            <td className='p-2 border-1 border-gray-400 bg-gray-100'>{purchaseOrder?.supplier?.currency.toUpperCase() === 'PEN' ? 'S/.' : '$'} {subtotalVenta ? (subtotalVenta * 0.18).toFixed(2) : 0}</td>
          </tr>
          <tr>
            <td colSpan={seePurchasePrices ? colSpan(5) : colSpan(7)} className='p-2 pr-8 font-bold text-right table-cell'>TOTAL</td>
            { seePurchasePrices && <td className='p-2 border-1 border-gray-400 bg-gray-800 text-white'>{purchaseOrder?.supplier?.currency.toUpperCase() === 'PEN' ? 'S/.' : '$'} {subtotalCompra ? (subtotalCompra * 1.18).toFixed(2) : 0}</td> }
            { seePurchasePrices && <td></td> }
            <td className='p-2 border-1 border-gray-400 text-white bg-gray-800'>{purchaseOrder?.supplier?.currency.toUpperCase() === 'PEN' ? 'S/.' : '$'} {subtotalVenta ? (subtotalVenta * 1.18).toFixed(2) : 0}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}