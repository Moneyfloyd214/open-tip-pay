import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React, { useState } from "react";

const queryClient = new QueryClient();

function GuestPaymentContent() {
  const pathParts = window.location.pathname.split("/");
  const recipientId = pathParts[pathParts.length - 1];
  const isColts =
    localStorage.getItem("whiteLabel") === "colts" ||
    window.location.search.includes("colts");
  const brandName = isColts ? "Colts Tip Pay" : "Open Tip Pay";

  const [amount, setAmount] = useState<number>(0);
  const [customAmount, setCustomAmount] = useState("");
  const [contactInfo, setContactInfo] = useState("");
  const [step, setStep] = useState<"input" | "paying" | "success">("input");
  const [pointsEarned, setPointsEarned] = useState(0);

  const presets = [1, 2, 5, 10, 20];
  const effectiveAmount = customAmount
    ? Number.parseFloat(customAmount)
    : amount;
  const canPay = effectiveAmount > 0 && contactInfo.trim().length > 3;

  const handlePay = (_method: string) => {
    if (!canPay) return;
    setStep("paying");
    setTimeout(() => {
      const pts = Math.floor(effectiveAmount * 10);
      setPointsEarned(pts);
      setStep("success");
    }, 1500);
  };

  if (step === "paying") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#00e5cc] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/70">Processing payment...</p>
        </div>
      </div>
    );
  }

  if (step === "success") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-sm text-center space-y-6">
          <div className="w-20 h-20 bg-[#10b981]/20 rounded-full flex items-center justify-center mx-auto border-2 border-[#10b981]">
            <span className="text-4xl text-[#10b981]">&#10003;</span>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground">
              Payment Sent!
            </h2>
            <p className="text-white/60 mt-1">
              ${effectiveAmount.toFixed(2)} delivered
            </p>
          </div>
          <div className="bg-[#f59e0b]/10 border border-[#f59e0b]/30 rounded-xl p-4">
            <p className="text-[#f59e0b] font-bold text-lg">
              &#11088; You earned {pointsEarned} Fan Points!
            </p>
            <p className="text-white/60 text-sm mt-1">
              We will send details to {contactInfo}
            </p>
          </div>
          <div className="bg-muted/30 backdrop-blur-md border border-white/10 rounded-xl p-5 space-y-3">
            <p className="text-white font-semibold">
              Want to do more with {brandName}?
            </p>
            <p className="text-white/60 text-sm">
              Track payments, send money to friends, and use your Fan Points.
            </p>
            <button
              type="button"
              className="w-full bg-[#00e5cc] text-[#0a0e1a] font-bold py-3 rounded-xl"
              data-ocid="guest-download-app-button"
            >
              Download the App
            </button>
            <button
              type="button"
              className="w-full border border-white/20 text-white/70 py-2 rounded-xl text-sm"
              data-ocid="guest-maybe-later-button"
            >
              Maybe Later
            </button>
            <div className="text-xs text-white/40 space-y-1 pt-2 border-t border-white/10">
              <p>iPhone: Tap Share then Add to Home Screen</p>
              <p>Android: Tap Install or Add to Home Screen</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-background p-4"
      data-ocid="guest_payment.page"
    >
      <div className="max-w-sm mx-auto space-y-5">
        <div className="text-center pt-8 pb-2">
          <h1 className="text-2xl font-bold text-[#00e5cc]">{brandName}</h1>
          {isColts && (
            <p className="text-white/40 text-xs">powered by Open Tip Pay</p>
          )}
        </div>
        <div className="bg-muted/30 backdrop-blur-md border border-white/10 rounded-xl p-5 text-center">
          <div className="w-16 h-16 bg-[#00e5cc]/20 rounded-full flex items-center justify-center mx-auto mb-3 text-2xl">
            &#128100;
          </div>
          <h2 className="text-white font-semibold">Send a tip or payment</h2>
          <p className="text-white/50 text-sm mt-1">
            Scan to pay instantly &middot; Recipient ID: {recipientId}
          </p>
        </div>
        <div className="bg-muted/30 backdrop-blur-md border border-white/10 rounded-xl p-5 space-y-3">
          <h3 className="text-white font-semibold">Select Amount</h3>
          <div className="grid grid-cols-5 gap-2">
            {presets.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => {
                  setAmount(p);
                  setCustomAmount("");
                }}
                data-ocid={`guest-preset-amount-${p}`}
                className={`py-2 rounded-lg text-sm font-medium transition-all ${amount === p && !customAmount ? "bg-[#00e5cc] text-[#0a0e1a]" : "bg-white/10 text-white hover:bg-white/20"}`}
              >
                ${p}
              </button>
            ))}
          </div>
          <input
            type="number"
            placeholder="Custom amount"
            value={customAmount}
            onChange={(e) => {
              setCustomAmount(e.target.value);
              setAmount(0);
            }}
            data-ocid="guest-custom-amount-input"
            className="w-full bg-muted/30 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-[#00e5cc]"
          />
        </div>
        <div className="bg-muted/30 backdrop-blur-md border border-white/10 rounded-xl p-5 space-y-3">
          <h3 className="text-white font-semibold">
            Enter your phone or email to earn Fan Points
          </h3>
          <input
            type="text"
            placeholder="Phone number or email address"
            value={contactInfo}
            onChange={(e) => setContactInfo(e.target.value)}
            data-ocid="guest-contact-info-input"
            className="w-full bg-muted/30 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-[#00e5cc]"
          />
          <p className="text-white/40 text-xs">
            We will send your Fan Points here and let you know how to download
            the app
          </p>
        </div>
        <div className="space-y-3">
          <button
            type="button"
            onClick={() => handlePay("apple")}
            disabled={!canPay}
            data-ocid="guest-apple-pay-button"
            className={`w-full bg-black text-white font-semibold py-4 rounded-xl text-lg transition-all ${canPay ? "opacity-100 hover:bg-gray-900" : "opacity-40 cursor-not-allowed"}`}
          >
            Pay with Apple Pay
          </button>
          <button
            type="button"
            onClick={() => handlePay("google")}
            disabled={!canPay}
            data-ocid="guest-google-pay-button"
            className={`w-full bg-white text-gray-800 font-semibold py-4 rounded-xl text-lg transition-all ${canPay ? "opacity-100 hover:bg-gray-100" : "opacity-40 cursor-not-allowed"}`}
          >
            G Pay
          </button>
          <button
            type="button"
            onClick={() => handlePay("card")}
            disabled={!canPay}
            data-ocid="guest-card-pay-button"
            className={`w-full border-2 border-[#00e5cc] text-[#00e5cc] font-semibold py-3 rounded-xl transition-all ${canPay ? "opacity-100 hover:bg-[#00e5cc]/10" : "opacity-40 cursor-not-allowed"}`}
          >
            Pay with Card
          </button>
        </div>
        <p className="text-center text-white/30 text-xs pb-8">
          Secured by {brandName}
        </p>
      </div>
    </div>
  );
}

export function GuestPaymentPage() {
  return (
    <QueryClientProvider client={queryClient}>
      <GuestPaymentContent />
    </QueryClientProvider>
  );
}

export default GuestPaymentPage;
