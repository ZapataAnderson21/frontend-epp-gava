import { useEffect, useState } from 'react';
import type { ElementRequestType, ElementType, OfficeInventoryEntry } from '../../../../data/types';
import CellTableSummary from './CellTableSummary';
import {
  getFallProtectionGroupParts,
  getRequestLineElementLabel,
  getRequestLineFamily,
} from '../../requestLineUtils';

interface RowTableSummaryProps {
  elementRequest: ElementRequestType;
  onQuantityChange: (id: number, quantity: number) => void;
  onSafetySelectionChange?: (id: number, selectedElementIds: number[]) => void;
  selectedSafetyElementIds?: number[];
  safetyElements?: ElementType[];
  officeEntries?: OfficeInventoryEntry[];
}

function getSafetyTypeName(element?: ElementType | null) {
  return (element?.categoryName || element?.name || 'Sin tipo').trim();
}

function getOfficeStock(elementId: number, officeEntries: OfficeInventoryEntry[] = []) {
  return officeEntries
    .filter(
      (entry) =>
        entry.elementId === elementId &&
        entry.status !== 'disposed' &&
        Number(entry.currentStock || 0) > 0,
    )
    .reduce((total, entry) => total + Number(entry.currentStock || 0), 0);
}

function getElementOptionLabel(element: ElementType) {
  return element.code ? `${element.name} - ${element.code}` : element.name;
}

function getElementSecondaryLabel(element: ElementType) {
  const details = [
    element.serialNumber ? `Serie: ${element.serialNumber}` : null,
    element.brand ? `Marca: ${element.brand}` : null,
    element.model ? `Modelo: ${element.model}` : null,
  ].filter(Boolean);

  return details.length > 0 ? details.join(' | ') : element.description || 'Sin detalle registrado';
}

function getFallProtectionGroupOfficeStock(
  elementRequest: ElementRequestType,
  officeEntries: OfficeInventoryEntry[] = [],
) {
  const group = elementRequest.fallProtectionGroup;
  const partIds = [
    group?.harnessElementId,
    group?.anchorBandElementId,
    group?.lifelineElementId,
    group?.positioningLanyardElementId,
  ].filter((id): id is number => typeof id === 'number');

  if (partIds.length === 0) return 0;

  return partIds.every((elementId) => getOfficeStock(elementId, officeEntries) > 0)
    ? 1
    : 0;
}

