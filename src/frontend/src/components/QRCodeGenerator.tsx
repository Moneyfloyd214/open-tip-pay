import { useEffect, useRef } from "react";

interface QRCodeGeneratorProps {
  value: string;
  size?: number;
  onCanvasReady?: (canvas: HTMLCanvasElement) => void;
}

export default function QRCodeGenerator({
  value,
  size = 200,
  onCanvasReady,
}: QRCodeGeneratorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current || !value) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const renderQR = () => {
      // @ts-ignore - QRCode is loaded from CDN
      if (window.QRCode) {
        // @ts-ignore
        window.QRCode.toCanvas(canvas, value, {
          width: size,
          margin: 2,
          color: {
            dark: "#1A2B3C",
            light: "#FFFFFF",
          },
        });
        onCanvasReady?.(canvas);
      }
    };

    // If the library is already loaded (e.g. sheet was opened before), render immediately
    // @ts-ignore
    if (window.QRCode) {
      renderQR();
      return;
    }

    // Otherwise inject the script once and render on load
    const script = document.createElement("script");
    script.src =
      "https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js";
    script.async = true;
    script.onload = renderQR;
    document.body.appendChild(script);

    return () => {
      // Only remove if it hasn't finished loading yet (avoid removing after renderQR ran)
      if (!script.dataset.loaded) {
        try {
          document.body.removeChild(script);
        } catch (_) {
          /* already removed */
        }
      }
    };
  }, [value, size, onCanvasReady]);

  return <canvas ref={canvasRef} className="rounded-lg" />;
}
