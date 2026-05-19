import { useEffect, useRef } from "react";

interface QRCodeGeneratorProps {
  value: string;
  size?: number;
}

export default function QRCodeGenerator({
  value,
  size = 200,
}: QRCodeGeneratorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current || !value) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Simple QR code generation using a library loaded via CDN
    const script = document.createElement("script");
    script.src =
      "https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js";
    script.async = true;
    script.onload = () => {
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
      }
    };
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, [value, size]);

  return <canvas ref={canvasRef} className="rounded-lg" />;
}
