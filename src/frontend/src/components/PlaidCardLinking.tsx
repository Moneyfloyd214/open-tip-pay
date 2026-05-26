import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, CreditCard, Link2, Unlink, X, Zap } from "lucide-react";
import { useEffect, useState } from "react";

const BANKS = [
  {
    name: "Chase",
    color: "from-blue-600/30 to-blue-700/20",
    border: "border-blue-500/30",
    text: "text-blue-300",
    logo: "🏦",
  },
  {
    name: "Bank of America",
    color: "from-red-600/30 to-red-700/20",
    border: "border-red-500/30",
    text: "text-red-300",
    logo: "🔴",
  },
  {
    name: "Wells Fargo",
    color: "from-yellow-600/30 to-yellow-700/20",
    border: "border-yellow-500/30",
    text: "text-yellow-300",
    logo: "🐴",
  },
  {
    name: "Citi",
    color: "from-sky-600/30 to-sky-700/20",
    border: "border-sky-500/30",
    text: "text-sky-300",
    logo: "🌐",
  },
  {
    name: "Capital One",
    color: "from-orange-600/30 to-orange-700/20",
    border: "border-orange-500/30",
    text: "text-orange-300",
    logo: "💠",
  },
  {
    name: "US Bank",
    color: "from-purple-600/30 to-purple-700/20",
    border: "border-purple-500/30",
    text: "text-purple-300",
    logo: "🔷",
  },
];

const STORAGE_KEY = "plaid_demo_connected";

type ModalStep = 1 | 2 | 3;

