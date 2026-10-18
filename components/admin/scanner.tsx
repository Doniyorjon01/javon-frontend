"use client";

/**
 * Barcode scanner for the back cover of a book (EAN-13 = ISBN-13).
 * Uses the browser's BarcodeDetector where it exists (Chrome on Android),
 * otherwise ZXing (iPhone Safari, Firefox). The camera stops after a hit.
 */
import { useEffect, useRef, useState } from "react";
import { useT } from "../app";
import { IScan } from "../icons";

type Detector = { detect: (src: CanvasImageSource) => Promise<Array<{ rawValue: string }>> };
type DetectorCtor = new (opts: { formats: string[] }) => Detector;

function isBookCode(code: string): boolean {
  const digits = code.replace(/\D/g, "");
  return (digits.length === 13 && /^97[89]/.test(digits)) || digits.length === 10;
}

export function Scanner({ onCode }: { onCode: (code: string) => void }) {
  const d = useT();
  const video = useRef<HTMLVideoElement>(null);
  const [running, setRunning] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const stopRef = useRef<() => void>(() => undefined);
  const onCodeRef = useRef(onCode);
  onCodeRef.current = onCode;

  useEffect(() => () => stopRef.current(), []);

  async function start() {
    setProblem(null);
    const el = video.current;
    if (!el) return;
    if (!navigator.mediaDevices?.getUserMedia) {
      setProblem(d.add.scanUnsupported);
      return;
    }
    setRunning(true);
    const Native = (window as unknown as { BarcodeDetector?: DetectorCtor }).BarcodeDetector;
    try {
      if (Native) {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false });
        el.srcObject = stream;
        await el.play();
        const detector = new Native({ formats: ["ean_13", "ean_8", "upc_a"] });
        let alive = true;
        const stop = () => {
          alive = false;
          stream.getTracks().forEach((t) => t.stop());
          el.srcObject = null;
          setRunning(false);
        };
        stopRef.current = stop;
        const tick = async () => {
          if (!alive) return;
          try {
            const codes = await detector.detect(el);
            const hit = codes.find((c) => isBookCode(c.rawValue));
            if (hit) {
              stop();
              navigator.vibrate?.(80);
              onCodeRef.current(hit.rawValue.replace(/\D/g, ""));
              return;
            }
          } catch {
            /* a frame that could not be read */
          }
          setTimeout(tick, 180);
        };
        void tick();
      } else {
        const { BrowserMultiFormatReader } = await import("@zxing/browser");
        const reader = new BrowserMultiFormatReader();
        const controls = await reader.decodeFromConstraints(
          { video: { facingMode: "environment" }, audio: false },
          el,
          (result) => {
            const text = result?.getText();
            if (text && isBookCode(text)) {
              controls.stop();
              setRunning(false);
              navigator.vibrate?.(80);
              onCodeRef.current(text.replace(/\D/g, ""));
            }
          },
        );
        stopRef.current = () => {
          controls.stop();
          setRunning(false);
        };
      }
    } catch (e) {
      setRunning(false);
      const name = (e as Error).name;
      setProblem(name === "NotAllowedError" || name === "SecurityError" ? d.add.scanPermission : d.add.scanUnsupported);
    }
  }

  return (
    <div className="stack-sm">
      <div className="scanner">
        <video ref={video} muted playsInline />
        {running ? (
          <>
            <div className="frame" aria-hidden="true">
              <span />
              <span />
              <span />
              <span />
              <div className="scanline" />
            </div>
            <div className="cap">{d.add.scanHint}</div>
          </>
        ) : (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <button className="btn btn-saffron" onClick={start}>
              <IScan size={18} /> {d.add.scanStart}
            </button>
          </div>
        )}
      </div>
      {running && (
        <button className="btn btn-soft btn-sm" style={{ alignSelf: "center" }} onClick={() => stopRef.current()}>
          {d.add.scanStop}
        </button>
      )}
      {problem && <div className="note note-warn small">{problem}</div>}
    </div>
  );
}
