import type { PurchaseOrder } from "../../../../../data/types";

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
            {seePurchasePrices && <th className='p-2 border-r-1 border-[#f3f4f6] text-nowrap'>PR UNIT COMP</th>}
            <th className='p-2 border-r-1 border-[#f3f4f6] text-nowrap'>PR UNIT {seePurchasePrices ? 'VENT' : ''}</th>
            {seePurchasePrices && <th className='p-2 border-r-1 border-[#f3f4f6] text-nowrap'>PR PARC COMP</th>}
            <th className='p-2 text-nowrap'>PR PARC {seePurchasePrices ? 'VENT' : ''}</th>
          </tr>
        </thead>
        <tbody className='border-1 border-gray-400'>
          {purchaseOrder?.resources?.map((item, index) => (
            <tr key={index}>
              <td className='p-2 border-1 border-gray-400'>{index+1}</td>
              <td className='p-2 border-1 border-gray-400 text-nowrap'>{item.resource?.description}</td>
              <td className='p-2 border-1 border-gray-400 text-nowrap'>{item.resource?.unit}</td>
              <td className='p-2 border-1 border-gray-400 text-nowrap'>{item.quantity}</td>
              { seePurchasePrices && <td className='p-2 border-1 border-gray-400 text-nowrap'>{purchaseOrder?.supplier?.currency.toUpperCase() === 'SOLES' ? 'S/.' : '$'}{item.unitPurchasePrice}</td>}
              <td className='p-2 border-1 border-gray-400 text-nowrap'>{purchaseOrder?.supplier?.currency.toUpperCase() === 'SOLES' ? 'S/.' : '$'}{item.unitSalesPrice}</td>
              { seePurchasePrices && <td className='p-2 border-1 border-gray-400 bg-gray-100 text-nowrap'>{purchaseOrder?.supplier?.currency.toUpperCase() === 'SOLES' ? 'S/.' : '$'}{item.quantity*item.unitPurchasePrice}</td>}
              <td className='p-2 border-1 border-gray-400 bg-gray-100 text-nowrap'>{purchaseOrder?.supplier?.currency.toUpperCase() === 'SOLES' ? 'S/.' : '$'}{item.quantity*item.unitSalesPrice}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={seePurchasePrices ? colSpan(6) : colSpan(7)} className='p-2 pr-8 font-bold text-right table-cell'>SUBTOTAL</td>
            { seePurchasePrices && <td className='p-2 border-1 border-gray-400 bg-gray-100'>{purchaseOrder?.supplier?.currency.toUpperCase() === 'SOLES' ? 'S/.' : '$'} {subtotalCompra?.toFixed(2)}</td>}
            <td className='p-2 border-1 border-gray-400 bg-gray-100'>{purchaseOrder?.supplier?.currency.toUpperCase() === 'SOLES' ? 'S/.' : '$'} {subtotalVenta?.toFixed(2)}</td>
          </tr>
          <tr>
            <td colSpan={colSpan(7)} className='p-2 pr-8 font-bold text-right table-cell'>IGV</td>
            <td className='p-2 border-1 border-gray-400 bg-gray-100'>{purchaseOrder?.supplier?.currency.toUpperCase() === 'SOLES' ? 'S/.' : '$'} {subtotalVenta ? (subtotalVenta * 0.18).toFixed(2) : 0}</td>
          </tr>
          <tr>
            <td colSpan={colSpan(7)} className='p-2 pr-8 font-bold text-right table-cell'>TOTAL</td>
            <td className='p-2 border-1 border-gray-400 text-white bg-gray-800'>{purchaseOrder?.supplier?.currency.toUpperCase() === 'SOLES' ? 'S/.' : '$'} {subtotalVenta ? (subtotalVenta * 1.18).toFixed(2) : 0}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}