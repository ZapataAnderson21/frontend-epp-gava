export default function SignaturesTable() {
  return (
    <table className="text-center border-1">
      <thead className="bg-[#14519d] border-1 border-[#14519d] text-white">
        <tr>
          <th className="p-2 border-r-1 border-gray-100">Elaboración</th>
          <th className="p-2 border-r-1 border-gray-100">Autorización</th>
          <th className="p-2 border-gray-100">Seguimiento y Control</th>
        </tr>
      </thead>
      <tbody className="border-1 border-gray-400">
        <tr>
          <td className="p-2 border-1 border-gray-400">Angi Gonzales Cotrina</td>
          <td className="p-2 border-1 border-gray-400">Henrry Gayoso Valdera</td>
          <td className="p-2 border-1 border-gray-400">Angi Gonzales Cotrina</td>
        </tr>
      </tbody>
    </table>
  );
}
