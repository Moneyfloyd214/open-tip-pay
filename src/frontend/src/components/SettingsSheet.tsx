import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Check, Clock, Copy, FileText, Shield } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  useGetDirectDepositAccount,
  useGetDirectDepositHistory,
  useGetLegalAndPrivacy,
  useGetMyBusinessApplication,
  useIsCallerAdmin,
} from "../hooks/useQueries";
import BusinessUpgrade from "./BusinessUpgrade";
import DisputeResolutionCenter from "./DisputeResolutionCenter";

function BusinessSettingsContent() {
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  const { data: application, isLoading } = useGetMyBusinessApplication();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-teal border-t-transparent" />
      </div>
    );
  }

  if (!application && !showApplicationForm) {
    return <BusinessLandingPage onApply={() => setShowApplicationForm(true)} />;
  }

  return <BusinessUpgrade />;
}
import BusinessLandingPage from "./BusinessLandingPage";
import ManageMyData from "./ManageMyData";
import PaymentMethods from "./PaymentMethods";
import SecurityCenter from "./SecurityCenter";
import SpendingLimits from "./SpendingLimits";

interface SettingsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultTab?: string;
}

// ─── Copy Field ────────────────────────────────────────────────────────────────

function CopyRow({
  label,
  value,
  ocid,
}: { label: string; value: string; ocid: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast.success(`${label} copied`);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  };

  return (
    <div className="flex items-center justify-between gap-3 bg-muted/30 rounded-xl px-4 py-3 border border-border">
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-0.5">
          {label}
        </p>
        <p className="text-sm font-mono font-semibold text-foreground tracking-wider truncate">
          {value}
        </p>
      </div>
      <button
        type="button"
        onClick={handleCopy}
        aria-label={`Copy ${label}`}
        data-ocid={ocid}
        className="h-8 w-8 flex items-center justify-center rounded-lg bg-teal/10 hover:bg-teal/20 border border-teal/30 text-teal transition-all duration-200 shrink-0"
      >
        {copied ? (
          <Check className="h-3.5 w-3.5 text-green-400" />
        ) : (
          <Copy className="h-3.5 w-3.5" />
        )}
      </button>
    </div>
  );
}

// ─── Direct Deposit Settings Section ──────────────────────────────────────────

