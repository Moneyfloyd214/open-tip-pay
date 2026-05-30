export default function LandingHero() {
  return (
    <div className="flex flex-col items-center text-center gap-3 pt-6">
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
  );
}
