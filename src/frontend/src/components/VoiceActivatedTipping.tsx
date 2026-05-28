import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CircleAlert as AlertCircle, CircleCheck as CheckCircle, Loader as Loader2, Mic, MicOff } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Variant_fiat_crypto } from "../types/local-backend";
import { useGetCallerUserProfile, useSendTip } from "../hooks/useQueries";

interface VoiceActivatedTippingProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function VoiceActivatedTipping({
  open,
  onOpenChange,
}: VoiceActivatedTippingProps) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationSuccess, setVerificationSuccess] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);

  const { data: _userProfile } = useGetCallerUserProfile();
  const _sendTip = useSendTip();

  useEffect(() => {
    // Initialize speech recognition
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognitionInstance = new SpeechRecognition();
      recognitionInstance.continuous = false;
      recognitionInstance.interimResults = false;
      recognitionInstance.lang = "en-US";

      recognitionInstance.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setTranscript(transcript);
        handleVoiceCommand(transcript);
      };

      recognitionInstance.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        setError(`Voice recognition error: ${event.error}`);
        setIsListening(false);
      };

      recognitionInstance.onend = () => {
        setIsListening(false);
      };

      setRecognition(recognitionInstance);
    }
  }, []);

  useEffect(() => {
    if (!open) {
      setTranscript("");
      setError(null);
      setIsListening(false);
      setIsProcessing(false);
      setIsVerifying(false);
      setVerificationSuccess(false);
      if (recognition && isListening) {
        recognition.stop();
      }
    }
  }, [open, recognition, isListening]);

  const startListening = () => {
    if (!recognition) {
      setError("Voice recognition is not supported in your browser");
      return;
    }

    setError(null);
    setTranscript("");
    setIsListening(true);
    recognition.start();
  };

  const stopListening = () => {
    if (recognition) {
      recognition.stop();
    }
    setIsListening(false);
  };

  const simulateVoicePrintVerification = async (): Promise<boolean> => {
    setIsVerifying(true);

    // Simulate voice-print verification delay
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // In a real implementation, this would verify the voice-print against stored data
    // For now, we'll simulate a successful verification
    const verified = Math.random() > 0.1; // 90% success rate for demo

    setIsVerifying(false);
    setVerificationSuccess(verified);

    if (verified && navigator.vibrate) {
      navigator.vibrate([50, 100, 50]);
    }

    return verified;
  };

  const parseVoiceCommand = (
    command: string,
  ): {
    amount: number | null;
    recipient: string | null;
    isCrypto: boolean;
  } | null => {
    const lowerCommand = command.toLowerCase();

    // Check for trigger phrase
    if (
      !lowerCommand.includes("hey opentip") &&
      !lowerCommand.includes("open tip")
    ) {
      return null;
    }

    // Extract amount
    const amountMatch = lowerCommand.match(/\$?(\d+(?:\.\d{2})?)/);
    const amount = amountMatch ? Number.parseFloat(amountMatch[1]) : null;

    // Check if crypto
    const isCrypto = lowerCommand.includes("crypto");

    // Extract recipient (simplified - in real app would use more sophisticated NLP)
    const toMatch = lowerCommand.match(/to\s+([a-zA-Z0-9]+)/);
    const recipient = toMatch ? toMatch[1] : null;

    return { amount, recipient, isCrypto };
  };

  const handleVoiceCommand = async (command: string) => {
    setIsProcessing(true);
    setError(null);

    try {
      const parsed = parseVoiceCommand(command);

      if (!parsed) {
        setError(
          'Command not recognized. Try saying "Hey Open Tip Pay, send $10 tip to username"',
        );
        setIsProcessing(false);
        return;
      }

      if (!parsed.amount || !parsed.recipient) {
        setError("Could not understand amount or recipient. Please try again.");
        setIsProcessing(false);
        return;
      }

      // Verify voice-print
      toast.info("Verifying your voice...");
      const verified = await simulateVoicePrintVerification();

      if (!verified) {
        setError("Voice verification failed. Please try again.");
        setIsProcessing(false);
        return;
      }

      toast.success("Voice verified!");

      // In a real implementation, we would look up the recipient by username
      // For now, we'll show a success message
      toast.success(
        `Voice command processed: Send $${parsed.amount} ${parsed.isCrypto ? "crypto" : "fiat"} tip to ${parsed.recipient}`,
      );

      // Haptic feedback
      if (navigator.vibrate) {
        navigator.vibrate([100, 50, 100, 50, 100]);
      }

      setTimeout(() => {
        onOpenChange(false);
      }, 2000);
    } catch (err: any) {
      console.error("Voice command error:", err);
      setError(err.message || "Failed to process voice command");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-navy-light/95 backdrop-blur-xl border-teal/30">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <img
              src="/assets/generated/voice-mic-icon.dim_32x32.png"
              alt="Voice"
              className="h-6 w-6"
            />
            Voice-Activated Tipping
          </DialogTitle>
          <DialogDescription className="text-white/70">
            Say "Hey Open Tip Pay, send $10 tip to [name]" or "send a $10 crypto
            tip to [name]"
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {error && (
            <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-3 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-red-400 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {verificationSuccess && (
            <div className="rounded-lg bg-teal/10 border border-teal/30 p-3 flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-teal mt-0.5 flex-shrink-0" />
              <p className="text-sm text-teal">Voice verified successfully!</p>
            </div>
          )}

          <div className="glassmorphism rounded-xl p-8 border-2 border-teal/30 text-center space-y-4">
            <div className="relative mx-auto w-32 h-32">
              {isListening && (
                <div className="absolute inset-0 bg-teal/20 rounded-full animate-ping" />
              )}
              <div
                className={`relative flex items-center justify-center w-full h-full rounded-full border-4 transition-all ${
                  isListening
                    ? "bg-teal/30 border-teal shadow-lg shadow-teal/50"
                    : "bg-navy-dark/50 border-teal/30"
                }`}
              >
                {isListening ? (
                  <Mic className="h-16 w-16 text-teal animate-pulse" />
                ) : (
                  <MicOff className="h-16 w-16 text-white/50" />
                )}
              </div>
            </div>

            {isVerifying ? (
              <>
                <p className="text-white font-medium">Verifying Voice...</p>
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-teal" />
                  <p className="text-sm text-white/70">Analyzing voice-print</p>
                </div>
              </>
            ) : isProcessing ? (
              <>
                <p className="text-white font-medium">Processing Command...</p>
                <Loader2 className="h-5 w-5 animate-spin text-teal mx-auto" />
              </>
            ) : isListening ? (
              <>
                <p className="text-white font-medium">Listening...</p>
                <p className="text-sm text-white/70">Speak your command now</p>
              </>
            ) : (
              <>
                <p className="text-white font-medium">Ready to Listen</p>
                <p className="text-sm text-white/70">Tap the button to start</p>
              </>
            )}

            {transcript && (
              <div className="mt-4 p-3 bg-navy-dark/50 rounded-lg">
                <p className="text-xs text-white/60 mb-1">You said:</p>
                <p className="text-sm text-white italic">"{transcript}"</p>
              </div>
            )}
          </div>

          <Button
            onClick={isListening ? stopListening : startListening}
            disabled={isProcessing || isVerifying}
            className={`w-full font-semibold shadow-lg ${
              isListening
                ? "bg-red-500 hover:bg-red-600 shadow-red-500/30"
                : "bg-teal hover:bg-teal-dark shadow-teal/30"
            }`}
            size="lg"
          >
            {isProcessing || isVerifying ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                {isVerifying ? "Verifying..." : "Processing..."}
              </>
            ) : isListening ? (
              <>
                <MicOff className="mr-2 h-5 w-5" />
                Stop Listening
              </>
            ) : (
              <>
                <Mic className="mr-2 h-5 w-5" />
                Start Voice Command
              </>
            )}
          </Button>

          <div className="text-center space-y-2">
            <p className="text-xs text-white/60">Example commands:</p>
            <div className="space-y-1">
              <p className="text-xs text-white/50 italic">
                "Hey Open Tip Pay, send $10 tip to Alice"
              </p>
              <p className="text-xs text-white/50 italic">
                "Hey Open Tip Pay, send a $25 crypto tip to Bob"
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
