import { j as jsxRuntimeExports, Q as QueryClientProvider, a as QueryClient, r as reactExports } from "./index-DgPXBAnq.js";
const queryClient = new QueryClient();
function GuestPaymentContent() {
  const pathParts = window.location.pathname.split("/");
  const recipientId = pathParts[pathParts.length - 1];
  const isColts = localStorage.getItem("whiteLabel") === "colts" || window.location.search.includes("colts");
  const brandName = isColts ? "Colts Tip Pay" : "Open Tip Pay";
  const [amount, setAmount] = reactExports.useState(0);
  const [customAmount, setCustomAmount] = reactExports.useState("");
  const [contactInfo, setContactInfo] = reactExports.useState("");
  const [step, setStep] = reactExports.useState("input");
  const [pointsEarned, setPointsEarned] = reactExports.useState(0);
  const presets = [1, 2, 5, 10, 20];
  const effectiveAmount = customAmount ? Number.parseFloat(customAmount) : amount;
  const canPay = effectiveAmount > 0 && contactInfo.trim().length > 3;
  const handlePay = (_method) => {
    if (!canPay) return;
    setStep("paying");
    setTimeout(() => {
      const pts = Math.floor(effectiveAmount * 10);
      setPointsEarned(pts);
      setStep("success");
    }, 1500);
  };
  if (step === "paying") {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "min-h-screen bg-background flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-12 h-12 border-4 border-[#00e5cc] border-t-transparent rounded-full animate-spin mx-auto mb-4" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-white/70", children: "Processing payment..." })
    ] }) });
  }
  if (step === "success") {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "min-h-screen bg-background flex items-center justify-center p-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "w-full max-w-sm text-center space-y-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-20 h-20 bg-[#10b981]/20 rounded-full flex items-center justify-center mx-auto border-2 border-[#10b981]", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-4xl text-[#10b981]", children: "✓" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-2xl font-bold text-foreground", children: "Payment Sent!" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-white/60 mt-1", children: [
          "$",
          effectiveAmount.toFixed(2),
          " delivered"
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-[#f59e0b]/10 border border-[#f59e0b]/30 rounded-xl p-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-[#f59e0b] font-bold text-lg", children: [
          "⭐ You earned ",
          pointsEarned,
          " Fan Points!"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-white/60 text-sm mt-1", children: [
          "We will send details to ",
          contactInfo
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-muted/30 backdrop-blur-md border border-white/10 rounded-xl p-5 space-y-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-white font-semibold", children: [
          "Want to do more with ",
          brandName,
          "?"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-white/60 text-sm", children: "Track payments, send money to friends, and use your Fan Points." }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            type: "button",
            className: "w-full bg-[#00e5cc] text-[#0a0e1a] font-bold py-3 rounded-xl",
            "data-ocid": "guest-download-app-button",
            children: "Download the App"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            type: "button",
            className: "w-full border border-white/20 text-white/70 py-2 rounded-xl text-sm",
            "data-ocid": "guest-maybe-later-button",
            children: "Maybe Later"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xs text-white/40 space-y-1 pt-2 border-t border-white/10", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: "iPhone: Tap Share then Add to Home Screen" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: "Android: Tap Install or Add to Home Screen" })
        ] })
      ] })
    ] }) });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    "div",
    {
      className: "min-h-screen bg-background p-4",
      "data-ocid": "guest_payment.page",
      children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-sm mx-auto space-y-5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center pt-8 pb-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-2xl font-bold text-[#00e5cc]", children: brandName }),
          isColts && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-white/40 text-xs", children: "powered by Open Tip Pay" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-muted/30 backdrop-blur-md border border-white/10 rounded-xl p-5 text-center", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-16 h-16 bg-[#00e5cc]/20 rounded-full flex items-center justify-center mx-auto mb-3 text-2xl", children: "👤" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-white font-semibold", children: "Send a tip or payment" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-white/50 text-sm mt-1", children: [
            "Scan to pay instantly · Recipient ID: ",
            recipientId
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-muted/30 backdrop-blur-md border border-white/10 rounded-xl p-5 space-y-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-white font-semibold", children: "Select Amount" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-5 gap-2", children: presets.map((p) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "button",
            {
              type: "button",
              onClick: () => {
                setAmount(p);
                setCustomAmount("");
              },
              "data-ocid": `guest-preset-amount-${p}`,
              className: `py-2 rounded-lg text-sm font-medium transition-all ${amount === p && !customAmount ? "bg-[#00e5cc] text-[#0a0e1a]" : "bg-white/10 text-white hover:bg-white/20"}`,
              children: [
                "$",
                p
              ]
            },
            p
          )) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              type: "number",
              placeholder: "Custom amount",
              value: customAmount,
              onChange: (e) => {
                setCustomAmount(e.target.value);
                setAmount(0);
              },
              "data-ocid": "guest-custom-amount-input",
              className: "w-full bg-muted/30 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-[#00e5cc]"
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-muted/30 backdrop-blur-md border border-white/10 rounded-xl p-5 space-y-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-white font-semibold", children: "Enter your phone or email to earn Fan Points" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              type: "text",
              placeholder: "Phone number or email address",
              value: contactInfo,
              onChange: (e) => setContactInfo(e.target.value),
              "data-ocid": "guest-contact-info-input",
              className: "w-full bg-muted/30 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-[#00e5cc]"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-white/40 text-xs", children: "We will send your Fan Points here and let you know how to download the app" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              type: "button",
              onClick: () => handlePay(),
              disabled: !canPay,
              "data-ocid": "guest-apple-pay-button",
              className: `w-full bg-black text-white font-semibold py-4 rounded-xl text-lg transition-all ${canPay ? "opacity-100 hover:bg-gray-900" : "opacity-40 cursor-not-allowed"}`,
              children: "Pay with Apple Pay"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              type: "button",
              onClick: () => handlePay(),
              disabled: !canPay,
              "data-ocid": "guest-google-pay-button",
              className: `w-full bg-white text-gray-800 font-semibold py-4 rounded-xl text-lg transition-all ${canPay ? "opacity-100 hover:bg-gray-100" : "opacity-40 cursor-not-allowed"}`,
              children: "G Pay"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              type: "button",
              onClick: () => handlePay(),
              disabled: !canPay,
              "data-ocid": "guest-card-pay-button",
              className: `w-full border-2 border-[#00e5cc] text-[#00e5cc] font-semibold py-3 rounded-xl transition-all ${canPay ? "opacity-100 hover:bg-[#00e5cc]/10" : "opacity-40 cursor-not-allowed"}`,
              children: "Pay with Card"
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-center text-white/30 text-xs pb-8", children: [
          "Secured by ",
          brandName
        ] })
      ] })
    }
  );
}
function GuestPaymentPage() {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(QueryClientProvider, { client: queryClient, children: /* @__PURE__ */ jsxRuntimeExports.jsx(GuestPaymentContent, {}) });
}
export {
  GuestPaymentPage,
  GuestPaymentPage as default
};
