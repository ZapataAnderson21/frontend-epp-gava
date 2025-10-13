interface Props {
  projectName: string;
  code: string;
  onChangeCode: (v: string) => void;
}

export default function PurchaseOrderHeader({ projectName, code, onChangeCode }: Props) {
  return (
    <div className="flex flex-col gap-8 text-center">
      <div className="flex flex-row flex-wrap items-center justify-center md:justify-between gap-8">
        <img className="max-h-45 md:max-h-56" src="/pdf-images/Logo-Cabecera-OC.png" alt="Logo" />
        <div className="flex flex-row gap-8 flex-wrap items-center justify-center">
          <img className="h-12 md:h-18 lg:h-24" src="/pdf-images/Logo-ISO9001.jpg" alt="Certificado ISO"/>
          <img className="h-12 md:h-18 lg:h-24" src="/pdf-images/Logo-SGS.png" alt="Certificado SGS"/>
          <img className="h-12 md:h-18 lg:h-24" src="/pdf-images/Logo-HODELPE.jpg" alt="Certificado HODELPE"/>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <h1 className="font-extrabold text-xl">{projectName}</h1>
        <div className="flex flex-col lg:flex-row items-center justify-center gap-2 bg-[#14519d] text-white p-4 text-2xl font-bold">
          <h1>CODIGO DE ORDEN DE COMPRA</h1>
          <input
            className="cursor-text bg-gray-50 border border-gray-400 text-gray-900 text-xl rounded-md focus-visible:ring-2 focus-visible:ring-gray-600 focus:outline-none block max-w-80 p-2.5"
            value={code}
            onChange={(e) => onChangeCode(e.target.value)}
          />
        </div>
        <p className="self-end">
          <span className="font-bold">Fecha:</span> {new Date().toLocaleDateString()}
        </p>
      </div>
    </div>
  );
}
