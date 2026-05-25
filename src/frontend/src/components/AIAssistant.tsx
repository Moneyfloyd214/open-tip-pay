import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import {
  DollarSign,
  FileText,
  Loader2,
  MessageCircle,
  Send,
  TrendingUp,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  useGetTipsReceived,
  useGetTipsSent,
  useLogAIQuery,
} from "../hooks/useQueries";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface AIAssistantProps {
  onOpenReceipt?: () => void;
}

export default function AIAssistant({ onOpenReceipt }: AIAssistantProps) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hi! I'm your Open Tip Pay AI assistant. Ask me about your spending, earnings, or how to use the app!",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const { data: tipsSent = [] } = useGetTipsSent();
  const { data: tipsReceived = [] } = useGetTipsReceived();
  const logQuery = useLogAIQuery();

  const processQuery = async (query: string): Promise<string> => {
    const lowerQuery = query.toLowerCase();

    // Calculate statistics
    const totalSent =
      tipsSent.reduce((sum, tip) => sum + Number(tip.amount), 0) / 100;
    const totalReceived =
      tipsReceived.reduce((sum, tip) => sum + Number(tip.amount), 0) / 100;
    const professionalTips = tipsReceived.filter((tip) => tip.professional);
    const professionalEarnings =
      professionalTips.reduce((sum, tip) => sum + Number(tip.amount), 0) / 100;

    // Query patterns
    if (
      lowerQuery.includes("how much") &&
      (lowerQuery.includes("tip") || lowerQuery.includes("sent"))
    ) {
      if (lowerQuery.includes("month")) {
        const thisMonth = new Date().getMonth();
        const monthlyTips = tipsSent.filter((tip) => {
          const tipDate = new Date(Number(tip.timestamp) / 1000000);
          return tipDate.getMonth() === thisMonth;
        });
        const monthlyTotal =
          monthlyTips.reduce((sum, tip) => sum + Number(tip.amount), 0) / 100;
        return `This month, you've sent $${monthlyTotal.toFixed(2)} in tips across ${monthlyTips.length} transactions.`;
      }
      return `You've sent a total of $${totalSent.toFixed(2)} in tips across ${tipsSent.length} transactions.`;
    }

    if (lowerQuery.includes("earn") || lowerQuery.includes("receiv")) {
      if (lowerQuery.includes("professional")) {
        return `You've earned $${professionalEarnings.toFixed(2)} from ${professionalTips.length} professional service tips.`;
      }
      return `You've received a total of $${totalReceived.toFixed(2)} in tips from ${tipsReceived.length} transactions.`;
    }

    if (
      lowerQuery.includes("export") ||
      lowerQuery.includes("receipt") ||
      lowerQuery.includes("tax")
    ) {
      if (onOpenReceipt) {
        setTimeout(() => {
          setOpen(false);
          onOpenReceipt();
        }, 1000);
      }
      return "Opening Smart Receipt Export! You can generate tax-ready PDF summaries of your professional earnings grouped by month.";
    }

    if (lowerQuery.includes("nfc") || lowerQuery.includes("tap")) {
      return `NFC Tap-to-Tip allows you to share your payment link or send tips by tapping phones together. Use the "Tap to Tip (NFC)" button in Quick Actions. If NFC isn't available, it automatically falls back to QR code sharing.`;
    }

    if (lowerQuery.includes("voice") || lowerQuery.includes("speak")) {
      return `Voice-activated tipping lets you send tips using voice commands like "Hey Open Tip Pay, send $10 tip to..." or "send a $10 crypto tip to [name]". The system uses voice-print verification for security. Try the "Voice Command" button in Quick Actions!`;
    }

    if (lowerQuery.includes("security") || lowerQuery.includes("safe")) {
      return "Open Tip Pay uses advanced security: AES-256 encryption for data at rest, end-to-end encryption for messages, AI fraud detection, voice-print verification, and MPC for crypto wallet integrity. Check Security Center in Settings for more details.";
    }

    if (lowerQuery.includes("crypto") || lowerQuery.includes("wallet")) {
      return "To send crypto tips, connect your MetaMask wallet in the Wallet Card. Recipients must also have a wallet connected. All crypto transactions are non-custodial - we never hold your keys.";
    }

    // Default response
    return `I can help you with:
• Checking your spending and earnings
• Exporting professional earnings for taxes (Smart Receipts)
• Understanding security features
• Learning about NFC Tap-to-Tip
• Using voice-activated tipping
• Managing crypto payments

What would you like to know?`;
  };

  const handleSend = async () => {
    if (!input.trim() || isProcessing) return;

    const userMessage: Message = {
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsProcessing(true);

    try {
      const response = await processQuery(input);

      const assistantMessage: Message = {
        role: "assistant",
        content: response,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Log the query
      await logQuery.mutateAsync({
        queryText: input,
        response,
      });
    } catch (_error) {
      toast.error("Failed to process query");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const quickActions = [
    {
      icon: TrendingUp,
      label: "Monthly spending",
      query: "How much did I tip this month?",
    },
    {
      icon: DollarSign,
      label: "Professional earnings",
      query: "How much have I earned from professional tips?",
    },
    {
      icon: FileText,
      label: "Export receipts",
      query: "Export my professional earnings",
    },
  ];

  return (
    <>
      {/* Floating AI Assistant Button */}
      <Button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full bg-teal hover:bg-teal-dark shadow-lg shadow-teal/50 z-50 glassmorphism border-2 border-teal/50 transition-all hover:scale-110"
        size="icon"
      >
        <img
          src="/assets/generated/ai-assistant-icon.dim_32x32.png"
          alt="AI Assistant"
          className="h-7 w-7"
        />
      </Button>

      {/* AI Assistant Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg h-[600px] flex flex-col bg-card/95 backdrop-blur-xl border-teal/30">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground">
              <MessageCircle className="h-5 w-5 text-teal" />
              AI Assistant
            </DialogTitle>
          </DialogHeader>

          {/* Quick Actions */}
          {messages.length === 1 && (
            <div className="space-y-2 pb-4">
              <p className="text-xs text-muted-foreground">Quick actions:</p>
              <div className="grid gap-2">
                {quickActions.map((action) => (
                  <Button
                    key={action.label}
                    variant="outline"
                    className="justify-start border-teal/30 bg-teal/10 text-foreground hover:bg-teal/20 transition-all"
                    onClick={() => {
                      setInput(action.query);
                      handleSend();
                    }}
                  >
                    <action.icon className="mr-2 h-4 w-4 text-teal" />
                    {action.label}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Messages */}
          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-4">
              {messages.map((message, index) => (
                <div
                  key={`msg-${message.role}-${index}`}
                  className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-3 transition-all ${
                      message.role === "user"
                        ? "bg-teal text-white shadow-md shadow-teal/30"
                        : "glassmorphism border border-teal/20 text-foreground"
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">
                      {message.content}
                    </p>
                    <p className="text-xs opacity-60 mt-1">
                      {format(message.timestamp, "HH:mm")}
                    </p>
                  </div>
                </div>
              ))}
              {isProcessing && (
                <div className="flex justify-start">
                  <div className="glassmorphism border border-teal/20 rounded-lg p-3">
                    <Loader2 className="h-4 w-4 animate-spin text-teal" />
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Input */}
          <div className="flex gap-2 pt-4 border-t border-teal/20">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything..."
              className="flex-1 bg-muted/50 border-teal/30 text-foreground placeholder:text-muted-foreground/60"
              disabled={isProcessing}
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isProcessing}
              className="bg-teal hover:bg-teal-dark shadow-md shadow-teal/30"
              size="icon"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
