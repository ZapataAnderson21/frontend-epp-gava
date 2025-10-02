interface LoadingSkeletonFormProps {
  numberRows: number;
}

export default function LoadingSkeletonForm({ numberRows }: LoadingSkeletonFormProps) {
  return (
    <div className="flex flex-col items-start justify-start w-full h-full text-gray-800 p-10">
      <div className="flex flex-row flex-wrap gap-2 items-center justify-between w-full">
        <div className="h-8 bg-gray-300 rounded animate-pulse w-64 mb-4"></div>
      </div>
      <div className="flex flex-col items-start justify-start gap-4 w-full h-full text-gray-600">
        <div className="flex flex-col gap-4 w-full max-w-2xl">
          {Array.from({ length: numberRows }).map((_, index) => (
            <div key={index} className="flex flex-col gap-2">
              <div className="h-4 bg-gray-300 rounded animate-pulse w-16"></div>
              <div className="h-10 bg-gray-300 rounded-sm animate-pulse w-full"></div>
            </div>
          ))}
          <div className="flex flex-row items-center justify-center gap-2 mt-2">
            <div className="h-10 bg-gray-300 rounded-md animate-pulse w-full"></div>
            <div className="h-10 bg-gray-300 rounded-md animate-pulse w-full"></div>
          </div>
        </div>
      </div>
    </div>
      );
    }