import { Zap, Shield, Smartphone } from "lucide-react";

export default function LandingStats() {
  return (
    <div className="w-full max-w-[400px] flex flex-col items-center gap-4">
      <div className="w-full rounded-xl border border-gray-800 bg-transparent divide-x divide-gray-800 grid grid-cols-3">
        <div className="flex flex-col items-center gap-1 py-4 px-2">
          <Zap className="w-5 h-5 text-[#00e5a0]" strokeWidth={2} />
          <span className="text-white text-xs font-bold mt-1">Instant</span>
          <span className="text-gray-500 text-[10px] text-center leading-tight">
            Real-time transfers
          </span>
        </div>

        <div className="flex flex-col items-center gap-1 py-4 px-2">
          <Shield className="w-5 h-5 text-[#00e5a0]" strokeWidth={2} />
          <span className="text-white text-xs font-bold mt-1">Secure</span>
          <span className="text-gray-500 text-[10px] text-center leading-tight">
            2FA + biometric
          </span>
        </div>

        <div className="flex flex-col items-center gap-1 py-4 px-2">
          <Smartphone className="w-5 h-5 text-[#00e5a0]" strokeWidth={2} />
          <span className="text-white text-xs font-bold mt-1">Mobile-First</span>
          <span className="text-gray-500 text-[10px] text-center leading-tight">
            PWA ready
          </span>
        </div>
      </div>

      <p className="text-[10px] text-gray-700 mt-2">© 2026 Open Tip Pay</p>
    </div>
  );
}
