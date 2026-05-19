import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useQueryClient } from "@tanstack/react-query";
import { CheckCircle, Copy, Loader2, Wallet, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  useGetCallerUserProfile,
  useRemoveWalletAddress,
  useSaveWalletAddress,
} from "../hooks/useQueries";
import { useWallet } from "../hooks/useWallet";

interface WalletCardProps {
  onOpenSecurityFAQ?: () => void;
}

export default function WalletCard({ onOpenSecurityFAQ }: WalletCardProps) {
  const { data: userProfile } = useGetCallerUserProfile();
  const {
    connectMetaMask,
    isConnecting,
    error,
    clearError,
    isMetaMaskAvailable,
  } = useWallet();
  const saveWallet = useSaveWalletAddress();
  const removeWallet = useRemoveWalletAddress();
  const queryClient = useQueryClient();

  const [showDisconnectDialog, setShowDisconnectDialog] = useState(false);
  const [showCryptoTooltip, setShowCryptoTooltip] = useState(false);
  const [hasSeenCryptoTooltip, setHasSeenCryptoTooltip] = useState(false);
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showWelcomeTutorial, setShowWelcomeTutorial] = useState(false);
  const [connectedAddress, setConnectedAddress] = useState<string | null>(null);

  const walletAddress = userProfile?.walletAddress;
  const isConnected = !!walletAddress;
  const isFirstConnection = userProfile?.isFirstWalletConnection;

  // Show crypto tooltip on first render
  useEffect(() => {
    if (!hasSeenCryptoTooltip && !isConnected) {
      const timer = setTimeout(() => {
        setShowCryptoTooltip(true);
        setHasSeenCryptoTooltip(true);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [hasSeenCryptoTooltip, isConnected]);

  const triggerHapticFeedback = () => {
    if (navigator.vibrate) {
      navigator.vibrate([50, 100, 50]);
    }
  };

  const handleConnect = async () => {
    clearError();
    const address = await connectMetaMask();

    if (address) {
      try {
        const _result = await saveWallet.mutateAsync(address);
        setConnectedAddress(address);

        // Trigger haptic feedback
        triggerHapticFeedback();

        // Show success animation
        setShowSuccessAnimation(true);

        // After animation, show success modal
        setTimeout(() => {
          setShowSuccessAnimation(false);
          setShowSuccessModal(true);

          // Refresh transaction history to pull on-chain tips
          queryClient.invalidateQueries({ queryKey: ["tipsReceived"] });
          queryClient.invalidateQueries({ queryKey: ["tipsSent"] });
        }, 1500);

        toast.success("Wallet connected successfully!");
      } catch (err: any) {
        console.error("Failed to save wallet:", err);
        toast.error("Failed to save wallet address");
      }
    } else if (error) {
      toast.error(error);
    }
  };

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);

    // Check if this is first connection and show tutorial
    if (isFirstConnection) {
      setTimeout(() => {
        setShowWelcomeTutorial(true);
      }, 300);
    }
  };

  const handleDisconnect = async () => {
    try {
      await removeWallet.mutateAsync();
      toast.success("Wallet disconnected");
      setShowDisconnectDialog(false);
    } catch (err: any) {
      console.error("Failed to disconnect wallet:", err);
      toast.error("Failed to disconnect wallet");
    }
  };

  const handleCopyAddress = () => {
    if (walletAddress) {
      navigator.clipboard.writeText(walletAddress);
      toast.success("Wallet address copied!");
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const handleSecurityFAQClick = () => {
    if (onOpenSecurityFAQ) {
      onOpenSecurityFAQ();
    }
  };

  if (!isMetaMaskAvailable) {
    return (
      <Card className="border-white/10 bg-white/5 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-lg text-white flex items-center gap-2">
            <img
              src="/assets/generated/crypto-wallet-icon.dim_32x32.png"
              alt=""
              className="h-5 w-5"
            />
            Crypto Wallet
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg bg-navy-dark/50 p-4 text-center">
            <p className="text-sm text-white/70 mb-3">
              MetaMask is required to connect a crypto wallet
            </p>
            <Button
              onClick={() =>
                window.open("https://metamask.io/download/", "_blank")
              }
              variant="outline"
              className="border-teal/30 bg-teal/10 text-teal hover:bg-teal/20"
            >
              Install MetaMask
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="border-white/10 bg-white/5 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg text-white flex items-center gap-2">
              <img
                src="/assets/generated/crypto-wallet-icon.dim_32x32.png"
                alt=""
                className="h-5 w-5"
              />
              Crypto Wallet
            </CardTitle>
            <TooltipProvider>
              <Tooltip
                open={showCryptoTooltip}
                onOpenChange={setShowCryptoTooltip}
              >
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 p-0 hover:bg-transparent"
                    onClick={() => setShowCryptoTooltip(!showCryptoTooltip)}
                  >
                    <img
                      src="/assets/generated/tooltip-icon.dim_24x24.png"
                      alt="Help"
                      className={`h-5 w-5 ${!hasSeenCryptoTooltip ? "animate-pulse" : ""}`}
                    />
                  </Button>
                </TooltipTrigger>
                <TooltipContent
                  className="max-w-xs glassmorphism border-teal/50 shadow-lg shadow-teal/30 bg-navy-dark/95 backdrop-blur-xl"
                  side="top"
                >
                  <div className="space-y-2">
                    <p className="text-xs text-white leading-relaxed">
                      <span className="font-semibold text-teal">
                        🔒 Non-Custodial Security:
                      </span>{" "}
                      Connect your wallet to send and receive crypto tips. We
                      never store your private keys - you maintain full control.
                    </p>
                    <button
                      type="button"
                      onClick={handleSecurityFAQClick}
                      className="text-xs text-teal hover:text-teal-dark underline font-medium"
                    >
                      Learn more in Security FAQ →
                    </button>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {isConnected ? (
            <>
              <div className="flex items-center gap-2 rounded-lg bg-navy-dark/50 p-3">
                <Wallet className="h-4 w-4 text-teal" />
                <p className="flex-1 text-sm text-white/80 font-mono">
                  {formatAddress(walletAddress)}
                </p>
                <Button
                  onClick={handleCopyAddress}
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-white/70 hover:text-white"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <Button
                onClick={() => setShowDisconnectDialog(true)}
                variant="outline"
                className="w-full border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20"
                disabled={removeWallet.isPending}
              >
                {removeWallet.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Disconnecting...
                  </>
                ) : (
                  <>
                    <X className="mr-2 h-4 w-4" />
                    Disconnect Wallet
                  </>
                )}
              </Button>
            </>
          ) : (
            <Button
              onClick={handleConnect}
              className="w-full bg-teal hover:bg-teal-dark text-white"
              disabled={isConnecting || saveWallet.isPending}
            >
              {isConnecting || saveWallet.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Wallet className="mr-2 h-4 w-4" />
                  Connect Wallet
                </>
              )}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Success Animation Overlay */}
      {showSuccessAnimation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="glassmorphism p-8 rounded-2xl border-2 border-teal shadow-2xl shadow-teal/50 animate-pulse">
            <div className="relative">
              <CheckCircle className="h-20 w-20 text-teal mx-auto animate-bounce" />
              <div className="absolute inset-0 bg-teal/20 rounded-full blur-xl animate-ping" />
            </div>
            <p className="text-white text-xl font-semibold text-center mt-4">
              Wallet Connected!
            </p>
          </div>
        </div>
      )}

      {/* Success Summary Modal */}
      <Dialog open={showSuccessModal} onOpenChange={handleSuccessModalClose}>
        <DialogContent className="glassmorphism border-teal/50 bg-navy-dark/95 backdrop-blur-xl">
          <DialogHeader>
            <div className="flex items-center justify-center mb-4">
              <div className="relative">
                <CheckCircle className="h-16 w-16 text-teal" />
                <div className="absolute inset-0 bg-teal/30 rounded-full blur-lg" />
              </div>
            </div>
            <DialogTitle className="text-center text-white text-xl">
              MetaMask Connected
            </DialogTitle>
            <DialogDescription className="text-center text-white/70">
              Your wallet has been successfully connected to Open Tip Pay
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="rounded-lg bg-navy-light/50 p-4 border border-teal/30">
              <p className="text-xs text-white/60 mb-2">Wallet Address</p>
              <p className="text-sm text-white font-mono break-all">
                {connectedAddress || walletAddress}
              </p>
            </div>
            <div className="rounded-lg bg-teal/10 border border-teal/30 p-3">
              <p className="text-xs text-teal font-medium">
                ✓ Transaction history refreshed
              </p>
              <p className="text-xs text-white/70 mt-1">
                Any on-chain tips linked to this wallet are now visible in your
                history
              </p>
            </div>
          </div>
          <Button
            onClick={handleSuccessModalClose}
            className="w-full bg-teal hover:bg-teal-dark text-white mt-4"
          >
            Continue
          </Button>
        </DialogContent>
      </Dialog>

      {/* Welcome to Crypto Tipping Tutorial */}
      <Dialog open={showWelcomeTutorial} onOpenChange={setShowWelcomeTutorial}>
        <DialogContent className="glassmorphism border-teal/50 bg-navy-dark/95 backdrop-blur-xl max-w-md">
          <DialogHeader>
            <div className="flex items-center justify-center mb-4">
              <img
                src="/assets/generated/crypto-wallet-icon.dim_32x32.png"
                alt="Crypto Wallet"
                className="h-16 w-16"
              />
            </div>
            <DialogTitle className="text-center text-white text-xl">
              Welcome to Crypto Tipping! 🎉
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-teal/20 flex items-center justify-center">
                  <span className="text-teal font-semibold">1</span>
                </div>
                <div>
                  <p className="text-sm text-white font-medium">
                    Send & Receive Crypto Tips
                  </p>
                  <p className="text-xs text-white/70 mt-1">
                    Use your connected wallet to send and receive cryptocurrency
                    tips securely
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-teal/20 flex items-center justify-center">
                  <span className="text-teal font-semibold">2</span>
                </div>
                <div>
                  <p className="text-sm text-white font-medium">
                    View Transaction History
                  </p>
                  <p className="text-xs text-white/70 mt-1">
                    All crypto tips appear in your transaction history with live
                    USD conversion rates
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-teal/20 flex items-center justify-center">
                  <span className="text-teal font-semibold">3</span>
                </div>
                <div>
                  <p className="text-sm text-white font-medium">
                    Non-Custodial Security
                  </p>
                  <p className="text-xs text-white/70 mt-1">
                    Your private keys stay with you. We never store or access
                    your wallet credentials
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-lg bg-teal/10 border border-teal/30 p-3">
              <p className="text-xs text-teal font-medium mb-1">💡 Pro Tip</p>
              <p className="text-xs text-white/70">
                Toggle "Crypto" when sending tips to use your connected wallet.
                Perfect for international payments!
              </p>
            </div>
          </div>
          <Button
            onClick={() => setShowWelcomeTutorial(false)}
            className="w-full bg-teal hover:bg-teal-dark text-white mt-4"
          >
            Got it, thanks!
          </Button>
        </DialogContent>
      </Dialog>

      {/* Disconnect Confirmation Dialog */}
      <AlertDialog
        open={showDisconnectDialog}
        onOpenChange={setShowDisconnectDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disconnect Wallet?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove your wallet address from your profile. You can
              reconnect it anytime.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDisconnect}
              className="bg-red-500 hover:bg-red-600"
            >
              Disconnect
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
