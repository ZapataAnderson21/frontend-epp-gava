import { useRef, useState, useEffect } from "react";
import { IoCloseCircle } from "react-icons/io5";
import type {
  WorkerMonthlyEvaluationPeriodDetail,
  WorkerMonthlyEvaluationPeriodWorker,
} from "../../data/types";

interface BestWorkerCertificateModalProps {
  detail: WorkerMonthlyEvaluationPeriodDetail;
  rankingMap: Map<number, number>;
  onClose: () => void;
}

function formatMonthName(month: number) {
  return new Date(2000, month - 1, 1).toLocaleDateString("es-PE", {
    month: "long",
  });
}

function findFirstPlaceWorkers(
  detail: WorkerMonthlyEvaluationPeriodDetail,
  rankingMap: Map<number, number>,
): WorkerMonthlyEvaluationPeriodWorker[] {
  return detail.workers
    .filter((w) => rankingMap.get(w.workerId) === 1)
    .sort((a, b) => a.fullName.localeCompare(b.fullName));
}

const PRINT_STYLES = `
@media print {
  html, body {
    height: 100vh !important;
    width: 100vw !important;
    overflow: hidden !important;
    margin: 0 !important;
    padding: 0 !important;
  }
  body * { visibility: hidden !important; }
  .print-target, .print-target * { visibility: visible !important; }
  .print-target {
    position: fixed !important;
    top: 0 !important;
    left: 0 !important;
    width: 100vw !important;
    height: 100vh !important;
    margin: 0 !important;
    padding: 0 !important;
    display: block !important;
    background: white !important;
    z-index: 99999 !important;
  }
  .certificate-inner {
    width: 100vw !important;
    height: 100vh !important;
    max-width: none !important;
    max-height: none !important;
    aspect-ratio: auto !important;
    margin: 0 !important;
    padding: 30px 40px !important;
    border-radius: 0 !important;
    box-shadow: none !important;
    box-sizing: border-box !important;
  }
  .no-print { display: none !important; }
  @page {
    size: landscape;
    margin: 0;
  }
}
`;

