import type { InventoryFamilyTabKey } from "../../Elements/inventoryCatalog";
import { requestFamilyTabs } from "../requestFamilies";

interface RequestFamilyTabsProps {
  activeFamily: InventoryFamilyTabKey;
  onChange: (family: InventoryFamilyTabKey) => void;
}

export default function RequestFamilyTabs({
  activeFamily,
  onChange,
}: RequestFamilyTabsProps) {
  return (
    <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-3">
      {requestFamilyTabs.map((tab) => {
        const active = tab.key === activeFamily;

        return (
          <button
            key={tab.key}
            type="button"
            onClick={() => onChange(tab.key)}
            className={`rounded-t-md border-b-2 px-4 py-2 text-sm font-semibold transition-colors ${
              active
                ? "border-[#0047a3] text-[#0047a3]"
                : "border-transparent text-gray-400 hover:text-gray-700"
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
