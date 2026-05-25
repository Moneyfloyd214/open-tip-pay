import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Briefcase,
  CheckCircle,
  Clock,
  XCircle,
} from "lucide-react";
import { BusinessApplicationStatus } from "../backend";
import { useGetMyBusinessApplication } from "../hooks/useQueries";

interface BusinessUpgradeCardProps {
  onOpenBusinessSettings: () => void;
  onOpenManagerDashboard?: () => void;
  onStartOnboarding?: () => void;
}

export default function BusinessUpgradeCard({
  onOpenBusinessSettings,
  onOpenManagerDashboard,
  onStartOnboarding = () => {},
}: BusinessUpgradeCardProps) {
  const { data: application, isLoading } = useGetMyBusinessApplication();

  if (isLoading) return null;

  // Approved state
  if (application?.status === BusinessApplicationStatus.approved) {
    return (
      <div
        data-ocid="business-upgrade-card"
        className="glassmorphism rounded-xl p-4 border border-green-500/30 bg-green-500/5"
      >
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-lg bg-green-500/20 flex items-center justify-center shrink-0">
            <CheckCircle className="h-5 w-5 text-green-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white">
              Business Account Active
            </p>
            <p className="text-xs text-white/60 mt-0.5 leading-relaxed">
              You have manager access to the Manager Portal.
            </p>
          </div>
        </div>
        {/* Onboarding banner — shown until dismissed or completed */}
        {localStorage.getItem("businessOnboardingDone") !== "true" && (
          <button
            type="button"
            data-ocid="business-onboarding-banner"
            onClick={onStartOnboarding}
            className="mt-3 w-full flex items-center gap-2 bg-teal-500/20 border border-teal-400/40 rounded-lg p-3 text-sm text-teal-300 cursor-pointer hover:bg-teal-500/30 transition-all text-left"
          >
            <span className="flex-1 leading-snug">
              Your business account is approved — click here to set up your
              staff and QR codes.
            </span>
            <ArrowRight className="h-4 w-4 shrink-0" />
          </button>
        )}
        <Button
          data-ocid="business-open-portal-btn"
          onClick={() => onOpenManagerDashboard?.()}
          className="mt-3 w-full bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 text-green-400 font-semibold text-sm h-9 transition-all duration-200"
          variant="outline"
          size="sm"
        >
          <CheckCircle className="h-3.5 w-3.5 mr-2" />
          Open Manager Dashboard
        </Button>
      </div>
    );
  }

  // Pending state
  if (application?.status === BusinessApplicationStatus.pending) {
    return (
      <div
        data-ocid="business-upgrade-card"
        className="glassmorphism rounded-xl p-4 border border-yellow-500/30 bg-yellow-500/5"
      >
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-lg bg-yellow-500/20 flex items-center justify-center shrink-0">
            <Clock className="h-5 w-5 text-yellow-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white">
              Application Under Review
            </p>
            <p className="text-xs text-white/60 mt-0.5 leading-relaxed">
              We are reviewing your business application.
            </p>
          </div>
        </div>
        <Button
          data-ocid="business-view-status-btn"
          onClick={onOpenBusinessSettings}
          className="mt-3 w-full bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/30 text-yellow-400 font-semibold text-sm h-9 transition-all duration-200"
          variant="outline"
          size="sm"
        >
          <Clock className="h-3.5 w-3.5 mr-2" />
          View Status
        </Button>
      </div>
    );
  }

  // Rejected state
  if (application?.status === BusinessApplicationStatus.rejected) {
    return (
      <div
        data-ocid="business-upgrade-card"
        className="glassmorphism rounded-xl p-4 border border-red-500/30 bg-red-500/5"
      >
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-lg bg-red-500/20 flex items-center justify-center shrink-0">
            <XCircle className="h-5 w-5 text-red-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white">
              Application Not Approved
            </p>
            {application.rejectionReason && (
              <p className="text-xs text-red-300/80 mt-0.5 leading-relaxed">
                {application.rejectionReason}
              </p>
            )}
          </div>
        </div>
        <Button
          data-ocid="business-reapply-btn"
          onClick={onOpenBusinessSettings}
          className="mt-3 w-full bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 font-semibold text-sm h-9 transition-all duration-200"
          variant="outline"
          size="sm"
        >
          <Briefcase className="h-3.5 w-3.5 mr-2" />
          Reapply
        </Button>
      </div>
    );
  }

  // No application state
  return (
    <div
      data-ocid="business-upgrade-card"
      className="glassmorphism rounded-xl p-4 border border-teal/30 bg-gradient-to-br from-teal/10 to-teal/5"
    >
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 rounded-lg bg-teal/20 flex items-center justify-center shrink-0 glow-teal">
          <Briefcase className="h-5 w-5 text-teal" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white">Grow Your Business</p>
          <p className="text-xs text-white/60 mt-0.5 leading-relaxed">
            Apply for a business account to access team management and tip
            pooling.
          </p>
        </div>
      </div>
      <Button
        data-ocid="business-upgrade-btn"
        onClick={onOpenBusinessSettings}
        className="mt-3 w-full bg-gradient-to-r from-teal/30 to-teal/20 hover:from-teal/40 hover:to-teal/30 border border-teal/40 text-white font-semibold text-sm h-9 shadow-lg shadow-teal/20 transition-all duration-300 hover:shadow-teal/40"
      >
        <Briefcase className="h-3.5 w-3.5 mr-2" />
        Upgrade to Business
      </Button>
    </div>
  );
}