export default function BestWorkerCertificateModal({
  detail,
  rankingMap,
  onClose,
}: BestWorkerCertificateModalProps) {
  const styleRef = useRef<HTMLStyleElement | null>(null);
  const [printingId, setPrintingId] = useState<number | null>(null);

  useEffect(() => {
    const handleAfterPrint = () => setPrintingId(null);
    window.addEventListener("afterprint", handleAfterPrint);
    return () => window.removeEventListener("afterprint", handleAfterPrint);
  }, []);

  const firstPlaceWorkers = findFirstPlaceWorkers(detail, rankingMap);
  const monthLabel = formatMonthName(detail.month);
  const yearLabel = detail.year;

  const handlePrint = (workerId: number) => {
    if (!styleRef.current) {
      const style = document.createElement("style");
      style.textContent = PRINT_STYLES;
      document.head.appendChild(style);
      styleRef.current = style;
    }

    setPrintingId(workerId);
    setTimeout(() => {
      window.print();
    }, 100);
  };

  if (firstPlaceWorkers.length === 0) {
    return (
      <div className="fixed inset-0 z-[60] bg-black/40 flex items-center justify-center">
        <div className="bg-white rounded-xl w-[min(500px,92vw)] p-6 relative">
          <h2 className="text-xl font-extrabold mb-3">Sin resultados</h2>
          <p className="text-gray-600">
            No hay trabajadores evaluados en este periodo para generar un
            certificado.
          </p>
          <button
            type="button"
            className="absolute right-3 top-3"
            onClick={onClose}
          >
            <IoCloseCircle className="size-8" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[60] bg-black/40 flex items-center justify-center">
      <div className="bg-white rounded-xl w-[min(1100px,96vw)] p-6 relative overflow-y-auto max-h-[95vh]">
        {/* Action bar */}
        <div className="flex items-center justify-between mb-6 no-print">
          <div className="flex flex-col">
            <h2 className="text-2xl font-extrabold text-[#0047a3] mb-1">
              🏆 Certificados Emitidos
            </h2>
            <p className="text-gray-600 font-medium">
              Mejor trabajador del mes • {firstPlaceWorkers.length} {firstPlaceWorkers.length === 1 ? 'ganador' : 'ganadores (empate)'}
            </p>
          </div>
          <button type="button" onClick={onClose} className="hover:opacity-75 transition-opacity">
            <IoCloseCircle className="size-10 text-gray-400 hover:text-red-500 transition-colors" />
          </button>
        </div>

        {/* Certificates */}
        <div className="flex flex-col gap-10">
          {firstPlaceWorkers.map((worker) => {
            const scoreText =
              worker.totalScore !== null && worker.maxScore !== null
                ? `${worker.totalScore} / ${worker.maxScore}`
                : "-";
            const isPrinting = printingId === worker.workerId;

            return (
              <div
                key={worker.workerId}
                className="border border-gray-200 rounded-xl p-6 bg-gray-50/50"
              >
                <div className="flex items-center justify-between mb-6 no-print bg-amber-50 rounded-lg px-5 py-4 border border-amber-200">
                  <h3 className="font-bold text-xl text-amber-900 border-l-4 border-amber-500 pl-4">
                    {worker.fullName}
                  </h3>
                  <button
                    type="button"
                    className="px-6 py-2.5 rounded-md bg-[#0047a3] hover:bg-[#003366] text-white font-semibold flex items-center gap-2 shadow-sm transition-colors"
                    onClick={() => handlePrint(worker.workerId)}
                  >
                    🖨️ Imprimir
                  </button>
                </div>

                <div
                  className={`certificate-page ${isPrinting ? "print-target" : ""}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "10px",
                    margin: "0 auto",
                    maxWidth: "960px",
                    background: "white",
                    borderRadius: "8px",
                  }}
              >
                <div
                  className="certificate-inner"
                  style={{
                    width: "100%",
                    maxWidth: "960px",
                    aspectRatio: "1.414 / 1",
                    background:
                      "linear-gradient(135deg, #fffdf5 0%, #fff9e6 40%, #fffdf5 100%)",
                    border: "8px solid transparent",
                    borderImage:
                      "linear-gradient(135deg, #c9a84c 0%, #f4d078 25%, #c9a84c 50%, #f4d078 75%, #c9a84c 100%) 1",
                    borderRadius: "4px",
                    boxShadow: "0 0 0 2px #c9a84c, 0 8px 32px rgba(0,0,0,0.12)",
                    padding: "48px 56px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    position: "relative",
                    overflow: "hidden",
                    fontFamily: "'Georgia', 'Times New Roman', serif",
                  }}
                >
            {/* Corner decorations */}
            <div
              style={{
                position: "absolute",
                top: "16px",
                left: "16px",
                width: "60px",
                height: "60px",
                borderTop: "3px solid #c9a84c",
                borderLeft: "3px solid #c9a84c",
              }}
            />
            <div
              style={{
                position: "absolute",
                top: "16px",
                right: "16px",
                width: "60px",
                height: "60px",
                borderTop: "3px solid #c9a84c",
                borderRight: "3px solid #c9a84c",
              }}
            />
            <div
              style={{
                position: "absolute",
                bottom: "16px",
                left: "16px",
                width: "60px",
                height: "60px",
                borderBottom: "3px solid #c9a84c",
                borderLeft: "3px solid #c9a84c",
              }}
            />
            <div
              style={{
                position: "absolute",
                bottom: "16px",
                right: "16px",
                width: "60px",
                height: "60px",
                borderBottom: "3px solid #c9a84c",
                borderRight: "3px solid #c9a84c",
              }}
            />

            {/* Header: GAVA logo left, certification logos right */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                width: "100%",
                marginBottom: "12px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <img
                  src="/logo-gava.png"
                  alt="GAVA C&C S.R.L."
                  style={{
                    height: "60px",
                    objectFit: "contain",
                  }}
                />
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                <img
                  src="/pdf-images/hodelpe-logo-sin-fondo.png"
                  alt="HODELPE — Homologaciones del Perú"
                  style={{
                    height: "48px",
                    objectFit: "contain",
                    borderRadius: "4px",
                  }}
                />
                <img
                  src="/pdf-images/Logo-ISO9001.jpg"
                  alt="ISO 9001 — Quality Management"
                  style={{
                    height: "48px",
                    objectFit: "contain",
                    borderRadius: "4px",
                  }}
                />
                <img
                  src="/pdf-images/Logo-SGS.png"
                  alt="SGS Homologado"
                  style={{
                    height: "48px",
                    objectFit: "contain",
                    borderRadius: "4px",
                  }}
                />
              </div>
            </div>

            {/* Divider */}
            <div
              style={{
                width: "200px",
                height: "2px",
                background:
                  "linear-gradient(90deg, transparent, #c9a84c, transparent)",
                marginBottom: "20px",
              }}
            />

            {/* Title */}
            <h1
              style={{
                fontSize: "28px",
                fontWeight: 800,
                color: "#1a1a1a",
                textAlign: "center",
                letterSpacing: "5px",
                textTransform: "uppercase",
                marginBottom: "4px",
                lineHeight: 1.3,
              }}
            >
              Certificado de Reconocimiento
            </h1>

            <p
              style={{
                fontSize: "16px",
                color: "#cca539ff",
                fontWeight: 600,
                letterSpacing: "4px",
                textTransform: "uppercase",
                marginBottom: "24px",
              }}
            >
              Mejor Trabajador del Mes
            </p>

            {/* Divider */}
            <div
              style={{
                width: "300px",
                height: "1px",
                background:
                  "linear-gradient(90deg, transparent, #c9a84c, transparent)",
                marginBottom: "20px",
              }}
            />

            {/* Message */}
            <p
              style={{
                fontSize: "14px",
                color: "#555",
                textAlign: "center",
                marginBottom: "12px",
                fontStyle: "italic",
              }}
            >
              Se otorga el presente certificado a
            </p>

            {/* Worker name */}
            <h2
              style={{
                fontSize: "34px",
                fontWeight: 800,
                color: "#0047a3",
                textAlign: "center",
                marginBottom: "12px",
                lineHeight: 1.2,
                borderBottom: "2px solid #c9a84c",
                paddingBottom: "8px",
                paddingLeft: "40px",
                paddingRight: "40px",
              }}
            >
              {worker.fullName}
            </h2>

            {/* Period */}
            <p
              style={{
                fontSize: "15px",
                color: "#333",
                textAlign: "center",
                marginBottom: "8px",
              }}
            >
              Por su destacado desempeño durante el periodo de evaluación de
            </p>
            <p
              style={{
                fontSize: "20px",
                fontWeight: 700,
                color: "#1a1a1a",
                textTransform: "capitalize",
                marginBottom: "16px",
              }}
            >
              {monthLabel} {yearLabel}
            </p>

            {/* Score badges */}
            <div
              style={{
                display: "flex",
                gap: "24px",
                marginBottom: "24px",
                flexWrap: "wrap",
                justifyContent: "center",
              }}
            >
              <div
                style={{
                  background: "#0047a3",
                  color: "white",
                  padding: "8px 20px",
                  borderRadius: "8px",
                  fontSize: "14px",
                  fontWeight: 700,
                  fontFamily: "'Arial', sans-serif",
                }}
              >
                Puntaje: {scoreText}
              </div>
              {worker.performanceLabel ? (
                <div
                  style={{
                    background: "#c9a84c",
                    color: "white",
                    padding: "8px 20px",
                    borderRadius: "8px",
                    fontSize: "14px",
                    fontWeight: 700,
                    fontFamily: "'Arial', sans-serif",
                  }}
                >
                  {worker.performanceLabel}
                </div>
              ) : null}
            </div>

            {/* Bottom divider */}
            <div
              style={{
                width: "200px",
                height: "2px",
                background:
                  "linear-gradient(90deg, transparent, #c9a84c, transparent)",
                marginBottom: "16px",
              }}
            />

            {/* Certification logos row */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "28px",
                marginBottom: "12px",
                flexWrap: "wrap",
              }}
            >
              <div
                style={{
                  fontSize: "40px",
                  lineHeight: 1,
                }}
              >
                🏆
              </div>
            </div>

                  <p
                    style={{
                      fontSize: "11px",
                      color: "#CCC",
                      textAlign: "center",
                      fontFamily: "'Arial', sans-serif",
                    }}
                  >
                    Documento generado automáticamente por el sistema SIR-GAVA
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      </div>
    </div>
  );
}
