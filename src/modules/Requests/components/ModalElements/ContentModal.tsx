import { useEffect, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import { FaSave } from "react-icons/fa";
import { FaDeleteLeft } from "react-icons/fa6";

import type { ElementRequestType, ElementType } from "../../../../data/types";
import { elementApi, elementRequestApi } from "../../../../data/apiUrl";
import LoadingSkeletonTable from "../../../../common/loading/LoadingSkeletonTable";
import Button from "../../../../components/Button";
import { useApiAction } from "../../../../hooks/useApiAction";
import { useFetch } from "../../../../hooks/useFetch";
import {
  getInventoryBackendPayload,
  getInventoryFamilyFromSource,
  type InventoryFamilyTabKey,
} from "../../../Elements/inventoryCatalog";
import {
  attachRequestLineKeys,
  createElementRequestLine,
  getUniqueElementsFromLines,
} from "../../requestLineUtils";
import HeaderModal from "./HeaderModal";

interface ContentModalProps {
  familyKey: InventoryFamilyTabKey;
  onSelected: (els: ElementType[], reqs: ElementRequestType[]) => void;
  onClose: () => void;
}

export default function ContentModal({
  familyKey,
  onSelected,
  onClose,
}: ContentModalProps) {
  const [elements, setElements] = useState<ElementType[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [originalIds, setOriginalIds] = useState<number[]>([]);
  const [searchItem, setSearchItem] = useState("");
  const [pages, setPages] = useState<number>(1);
  const [currentPage, setCurrentPage] = useState<number>(1);

  const itemsPerPage = 5;
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentElements = elements
    .filter((item) => item.name?.toLowerCase().includes(searchItem.toLowerCase()))
    .slice(indexOfFirstItem, indexOfLastItem);

  const { id } = useParams();
  const location = useLocation();
  const isNewRequest = location.pathname.endsWith("/new");

  const backendPayload = getInventoryBackendPayload(familyKey);
  const isProtectionGroup = familyKey === "epp";
  const { data: fetchedElements, loading, error } = useFetch<ElementType[]>(
    isProtectionGroup ? elementApi : `${elementApi}family/${backendPayload.family}`,
    [backendPayload.family, isProtectionGroup],
  );
  const { data: fetchedElementRequests } = useFetch<ElementRequestType[]>(
    id ? `${elementRequestApi}request/${id}` : "",
    [id],
  );

  const { execute: createElementRequest } = useApiAction<any>();
  const { execute: deleteElementRequest } = useApiAction<any>();

  useEffect(() => {
    if (!fetchedElements) return;
    const visibleElements = isProtectionGroup
      ? fetchedElements.filter((element) =>
          ["epp", "epi", "uniform"].includes(getInventoryFamilyFromSource(element)),
        )
      : fetchedElements;
    setElements(visibleElements);
    setPages(Math.max(1, Math.ceil(visibleElements.length / itemsPerPage)));
  }, [fetchedElements, isProtectionGroup]);

  useEffect(() => {
    if (isNewRequest) {
      const saved = localStorage.getItem("selectedElements");
      if (saved) {
        const parsed: ElementType[] = JSON.parse(saved);
        setSelectedIds(
          parsed
            .map((item) => item.elementId)
            .filter((elementId): elementId is number => elementId !== undefined),
        );
      }
      return;
    }

    if (!fetchedElementRequests) return;
    const ids = fetchedElementRequests.map((elementRequest) => elementRequest.elementId);
    setSelectedIds(ids);
    setOriginalIds(ids);
  }, [isNewRequest, fetchedElementRequests]);

  const handleCheckboxChange = (elementId?: number) => {
    if (elementId === undefined) return;
    setSelectedIds((prev) =>
      prev.includes(elementId)
        ? prev.filter((id) => id !== elementId)
        : [...prev, elementId],
    );
  };

  const handleNewRequestSelection = () => {
    const previousLines = attachRequestLineKeys(
      JSON.parse(localStorage.getItem("selectedElementRequest") || "[]"),
    );
    const modalElementIds = new Set(elements.map((element) => element.elementId));
    const selectedElements = elements.filter((element) => selectedIds.includes(element.elementId));
    const selectedElementIds = new Set(selectedElements.map((element) => element.elementId));

    const keepFromOtherGroups = previousLines.filter(
      (requestLine) => !modalElementIds.has(requestLine.elementId),
    );
    const keptSelectedLines = previousLines
      .filter((requestLine) => modalElementIds.has(requestLine.elementId))
      .filter((requestLine) => selectedElementIds.has(requestLine.elementId))
      .map((requestLine) => ({
        ...requestLine,
        element:
          selectedElements.find((element) => element.elementId === requestLine.elementId) ??
          requestLine.element,
      }));
    const newLines = selectedElements
      .filter(
        (element) =>
          !keptSelectedLines.some((requestLine) => requestLine.elementId === element.elementId),
      )
      .map((element) => createElementRequestLine(element));

    const nextReqs = attachRequestLineKeys([
      ...keepFromOtherGroups,
      ...keptSelectedLines,
      ...newLines,
    ]);
    const nextElements = getUniqueElementsFromLines(nextReqs, selectedElements);

    onSelected(nextElements, nextReqs);
    onClose();
  };

  const handleDraftSelection = async () => {
    if (!id) return;

    const requestId = Number(id);
    const added = selectedIds.filter((selectedId) => !originalIds.includes(selectedId));
    const removed = originalIds.filter((originalId) => !selectedIds.includes(originalId));
    const createdResponses: ElementRequestType[] = [];

    for (const addId of added) {
      const response = await createElementRequest(`${elementRequestApi}`, "POST", {
        elementId: addId,
        quantityRequested: 0,
        unit: "",
        lineItemOrder: (fetchedElementRequests?.length || 0) + createdResponses.length + 1,
        requestId,
      });

      if (response?.statusCode === 201) {
        createdResponses.push(response.data);
      }
    }

    if (fetchedElementRequests) {
      for (const removeId of removed) {
        const linesToDelete = fetchedElementRequests.filter(
          (requestLine) => requestLine.elementId === removeId,
        );

        for (const itemToDelete of linesToDelete) {
          if (itemToDelete.elementRequestId !== undefined) {
            await deleteElementRequest(
              `${elementRequestApi}${itemToDelete.elementRequestId}`,
              "DELETE",
            );
          }
        }
      }
    }

    const baseLines = attachRequestLineKeys(
      (fetchedElementRequests || []).filter(
        (requestLine) => !removed.includes(requestLine.elementId),
      ),
    );
    const nextReqs = attachRequestLineKeys([...baseLines, ...createdResponses]);
    const nextElements = getUniqueElementsFromLines(nextReqs, elements);

    onSelected(nextElements, nextReqs);
    setOriginalIds(selectedIds);
    onClose();
  };

  const onClick = async () => {
    if (isNewRequest) {
      handleNewRequestSelection();
      return;
    }

    await handleDraftSelection();
  };

  if (loading) return <LoadingSkeletonTable />;
  if (error) {
    return <div className="flex h-full w-full items-center justify-center">{error}</div>;
  }

  return (
    <>
      <div className="px-3">
        <div className="flex w-full flex-row items-center justify-between rounded-md border border-gray-300 px-2 py-1">
          <input
            type="text"
            className="size-full p-1 outline-none"
            placeholder="Buscar por nombre..."
            value={searchItem}
            onChange={(e) => setSearchItem(e.target.value)}
          />
          <FaDeleteLeft
            className="size-6 cursor-pointer hover:scale-110"
            onClick={() => setSearchItem("")}
          />
        </div>
      </div>
      <HeaderModal />
      <div className="flex w-full flex-col items-center justify-between gap-4 px-6 pt-4 text-[14px] md:text-[16px]">
        {currentElements.map((item) => (
          <div
            key={item.elementId ?? item.name}
            className="flex w-full items-center justify-between"
          >
            <span className="flex w-12 items-center justify-start">{item.elementId}</span>
            <span className="flex w-full items-center justify-start">{item.name}</span>
            <input
              type="checkbox"
              className="size-4 p-2"
              checked={item.elementId !== undefined && selectedIds.includes(item.elementId)}
              onChange={() => handleCheckboxChange(item.elementId)}
            />
          </div>
        ))}
        <div className="mt-4 flex w-full flex-row justify-end gap-2 font-bold">
          {Array.from({ length: pages }, (_, index) => (
            <div
              key={index}
              className={`cursor-pointer rounded-md border-2 px-3 py-2 hover:bg-gray-100 ${
                currentPage === index + 1 ? "bg-gray-300" : ""
              }`}
              onClick={() => setCurrentPage(index + 1)}
            >
              {index + 1}
            </div>
          ))}
        </div>
        <Button
          icon={<FaSave />}
          label="Guardar"
          type="button"
          bgColor="#0047a3"
          bgHoverColor="#003366"
          onClick={onClick}
        />
      </div>
    </>
  );
}
