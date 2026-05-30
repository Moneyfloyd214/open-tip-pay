import { Zap, Shield, Smartphone } from "lucide-react";

export default function LandingPageNew() {
  return (
    <div className="min-h-screen bg-[#0a0f1e] flex flex-col items-center justify-between px-4 py-10">

      {/* TOP SECTION */}
      <div className="flex flex-col items-center text-center gap-3 pt-6">
        {/* Logo placeholder */}
        <div className="w-16 h-16 rounded-2xl bg-[#111827] border border-gray-700 flex items-center justify-center mb-2">
          <span className="text-[#00e5a0] text-2xl font-bold">O</span>
        </div>

        <h1 className="text-4xl font-extrabold text-white tracking-tight leading-tight">
          Open Tip Pay
        </h1>

        <p className="text-xs text-gray-500 -mt-1">powered by Open Tip Pay</p>

        <p className="text-[#00e5a0] font-semibold text-sm mt-1">
          Next-Gen Stadium &amp; Everyday Digital Wallet
        </p>

        <p className="text-gray-400 text-sm max-w-xs leading-relaxed">
          Send money, pay friends, split bills — instantly and securely.
        </p>
      </div>

      {/* MIDDLE SPACER — login fields will go here */}
      <div className="w-full max-w-sm flex-1 my-10" />

      {/* BOTTOM SECTION */}
      <div className="w-full max-w-[400px] flex flex-col items-center gap-4">
        {/* Feature cards */}
        <div className="w-full rounded-xl border border-gray-800 bg-transparent divide-x divide-gray-800 grid grid-cols-3">
          {/* Instant */}
          <div className="flex flex-col items-center gap-1 py-4 px-2">
            <Zap className="w-5 h-5 text-[#00e5a0]" strokeWidth={2} />
            <span className="text-white text-xs font-bold mt-1">Instant</span>
            <span className="text-gray-500 text-[10px] text-center leading-tight">
              Real-time transfers
            </span>
          </div>

          {/* Secure */}
          <div className="flex flex-col items-center gap-1 py-4 px-2">
            <Shield className="w-5 h-5 text-[#00e5a0]" strokeWidth={2} />
            <span className="text-white text-xs font-bold mt-1">Secure</span>
            <span className="text-gray-500 text-[10px] text-center leading-tight">
              2FA + biometric
            </span>
          </div>

          {/* Mobile-First */}
          <div className="flex flex-col items-center gap-1 py-4 px-2">
            <Smartphone className="w-5 h-5 text-[#00e5a0]" strokeWidth={2} />
            <span className="text-white text-xs font-bold mt-1">Mobile-First</span>
            <span className="text-gray-500 text-[10px] text-center leading-tight">
              PWA ready
            </span>
          </div>
        </div>

        {/* Footer */}
        <p className="text-[10px] text-gray-700 mt-2">© 2026 Open Tip Pay</p>
      </div>

    </div>
  );
}
