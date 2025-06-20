import Info from "../../Info";
import RequestTypeCard from "./components/RequestTypeCard";
import { FaHelmetSafety } from "react-icons/fa6";
import { FaTools } from "react-icons/fa";
import { type Element, type ElementRequest } from "../../Types";
import { useEffect, useState } from "react";
import BlueButton from "../../BlueButton";
import HeaderNewRequest from "./components/HeaderNewRequest";
import RowElementRequest from "./components/RowElementRequest";

export default function NewRequest() {

  const selectedElements: Element[] = JSON.parse(localStorage.getItem("selectedElements") || "[]");
  const selectedElementRequest: ElementRequest[] = JSON.parse(localStorage.getItem("selectedElementRequest") || "[]");

  const [elements, setElements] = useState<Element[]>(selectedElements);
  const [elementRequests, setElementRequests] = useState<ElementRequest[]>(selectedElementRequest);

  useEffect(() => {
    const handleStorageChange = () => {
      const updatedElements: Element[] = JSON.parse(localStorage.getItem("selectedElements") || "[]");
      setElements(updatedElements);
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  const handleRemoveElement = (element: Element) => {
    const updatedElements = elements.filter((elem) => elem.element_id !== element.element_id);
    const updatedElementRequests = elementRequests.filter((req) => req.element_id !== element.element_id);

    setElements(updatedElements);
    setElementRequests(updatedElementRequests);

    localStorage.setItem("selectedElements", JSON.stringify(updatedElements));
    localStorage.setItem("selectedElementRequest", JSON.stringify(updatedElementRequests));
  };

  const handleChangeElementRequest = (element_id: number, field: keyof ElementRequest, value: string | number) => {
    const updated = elementRequests.map((req) =>
      req.element_id === element_id ? { ...req, [field]: field === "quantity" ? Number(value) : value } : req
    );
    setElementRequests(updated);
    localStorage.setItem("selectedElementRequest", JSON.stringify(updated));
  };

  return (
    <div className="flex flex-col items-start justify-start w-full h-full text-gray-800 p-10">
      <div className="flex flex-row flex-wrap gap-2 items-center justify-between w-full text-[12px] md:text-[14px]">
        <h1 className="text-2xl font-bold mb-4">REGISTRAR SOLICITUD</h1>
      </div>

      <div className="flex flex-col items-start justify-start gap-6 w-full max-w-2xl h-full text-[14px] text-gray-600">
        <span className="font-semibold">Busca los elementos que vas a seleccionar:</span>
        <div className="flex flex-row items-center justify-around gap-4 w-full">
          <RequestTypeCard icon={<FaHelmetSafety className="size-16" />} title="Seguridad" typeElement="security" />
          <RequestTypeCard icon={<FaTools className="size-16" />} title="Operativo" typeElement="operative" />
        </div>
        <div className="flex flex-col items-start gap-2 justify-start w-full">
          {
            selectedElements.length > 0 ? (
              <>
              <span className="font-semibold pt-2 pb-4">Elementos seleccionados:</span>
              <HeaderNewRequest />
                {elements.map((element) => (
                  <RowElementRequest 
                    key={element.element_id}
                    elementRequest={
                      elementRequests.find(req => req.element_id === element.element_id) || 
                      { unit: "", quantity: 0, element_id: element.element_id!, request_id: 0, element: element }
                    }
                    handleRemoveElement={handleRemoveElement}
                    handleChangeElementRequest={handleChangeElementRequest}
                  />
                ))}
                <BlueButton href="#" name="Registrar" onClick={() => {}} />
              </>
            ) : (
              <span className="text-gray-500">No hay elementos seleccionados.</span>
            )
          }
        </div>
      </div>


      <Info />
    </div>
  );
}