export default function RowTableSummary({
  elementRequest,
  onQuantityChange,
  onSafetySelectionChange,
  selectedSafetyElementIds: controlledSelectedElementIds,
  safetyElements = [],
  officeEntries = [],
}: RowTableSummaryProps) {
  const family = getRequestLineFamily(elementRequest);
  const initialQuantity =
    elementRequest.elementRequestResponses?.[0]?.quantityAccepted ??
    (family === 'harness' ? 1 : 0);
  const [quantityAccepted, setQuantityAccepted] = useState<number>(initialQuantity);
  const savedSelectedElementIds =
    elementRequest.elementRequestResponses?.[0]?.selectedElementIds || [];
  const savedSelectedElementIdsKey = savedSelectedElementIds.join(',');
  const [localSelectedElementIds, setLocalSelectedElementIds] =
    useState<number[]>(savedSelectedElementIds);
  const selectedElementIds =
    family === 'ese' && Array.isArray(controlledSelectedElementIds)
      ? controlledSelectedElementIds
      : localSelectedElementIds;

  useEffect(() => {
    setQuantityAccepted(initialQuantity);
  }, [initialQuantity]);

  useEffect(() => {
    if (Array.isArray(controlledSelectedElementIds)) return;
    setLocalSelectedElementIds(savedSelectedElementIds);
  }, [controlledSelectedElementIds, savedSelectedElementIdsKey]);
  const fallProtectionParts = getFallProtectionGroupParts(elementRequest);
  const requestedSafetyType = getSafetyTypeName(elementRequest.element);
  const safetyOptions = safetyElements.filter(
    (element) =>
      getSafetyTypeName(element) === requestedSafetyType &&
      getOfficeStock(element.elementId, officeEntries) > 0,
  );
  const requestedQuantity = Number(elementRequest.quantityRequested || 0);
  const acceptedSafetyQuantity = selectedElementIds.length;
  const officeStock =
    family === 'ese'
      ? safetyOptions.reduce(
          (total, element) => total + getOfficeStock(element.elementId, officeEntries),
          0,
        )
      : family === 'harness'
        ? getFallProtectionGroupOfficeStock(elementRequest, officeEntries)
        : getOfficeStock(elementRequest.elementId, officeEntries);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value);
    setQuantityAccepted(value);
    if (typeof elementRequest.elementRequestId === 'number') {
      onQuantityChange(elementRequest.elementRequestId, value);
    }
  };

  const handleSafetySelectionChange = (elementId: number, checked: boolean) => {
    const selectedIds = checked
      ? Array.from(new Set([...selectedElementIds, elementId]))
      : selectedElementIds.filter((selectedElementId) => selectedElementId !== elementId);

    if (!Array.isArray(controlledSelectedElementIds)) {
      setLocalSelectedElementIds(selectedIds);
    }
    setQuantityAccepted(selectedIds.length);
    if (typeof elementRequest.elementRequestId === 'number') {
      onSafetySelectionChange?.(elementRequest.elementRequestId, selectedIds);
      onQuantityChange(elementRequest.elementRequestId, selectedIds.length);
    }
  };

  const handleFallProtectionDecision = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = Number(e.target.value);
    setQuantityAccepted(value);
    if (typeof elementRequest.elementRequestId === 'number') {
      onQuantityChange(elementRequest.elementRequestId, value);
    }
  };

  return (
    <div className="w-full min-w-[840px]">
      <div className="grid w-full h-full text-[14px] text-gray-700 gap-1 mt-1" style={{ gridTemplateColumns: '1fr 118px 104px 104px 112px' }}>
        <div className="flex items-center border-2 border-gray-800 h-full text-start px-3 py-1 rounded-md overflow-hidden w-full">
          <div className="flex w-full flex-col items-center justify-center gap-0.5 break-words text-center">
            <span>{getRequestLineElementLabel(elementRequest)}</span>
            {fallProtectionParts.length > 0 && (
              <span className="text-[11px] leading-tight text-gray-500">
                {fallProtectionParts.join(" | ")}
              </span>
            )}
          </div>
        </div>
        <CellTableSummary value={elementRequest.unit} className="w-full" />
        <CellTableSummary value={officeStock} className="w-full" />
        <CellTableSummary value={elementRequest.quantityRequested} className="w-full" />
        {family === 'ese' ? (
          <div className="flex items-center justify-center rounded-md border-2 border-gray-800 bg-yellow-400 px-3 py-1 font-semibold">
            {acceptedSafetyQuantity}
          </div>
        ) : family === 'harness' ? (
          <select
            className="border-2 border-gray-800 w-full h-full text-center px-2 py-1 rounded-md bg-yellow-400 font-semibold"
            value={quantityAccepted}
            onChange={handleFallProtectionDecision}
          >
            <option value={1}>Aceptar</option>
            <option value={0}>Cancelar</option>
          </select>
        ) : (
          <input
            type="number"
            className="border-2 border-gray-800 w-full h-full text-center px-3 py-1 rounded-md bg-yellow-400 font-semibold"
            placeholder={elementRequest.quantityRequested.toString()}
            value={quantityAccepted}
            onChange={handleChange}
          />
        )}
      </div>

      {family === 'ese' ? (
        <div className="mt-2 rounded-md border border-gray-300 bg-gray-50 p-3">
          <div className="mb-2 flex items-center justify-between gap-3">
            <p className="text-sm font-bold text-gray-900">
              Equipos fisicos para enviar
            </p>
            <p className="text-xs font-semibold text-gray-600">
              {acceptedSafetyQuantity} de {requestedQuantity} seleccionado(s)
            </p>
          </div>

          {safetyOptions.length === 0 ? (
            <p className="rounded-md border border-dashed border-gray-300 bg-white p-3 text-sm text-gray-500">
              No hay equipos fisicos disponibles en oficina para este tipo.
            </p>
          ) : (
            <div className="overflow-hidden rounded-md border border-gray-300 bg-white">
              <div className="grid grid-cols-[1fr_96px_88px] gap-2 bg-gray-100 px-3 py-2 text-xs font-extrabold uppercase text-gray-700">
                <span>Equipo fisico</span>
                <span className="text-center">Stock ofic.</span>
                <span className="text-center">Enviar</span>
              </div>
              {safetyOptions.map((element) => {
                const checked = selectedElementIds.includes(element.elementId);
                const maxReached = requestedQuantity > 0 && selectedElementIds.length >= requestedQuantity;
                const disabled = !checked && maxReached;

                return (
                  <label
                    key={element.elementId}
                    className={`grid cursor-pointer grid-cols-[1fr_96px_88px] items-center gap-2 border-t px-3 py-2 text-sm transition ${
                      checked
                        ? 'border-blue-200 bg-blue-50'
                        : disabled
                          ? 'border-gray-200 opacity-60'
                          : 'border-gray-200 hover:bg-blue-50'
                    }`}
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-bold text-gray-900">
                        {getElementOptionLabel(element)}
                      </span>
                      <span className="block text-xs text-gray-500">
                        {getElementSecondaryLabel(element)}
                      </span>
                    </span>
                    <span className="text-center font-bold text-gray-800">
                      {getOfficeStock(element.elementId, officeEntries)}
                    </span>
                    <span className="flex justify-center">
                      <input
                        type="checkbox"
                        className="size-4"
                        checked={checked}
                        disabled={disabled}
                        onChange={(event) =>
                          handleSafetySelectionChange(
                            element.elementId,
                            event.target.checked,
                          )
                        }
                      />
                    </span>
                  </label>
                );
              })}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
