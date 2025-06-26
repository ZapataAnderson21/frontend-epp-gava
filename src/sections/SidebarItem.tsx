import type React from "react";
import { MdOutlineArrowDropDown } from "react-icons/md";

interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  href?: string;
  isRoot?: boolean;
  isOpen?: boolean;
  onClick?: () => void;
}

export default function SidebarItem({ icon, label, href, isRoot, isOpen, onClick }: SidebarItemProps) {
  return (
    <a className="w-full" href={href}  onClick={onClick}>
      <div tabIndex={0} className="flex flex-row items-center justify-between gap-4 py-4 px-4 hover:bg-[#eff2ff]
                                  hover:text-[#0047a3] hover:shadow-[#c8d1f3] hover:shadow-md focus:bg-[#e0e5f6] focus:text-[#0047a3]
                                  focus:shadow-[#c8d1f3] focus:shadow-sm w-full cursor-pointer rounded-sm mb-2">
        <div className="flex flex-row items-center gap-4">
          {icon}
          {label}
        </div>
        {isRoot && (isOpen ? (<MdOutlineArrowDropDown className="rotate-180" />) : (<MdOutlineArrowDropDown />))}
      </div>
    </a>
  );
}