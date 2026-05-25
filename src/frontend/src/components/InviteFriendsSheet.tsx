import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Copy, Loader2, Share2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useGenerateInviteCode } from "../hooks/useQueries";

interface InviteFriendsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function InviteFriendsSheet({
  open,
  onOpenChange,
}: InviteFriendsSheetProps) {
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const generateInviteCode = useGenerateInviteCode();

  const handleGenerateLink = async () => {
    try {
      const code = await generateInviteCode.mutateAsync();
      const baseUrl = `${window.location.protocol}//${window.location.host}`;
      const link = `${baseUrl}/#/invite/${code}`;
      setInviteLink(link);
    } catch (error) {
      toast.error("Failed to generate invite link");
      console.error("Error generating invite code:", error);
    }
  };

  const handleShare = async () => {
    if (!inviteLink) return;

    const message = `Hey! Join me on Open Tip Pay - the easiest way to send and receive tips. Sign up here: ${inviteLink}`;

    // Haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }

    if (navigator.share) {
      try {
        await navigator.share({
          title: "Join Open Tip Pay",
          text: message,
        });
        toast.success("Invite link shared!");
      } catch (error) {
        // User cancelled share or error occurred
        if ((error as Error).name !== "AbortError") {
          console.error("Error sharing:", error);
        }
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(message);
      toast.success("Invite link copied to clipboard!");
    }
  };

  const handleCopyLink = () => {
    if (!inviteLink) return;

    navigator.clipboard.writeText(inviteLink);

    // Haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }

    toast.success("Invite link copied!");
  };

  // Generate link when sheet opens
  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen && !inviteLink) {
      handleGenerateLink();
    }
    onOpenChange(newOpen);
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        side="bottom"
        className="border-t border-border bg-card/95 backdrop-blur-xl rounded-t-3xl max-h-[85vh] overflow-y-auto"
      >
        <SheetHeader className="space-y-3 pb-6">
          <SheetTitle className="text-2xl font-bold text-foreground text-center">
            Invite your friends to join Open Tip Pay!
          </SheetTitle>
          <SheetDescription className="text-muted-foreground text-center text-base">
            Share Open Tip Pay with your friends and help them discover the
            easiest way to send and receive tips.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 py-4">
          {/* Invite Link Display */}
          <div className="glass-card p-6 rounded-2xl border border-teal/30 shadow-lg shadow-teal/20">
            <p className="text-xs text-muted-foreground mb-3 uppercase tracking-wider font-semibold">
              Your Invite Link
            </p>

            {generateInviteCode.isPending || !inviteLink ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-teal" />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-muted/50 rounded-xl p-4 border border-border">
                  <p className="text-sm text-foreground break-all font-mono">
                    {inviteLink}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Button
                    onClick={handleCopyLink}
                    className="w-full bg-card/50 hover:bg-card border border-teal/30 text-foreground font-semibold shadow-lg shadow-teal/20 transition-all duration-300 hover:shadow-teal/40"
                  >
                    <Copy className="mr-2 h-4 w-4" />
                    Copy Link
                  </Button>
                  <Button
                    onClick={handleShare}
                    className="w-full bg-teal hover:bg-teal/90 text-navy-dark font-bold shadow-lg shadow-teal/30 transition-all duration-300 hover:shadow-teal/50 hover:scale-105"
                  >
                    <Share2 className="mr-2 h-4 w-4" />
                    Share Link
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Info Section */}
          <div className="glass-card p-5 rounded-xl border border-border">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-teal/20 flex items-center justify-center flex-shrink-0 mt-1">
                <Share2 className="h-5 w-5 text-teal" />
              </div>
              <div className="flex-1">
                <h3 className="text-foreground font-semibold mb-1">
                  Share via any app
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Send your invite link through SMS, WhatsApp, social media, or
                  any messaging app. Your friends can join Open Tip Pay
                  instantly!
                </p>
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
