import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Principal } from "@dfinity/principal";
import { AlertCircle, Camera, SwitchCamera } from "lucide-react";
import { useEffect } from "react";
import { useQRScanner } from "../qr-code/useQRScanner";

interface ScanToPaySheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onScanSuccess: (principal: Principal) => void;
}

export default function ScanToPaySheet({
  open,
  onOpenChange,
  onScanSuccess,
}: ScanToPaySheetProps) {
  const {
    qrResults,
    isScanning,
    isActive,
    isSupported,
    error,
    canStartScanning,
    startScanning,
    stopScanning,
    switchCamera,
    videoRef,
    canvasRef,
  } = useQRScanner({
    facingMode: "environment",
    scanInterval: 100,
  });

  // Auto-start scanning when sheet opens
  useEffect(() => {
    if (open && canStartScanning && !isActive) {
      startScanning();
    }
    if (!open && isActive) {
      stopScanning();
    }
  }, [open, canStartScanning, isActive, startScanning, stopScanning]);

  // Handle scan results
  useEffect(() => {
    if (qrResults.length > 0) {
      const latestResult = qrResults[0];
      try {
        const principal = Principal.fromText(latestResult.data);
        stopScanning();
        onScanSuccess(principal);
      } catch (_error) {
        // Invalid principal format, ignore
      }
    }
  }, [qrResults, onScanSuccess, stopScanning]);

  const isMobile =
    /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent,
    );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[90vh]">
        <SheetHeader>
          <SheetTitle>Scan QR Code</SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {isSupported === false && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Camera not supported on this device
              </AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error.message}</AlertDescription>
            </Alert>
          )}

          {/* Camera Preview */}
          <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-black">
            <video
              ref={videoRef}
              className="h-full w-full object-cover"
              playsInline
              muted
            />
            <canvas ref={canvasRef} className="hidden" />

            {/* Scanning Overlay */}
            {isScanning && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-48 w-48 border-4 border-teal rounded-lg animate-pulse" />
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="flex gap-2">
            {!isActive && (
              <Button
                onClick={startScanning}
                disabled={!canStartScanning}
                className="flex-1 bg-teal hover:bg-teal-dark"
              >
                <Camera className="mr-2 h-4 w-4" />
                Start Camera
              </Button>
            )}

            {isActive && isMobile && (
              <Button
                onClick={switchCamera}
                variant="outline"
                className="flex-1"
              >
                <SwitchCamera className="mr-2 h-4 w-4" />
                Switch Camera
              </Button>
            )}
          </div>

          <p className="text-center text-sm text-muted-foreground">
            Point your camera at a QR code to scan
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
