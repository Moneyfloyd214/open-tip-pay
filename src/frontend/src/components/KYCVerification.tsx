import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  AlertCircle,
  Camera,
  CheckCircle,
  Clock,
  Upload,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { KYCStatus } from "../backend";
import { useGetCallerUserProfile, useSubmitKYC } from "../hooks/useQueries";

export default function KYCVerification() {
  const { data: userProfile, isLoading } = useGetCallerUserProfile();
  const submitKYC = useSubmitKYC();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const kycStatus = userProfile?.kycStatus || KYCStatus.notSubmitted;

  const handleStartVerification = async () => {
    setIsSubmitting(true);
    try {
      await submitKYC.mutateAsync();
      toast.success(
        "KYC verification submitted successfully! We will review your submission shortly.",
      );
    } catch (error: any) {
      toast.error(error.message || "Failed to submit KYC verification");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusConfig = () => {
    switch (kycStatus) {
      case KYCStatus.verified:
        return {
          icon: <CheckCircle className="h-8 w-8 text-green-500" />,
          badge: (
            <Badge className="bg-green-500/20 text-green-500 border-green-500/30">
              Verified
            </Badge>
          ),
          title: "Identity Verified",
          description:
            "Your identity has been successfully verified. You can now withdraw any amount.",
          color: "green",
          imageSrc:
            "/assets/generated/kyc-verified-icon-transparent.dim_24x24.png",
        };
      case KYCStatus.pending:
        return {
          icon: <Clock className="h-8 w-8 text-yellow-500" />,
          badge: (
            <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500/30">
              Pending
            </Badge>
          ),
          title: "Verification in Progress",
          description:
            "Your KYC verification is being reviewed. This typically takes 24-48 hours.",
          color: "yellow",
          imageSrc:
            "/assets/generated/kyc-pending-icon-transparent.dim_24x24.png",
        };
      case KYCStatus.failed:
        return {
          icon: <XCircle className="h-8 w-8 text-red-500" />,
          badge: (
            <Badge className="bg-red-500/20 text-red-500 border-red-500/30">
              Failed
            </Badge>
          ),
          title: "Verification Failed",
          description:
            "Your KYC verification was unsuccessful. Please retry with valid documents.",
          color: "red",
          imageSrc:
            "/assets/generated/kyc-failed-icon-transparent.dim_24x24.png",
        };
      default:
        return {
          icon: <AlertCircle className="h-8 w-8 text-teal" />,
          badge: (
            <Badge className="bg-teal/20 text-teal border-teal/30">
              Not Submitted
            </Badge>
          ),
          title: "Verify Your Identity",
          description:
            "Complete KYC verification to withdraw amounts over $200 and ensure regulatory compliance.",
          color: "teal",
          imageSrc:
            "/assets/generated/kyc-verification-icon-transparent.dim_32x32.png",
        };
    }
  };

  const statusConfig = getStatusConfig();

  if (isLoading) {
    return (
      <Card className="glassmorphism border-teal/20">
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glassmorphism border-teal/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2 text-white">
          <img
            src="/assets/generated/kyc-verification-icon-transparent.dim_32x32.png"
            alt=""
            className="h-5 w-5"
          />
          KYC Verification
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Display */}
        <div className="glassmorphism p-4 rounded-lg border border-teal/30">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <img src={statusConfig.imageSrc} alt="" className="h-8 w-8" />
              <div>
                <h4 className="text-sm font-semibold text-white">
                  {statusConfig.title}
                </h4>
                <p className="text-xs text-white/60 mt-1">
                  {statusConfig.description}
                </p>
              </div>
            </div>
            {statusConfig.badge}
          </div>

          {kycStatus === KYCStatus.notSubmitted && (
            <>
              <Separator className="my-4 bg-white/10" />
              <div className="space-y-3">
                <p className="text-xs text-white/70">
                  To complete KYC verification, you'll need to:
                </p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs text-white/80">
                    <img
                      src="/assets/generated/id-document-scan-icon-transparent.dim_24x24.png"
                      alt=""
                      className="h-4 w-4"
                    />
                    <span>Upload a valid government-issued ID</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-white/80">
                    <img
                      src="/assets/generated/liveness-selfie-icon-transparent.dim_24x24.png"
                      alt=""
                      className="h-4 w-4"
                    />
                    <span>Complete a liveness selfie check</span>
                  </div>
                </div>
              </div>
            </>
          )}

          {kycStatus === KYCStatus.pending &&
            userProfile?.kycSubmissionTimestamp && (
              <>
                <Separator className="my-4 bg-white/10" />
                <div className="text-xs text-white/60">
                  Submitted:{" "}
                  {new Date(
                    Number(userProfile.kycSubmissionTimestamp) / 1000000,
                  ).toLocaleDateString()}
                </div>
              </>
            )}
        </div>

        {/* Action Buttons */}
        {(kycStatus === KYCStatus.notSubmitted ||
          kycStatus === KYCStatus.failed) && (
          <Button
            onClick={handleStartVerification}
            disabled={isSubmitting || submitKYC.isPending}
            className="w-full bg-gradient-to-r from-teal to-teal-dark hover:from-teal-dark hover:to-teal text-white font-semibold shadow-lg shadow-teal/30 transition-all duration-300"
          >
            {isSubmitting || submitKYC.isPending ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Submitting...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                {kycStatus === KYCStatus.failed
                  ? "Retry Verification"
                  : "Start KYC Verification"}
              </>
            )}
          </Button>
        )}

        {/* Educational Content */}
        <div className="glassmorphism p-3 rounded-lg border border-white/10">
          <h5 className="text-xs font-semibold text-white mb-2 flex items-center gap-2">
            <img
              src="/assets/generated/legal-compliance-icon-transparent.dim_32x32.png"
              alt=""
              className="h-4 w-4"
            />
            Why KYC is Required
          </h5>
          <p className="text-xs text-white/60 leading-relaxed">
            KYC (Know Your Customer) verification helps us comply with financial
            regulations and protect all users from fraud. Your data is encrypted
            with E2EE and stored securely. We only use it for identity
            verification purposes.
          </p>
        </div>

        {/* Privacy Notice */}
        <div className="p-3 rounded-lg bg-navy-dark/50 border border-white/10">
          <p className="text-xs text-white/60 leading-relaxed">
            🔒 <strong className="text-white">Privacy Protected:</strong> All
            KYC data is encrypted end-to-end (E2EE) and complies with data
            protection regulations. We never share your information with third
            parties without your consent.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