export function PlaidCardLinking() {
  const [connected, setConnected] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [step, setStep] = useState<ModalStep>(1);
  const [selectedBank, setSelectedBank] = useState<string | null>(null);
  const [disconnectConfirm, setDisconnectConfirm] = useState(false);

  useEffect(() => {
    setConnected(localStorage.getItem(STORAGE_KEY) === "true");
  }, []);

  const handleSelectBank = (bankName: string) => {
    setSelectedBank(bankName);
    setStep(2);
    setTimeout(() => {
      setStep(3);
      setTimeout(() => {
        localStorage.setItem(STORAGE_KEY, "true");
        setConnected(true);
        setModalOpen(false);
        setStep(1);
        setSelectedBank(null);
      }, 1500);
    }, 1500);
  };

  const handleDisconnect = () => {
    localStorage.removeItem(STORAGE_KEY);
    setConnected(false);
    setDisconnectConfirm(false);
  };

  const handleClose = () => {
    setModalOpen(false);
    setStep(1);
    setSelectedBank(null);
  };

  return (
    <>
      {connected ? (
        <div
          className="bg-muted/30 backdrop-blur-md border border-green-500/30 rounded-xl p-4 flex items-center justify-between"
          style={{ boxShadow: "0 0 20px rgba(34,197,94,0.08)" }}
          data-ocid="plaid.connected_card"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center border border-green-500/30">
              <CheckCircle2 className="h-5 w-5 text-green-400" />
            </div>
            <div className="min-w-0">
              <p className="text-white font-semibold text-sm">Card Linked</p>
              <p className="text-white/50 text-xs">
                Chase Bank — Visa ending in 4242
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-green-500/20 text-green-300 border border-green-500/30 text-xs">
              Active
            </Badge>
            {disconnectConfirm ? (
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={handleDisconnect}
                  className="text-red-400 hover:text-red-300 text-xs px-2 py-1 rounded border border-red-500/30 hover:bg-red-500/10 transition-all"
                  data-ocid="plaid.confirm_disconnect_button"
                >
                  Confirm
                </button>
                <button
                  type="button"
                  onClick={() => setDisconnectConfirm(false)}
                  className="text-white/50 hover:text-white/80 text-xs px-2 py-1 rounded border border-border transition-all"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setDisconnectConfirm(true)}
                className="text-white/40 hover:text-red-400 transition-colors"
                aria-label="Disconnect card"
                data-ocid="plaid.disconnect_button"
              >
                <Unlink className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      ) : (
        <div
          className="bg-muted/30 backdrop-blur-md border border-teal/20 rounded-xl p-4 flex items-center justify-between"
          data-ocid="plaid.unconnected_card"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-teal/10 flex items-center justify-center border border-teal/20">
              <CreditCard className="h-5 w-5 text-teal" />
            </div>
            <div className="min-w-0">
              <p className="text-white font-semibold text-sm">
                Connect Your Card
              </p>
              <p className="text-white/50 text-xs">
                Earn points anywhere in the stadium
              </p>
            </div>
          </div>
          <Button
            onClick={() => setModalOpen(true)}
            size="sm"
            className="bg-teal/20 hover:bg-teal/30 border border-teal/40 text-teal font-semibold transition-all shrink-0"
            data-ocid="plaid.connect_button"
          >
            <Link2 className="h-3.5 w-3.5 mr-1.5" />
            Connect
          </Button>
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.85)" }}
          data-ocid="plaid.dialog"
        >
          <div
            className="w-full max-w-sm bg-card/95 backdrop-blur-2xl border border-teal/20 rounded-2xl overflow-hidden"
            style={{
              boxShadow:
                "0 0 60px rgba(0,229,204,0.12), 0 25px 50px rgba(0,0,0,0.5)",
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div className="flex items-center gap-2">
                <Link2 className="h-4 w-4 text-teal" />
                <span className="font-bold text-white text-sm">
                  Link Your Card
                </span>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="h-7 w-7 rounded-lg bg-muted/30 hover:bg-muted/50 border border-border flex items-center justify-center transition-all"
                aria-label="Close"
                data-ocid="plaid.close_button"
              >
                <X className="h-3.5 w-3.5 text-white/60" />
              </button>
            </div>

            {/* Steps */}
            <div className="px-5 py-5">
              {step === 1 && (
                <>
                  <p className="text-white/70 text-sm mb-4">
                    Select your bank to securely link your card and earn Fan
                    Points automatically everywhere inside Lucas Oil Stadium —
                    parking, valet, food, drinks, merchandise, ticketing, and
                    more.
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {BANKS.map((bank) => (
                      <button
                        key={bank.name}
                        type="button"
                        onClick={() => handleSelectBank(bank.name)}
                        className={`bg-gradient-to-br ${bank.color} border ${bank.border} rounded-xl p-3.5 flex flex-col items-center gap-2 hover:scale-[1.03] transition-all duration-150 active:scale-[0.98]`}
                        data-ocid={`plaid.bank_${bank.name.toLowerCase().replace(/\s+/g, "_")}_button`}
                      >
                        <span className="text-2xl">{bank.logo}</span>
                        <span
                          className={`text-xs font-medium ${bank.text} leading-tight text-center`}
                        >
                          {bank.name}
                        </span>
                      </button>
                    ))}
                  </div>
                  <p className="text-white/30 text-xs text-center mt-4">
                    Secured by 256-bit encryption • Read-only access
                  </p>
                </>
              )}

              {step === 2 && (
                <div className="flex flex-col items-center py-6 gap-4">
                  <div className="w-16 h-16 rounded-full border-2 border-teal/40 border-t-teal animate-spin" />
                  <div className="text-center">
                    <p className="text-white font-semibold">
                      Connecting to {selectedBank}…
                    </p>
                    <p className="text-white/50 text-sm mt-1">
                      Securely verifying your account
                    </p>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="flex flex-col items-center py-6 gap-4">
                  <div className="w-16 h-16 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center">
                    <CheckCircle2 className="h-8 w-8 text-green-400" />
                  </div>
                  <div className="text-center">
                    <p className="text-white font-bold text-lg">Card Linked!</p>
                    <p className="text-white/60 text-sm mt-1">
                      Your card is now linked. Earn Fan Points at every purchase
                      inside Lucas Oil Stadium — parking, valet, merchandise,
                      food, drinks, ticketing upgrades, and more.
                    </p>
                  </div>
                  <div className="w-full bg-teal/10 border border-teal/20 rounded-lg px-4 py-3 flex items-center gap-2">
                    <Zap className="h-4 w-4 text-teal shrink-0" />
                    <p className="text-teal text-xs font-medium">
                      Points appear in your Fan Points balance after every
                      qualifying purchase — anywhere in the stadium.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
