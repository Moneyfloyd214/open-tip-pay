import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import {
  CheckCircle,
  Clock,
  Loader2,
  MessageCircle,
  RefreshCw,
  Send,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  useGetSupportConversation,
  useGetSupportMessages,
  useGetUnreadSupportCount,
  useMarkSupportMessagesRead,
  useOpenSupportTicket,
  useSendSupportMessage,
} from "../hooks/useQueries";

// ── Status Badge ───────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const map: Record<
    string,
    { label: string; cls: string; icon: React.ReactNode }
  > = {
    open: {
      label: "Open",
      cls: "bg-teal/10 text-teal border-teal/30",
      icon: <MessageCircle className="h-3 w-3" />,
    },
    waiting: {
      label: "Waiting",
      cls: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
      icon: <Clock className="h-3 w-3" />,
    },
    resolved: {
      label: "Resolved",
      cls: "bg-green-500/10 text-green-400 border-green-500/20",
      icon: <CheckCircle className="h-3 w-3" />,
    },
  };
  const cfg = map[status.toLowerCase()] ?? map.open;
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-[10px] font-semibold ${cfg.cls}`}
    >
      {cfg.icon}
      {cfg.label}
    </span>
  );
}

// ── Open Ticket Form ───────────────────────────────────────────────────────────
function OpenTicketForm({ onSuccess }: { onSuccess: () => void }) {
  const [subject, setSubject] = useState("");
  const [firstMessage, setFirstMessage] = useState("");
  const openTicket = useOpenSupportTicket();

  const handleSubmit = async () => {
    if (!subject.trim()) {
      toast.error("Please enter a subject");
      return;
    }
    if (!firstMessage.trim()) {
      toast.error("Please describe your issue");
      return;
    }
    try {
      await openTicket.mutateAsync({
        subject: subject.trim(),
        firstMessage: firstMessage.trim(),
      });
      toast.success("Support ticket opened! We'll respond shortly.");
      onSuccess();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to open ticket");
    }
  };

  return (
    <div className="space-y-5 py-4">
      <div className="text-center space-y-2 pb-2">
        <div className="h-16 w-16 rounded-2xl bg-teal/10 border border-teal/20 flex items-center justify-center mx-auto">
          <MessageCircle className="h-8 w-8 text-teal" />
        </div>
        <h3 className="text-lg font-bold text-white">Contact Support</h3>
        <p className="text-sm text-white/50">
          Describe your issue and our team will get back to you as soon as
          possible.
        </p>
      </div>

      <div className="space-y-3">
        <div>
          <label
            htmlFor="support-subject"
            className="text-xs font-semibold text-white/50 block mb-1.5"
          >
            Subject
          </label>
          <Input
            id="support-subject"
            placeholder="e.g. Withdrawal issue, Account question…"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
            data-ocid="support.subject_input"
          />
        </div>
        <div>
          <label
            htmlFor="support-first-message"
            className="text-xs font-semibold text-white/50 block mb-1.5"
          >
            Message <span className="text-red-400">*</span>
          </label>
          <Textarea
            id="support-first-message"
            placeholder="Describe your issue in detail…"
            value={firstMessage}
            onChange={(e) => setFirstMessage(e.target.value)}
            rows={5}
            className="bg-white/5 border-white/10 text-white placeholder:text-white/30 resize-none text-sm"
            data-ocid="support.first_message_textarea"
          />
        </div>
      </div>

      <Button
        onClick={handleSubmit}
        disabled={
          !subject.trim() || !firstMessage.trim() || openTicket.isPending
        }
        className="w-full bg-teal hover:bg-teal/90 text-white font-semibold py-5"
        data-ocid="support.open_ticket_button"
      >
        {openTicket.isPending ? (
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
        ) : (
          <Send className="h-4 w-4 mr-2" />
        )}
        Open Support Ticket
      </Button>
    </div>
  );
}

// ── Chat Thread ────────────────────────────────────────────────────────────────
function ChatThread() {
  const { data: convo, refetch: refetchConvo } = useGetSupportConversation();
  const { data: messages = [], refetch: refetchMessages } =
    useGetSupportMessages();
  const markRead = useMarkSupportMessagesRead();
  const sendMsg = useSendSupportMessage();
  const [newMessage, setNewMessage] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  // Poll every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      void refetchConvo();
      void refetchMessages();
    }, 30_000);
    return () => clearInterval(interval);
  }, [refetchConvo, refetchMessages]);

  const markReadMutate = markRead.mutate;

  // Mark messages read on mount
  useEffect(() => {
    markReadMutate();
  }, [markReadMutate]);

  // Scroll to bottom when messages arrive
  const prevCountRef = useRef(0);
  useEffect(() => {
    if (messages.length !== prevCountRef.current) {
      prevCountRef.current = messages.length;
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  });

  const handleSend = async () => {
    if (!newMessage.trim()) return;
    try {
      await sendMsg.mutateAsync(newMessage.trim());
      setNewMessage("");
      await refetchMessages();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to send message",
      );
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)]">
      {/* Conversation header */}
      {convo && (
        <div className="flex items-center justify-between mb-4 px-1">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-white truncate">
              {convo.subject}
            </p>
            <p className="text-[10px] text-white/30">
              Opened{" "}
              {new Date(
                Number(convo.createdAt) / 1_000_000,
              ).toLocaleDateString()}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={convo.status} />
            <button
              type="button"
              onClick={() => {
                void refetchConvo();
                void refetchMessages();
              }}
              className="h-7 w-7 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition-colors"
              aria-label="Refresh messages"
              data-ocid="support.refresh_button"
            >
              <RefreshCw className="h-3.5 w-3.5 text-white/50" />
            </button>
          </div>
        </div>
      )}

      {/* Message list */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1">
        {messages.map((msg, idx) => {
          const isUser = msg.senderRole !== "admin";
          const ts = new Date(Number(msg.timestamp) / 1_000_000);
          return (
            <div
              key={`msg-${String(msg.timestamp)}-${idx}`}
              className={`flex flex-col gap-1 ${isUser ? "items-end" : "items-start"}`}
              data-ocid={`support.message.${idx + 1}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                  isUser
                    ? "bg-teal text-white rounded-br-md"
                    : "bg-white/10 text-white/90 rounded-bl-md border border-white/10"
                }`}
              >
                {msg.message}
              </div>
              <p className="text-[10px] text-white/25 px-1">
                {isUser ? "You" : "Support"} ·{" "}
                {ts.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      {convo?.status !== "resolved" && (
        <div className="flex gap-2 pt-3 border-t border-white/10 mt-3">
          <input
            type="text"
            placeholder="Type a message…"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-teal/50"
            data-ocid="support.message_input"
          />
          <Button
            onClick={handleSend}
            disabled={!newMessage.trim() || sendMsg.isPending}
            size="sm"
            className="bg-teal hover:bg-teal/90 text-white shrink-0 px-4"
            data-ocid="support.send_button"
          >
            {sendMsg.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      )}

      {convo?.status === "resolved" && (
        <div className="mt-3 pt-3 border-t border-white/10 text-center">
          <p className="text-xs text-green-400/70 flex items-center justify-center gap-1.5">
            <CheckCircle className="h-3.5 w-3.5" />
            This ticket has been resolved
          </p>
        </div>
      )}
    </div>
  );
}

// ── Support Chat Button (for dashboard header) ────────────────────────────────
interface SupportChatButtonProps {
  className?: string;
}

export function SupportChatButton({ className = "" }: SupportChatButtonProps) {
  const [open, setOpen] = useState(false);
  const { data: unreadCount = 0 } = useGetUnreadSupportCount();

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`relative h-9 w-9 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition-all duration-200 ${className}`}
        aria-label="Open support chat"
        data-ocid="support.open_modal_button"
      >
        <MessageCircle className="h-4 w-4 text-white/70" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-4 w-4 bg-teal text-white text-[9px] font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      <SupportChatSheet open={open} onOpenChange={setOpen} />
    </>
  );
}

// ── Main Sheet Component ───────────────────────────────────────────────────────
interface SupportChatSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function SupportChatSheet({
  open,
  onOpenChange,
}: SupportChatSheetProps) {
  const { data: convo, isLoading, refetch } = useGetSupportConversation();
  const hasConversation = !!convo;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md bg-navy-dark/98 backdrop-blur-xl border-l border-teal/20 flex flex-col"
        data-ocid="support.dialog"
      >
        <SheetHeader>
          <div className="flex items-center justify-between">
            <SheetTitle className="text-white flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-teal" />
              Support
            </SheetTitle>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="h-8 w-8 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center"
              aria-label="Close"
              data-ocid="support.close_button"
            >
              <X className="h-4 w-4 text-white/60" />
            </button>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto mt-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-teal/50" />
            </div>
          ) : !hasConversation ? (
            <OpenTicketForm onSuccess={() => void refetch()} />
          ) : (
            <ChatThread />
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
