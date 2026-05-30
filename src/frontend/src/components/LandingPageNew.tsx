import LandingHero from "./landing/LandingHero";
import LandingLoginSlot from "./landing/LandingLoginSlot";
import LandingStats from "./landing/LandingStats";

export default function LandingPageNew() {
  return (
    <div className="min-h-screen bg-[#0a0f1e] flex flex-col items-center justify-between px-4 py-10">
      <LandingHero />
      <LandingLoginSlot />
      <LandingStats />
    </div>
  );
}
