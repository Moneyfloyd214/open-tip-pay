import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { Principal } from "@dfinity/principal";
import { Mic, Scan, ShoppingCart } from "lucide-react";
import { useState } from "react";
import NFCTapToTip from "./NFCTapToTip";
import VoiceActivatedTipping from "./VoiceActivatedTipping";

interface QuickActionsCardProps {
  onScanClick: () => void;
  onNFCSuccess?: (principal: Principal) => void;
  onOrderFoodClick?: () => void;
}

export default function QuickActionsCard({
  onScanClick,
  onNFCSuccess,
  onOrderFoodClick,
}: QuickActionsCardProps) {
  const [nfcOpen, setNfcOpen] = useState(false);
  const [voiceOpen, setVoiceOpen] = useState(false);

  const handleNFCSuccess = (principal: Principal) => {
    if (onNFCSuccess) {
      onNFCSuccess(principal);
    }
  };

  return (
    <>
      <Card className="glassmorphism border-teal/20 shadow-lg shadow-teal/10">
        <CardContent className="p-4 space-y-2">
          <Button
            onClick={onScanClick}
            className="w-full bg-teal hover:bg-teal-dark text-white font-semibold shadow-md shadow-teal/30 transition-all hover:shadow-lg hover:shadow-teal/40"
            size="lg"
          >
            <Scan className="mr-2 h-5 w-5" />
            Scan to Pay
          </Button>

          <Button
            onClick={() => setNfcOpen(true)}
            variant="outline"
            className="w-full border-teal/30 bg-teal/10 text-teal hover:bg-teal/20 font-semibold transition-all"
            size="lg"
          >
            <img
              src="/assets/generated/nfc-tap-icon.dim_32x32.png"
              alt=""
              className="mr-2 h-5 w-5"
            />
            Tap to Pay (NFC)
          </Button>

          <Button
            onClick={() => setVoiceOpen(true)}
            variant="outline"
            className="w-full border-teal/30 bg-teal/10 text-teal hover:bg-teal/20 font-semibold transition-all"
            size="lg"
          >
            <Mic className="mr-2 h-5 w-5" />
            Voice Command
          </Button>

          <Button
            onClick={() => onOrderFoodClick?.()}
            variant="outline"
            className="w-full border-teal/30 bg-teal/10 text-teal hover:bg-teal/20 font-semibold transition-all"
            size="lg"
            data-ocid="quick_actions.order_food_button"
          >
            <ShoppingCart className="mr-2 h-5 w-5" />
            Order Food
          </Button>

          <a
            href="/order-history"
            className="block text-center text-xs text-teal/70 hover:text-teal transition-colors py-0.5"
            data-ocid="quick_actions.order_history_link"
          >
            View Order History
          </a>
        </CardContent>
      </Card>

      <NFCTapToTip
        open={nfcOpen}
        onOpenChange={setNfcOpen}
        onSuccess={handleNFCSuccess}
      />
      <VoiceActivatedTipping open={voiceOpen} onOpenChange={setVoiceOpen} />
    </>
  );
}
