import { NotificationBell } from "../components";

export default function Header() {

  const user = localStorage.getItem("user");
    const parsedUser = user ? JSON.parse(user) : null;  

  return (
    <section className="col-span-1 row-span-1 flex items-center justify-end w-full h-[90px] shadow-xs">
        <div className="flex flex-row items-center justify-end w-full p-8">
          <div>
            <div className="flex flex-row items-center justify-center gap-6">
              <NotificationBell />              
              <div className="flex flex-col items-end justify-center">
                <span className="text-gray-700 font-bold text-nowrap">{parsedUser?.name} {parsedUser?.last_name}</span>
                <span className="text-gray-800 text-xs font-extrabold">{parsedUser?.userType}</span>
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