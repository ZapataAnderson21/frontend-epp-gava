import { useEffect, useRef, useState } from "react";
import SignaturePad from "signature_pad";
import { canSubmitSignature, runExclusively, signatureBlobError } from "./ssomaRules";
import type { SsomaWorker } from "./ssomaTypes";

interface SignatureCaptureProps {
  worker: SsomaWorker;
  saving?: boolean;
  onCancel: () => void;
  onSubmit: (signature: Blob) => Promise<void>;
}

function canvasBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("No se pudo preparar la imagen PNG de la firma."));
    }, "image/png");
  });
}

export default function SignatureCapture({
  worker,
  saving = false,
  onCancel,
  onSubmit,
}: SignatureCaptureProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const padRef = useRef<SignaturePad | null>(null);
  const submitLock = useRef(false);
  const [empty, setEmpty] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const busy = saving || submitting;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const pad = new SignaturePad(canvas, {
      backgroundColor: "rgb(255, 255, 255)",
      penColor: "rgb(15, 23, 42)",
      minWidth: 0.8,
      maxWidth: 2.5,
    });
    padRef.current = pad;
    let priorWidth = 0;
    let priorHeight = 0;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const width = Math.max(1, rect.width);
      const height = Math.max(1, rect.height);
      const scaleX = priorWidth > 0 ? width / priorWidth : 1;
      const scaleY = priorHeight > 0 ? height / priorHeight : 1;
      const data = pad.toData().map((group) => ({
        ...group,
        points: group.points.map((point) => ({
          ...point,
          x: point.x * scaleX,
          y: point.y * scaleY,
        })),
      }));
      const ratio = Math.max(window.devicePixelRatio || 1, 1);
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      canvas.getContext("2d")?.setTransform(ratio, 0, 0, ratio, 0, 0);
      pad.clear();
      if (data.length) pad.fromData(data);
      priorWidth = width;
      priorHeight = height;
      setEmpty(pad.isEmpty());
    };

    const preventTouchScroll = (event: TouchEvent) => event.preventDefault();
    canvas.addEventListener("touchmove", preventTouchScroll, { passive: false });
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    window.addEventListener("resize", resize);
    window.addEventListener("orientationchange", resize);
    resize();

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", resize);
      window.removeEventListener("orientationchange", resize);
      canvas.removeEventListener("touchmove", preventTouchScroll);
      pad.clear();
      pad.off();
      padRef.current = null;
    };
  }, []);

  const clear = () => {
    padRef.current?.clear();
    setEmpty(true);
    setError("");
  };

  const submit = async () => {
    const pad = padRef.current;
    const canvas = canvasRef.current;
    if (!pad || !canvas) return;
    if (!canSubmitSignature(pad.isEmpty())) {
      setError("La firma está vacía. Dibuja la firma antes de confirmar.");
      return;
    }

    await runExclusively(submitLock, async () => {
      setSubmitting(true);
      setError("");
      try {
        const blob = await canvasBlob(canvas);
        const validationError = signatureBlobError(blob);
        if (validationError) throw new Error(validationError);
        await onSubmit(blob);
        pad.clear();
        setEmpty(true);
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "No se pudo registrar la firma.");
      } finally {
        setSubmitting(false);
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/50 p-0 sm:items-center sm:p-4" role="presentation">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="ssoma-signature-title"
        className="w-full max-w-xl rounded-t-2xl bg-white p-4 shadow-xl sm:rounded-2xl sm:p-6"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-blue-700">Confirmación de identidad</p>
            <h2 id="ssoma-signature-title" className="mt-1 text-xl font-bold text-slate-900">Firma de {worker.fullName}</h2>
            <p className="mt-1 text-sm text-slate-600">DNI: {worker.dni}</p>
          </div>
          <button type="button" disabled={busy} onClick={() => { clear(); onCancel(); }} className="min-h-10 rounded-lg px-3 font-semibold text-slate-700 hover:bg-slate-100">Cancelar</button>
        </div>

        <p className="mt-4 text-sm text-slate-600">Firma dentro del recuadro. Al continuar, la imagen se enviará al servidor y no se guardará en este dispositivo.</p>
        <div className="mt-3 overflow-hidden rounded-xl border-2 border-dashed border-slate-300 bg-white">
          <canvas
            ref={canvasRef}
            aria-label={`Área de firma de ${worker.fullName}`}
            className="block h-56 w-full touch-none sm:h-64"
            style={{ touchAction: "none" }}
            onPointerUp={() => setEmpty(padRef.current?.isEmpty() ?? true)}
            onPointerCancel={() => setEmpty(padRef.current?.isEmpty() ?? true)}
          />
        </div>

        {(error || empty) && <p className={`mt-2 text-sm ${error ? "text-red-700" : "text-slate-500"}`} role={error ? "alert" : "status"}>{error || "Aún no se ha dibujado una firma."}</p>}
        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button type="button" disabled={busy || empty} onClick={clear} className="min-h-11 rounded-lg border border-slate-300 px-4 font-semibold text-slate-800 disabled:opacity-50">Limpiar firma</button>
          <button type="button" disabled={busy || empty} onClick={submit} className="min-h-11 rounded-lg bg-blue-700 px-5 font-semibold text-white disabled:opacity-50">{busy ? "Enviando firma…" : "Confirmar firma"}</button>
        </div>
      </section>
    </div>
  );
}
