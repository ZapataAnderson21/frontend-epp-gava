interface HeaderNewRequestProps {
  showDetailsColumn?: boolean;
}

export default function HeaderNewRequest({
  showDetailsColumn = false,
}: HeaderNewRequestProps) {
  return (
    <div className="flex w-full flex-row items-center justify-between gap-4 px-2 py-4 font-bold">
      <span className="flex min-w-0 flex-1 items-start justify-start">
        ELEMENTO
      </span>
      <span className="flex w-28 items-start justify-start">UNIDAD</span>
      <span className="flex w-28 items-start justify-start">CANTIDAD</span>
      <span className="flex w-[72px] items-start justify-start">
        {showDetailsColumn ? "DETALLE" : ""}
      </span>
      <span className="flex w-6 items-start justify-start" />
    </div>
  );
}
