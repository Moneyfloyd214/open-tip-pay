import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useGenerateInviteCode } from "../hooks/useQueries";

interface UserNotFoundProps {
  searchTerm: string;
}

export default function UserNotFound({
  searchTerm: _searchTerm,
}: UserNotFoundProps) {
  const generateInviteCode = useGenerateInviteCode();

  const handleInviteAndSendTip = async () => {
    try {
      const inviteCode = await generateInviteCode.mutateAsync();
      const baseUrl = `${window.location.protocol}//${window.location.host}`;
      const referralLink = `${baseUrl}?invite=${inviteCode}`;

      const message = `Hey! I'm trying to send you money on Open Tip Pay. Join here so I can pay you: ${referralLink}`;

      // Check if Web Share API is available
      if (navigator.share) {
        try {
          await navigator.share({
            title: "Join Open Tip Pay",
            text: message,
          });
          toast.success("Invite sent successfully!");
        } catch (error: any) {
          // User cancelled the share or error occurred
          if (error.name !== "AbortError") {
            console.error("Error sharing:", error);
            // Fallback to clipboard
            await navigator.clipboard.writeText(message);
            toast.success("Invite link copied to clipboard!");
          }
        }
      } else {
        // Fallback to clipboard if Web Share API is not available
        await navigator.clipboard.writeText(message);
        toast.success("Invite link copied to clipboard!");
      }
    } catch (error) {
      console.error("Error generating invite:", error);
      toast.error("Failed to generate invite link");
    }
  };

  return (
    <div className="px-6 py-12 text-center">
      {/* Graphic */}
      <div className="mb-6 flex justify-center">
        <img
          src="/assets/generated/user-not-found-graphic.dim_200x200.png"
          alt="User not found"
          className="w-32 h-32 object-contain opacity-90"
          onError={(e) => {
            // Fallback to celebration confetti if the graphic doesn't load
            e.currentTarget.src =
              "/assets/generated/celebration-confetti.dim_64x64.png";
            e.currentTarget.className = "w-16 h-16 object-contain opacity-90";
          }}
        />
      </div>

      {/* Headline */}
      <h3 className="text-xl font-bold text-white mb-2">
        They haven't joined the party yet!
      </h3>

      {/* Sub-headline */}
      <p className="text-white/70 text-sm mb-6 max-w-sm mx-auto">
        We couldn't find a user with that info, but you can still send them a
        tip invite.
      </p>

      {/* Invite Button */}
      <Button
        onClick={handleInviteAndSendTip}
        disabled={generateInviteCode.isPending}
        className="bg-teal hover:bg-teal-dark text-navy-dark font-semibold px-8 py-6 rounded-xl shadow-lg shadow-teal/30 transition-all duration-300 hover:shadow-teal/50 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {generateInviteCode.isPending ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Generating...
          </>
        ) : (
          "Invite & Send Money"
        )}
      </Button>

      {/* Additional info */}
      <p className="text-white/50 text-xs mt-4">
        They'll receive a link to join Open Tip Pay and you can tip them once
        they sign up!
      </p>
    </div>
  );
}
