import { Button } from "@/components/ui/button";
import { useInternetIdentity } from "@caffeineai/core-infrastructure";
import { Copy, Download, Share2, X } from "lucide-react";
import { useCallback, useRef } from "react";
import { toast } from "sonner";
import { useBranding } from "../context/BrandingContext";
import { DEMO_PROFILE, useDemoMode } from "../context/DemoContext";
import { useGetCallerUserProfile } from "../hooks/useQueries";
import QRCodeGenerator from "./QRCodeGenerator";

interface MyQRCodeSheetProps {
  open: boolean;
  onClose: () => void;
}

export default function MyQRCodeSheet({ open, onClose }: MyQRCodeSheetProps) {
  const { identity } = useInternetIdentity();
  const { isDemoMode } = useDemoMode();
  const { data: realProfile } = useGetCallerUserProfile();
  const userProfile = isDemoMode ? DEMO_PROFILE : realProfile;
  const { isWhiteLabel, brandName } = useBranding();

  const personalCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const handlePersonalCanvasReady = useCallback((canvas: HTMLCanvasElement) => {
    personalCanvasRef.current = canvas;
  }, []);

  const principal = isDemoMode
    ? "demo-principal-aaaaa-bbbbb-ccccc-ddddd-eee"
    : identity?.getPrincipal().toString() || "";
  const tipLink = `${window.location.origin}/#/tip/${principal}`;
  const downloadUrl = window.location.origin || "https://opentippay.app";
  const displayName = userProfile?.username || "You";
  const username = userProfile?.username;

  const handleShareTipLink = async () => {
    const shareText = `Scan my QR code to send me money on Open Tip Pay: ${tipLink}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: isWhiteLabel
            ? `Send money via ${brandName}`
            : "Send me money on Open Tip Pay",
          text: shareText,
          url: tipLink,
        });
      } catch (_err) {
        // user cancelled
      }
    } else {
      await navigator.clipboard.writeText(tipLink);
      toast.success("Tip link copied to clipboard!");
    }
  };

  const handleSaveQR = () => {
    const canvas = personalCanvasRef.current;
    if (!canvas) {
      toast.error("QR code not ready yet. Please wait a moment.");
      return;
    }
    try {
      const dataUrl = canvas.toDataURL("image/png");
      const safeUsername = username
        ? username.replace(/[^a-z0-9]/gi, "")
        : "me";
      const filename = `opentippay-${safeUsername}-qr.png`;
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = filename;
      link.click();
      toast.success("QR code saved!");
    } catch (_err) {
      toast.error("Could not save QR code. Try a screenshot instead.");
    }
  };

  const handleCopyDownloadLink = async () => {
    await navigator.clipboard.writeText(downloadUrl);
    toast.success("App link copied to clipboard!");
  };

  if (!open) return null;

  const sheetTitle = isWhiteLabel ? `My ${brandName} QR Code` : "My QR Code";

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      aria-modal="true"
      aria-label={sheetTitle}
      data-ocid="my_qr_code.dialog"
    >
      {/* Backdrop */}
      <button
        type="button"
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Close"
      />

      {/* Sheet */}
      <div className="relative z-10 w-full max-w-md rounded-t-3xl border border-border bg-card/95 backdrop-blur-xl pb-safe-or-8 pt-0 shadow-2xl shadow-black/50">
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="h-1 w-10 rounded-full bg-white/20" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3">
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-white truncate">
              {sheetTitle}
            </h2>
            {isWhiteLabel && (
              <p className="text-xs text-muted-foreground/50">
                powered by Open Tip Pay
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            data-ocid="my_qr_code.close_button"
            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-muted/50 text-white/60 hover:bg-white/20 hover:text-white transition-colors ml-2"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Divider */}
        <div className="h-px bg-muted/30 mx-5" />

        <div className="px-5 pt-5 pb-6 space-y-6">
          {/* Personal QR Code — large, centered */}
          <div className="flex flex-col items-center gap-3">
            <div className="p-4 rounded-2xl bg-white shadow-lg shadow-teal/10">
              {principal ? (
                <QRCodeGenerator
                  value={tipLink}
                  size={220}
                  onCanvasReady={handlePersonalCanvasReady}
                />
              ) : (
                <div className="w-[220px] h-[220px] rounded-lg bg-muted/50 animate-pulse" />
              )}
            </div>
            <div className="text-center">
              <p className="text-base font-semibold text-foreground">
                {displayName}
              </p>
              {username && <p className="text-sm text-teal/80">@{username}</p>}
              <p className="text-xs text-white/40 mt-1">Scan to send money</p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="space-y-2">
            <Button
              onClick={handleShareTipLink}
              data-ocid="my_qr_code.share_receive_button"
              className="w-full bg-teal hover:bg-teal-dark text-navy font-bold shadow-lg shadow-teal/30 transition-all duration-200 hover:shadow-teal/50 hover:scale-[1.01] py-5"
              size="lg"
            >
              <Share2 className="mr-2 h-4 w-4" />
              Share to Receive Money
            </Button>
            <Button
              onClick={handleSaveQR}
              data-ocid="my_qr_code.save_qr_button"
              variant="outline"
              className="w-full border-teal/40 bg-teal/10 hover:bg-teal/20 hover:border-teal/60 text-teal font-semibold transition-all duration-200 py-5"
              size="lg"
            >
              <Download className="mr-2 h-4 w-4" />
              Save QR as Image
            </Button>
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="h-px bg-muted/30" />
            <span className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 px-3 bg-card text-xs text-white/30 uppercase tracking-widest">
              also
            </span>
          </div>

          {/* Share to Download App */}
          <div className="space-y-3">
            <p className="text-sm font-medium text-white/70 text-center">
              Share to Download App
            </p>
            <div className="flex justify-center">
              <div className="p-3 rounded-xl bg-white shadow-md shadow-black/20">
                <QRCodeGenerator value={downloadUrl} size={120} />
              </div>
            </div>
            <p className="text-xs text-white/40 text-center">
              Scan to install Open Tip Pay
            </p>
            <Button
              onClick={handleCopyDownloadLink}
              data-ocid="my_qr_code.copy_download_link_button"
              variant="outline"
              className="w-full border-white/15 bg-white/5 hover:bg-muted/50 hover:border-white/25 text-white/80 font-semibold transition-all duration-200"
              size="lg"
            >
              <Copy className="mr-2 h-4 w-4" />
              Copy App Link
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
