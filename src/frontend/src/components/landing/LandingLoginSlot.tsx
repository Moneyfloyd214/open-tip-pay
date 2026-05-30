import { useState } from "react";
import { Play } from "lucide-react";

export default function LandingLoginSlot() {
  const [contactMethod, setContactMethod] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  async function handleSendCode(e: React.FormEvent) {
    e.preventDefault();
    if (!contactMethod.trim()) return;
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setContactMethod("");
      setSuccessMessage("Verification code sent! Check your device.");
    }, 1500);
  }

  return (
    <div className="w-full max-w-sm flex flex-col gap-4 items-center">

      {/* Skip to Demo */}
      <button className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-gray-800 bg-transparent hover:bg-gray-900/50 transition-colors">
        <Play className="w-4 h-4 text-[#00e5a0]" fill="#00e5a0" strokeWidth={0} />
        <span className="text-[#00e5a0] text-sm font-semibold">Skip to Demo</span>
      </button>

      {/* Demo subtext */}
      <p className="text-xs text-gray-500 text-center -mt-1">
        Explore with sample data · No sign-in required
      </p>

      {/* Divider */}
      <div className="w-full flex items-center gap-3">
        <div className="h-px bg-gray-800 flex-1" />
        <span className="text-xs text-gray-600 whitespace-nowrap">or sign in</span>
        <div className="h-px bg-gray-800 flex-1" />
      </div>

      {/* Frictionless Login */}
      <form onSubmit={handleSendCode} className="w-full flex flex-col gap-3">
        <label className="text-white text-sm font-medium">
          Log In or Create Account
        </label>

        <input
          type="text"
          placeholder="Enter Email or Phone Number"
          value={contactMethod}
          onChange={(e) => setContactMethod(e.target.value)}
          className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 outline-none focus:border-[#00e5a0] focus:ring-1 focus:ring-[#00e5a0] transition-colors"
        />

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3 rounded-xl font-bold text-white text-sm tracking-wide transition-opacity disabled:opacity-60"
          style={{ background: "linear-gradient(135deg, #00e5a0 0%, #00c87a 100%)" }}
        >
          {isLoading ? "Sending..." : "Send Code"}
        </button>

        {successMessage && (
          <p className="text-[#00e5a0] text-xs font-bold text-center">{successMessage}</p>
        )}

        <p className="text-xs text-gray-500 text-center leading-relaxed">
          Secured by Internet Identity · No password required
        </p>
      </form>

    </div>
  );
}
