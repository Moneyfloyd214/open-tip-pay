import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CircleAlert as AlertCircle, Loader as Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import QRCodeGenerator from "./QRCodeGenerator";

interface NFCTapToTipProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (principal: string) => void;
}

export default function NFCTapToTip({
  open,
  onOpenChange,
  onSuccess,
}: NFCTapToTipProps) {
  const { clerkUserId } = useAuth();
  const [mode, setMode] = useState<"share" | "receive">("share");
  const [isNFCSupported, setIsNFCSupported] = useState<boolean | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showQRFallback, setShowQRFallback] = useState(false);

  const principal = clerkUserId ?? "";

  useEffect(() => {
    // Check NFC support
    if ("NDEFReader" in window) {
      setIsNFCSupported(true);
    } else {
      setIsNFCSupported(false);
      setShowQRFallback(true);
    }
  }, []);

  useEffect(() => {
    if (!open) {
      setIsScanning(false);
      setError(null);
      setShowQRFallback(false);
      setMode("share");
    }
  }, [open]);

  const handleShareNFC = async () => {
    if (!isNFCSupported) {
      setShowQRFallback(true);
      return;
    }

    try {
      setIsScanning(true);
      setError(null);

      // @ts-ignore - NDEFReader is not in TypeScript types yet
      const ndef = new NDEFReader();

      await ndef.write({
        records: [
          {
            recordType: "text",
            data: principal,
          },
        ],
      });

      toast.success("Tap your phone to another device to share!");

      // Haptic feedback
      if (navigator.vibrate) {
        navigator.vibrate([100, 50, 100]);
      }
    } catch (err: any) {
      console.error("NFC write error:", err);

      if (err.name === "NotAllowedError") {
        setError(
          "NFC permission denied. Please enable NFC in your device settings.",
        );
      } else if (err.name === "NotSupportedError") {
        setError("NFC is not supported on this device.");
        setShowQRFallback(true);
      } else {
        setError("Failed to write NFC tag. Falling back to QR code.");
        setShowQRFallback(true);
      }
    } finally {
      setIsScanning(false);
    }
  };

  const handleReceiveNFC = async () => {
    if (!isNFCSupported) {
      setShowQRFallback(true);
      return;
    }

    try {
      setIsScanning(true);
      setError(null);

      // @ts-ignore - NDEFReader is not in TypeScript types yet
      const ndef = new NDEFReader();
      await ndef.scan();

      toast.success("Ready to scan! Tap another device...");

      ndef.addEventListener("reading", ({ message }: any) => {
        for (const record of message.records) {
          if (record.recordType === "text") {
            const textDecoder = new TextDecoder(record.encoding);
            const principalString = textDecoder.decode(record.data);

            try {
              if (!principalString.trim()) throw new Error("empty");

              // Haptic feedback
              if (navigator.vibrate) {
                navigator.vibrate([100, 50, 100]);
              }

              toast.success("Contact received!");
              onSuccess(principalString.trim());
              onOpenChange(false);
            } catch (_err) {
              setError("Invalid contact data received");
            }
          }
        }
      });

      ndef.addEventListener("readingerror", () => {
        setError("Failed to read NFC tag. Please try again.");
        setIsScanning(false);
      });
    } catch (err: any) {
      console.error("NFC scan error:", err);

      if (err.name === "NotAllowedError") {
        setError(
          "NFC permission denied. Please enable NFC in your device settings.",
        );
      } else if (err.name === "NotSupportedError") {
        setError("NFC is not supported on this device.");
        setShowQRFallback(true);
      } else {
        setError("Failed to start NFC scan. Falling back to QR code.");
        setShowQRFallback(true);
      }
      setIsScanning(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card/95 backdrop-blur-xl border-teal/30">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <img
              src="/assets/generated/nfc-tap-icon.dim_32x32.png"
              alt="NFC"
              className="h-6 w-6"
            />
            Tap to Pay
          </DialogTitle>
          <DialogDescription className="text-white/70">
            {showQRFallback
              ? "NFC is not available. Use QR code instead."
              : "Share or receive payment links by tapping phones together"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {!showQRFallback && isNFCSupported && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={() => setMode("share")}
                  variant={mode === "share" ? "default" : "outline"}
                  className={
                    mode === "share"
                      ? "bg-teal hover:bg-teal-dark"
                      : "border-teal/30 bg-muted/50 text-white hover:bg-teal/20"
                  }
                >
                  Share My Link
                </Button>
                <Button
                  onClick={() => setMode("receive")}
                  variant={mode === "receive" ? "default" : "outline"}
                  className={
                    mode === "receive"
                      ? "bg-teal hover:bg-teal-dark"
                      : "border-teal/30 bg-muted/50 text-white hover:bg-teal/20"
                  }
                >
                  Receive Link
                </Button>
              </div>

              {error && (
                <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-3 flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-red-400 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              )}

              <div className="glassmorphism rounded-xl p-8 border-2 border-teal/30 text-center space-y-4">
                <div className="relative mx-auto w-32 h-32">
                  <div className="absolute inset-0 bg-teal/20 rounded-full animate-ping" />
                  <div className="relative flex items-center justify-center w-full h-full bg-teal/30 rounded-full border-4 border-teal">
                    <img
                      src="/assets/generated/nfc-tap-icon.dim_32x32.png"
                      alt="NFC"
                      className="h-16 w-16"
                    />
                  </div>
                </div>

                {isScanning ? (
                  <>
                    <p className="text-white font-medium">
                      {mode === "share" ? "Ready to share!" : "Scanning..."}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {mode === "share"
                        ? "Tap your phone to another device"
                        : "Hold your phone near another device"}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-white font-medium">
                      {mode === "share"
                        ? "Share Your Payment Link"
                        : "Receive a Payment Link"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Tap the button below to start
                    </p>
                  </>
                )}
              </div>

              <Button
                onClick={mode === "share" ? handleShareNFC : handleReceiveNFC}
                disabled={isScanning}
                className="w-full bg-teal hover:bg-teal-dark text-white font-semibold shadow-lg shadow-teal/30"
                size="lg"
              >
                {isScanning ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    {mode === "share" ? "Ready to Tap..." : "Scanning..."}
                  </>
                ) : (
                  <>
                    <img
                      src="/assets/generated/nfc-tap-icon.dim_32x32.png"
                      alt=""
                      className="mr-2 h-5 w-5"
                    />
                    {mode === "share" ? "Start Sharing" : "Start Scanning"}
                  </>
                )}
              </Button>

              <Button
                onClick={() => setShowQRFallback(true)}
                variant="outline"
                className="w-full border-teal/30 bg-muted/50 text-white hover:bg-teal/20"
              >
                Use QR Code Instead
              </Button>
            </>
          )}

          {showQRFallback && (
            <div className="space-y-4">
              <div className="glassmorphism rounded-xl p-6 border-2 border-teal/30 text-center space-y-4">
                <p className="text-white font-medium">QR Code Fallback</p>
                <p className="text-sm text-white/70 mb-4">
                  Share this QR code to receive tips
                </p>
                <div className="bg-white p-4 rounded-lg inline-block">
                  <QRCodeGenerator value={principal} size={200} />
                </div>
              </div>

              {isNFCSupported && (
                <Button
                  onClick={() => setShowQRFallback(false)}
                  variant="outline"
                  className="w-full border-teal/30 bg-muted/50 text-white hover:bg-teal/20"
                >
                  Try NFC Again
                </Button>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
