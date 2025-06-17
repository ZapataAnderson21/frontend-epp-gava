import type React from "react";

interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  href?: string;
}

export default function SidebarItem({ icon, label, href }: SidebarItemProps) {
  return (
    <a className="w-full" href={href}>
      <div tabIndex={0} className="flex flex-row items-center justify-start gap-4 py-4 px-4 hover:bg-[#eff2ff]
                                  hover:text-[#0047a3] hover:shadow-[#c8d1f3] hover:shadow-md focus:bg-[#e0e5f6] focus:text-[#0047a3]
                                  focus:shadow-[#c8d1f3] focus:shadow-sm w-full cursor-pointer rounded-sm mb-2">
        {icon}
        {label}
      </div>
    </a>
  );
}