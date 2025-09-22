export default function LoadingSkeletonTable() {
  return (
    <div className="animate-pulse">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-100">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              <div className="h-6 bg-gray-300 rounded"></div>
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              <div className="h-6 bg-gray-300 rounded"></div>
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              <div className="h-6 bg-gray-300 rounded"></div>
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {Array.from({ length: 5 }).map((_, index) => (
            <tr key={index}>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="h-6 bg-gray-300 rounded"></div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="h-6 bg-gray-300 rounded"></div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="h-6 bg-gray-300 rounded"></div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
