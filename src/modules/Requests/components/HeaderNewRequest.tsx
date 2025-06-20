export default function HeaderNewRequest() {
  return (
    <div className="flex flex-row items-center justify-between w-full pt-2 px-4 font-bold gap-4 text-[14px] md:text-[16px]">
      <span className="flex items-start justify-start w-36">
        <a href="#">ELEMENTO</a>
      </span>
      <span className="flex items-start justify-start w-24">
        <a href="#">UNIDAD</a>
      </span>
      <span className="flex items-start justify-start w-12 sm:w-24">
        <a href="#">CANTIDAD</a>
      </span>
      <span className="flex items-start justify-start w-6">
        <a href="#"></a>
      </span>
    </div>
  );
}