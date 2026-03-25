import { useRef } from "react";
import { IoCloseCircle } from "react-icons/io5";
import type { WorkerMonthlyEvaluationPeriodDetail } from "../../data/types";

interface BestWorkerCertificateModalProps {
  detail: WorkerMonthlyEvaluationPeriodDetail;
  onClose: () => void;
}

function formatMonthName(month: number) {
  return new Date(2000, month - 1, 1).toLocaleDateString("es-PE", {
    month: "long",
  });
}

function findBestWorker(detail: WorkerMonthlyEvaluationPeriodDetail) {
  const evaluated = detail.workers.filter(
    (w) => w.evaluated && w.totalScore !== null,
  );

  if (evaluated.length === 0) return null;

  return evaluated.reduce((best, current) => {
    if ((current.totalScore ?? 0) > (best.totalScore ?? 0)) return current;
    if (
      (current.totalScore ?? 0) === (best.totalScore ?? 0) &&
      current.fullName.localeCompare(best.fullName) < 0
    )
      return current;
    return best;
  });
}

const PRINT_STYLES = `
@media print {
  body * { visibility: hidden !important; }
  #best-worker-certificate,
  #best-worker-certificate * { visibility: visible !important; }
  #best-worker-certificate {
    position: fixed !important;
    inset: 0 !important;
    z-index: 99999 !important;
    width: 100vw !important;
    height: 100vh !important;
    margin: 0 !important;
    padding: 0 !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    background: white !important;
  }
  .certificate-inner {
    width: 100% !important;
    max-width: none !important;
    height: 100% !important;
    border-radius: 0 !important;
    box-shadow: none !important;
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
  onClose,
}: BestWorkerCertificateModalProps) {
  const styleRef = useRef<HTMLStyleElement | null>(null);

  const bestWorker = findBestWorker(detail);
  const monthLabel = formatMonthName(detail.month);
  const yearLabel = detail.year;

  const handlePrint = () => {
    if (!styleRef.current) {
      const style = document.createElement("style");
      style.textContent = PRINT_STYLES;
      document.head.appendChild(style);
      styleRef.current = style;
    }

    setTimeout(() => {
      window.print();
    }, 100);
  };

  if (!bestWorker) {
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

  const scoreText =
    bestWorker.totalScore !== null && bestWorker.maxScore !== null
      ? `${bestWorker.totalScore} / ${bestWorker.maxScore}`
      : "-";

  return (
    <div className="fixed inset-0 z-[60] bg-black/40 flex items-center justify-center">
      <div className="bg-white rounded-xl w-[min(1100px,96vw)] p-6 relative overflow-y-auto max-h-[95vh]">
        {/* Action bar */}
        <div className="flex items-center justify-between mb-4 no-print">
          <h2 className="text-xl font-extrabold">
            Certificado — Mejor trabajador del mes
          </h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="px-5 py-2 rounded-md bg-[#0047a3] hover:bg-[#003366] text-white font-semibold"
              onClick={handlePrint}
            >
              🖨️ Imprimir
            </button>
            <button type="button" onClick={onClose}>
              <IoCloseCircle className="size-8" />
            </button>
          </div>
        </div>

        {/* Certificate */}
        <div
          id="best-worker-certificate"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
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
              boxShadow:
                "0 0 0 2px #c9a84c, 0 8px 32px rgba(0,0,0,0.12)",
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
              {bestWorker.fullName}
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
              {bestWorker.performanceLabel ? (
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
                  {bestWorker.performanceLabel}
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
    </div>
  );
}
