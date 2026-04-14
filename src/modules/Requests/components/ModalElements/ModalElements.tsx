import type { ElementRequestType, ElementType } from "../../../../data/types";
import ModalSelect from "../ModalSelect";
import ContentModal from "./ContentModal";
import {
  getInventoryFamilyConfig,
  type InventoryFamilyTabKey,
} from "../../../Elements/inventoryCatalog";

interface ModalElementsProps {
  familyKey: InventoryFamilyTabKey;
  isOpen?: boolean;
  onClose: () => void;
  onSelected: (els: ElementType[], reqs: ElementRequestType[]) => void;
}

export default function ModalElements({ familyKey, isOpen, onClose, onSelected }: ModalElementsProps) {

  if (!isOpen) return null;
  const familyConfig = getInventoryFamilyConfig(familyKey);
  const title = familyConfig?.description ?? "Elementos";

  return (
    <ModalSelect title={title} isOpen={isOpen} onClose={onClose}>
      <ContentModal familyKey={familyKey} onSelected={onSelected} onClose={onClose} />
    </ModalSelect>
  );
} 
