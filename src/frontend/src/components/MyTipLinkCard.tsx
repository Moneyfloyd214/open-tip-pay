import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Copy, QrCode, Share2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useGetCallerUserProfile } from "../hooks/useQueries";
import { supabase } from "../lib/supabase";
import QRCodeGenerator from "./QRCodeGenerator";

interface MyTipLinkCardProps {
  username: string;
}

export default function MyTipLinkCard({ username }: MyTipLinkCardProps) {
  const { data: userProfile } = useGetCallerUserProfile();
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [userId, setUserId] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user?.id) setUserId(data.session.user.id);
    });
  }, []);

  const principal = userId;
  const walletAddress = (userProfile as any)?.walletAddress;
  const tipLink = `${window.location.origin}/#/tip/${principal}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(tipLink);
    toast.success("Tip link copied to clipboard!");
  };

  const handleCopyWallet = () => {
    if (walletAddress) {
      navigator.clipboard.writeText(walletAddress);
      toast.success("Wallet address copied!");
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Send me money on Open Tip Pay",
          text: `Tip @${username} on Open Tip Pay`,
          url: tipLink,
        });
      } catch (_error) {
        // User cancelled share
      }
    } else {
      handleCopyLink();
    }
  };

  return (
    <>
      <Card className="border-white/10 bg-white/5 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-lg text-white">My Payment Link</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2 rounded-lg bg-navy-dark/50 p-3">
            <p className="flex-1 truncate text-sm text-white/80">{tipLink}</p>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <Button
              onClick={() => setQrDialogOpen(true)}
              variant="outline"
              className="border-teal/30 bg-teal/10 text-teal hover:bg-teal/20"
            >
              <QrCode className="mr-2 h-4 w-4" />
              QR
            </Button>
            <Button
              onClick={handleCopyLink}
              variant="outline"
              className="border-teal/30 bg-teal/10 text-teal hover:bg-teal/20"
            >
              <Copy className="mr-2 h-4 w-4" />
              Copy
            </Button>
            <Button
              onClick={handleShare}
              variant="outline"
              className="border-teal/30 bg-teal/10 text-teal hover:bg-teal/20"
            >
              <Share2 className="mr-2 h-4 w-4" />
              Share
            </Button>
          </div>

          {walletAddress && (
            <div className="pt-2 border-t border-white/10">
              <p className="text-xs text-white/60 mb-2">
                Crypto Wallet Address
              </p>
              <div className="flex items-center gap-2 rounded-lg bg-navy-dark/50 p-3">
                <p className="flex-1 truncate text-xs text-white/80 font-mono">
                  {walletAddress}
                </p>
                <Button
                  onClick={handleCopyWallet}
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-white/70 hover:text-white"
                >
                  <Copy className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* QR Code Dialog */}
      <Dialog open={qrDialogOpen} onOpenChange={setQrDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>My Payment QR Code</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center space-y-4 py-4">
            <QRCodeGenerator value={principal} size={256} />
            <p className="text-center text-sm text-muted-foreground">
              Scan this QR code to send me money
            </p>
            {walletAddress && (
              <div className="w-full pt-4 border-t">
                <p className="text-xs text-muted-foreground text-center mb-2">
                  Or send crypto directly to:
                </p>
                <div className="flex items-center gap-2 rounded-lg bg-muted p-2">
                  <p className="flex-1 truncate text-xs font-mono text-center">
                    {walletAddress}
                  </p>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
