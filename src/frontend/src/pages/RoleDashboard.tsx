import { useEffect, useRef, useState, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { Send, QrCode, ArrowDownLeft, Users, ScanLine, ShoppingBag, DollarSign, Star, Lock, Clock as Unlock, Shield, MessageCircle, UserPlus, Receipt, TrendingUp, Zap, X, Check, Eye, EyeOff, Copy, Download, ChevronRight, TriangleAlert as AlertTriangle } from "lucide-react";
import { toast } from "sonner";

// ── Security threshold ──────────────────────────────────────────────────────────
const LARGE_TX_THRESHOLD = 50;
const IDLE_LOCK_SECONDS = 60;

// ── PIN Challenge (large tx: PIN + SMS 2FA) ────────────────────────────────────
interface PinChallengeProps {
  title: string;
  onSuccess: () => void;
  onCancel: () => void;
}

function PinChallenge({ title, onSuccess, onCancel }: PinChallengeProps) {
  const [pin, setPin] = useState("");
  const [smsCode, setSmsCode] = useState("");
  const [smsStep, setSmsStep] = useState(false);
  const [error, setError] = useState("");

  function handleDigit(d: string) { if (pin.length < 4) setPin(p => p + d); }
  function handleBack() { setPin(p => p.slice(0, -1)); }

  function submitPin() {
    if (pin.length === 4) {
      setSmsStep(true);
      setError("");
      toast.info("SMS code sent: 1234 (simulated)");
    } else {
      setError("Enter a 4-digit PIN.");
    }
  }

  function submitSms() {
    if (smsCode.length === 4) { onSuccess(); }
    else { setError("Enter the 4-digit SMS code (1234)."); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="glassmorphism rounded-2xl p-6 w-full max-w-xs space-y-5 border border-teal/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-teal" />
            <h2 className="text-sm font-bold text-foreground">{title}</h2>
          </div>
          <button onClick={onCancel} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        {!smsStep ? (
          <>
            <p className="text-xs text-muted-foreground">Transfer exceeds ${LARGE_TX_THRESHOLD}. Enter your App Lock PIN to continue.</p>
            <div className="flex justify-center gap-3">
              {[0, 1, 2, 3].map(i => (
                <div key={i} className={`h-10 w-10 rounded-full border-2 flex items-center justify-center text-lg font-bold transition-smooth ${
                  i < pin.length ? "border-teal bg-teal/20 text-teal" : "border-border"
                }`}>
                  {i < pin.length ? "•" : ""}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-2">
              {["1","2","3","4","5","6","7","8","9","","0","⌫"].map((d, i) => (
                <button key={i} onClick={() => d === "⌫" ? handleBack() : d ? handleDigit(d) : undefined} disabled={!d}
                  className={`h-12 rounded-xl text-sm font-bold transition-smooth ${
                    d === "⌫" ? "bg-white/10 text-destructive hover:bg-destructive/20"
                    : d ? "bg-white/10 text-foreground hover:bg-white/20"
                    : "opacity-0 pointer-events-none"
                  }`}>
                  {d}
                </button>
              ))}
            </div>
            {error && <p className="text-xs text-destructive text-center">{error}</p>}
            <button onClick={submitPin} className="w-full rounded-xl bg-teal py-3 text-sm font-bold text-white hover:bg-teal-light transition-smooth">
              Verify PIN
            </button>
          </>
        ) : (
          <>
            <p className="text-xs text-muted-foreground">Enter the 4-digit SMS code sent to your number.</p>
            <input
              type="text" inputMode="numeric" maxLength={4} value={smsCode}
              onChange={e => setSmsCode(e.target.value.replace(/\D/g, ""))}
              placeholder="1234"
              className="w-full rounded-xl border border-border bg-black/20 px-4 py-3 text-center text-2xl font-bold tracking-widest text-foreground placeholder:text-muted-foreground focus:border-teal focus:outline-none transition-smooth"
            />
            {error && <p className="text-xs text-destructive text-center">{error}</p>}
            <button onClick={submitSms} className="w-full rounded-xl bg-teal py-3 text-sm font-bold text-white hover:bg-teal-light transition-smooth">
              Verify SMS Code
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ── Vault Unlock (biometric simulation) ───────────────────────────────────────
interface VaultUnlockProps { onSuccess: () => void; onCancel: () => void; }

function VaultUnlockModal({ onSuccess, onCancel }: VaultUnlockProps) {
  const [scanning, setScanning] = useState(false);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="glassmorphism rounded-2xl p-6 w-full max-w-xs space-y-5 border border-amber-500/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-amber-400" />
            <h2 className="text-sm font-bold text-foreground">Vault Unlock</h2>
          </div>
          <button onClick={onCancel} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
        </div>
        <p className="text-xs text-muted-foreground text-center">Biometric re-authentication required to unlock your vault and resume transfers.</p>
        <div className="flex flex-col items-center gap-4 py-4">
          <div className={`h-20 w-20 rounded-full flex items-center justify-center border-2 transition-smooth ${scanning ? "border-teal bg-teal/20 animate-pulse" : "border-amber-500/40 bg-amber-500/10"}`}>
            <Shield className={`h-10 w-10 ${scanning ? "text-teal" : "text-amber-400"}`} />
          </div>
          <p className="text-xs text-muted-foreground">{scanning ? "Scanning biometrics…" : "Tap to authenticate"}</p>
        </div>
        <button
          onClick={() => { setScanning(true); setTimeout(() => { setScanning(false); onSuccess(); }, 2000); }}
          disabled={scanning}
          className="w-full rounded-xl bg-amber-500/80 py-3 text-sm font-bold text-white hover:bg-amber-500 transition-smooth disabled:opacity-60"
        >
          {scanning ? "Authenticating…" : "Scan Fingerprint"}
        </button>
      </div>
    </div>
  );
}

// ── My QR Code modal ───────────────────────────────────────────────────────────
interface QRModalProps { userId: string; name: string; onClose: () => void; }

function MyQRModal({ userId, name, onClose }: QRModalProps) {
  const tipUrl = `${window.location.origin}/tip/${userId.slice(0, 8)}`;

  const cells = Array.from({ length: 49 }, (_, i) =>
    [0,1,2,3,4,5,6,7,13,14,20,21,27,28,34,35,41,42,43,44,45,46,47,48,
     8,15,22,29,36,10,11,12,16,17,18,24,25,26,30,31,32,38,39,40].includes(i)
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="glassmorphism rounded-2xl p-6 w-full max-w-xs space-y-5 border border-teal/30">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-foreground">My Tip QR Code</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
        </div>
        <div className="flex flex-col items-center gap-4">
          <div className="rounded-2xl bg-white p-5 shadow-xl">
            <div className="grid grid-cols-7 gap-1">
              {cells.map((filled, i) => (
                <div key={i} className={`h-5 w-5 rounded-sm ${filled ? "bg-gray-900" : "bg-transparent"}`} />
              ))}
            </div>
          </div>
          <div className="text-center space-y-1">
            <p className="text-sm font-bold text-foreground">{name}</p>
            <p className="text-xs text-muted-foreground truncate max-w-[200px]">{tipUrl}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => { navigator.clipboard.writeText(tipUrl); toast.success("Tip link copied!"); }}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-border py-2.5 text-xs font-semibold text-foreground hover:border-teal/40 transition-smooth"
          >
            <Copy className="h-3.5 w-3.5" /> Copy Link
          </button>
          <button
            onClick={() => toast.info("Download feature coming soon.")}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-teal py-2.5 text-xs font-semibold text-white hover:bg-teal-light transition-smooth"
          >
            <Download className="h-3.5 w-3.5" /> Save
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Scan QR modal (camera simulation) ─────────────────────────────────────────
interface ScanQRModalProps { onClose: () => void; }

function ScanQRModal({ onClose }: ScanQRModalProps) {
  const [scanned, setScanned] = useState(false);
  useEffect(() => { const t = setTimeout(() => setScanned(true), 3000); return () => clearTimeout(t); }, []);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
      <div className="w-full max-w-xs space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-foreground">Scan QR Code</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
        </div>
        <div className="relative h-64 w-full rounded-2xl overflow-hidden bg-black/40 border border-white/10 flex items-center justify-center">
          {!scanned ? (
            <>
              <div className="absolute inset-6 border-2 border-teal/60 rounded-xl" />
              <div className="absolute top-6 left-6 right-6 h-0.5 bg-teal/80 animate-bounce" style={{ animationDuration: "1.5s" }} />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center space-y-2">
                  <ScanLine className="h-10 w-10 text-teal/60 mx-auto" />
                  <p className="text-xs text-muted-foreground">Align QR code in the frame…</p>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center gap-3 fade-in-up">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-teal/20 border border-teal">
                <Check className="h-7 w-7 text-teal" />
              </div>
              <p className="text-sm font-bold text-foreground">Staff Badge Detected!</p>
              <p className="text-xs text-muted-foreground">Jake — Bartender, Section 112</p>
              <button
                onClick={() => { onClose(); window.location.href = "/wallet/send"; }}
                className="rounded-xl bg-teal px-6 py-2.5 text-sm font-bold text-white hover:bg-teal-light transition-smooth"
              >
                Send Tip to Jake
              </button>
            </div>
          )}
        </div>
        <p className="text-center text-xs text-muted-foreground">Camera simulation · Scanning for staff badges and payment stands</p>
      </div>
    </div>
  );
}

// ── Idle lock screen ───────────────────────────────────────────────────────────
interface IdleLockProps { onUnlock: () => void; }

function IdleLockScreen({ onUnlock }: IdleLockProps) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");

  function handleDigit(d: string) { if (pin.length < 4) setPin(p => p + d); }
  function handleBack() { setPin(p => p.slice(0, -1)); }
  function submit() { if (pin.length === 4) { setError(""); onUnlock(); } else { setError("Enter 4 digits."); } }

  return (
    <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-background/95 backdrop-blur-xl p-6 gap-6">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-teal/20 border border-teal">
        <Lock className="h-8 w-8 text-teal" />
      </div>
      <div className="text-center">
        <h2 className="text-xl font-bold text-foreground">Screen Locked</h2>
        <p className="text-sm text-muted-foreground mt-1">1 minute idle · Enter PIN to continue</p>
      </div>
      <div className="flex gap-3">
        {[0, 1, 2, 3].map(i => (
          <div key={i} className={`h-12 w-12 rounded-full border-2 flex items-center justify-center text-lg font-bold transition-smooth ${
            i < pin.length ? "border-teal bg-teal/20 text-teal" : "border-border"
          }`}>
            {i < pin.length ? "•" : ""}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-3 w-full max-w-[240px]">
        {["1","2","3","4","5","6","7","8","9","","0","⌫"].map((d, i) => (
          <button key={i} onClick={() => d === "⌫" ? handleBack() : d ? handleDigit(d) : undefined} disabled={!d}
            className={`h-14 rounded-2xl text-base font-bold transition-smooth ${
              d === "⌫" ? "bg-white/10 text-destructive hover:bg-destructive/20"
              : d ? "bg-white/10 text-foreground hover:bg-white/20"
              : "opacity-0 pointer-events-none"
            }`}>
            {d}
          </button>
        ))}
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
      <button onClick={submit} className="w-full max-w-[240px] rounded-xl bg-teal py-3 text-sm font-bold text-white hover:bg-teal-light transition-smooth">
        Unlock
      </button>
    </div>
  );
}

// ── Invite Friends sheet ───────────────────────────────────────────────────────
interface InviteProps { onClose: () => void; }

function InviteSheet({ onClose }: InviteProps) {
  const [copied, setCopied] = useState(false);
  const referralLink = `${window.location.origin}/?ref=opentip`;
  function copy() { navigator.clipboard.writeText(referralLink); setCopied(true); setTimeout(() => setCopied(false), 2000); }
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="glassmorphism rounded-t-3xl w-full max-w-lg p-6 space-y-5 border-t border-teal/20">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-foreground">Invite Friends</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
        </div>
        <div className="text-center space-y-2 py-2">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-teal/20 border border-teal mx-auto">
            <UserPlus className="h-7 w-7 text-teal" />
          </div>
          <p className="text-sm font-semibold text-foreground">Earn 100 Fan Points per referral</p>
          <p className="text-xs text-muted-foreground">Share your link — when a friend signs up and tips, you both earn bonus Fan Points.</p>
        </div>
        <div className="rounded-xl bg-black/20 border border-border p-3 flex items-center gap-2">
          <code className="flex-1 text-xs text-muted-foreground truncate">{referralLink}</code>
          <button onClick={copy} className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-smooth ${copied ? "bg-teal/20 text-teal" : "bg-teal text-white hover:bg-teal-light"}`}>
            {copied ? <><Check className="h-3 w-3" /> Copied</> : <><Copy className="h-3 w-3" /> Copy</>}
          </button>
        </div>
        <button
          onClick={() => { if (navigator.share) navigator.share({ title: "Join Open Tip Pay", url: referralLink }); else copy(); }}
          className="w-full rounded-xl bg-teal py-3 text-sm font-bold text-white hover:bg-teal-light transition-smooth"
        >
          Share Invite Link
        </button>
      </div>
    </div>
  );
}

// ── AI Assistant chat ──────────────────────────────────────────────────────────
interface AIChatProps { onClose: () => void; }

function AIAssistantChat({ onClose }: AIChatProps) {
  const [messages, setMessages] = useState([
    { role: "assistant", text: "Hi! I'm your Open Tip Pay assistant. Ask me about tipping, rewards, splitting bills, or security." },
  ]);
  const [input, setInput] = useState("");

  const RESPONSES: Record<string, string> = {
    tip: "To tip a staff member, tap 'Send Tip' on the dashboard or scan their QR badge using the Scan QR button.",
    reward: "You earn Fan Points on every tip and payment. Redeem them for merch, food credits, or seating upgrades on the Rewards page.",
    split: "Use 'Split Bill' to divide a total by equal share, custom percentage, or exact amounts among up to 6 people.",
    vault: "Vault Lock freezes all outgoing transactions instantly. It has a 24-hour cooldown and requires biometric re-authentication to unlock early.",
    secure: "Transfers over $50 require both your App Lock PIN and a simulated SMS 2FA code for security.",
    order: "Use 'Order Food' to browse the concession menu and add items to your cart for in-seat delivery.",
    qr: "Your QR code is your personal tip link. Staff and fans can scan it to send you tips instantly.",
    default: "I can help with tips, rewards, security, payments, and food ordering. What would you like to know?",
  };

  function send() {
    if (!input.trim()) return;
    const userMsg = input.trim();
    setInput("");
    setMessages(m => [...m, { role: "user", text: userMsg }]);
    const lower = userMsg.toLowerCase();
    const key = Object.keys(RESPONSES).find(k => lower.includes(k)) ?? "default";
    setTimeout(() => {
      setMessages(m => [...m, { role: "assistant", text: RESPONSES[key] }]);
    }, 600);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="glassmorphism rounded-t-3xl w-full max-w-lg border-t border-teal/20 flex flex-col" style={{ maxHeight: "70vh" }}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/30">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-full bg-teal/20 flex items-center justify-center">
              <MessageCircle className="h-4 w-4 text-teal" />
            </div>
            <span className="text-sm font-bold text-foreground">AI Assistant</span>
            <span className="rounded-full bg-teal/20 px-2 py-0.5 text-[10px] font-semibold text-teal">Online</span>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 min-h-0">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-xs ${
                m.role === "user" ? "bg-teal text-white rounded-br-sm" : "glassmorphism text-foreground rounded-bl-sm"
              }`}>
                {m.text}
              </div>
            </div>
          ))}
        </div>
        <div className="flex gap-2 px-4 py-4 border-t border-border/30">
          <input
            value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && send()}
            placeholder="Ask anything…"
            className="flex-1 rounded-xl border border-border bg-black/20 px-3 py-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:border-teal focus:outline-none transition-smooth"
          />
          <button onClick={send} className="rounded-xl bg-teal px-4 py-2.5 text-xs font-bold text-white hover:bg-teal-light transition-smooth">
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Dashboard ──────────────────────────────────────────────────────────────
interface RecentTip {
  id: string;
  amount: number;
  tipper_name: string | null;
  created_at: string;
  transaction_type: string;
}

export default function RoleDashboard() {
  const { user, profile } = useAuth();

  // Data
  const [balance, setBalance] = useState(0);
  const [totalEarned, setTotalEarned] = useState(0);
  const [thisWeek, setThisWeek] = useState(0);
  const [tipCount, setTipCount] = useState(0);
  const [fanPoints, setFanPoints] = useState(0);
  const [recentTips, setRecentTips] = useState<RecentTip[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Vault lock
  const [vaultLocked, setVaultLocked] = useState(false);
  const [vaultCooldownEnd, setVaultCooldownEnd] = useState<number | null>(null);
  const [vaultCooldownDisplay, setVaultCooldownDisplay] = useState("");
  const [showVaultUnlock, setShowVaultUnlock] = useState(false);

  // Security / idle
  const [idleLocked, setIdleLocked] = useState(false);
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  const [showPinChallenge, setShowPinChallenge] = useState(false);

  // UI overlays
  const [showMyQR, setShowMyQR] = useState(false);
  const [showScanQR, setShowScanQR] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [showBalance, setShowBalance] = useState(true);

  const displayName = profile?.full_name || user?.email?.split("@")[0] || "there";
  const tipSlug = user?.id?.slice(0, 8) ?? "";

  // Load data
  useEffect(() => {
    if (!user) return;
    Promise.all([fetchTransactions(), fetchFanPoints()]).finally(() => setLoadingData(false));
  }, [user]);

  async function fetchTransactions() {
    const { data } = await supabase
      .from("transactions")
      .select("id, amount, tipper_name, created_at, transaction_type")
      .eq("staff_id", user!.id)
      .order("created_at", { ascending: false })
      .limit(20);
    if (!data) return;
    setRecentTips(data.slice(0, 5));
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const earned = data.reduce((s, t) => s + (t.amount || 0), 0);
    const week = data.filter(t => new Date(t.created_at) >= weekAgo).reduce((s, t) => s + (t.amount || 0), 0);
    setBalance(earned);
    setTotalEarned(earned);
    setThisWeek(week);
    setTipCount(data.length);
  }

  async function fetchFanPoints() {
    const { data } = await supabase
      .from("fan_point_balances")
      .select("total_points")
      .eq("user_id", user!.id)
      .maybeSingle();
    if (data) setFanPoints(Number(data.total_points) || 0);
  }

  // Vault cooldown ticker
  useEffect(() => {
    if (!vaultCooldownEnd) return;
    const interval = setInterval(() => {
      const remaining = Math.max(0, vaultCooldownEnd - Date.now());
      if (remaining === 0) {
        clearInterval(interval);
        setVaultCooldownDisplay("");
        setVaultCooldownEnd(null);
      } else {
        const h = Math.floor(remaining / 3600000);
        const m = Math.floor((remaining % 3600000) / 60000);
        const s = Math.floor((remaining % 60000) / 1000);
        setVaultCooldownDisplay(`${h}h ${m}m ${s}s`);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [vaultCooldownEnd]);

  function lockVault() {
    setVaultLocked(true);
    setVaultCooldownEnd(Date.now() + 24 * 60 * 60 * 1000);
    supabase.from("profiles").update({ vault_locked: true }).eq("id", user!.id);
    toast.success("Vault locked. All outgoing transactions frozen for 24 hours.");
  }

  function onVaultUnlockSuccess() {
    setVaultLocked(false);
    setVaultCooldownEnd(null);
    setVaultCooldownDisplay("");
    setShowVaultUnlock(false);
    supabase.from("profiles").update({ vault_locked: false }).eq("id", user!.id);
    toast.success("Vault unlocked via biometrics.");
  }

  // Idle lock
  const resetIdleTimer = useCallback(() => {
    if (idleTimer.current) clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(() => setIdleLocked(true), IDLE_LOCK_SECONDS * 1000);
  }, []);

  useEffect(() => {
    const events = ["mousemove", "keydown", "touchstart", "click"];
    events.forEach(e => window.addEventListener(e, resetIdleTimer));
    resetIdleTimer();
    return () => {
      events.forEach(e => window.removeEventListener(e, resetIdleTimer));
      if (idleTimer.current) clearTimeout(idleTimer.current);
    };
  }, [resetIdleTimer]);

  // Large-tx security gate
  function requireSecurityGate(amount: number, action: () => void) {
    if (vaultLocked) { toast.error("Vault is locked. Unlock via biometrics to transfer funds."); return; }
    if (amount > LARGE_TX_THRESHOLD) {
      setPendingAction(() => action);
      setShowPinChallenge(true);
    } else {
      action();
    }
  }

  function onPinSuccess() {
    setShowPinChallenge(false);
    if (pendingAction) { pendingAction(); setPendingAction(null); }
    toast.success("Identity verified. Proceeding with transfer.");
  }

  // 7 Quick Actions
  const QUICK_ACTIONS = [
    {
      label: "Send Money",
      icon: Send,
      color: "bg-teal/20 text-teal",
      note: "msg req.",
      action: () => requireSecurityGate(100, () => { window.location.href = "/wallet/send"; }),
    },
    {
      label: "Send Tip",
      icon: DollarSign,
      color: "bg-emerald-500/20 text-emerald-400",
      note: null,
      action: () => requireSecurityGate(0, () => { window.location.href = "/wallet/send?tip=1"; }),
    },
    {
      label: "Request",
      icon: ArrowDownLeft,
      color: "bg-blue-500/20 text-blue-400",
      note: null,
      action: () => { window.location.href = "/wallet/request"; },
    },
    {
      label: "Split Bill",
      icon: Users,
      color: "bg-amber-500/20 text-amber-400",
      note: null,
      action: () => { window.location.href = "/wallet/split"; },
    },
    {
      label: "Scan QR",
      icon: ScanLine,
      color: "bg-cyan-500/20 text-cyan-400",
      note: null,
      action: () => setShowScanQR(true),
    },
    {
      label: "My QR",
      icon: QrCode,
      color: "bg-rose-500/20 text-rose-400",
      note: null,
      action: () => setShowMyQR(true),
    },
    {
      label: "Order Food",
      icon: ShoppingBag,
      color: "bg-orange-500/20 text-orange-400",
      note: null,
      action: () => { window.location.href = "/order"; },
    },
  ];

  const frozen = vaultLocked;

  return (
    <>
      {/* Overlays */}
      {idleLocked && <IdleLockScreen onUnlock={() => { setIdleLocked(false); resetIdleTimer(); }} />}
      {showPinChallenge && (
        <PinChallenge
          title="Security Verification"
          onSuccess={onPinSuccess}
          onCancel={() => { setShowPinChallenge(false); setPendingAction(null); }}
        />
      )}
      {showVaultUnlock && (
        <VaultUnlockModal onSuccess={onVaultUnlockSuccess} onCancel={() => setShowVaultUnlock(false)} />
      )}
      {showMyQR && <MyQRModal userId={user?.id ?? ""} name={displayName} onClose={() => setShowMyQR(false)} />}
      {showScanQR && <ScanQRModal onClose={() => setShowScanQR(false)} />}
      {showInvite && <InviteSheet onClose={() => setShowInvite(false)} />}
      {showAI && <AIAssistantChat onClose={() => setShowAI(false)} />}

      <div className="min-h-screen bg-background">
        {/* Ambient glows */}
        <div className="pointer-events-none fixed inset-0 overflow-hidden -z-10">
          <div className={`absolute left-1/4 top-[-10%] h-[500px] w-[500px] rounded-full blur-[100px] transition-all duration-700 ${frozen ? "bg-amber-500/[0.08]" : "bg-teal/[0.07]"}`} />
          <div className="absolute bottom-0 right-1/4 h-[400px] w-[400px] rounded-full bg-teal/[0.04] blur-[100px]" />
        </div>

        {/* Header */}
        <header className="sticky top-0 z-30 border-b border-border/40 bg-background/85 backdrop-blur-xl">
          <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <div className={`flex h-8 w-8 items-center justify-center rounded-lg transition-smooth ${frozen ? "bg-amber-500" : "bg-teal glow-teal"}`}>
                <DollarSign className="h-4 w-4 text-white" />
              </div>
              <div>
                <span className="text-base font-bold text-foreground">Colts Tip Pay</span>
                {profile?.role && (
                  <span className="ml-2 rounded-full bg-teal/20 px-2 py-0.5 text-[10px] font-semibold text-teal capitalize">{profile.role}</span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => setShowInvite(true)} className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-white/5 hover:text-teal transition-smooth">
                <UserPlus className="h-4 w-4" />
              </button>
              <button onClick={() => { window.location.href = "/security"; }} className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-white/5 hover:text-foreground transition-smooth">
                <Shield className="h-4 w-4" />
              </button>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-2xl px-4 pt-5 pb-28 space-y-5 fade-in-up">
          {/* Greeting */}
          <div>
            <p className="text-sm text-muted-foreground">Welcome back,</p>
            <h1 className="text-2xl font-bold text-foreground capitalize">{displayName}</h1>
          </div>

          {/* ── Balance Card ── */}
          <div className={`relative rounded-2xl p-5 overflow-hidden border transition-all duration-500 ${
            frozen
              ? "border-amber-500/40 bg-gradient-to-br from-amber-950/60 to-amber-900/20"
              : "glassmorphism border-teal/20"
          }`}>
            <div className={`absolute inset-0 rounded-2xl opacity-10 ${frozen ? "bg-gradient-to-br from-amber-400 to-transparent" : "bg-gradient-to-br from-teal to-transparent"}`} />

            <div className="relative z-10 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-1">
                    {frozen ? "VAULT LOCKED — Funds Frozen" : "Account Balance"}
                  </p>
                  <div className="flex items-center gap-2">
                    <p className={`text-4xl font-bold tracking-tight ${frozen ? "text-amber-400" : "text-foreground"}`}>
                      {loadingData ? (
                        <span className="inline-block h-9 w-28 rounded-lg bg-white/10 animate-pulse align-middle" />
                      ) : showBalance ? `$${balance.toFixed(2)}` : "••••••"}
                    </p>
                    <button onClick={() => setShowBalance(v => !v)} className="text-muted-foreground hover:text-foreground transition-smooth mt-1">
                      {showBalance ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {frozen && vaultCooldownDisplay && (
                    <p className="text-xs text-amber-400/80 mt-1 font-medium">Cooldown: {vaultCooldownDisplay} remaining</p>
                  )}
                </div>

                {/* Vault Lock Toggle */}
                <button
                  onClick={() => {
                    if (frozen) setShowVaultUnlock(true);
                    else lockVault();
                  }}
                  className={`flex flex-col items-center gap-1 rounded-xl p-2.5 border-2 transition-all duration-300 ${
                    frozen
                      ? "border-amber-500 bg-amber-500/20 text-amber-400 shadow-lg shadow-amber-500/20"
                      : "border-white/20 bg-white/5 text-muted-foreground hover:border-teal/40 hover:text-teal"
                  }`}
                >
                  {frozen ? <Lock className="h-6 w-6" /> : <Unlock className="h-6 w-6" />}
                  <span className={`text-[9px] font-bold uppercase tracking-wide ${frozen ? "text-amber-400" : "text-muted-foreground"}`}>
                    {frozen ? "Locked" : "Vault"}
                  </span>
                </button>
              </div>

              {/* Stats row */}
              <div className="flex gap-2">
                {[
                  { label: "This Week", value: `$${thisWeek.toFixed(2)}`, icon: TrendingUp },
                  { label: "Tips", value: tipCount.toString(), icon: Zap },
                  { label: "Total", value: `$${totalEarned.toFixed(2)}`, icon: DollarSign },
                ].map(({ label, value, icon: Icon }) => (
                  <div key={label} className="flex-1 rounded-xl bg-black/20 px-2 py-2 text-center">
                    <Icon className={`mx-auto mb-0.5 h-3 w-3 ${frozen ? "text-amber-400" : "text-teal"}`} />
                    <p className="text-sm font-bold text-foreground">{loadingData ? "—" : value}</p>
                    <p className="text-[9px] text-muted-foreground">{label}</p>
                  </div>
                ))}
              </div>

              {frozen && (
                <div className="flex items-center gap-2 rounded-xl bg-amber-500/10 border border-amber-500/30 px-3 py-2">
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-400 flex-shrink-0" />
                  <p className="text-[11px] text-amber-300 font-medium">All outgoing transactions are frozen. Tap the lock icon to unlock via biometrics.</p>
                </div>
              )}
            </div>
          </div>

          {/* ── 7 Quick Actions ── */}
          <div>
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Quick Actions</h2>
            <div className="grid grid-cols-4 gap-3">
              {QUICK_ACTIONS.map(({ label, icon: Icon, color, note, action }) => {
                const isFrozenAction = frozen && (label === "Send Money" || label === "Send Tip");
                return (
                  <button
                    key={label}
                    onClick={action}
                    className={`relative flex flex-col items-center gap-2 rounded-2xl glassmorphism p-3 transition-smooth ${
                      isFrozenAction ? "opacity-40 cursor-not-allowed" : "hover:border-teal/40"
                    }`}
                  >
                    {note && (
                      <span className="absolute -top-1.5 -right-1.5 rounded-full bg-teal px-1.5 py-0.5 text-[8px] font-bold text-white leading-tight z-10">
                        {note}
                      </span>
                    )}
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${color}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="text-[10px] font-semibold text-foreground text-center leading-tight">{label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Fan Points Card ── */}
          <button
            onClick={() => { window.location.href = "/rewards"; }}
            className="w-full rounded-2xl p-4 flex items-center justify-between border border-amber-500/20 bg-gradient-to-r from-amber-950/30 to-transparent hover:border-amber-500/40 transition-smooth"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/20 border border-amber-500/30">
                <Star className="h-6 w-6 text-amber-400" />
              </div>
              <div className="text-left">
                <p className="text-sm font-bold text-foreground">Fan Points</p>
                <p className="text-xs text-muted-foreground">Redeem for Colts perks</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-right">
                {loadingData ? (
                  <div className="h-5 w-16 rounded bg-white/10 animate-pulse" />
                ) : (
                  <p className="text-xl font-bold text-amber-400">{fanPoints.toLocaleString()}</p>
                )}
                <p className="text-[10px] text-muted-foreground">pts available</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>
          </button>

          {/* ── Invite Friends ── */}
          <button
            onClick={() => setShowInvite(true)}
            className="w-full rounded-2xl glassmorphism p-4 flex items-center gap-3 hover:border-teal/40 transition-smooth"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal/20">
              <UserPlus className="h-5 w-5 text-teal" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-semibold text-foreground">Invite Friends</p>
              <p className="text-xs text-muted-foreground">Earn 100 Fan Points per referral</p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>

          {/* ── Recent Activity ── */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Recent Activity</h2>
              <button onClick={() => { window.location.href = "/transactions"; }} className="text-xs text-teal hover:text-teal-light transition-smooth">View all</button>
            </div>
            {loadingData ? (
              <div className="space-y-2">{[1, 2, 3].map(i => <div key={i} className="h-14 rounded-xl bg-white/5 animate-pulse" />)}</div>
            ) : recentTips.length === 0 ? (
              <div className="glassmorphism rounded-2xl py-10 text-center">
                <Receipt className="mx-auto mb-2 h-8 w-8 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">No activity yet.</p>
                <p className="text-xs text-muted-foreground/60 mt-1">Share your tip link to start receiving.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {recentTips.map(tip => (
                  <div key={tip.id} className="glassmorphism rounded-xl px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-teal/20 text-teal text-xs font-bold">
                        {(tip.tipper_name || "?").charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{tip.tipper_name || "Anonymous"}</p>
                        <p className="text-xs text-muted-foreground">{new Date(tip.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <p className="text-sm font-bold text-teal">+${(tip.amount || 0).toFixed(2)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Tip Link ── */}
          <div className="glassmorphism rounded-2xl p-4 border border-teal/20">
            <p className="text-xs text-muted-foreground mb-2 font-semibold">Your Tip Link</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 truncate rounded-lg bg-black/20 px-3 py-2 text-xs text-muted-foreground">
                {window.location.origin}/tip/{tipSlug}
              </code>
              <button
                onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/tip/${tipSlug}`); toast.success("Tip link copied!"); }}
                className="rounded-lg bg-teal px-3 py-2 text-xs font-semibold text-white hover:bg-teal-light transition-smooth"
              >
                Copy
              </button>
            </div>
          </div>
        </main>

        {/* Bottom nav */}
        {(() => {
          const NAV = [
            { label: "Home",     icon: DollarSign, href: "/dashboard"    },
            { label: "Wallet",   icon: Send,       href: "/wallet/send"  },
            { label: "Activity", icon: Receipt,    href: "/transactions" },
            { label: "Rewards",  icon: Star,       href: "/rewards"      },
            { label: "Profile",  icon: Shield,     href: "/profile"      },
          ];
          const path = window.location.pathname;
          return (
            <nav className="fixed bottom-0 inset-x-0 z-40 border-t border-border/40 bg-background/95 backdrop-blur-xl">
              <div className="mx-auto flex max-w-2xl">
                {NAV.map(({ label, icon: Icon, href }) => {
                  const active = path === href || (href === "/dashboard" && (path === "/" || path === "/dashboard"));
                  return (
                    <button key={href} onClick={() => { window.location.href = href; }}
                      className={`flex flex-1 flex-col items-center gap-0.5 py-3 text-[11px] font-semibold transition-smooth ${active ? "text-teal" : "text-muted-foreground hover:text-foreground"}`}
                    >
                      <Icon className="h-5 w-5" />
                      {label}
                    </button>
                  );
                })}
              </div>
            </nav>
          );
        })()}

        {/* Floating AI Assistant */}
        <button
          onClick={() => setShowAI(true)}
          className="fixed bottom-20 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-teal shadow-xl shadow-teal/30 hover:bg-teal-light transition-smooth glow-teal-hero"
        >
          <MessageCircle className="h-6 w-6 text-white" />
        </button>
      </div>
    </>
  );
}
