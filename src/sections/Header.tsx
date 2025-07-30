export default function Header() {

  const user = localStorage.getItem("user");
    const parsedUser = user ? JSON.parse(user) : null;  

  return (
    <section className="col-span-2 row-span-1 flex items-center justify-center w-full h-[90px] shadow-xs">
        <div className="flex flex-row items-center justify-between w-full p-8">
          <div className="flex flex-row items-center justify-start gap-4">
            <img src="/logo-gava.png" alt="Logo" className="h-14" />
          </div>
          <div>
            <div className="flex flex-row items-center justify-center gap-4">
              <div className="hidden sm:flex flex-col items-end justify-center">
                <span className="text-gray-700 font-bold text-nowrap">{parsedUser?.name} {parsedUser?.last_name}</span>
                <span className="text-gray-800 text-sm font-extrabold">{parsedUser?.userUserTypes[0]?.userType.name}</span>
              </div>
              <div className="flex items-center justify-center border border-gray-300 rounded-full size-14">
                <img src="/buho-gava.webp" alt="Logo-Buho" className="h-14" />
              </div>
            </div>
          </div>
        </div>
      </section>
  )
}