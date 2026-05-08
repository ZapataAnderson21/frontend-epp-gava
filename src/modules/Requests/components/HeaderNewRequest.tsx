interface HeaderNewRequestProps {
  showDetailsColumn?: boolean;
  showQuantityColumn?: boolean;
}

export default function HeaderNewRequest({
  showDetailsColumn = false,
  showQuantityColumn = true,
}: HeaderNewRequestProps) {
  const gridClass = getHeaderGridClass(showQuantityColumn);

  return (
    <div className={`hidden w-full max-w-4xl items-center gap-4 px-2 py-4 font-bold lg:grid ${gridClass}`}>
      <span>ELEMENTO</span>
      {showQuantityColumn ? (
        <span>CANTIDAD</span>
      ) : null}
      <span>DESCRIPCION</span>
      <span>{showDetailsColumn ? "DETALLE" : ""}</span>
      <span />
    </div>
  );
}

function getHeaderGridClass(showQuantityColumn: boolean) {
  if (showQuantityColumn) {
    return "lg:grid-cols-[minmax(10rem,1fr)_7rem_minmax(12rem,18rem)_5rem_1.5rem]";
  }

  return "lg:grid-cols-[minmax(10rem,1fr)_minmax(12rem,18rem)_5rem_1.5rem]";
}