function DirectDepositSection() {
  const { data: account, isLoading } = useGetDirectDepositAccount();
  const { data: history = [] } = useGetDirectDepositHistory();

  const recent = history.slice(0, 5);

  function tsToMs(ts: bigint) {
    return Number(ts) / 1_000_000;
  }

  function StatusBadge({ status }: { status: string }) {
    const map: Record<string, string> = {
      Pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
      Completed: "bg-green-500/20 text-green-400 border-green-500/30",
      Failed: "bg-red-500/20 text-red-400 border-red-500/30",
    };
    const cls =
      map[status] ?? "bg-muted/30 text-muted-foreground border-border";
    return (
      <span
        className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${cls}`}
      >
        {status}
      </span>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-3 animate-pulse">
        <div className="h-14 rounded-xl bg-muted/30" />
        <div className="h-14 rounded-xl bg-muted/30" />
        <div className="h-10 rounded-lg bg-muted/30 w-3/4" />
      </div>
    );
  }

  return (
    <div className="space-y-5" data-ocid="settings-direct-deposit-section">
      {/* Status Row */}
      <div className="flex items-center gap-2 bg-teal/5 border border-teal/20 rounded-xl px-4 py-3">
        <span className="h-2 w-2 rounded-full bg-teal animate-pulse" />
        <p className="text-xs text-teal/90 font-medium">
          Your virtual account is ready to receive deposits
        </p>
      </div>

      {/* Account Numbers */}
      {account ? (
        <div className="space-y-3">
          <CopyRow
            label="Routing Number"
            value={account.routingNumber}
            ocid="settings-direct-deposit-copy-routing"
          />
          <CopyRow
            label="Account Number"
            value={account.accountNumber}
            ocid="settings-direct-deposit-copy-account"
          />
        </div>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-3">
          Unable to load account details
        </p>
      )}

      {/* Helper Text */}
      <p className="text-xs text-muted-foreground leading-relaxed bg-muted/30 border border-border rounded-xl px-4 py-3">
        Share your routing and account numbers with your employer or bank.
        Deposits typically arrive within 1–2 business days.
      </p>

      {/* Recent Deposits */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">
          Recent Deposits
        </p>
        {recent.length === 0 ? (
          <div
            className="rounded-xl p-6 text-center border border-border bg-muted/20"
            data-ocid="settings-direct-deposit-empty-state"
          >
            <Clock className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">No deposits yet</p>
            <p className="text-[11px] text-muted-foreground/60 mt-1">
              Share your account details to start receiving direct deposits.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {recent.map((dep, idx) => (
              <div
                key={dep.id}
                className="flex items-center justify-between rounded-xl px-4 py-3 border border-border bg-card"
                data-ocid={`settings-direct-deposit-item.${idx + 1}`}
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground">
                    ${(Number(dep.amount) / 100).toFixed(2)}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {new Date(tsToMs(dep.createdAt)).toLocaleDateString()}
                    {dep.isTest && (
                      <span className="ml-1.5 text-muted-foreground/50">
                        (test)
                      </span>
                    )}
                  </p>
                </div>
                <StatusBadge status={dep.status} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
// ─── Main Component ────────────────────────────────────────────────────────────
export default function SettingsSheet({
  open,
  onOpenChange,
  defaultTab = "security",
}: SettingsSheetProps) {
  const { data: legal } = useGetLegalAndPrivacy();
  const { data: isAdmin } = useIsCallerAdmin();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-2xl bg-card/95 backdrop-blur-xl border-teal/20 overflow-y-auto"
      >
        <SheetHeader>
          <SheetTitle className="text-foreground">Settings</SheetTitle>
        </SheetHeader>

        <Tabs defaultValue={defaultTab} className="mt-6">
          <TabsList className="grid w-full grid-cols-4 bg-muted/50 mb-1">
            <TabsTrigger
              value="security"
              className="data-[state=active]:bg-teal text-xs"
              data-ocid="settings-security-tab"
            >
              Security
            </TabsTrigger>
            <TabsTrigger
              value="payments"
              className="data-[state=active]:bg-teal text-xs"
              data-ocid="settings-payments-tab"
            >
              Payments
            </TabsTrigger>
            <TabsTrigger
              value="deposit"
              className="data-[state=active]:bg-teal text-xs"
              data-ocid="settings-deposit-tab"
            >
              Deposit
            </TabsTrigger>
            <TabsTrigger
              value="limits"
              className="data-[state=active]:bg-teal text-xs"
              data-ocid="settings-limits-tab"
            >
              Limits
            </TabsTrigger>
          </TabsList>
          <TabsList className="grid w-full grid-cols-4 bg-muted/50">
            <TabsTrigger
              value="disputes"
              className="data-[state=active]:bg-teal text-xs"
            >
              Disputes
            </TabsTrigger>
            <TabsTrigger
              value="legal"
              className="data-[state=active]:bg-teal text-xs"
            >
              Legal
            </TabsTrigger>
            <TabsTrigger
              value="privacy"
              className="data-[state=active]:bg-teal text-xs"
              data-ocid="settings-privacy-tab"
            >
              Privacy
            </TabsTrigger>
            <TabsTrigger
              value="business"
              className="data-[state=active]:bg-teal text-xs"
              data-ocid="settings-business-tab"
            >
              Business
            </TabsTrigger>
          </TabsList>

          <TabsContent value="security" className="mt-4">
            <SecurityCenter />

            {/* Admin controls moved to dedicated Admin Panel */}
            {isAdmin && (
              <div className="mt-6 space-y-3">
                <Separator className="bg-teal/20" />
                <div className="p-4 rounded-xl bg-teal/5 border border-teal/20 space-y-2">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-teal shrink-0" />
                    <h3 className="text-sm font-semibold text-foreground">
                      Admin Controls
                    </h3>
                    <Badge className="ml-auto text-[10px] bg-teal/10 text-teal border-teal/30">
                      Admin Only
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    All admin controls have been moved to the dedicated Admin
                    Panel. Use the shield button on your dashboard to access it.
                  </p>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="payments" className="mt-4">
            <PaymentMethods />
          </TabsContent>

          <TabsContent value="deposit" className="mt-4">
            <div className="space-y-4 pb-20">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-sm font-semibold text-foreground">
                  Direct Deposit
                </h3>
              </div>
              <DirectDepositSection />
            </div>
          </TabsContent>

          <TabsContent value="limits" className="mt-4">
            <div className="pb-20">
              <SpendingLimits />
            </div>
          </TabsContent>

          <TabsContent value="disputes" className="mt-4">
            <DisputeResolutionCenter />
          </TabsContent>

          <TabsContent value="legal" className="mt-4">
            <ScrollArea className="h-[calc(100vh-16rem)]">
              <div className="space-y-6 pr-4">
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-foreground">
                    Legal & Privacy
                  </h3>

                  <div className="space-y-2 glassmorphism p-4 rounded-lg">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-teal" />
                      <h4 className="text-sm font-medium text-foreground">
                        Terms of Service
                      </h4>
                    </div>
                    <p className="text-xs text-foreground/70 leading-relaxed">
                      {legal?.terms ||
                        `OPEN TIP PAY — TERMS OF SERVICE

By accessing or using Open Tip Pay, you agree to be bound by these Terms of Service.

FEE SCHEDULE

Open Tip Pay charges the following fees:

Sending Money:
• From balance or debit card (personal): Free
• From credit card: 3% of the transaction amount
• Crypto transfers: No platform fee

Receiving Money:
• Personal accounts: Free
• Business accounts: 2.6% + $0.15 per payment received

Withdrawals:
• Standard (1–3 business days): Free
• Instant (arrives immediately): 0.5%–2.5% of withdrawal amount (min. $0.25)
• ATM withdrawal: $2.50 per transaction

International / Foreign Transactions:
• 3% foreign transaction fee on international card payments

Direct Deposit:
• Receiving direct deposit: Free

Other Fees:
• No monthly fees
• No account maintenance fees
• No minimum balance fees

Fees are shown before transaction confirmation. All fees are subject to change with advance notice. Current fee schedule is always available under Settings → Legal.

Users are responsible for their transactions and must comply with applicable laws. Open Tip Pay reserves the right to suspend accounts that violate these Terms.`}
                    </p>
                  </div>

                  <Separator className="bg-white/10" />

                  <div className="space-y-2 glassmorphism p-4 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-teal" />
                      <h4 className="text-sm font-medium text-foreground">
                        Privacy Policy
                      </h4>
                    </div>
                    <p className="text-xs text-foreground/70 leading-relaxed">
                      {legal?.privacy ||
                        "We respect your privacy. Your personal information is encrypted with AES-256 and stored securely. We do not share your data with third parties without your consent. Transaction data is stored on the blockchain for transparency and security. All messages use end-to-end encryption."}
                    </p>
                  </div>
                </div>

                <Separator className="bg-white/10" />

                <div className="space-y-2 glassmorphism p-4 rounded-lg border border-teal/30">
                  <div className="flex items-center gap-2 mb-3">
                    <img
                      src="/assets/generated/legal-compliance-icon-transparent.dim_32x32.png"
                      alt=""
                      className="h-5 w-5"
                    />
                    <h4 className="text-sm font-medium text-foreground">
                      Legal Compliance
                    </h4>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <h5 className="text-xs font-semibold text-foreground mb-1">
                        KYC & AML Protection
                      </h5>
                      <p className="text-xs text-foreground/70 leading-relaxed">
                        Open Tip Pay implements Know Your Customer (KYC) and
                        Anti-Money Laundering (AML) procedures to ensure
                        regulatory compliance and protect all users. KYC
                        verification is required for withdrawals over $200.
                      </p>
                    </div>
                    <Separator className="bg-white/10" />
                    <div>
                      <h5 className="text-xs font-semibold text-foreground mb-1">
                        Why KYC Matters
                      </h5>
                      <ul className="text-xs text-foreground/70 leading-relaxed space-y-1 list-disc list-inside">
                        <li>Prevents fraud and identity theft</li>
                        <li>Ensures compliance with financial regulations</li>
                        <li>Protects the platform and all users</li>
                        <li>Enables secure high-value transactions</li>
                      </ul>
                    </div>
                    <Separator className="bg-white/10" />
                    <div>
                      <h5 className="text-xs font-semibold text-foreground mb-1">
                        Data Protection
                      </h5>
                      <p className="text-xs text-foreground/70 leading-relaxed">
                        All KYC data is encrypted end-to-end (E2EE) and stored
                        securely. We comply with data protection regulations and
                        never share your information with third parties without
                        your explicit consent.
                      </p>
                    </div>
                  </div>
                </div>

                <Separator className="bg-white/10" />

                <div className="space-y-2 glassmorphism p-4 rounded-lg">
                  <h3 className="text-sm font-semibold text-foreground">
                    About Open Tip Pay
                  </h3>
                  <p className="text-xs text-foreground/70 leading-relaxed">
                    Open Tip Pay is a universal P2P payment and tipping platform
                    built on the Internet Computer. Send and receive tips
                    instantly with QR codes, NFC tap-to-pay, and voice commands.
                  </p>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="privacy" className="mt-4">
            <ManageMyData />
          </TabsContent>

          <TabsContent value="business" className="mt-4">
            <BusinessSettingsContent />
          </TabsContent>
        </Tabs>

        <div className="absolute bottom-0 left-0 right-0 border-t border-teal/20 bg-background/95 backdrop-blur-xl p-4">
          <p className="text-center text-xs text-muted-foreground">
            © {new Date().getFullYear()}. Built with ❤️ using{" "}
            <a
              href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-teal hover:underline"
            >
              caffeine.ai
            </a>
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
