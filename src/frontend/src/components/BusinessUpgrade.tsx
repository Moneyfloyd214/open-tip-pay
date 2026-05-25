import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertTriangle,
  Briefcase,
  CheckCircle,
  Clock,
  Loader2,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { BusinessApplicationStatus } from "../backend";
import {
  useGetMyBusinessApplication,
  useSubmitBusinessApplication,
} from "../hooks/useQueries";

const BUSINESS_TYPES = [
  "Restaurant",
  "Bar/Cafe",
  "Shop/Retail",
  "Service Business",
  "Other",
];

const MAX_DESCRIPTION = 500;

function statusBadge(status: BusinessApplicationStatus) {
  if (status === BusinessApplicationStatus.approved)
    return (
      <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">
        <CheckCircle className="h-3 w-3 mr-1" /> Approved
      </Badge>
    );
  if (status === BusinessApplicationStatus.rejected)
    return (
      <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-xs">
        <XCircle className="h-3 w-3 mr-1" /> Rejected
      </Badge>
    );
  return (
    <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-xs">
      <Clock className="h-3 w-3 mr-1" /> Under Review
    </Badge>
  );
}

export default function BusinessUpgrade() {
  const { data: application, isLoading } = useGetMyBusinessApplication();
  const submit = useSubmitBusinessApplication();

  const [businessName, setBusinessName] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [description, setDescription] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showFormAgain, setShowFormAgain] = useState(false);
  const [ein, setEin] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [einError, setEinError] = useState("");

  const EIN_REGEX = /^\d{2}-\d{7}$/;

  const isFormValid =
    businessName.trim().length > 0 &&
    businessType.length > 0 &&
    description.trim().length > 0 &&
    termsAccepted &&
    EIN_REGEX.test(ein);

  const hasSubmitted = !!application && !showFormAgain;

  async function handleSubmit() {
    if (!EIN_REGEX.test(ein)) {
      setEinError("Please enter a valid EIN (format: XX-XXXXXXX)");
      return;
    }
    setEinError("");
    if (!isFormValid) return;
    try {
      await submit.mutateAsync({
        businessName,
        businessType,
        description,
        termsAccepted,
      });
      // Store verification info in localStorage for admin review
      localStorage.setItem(
        "businessVerificationInfo",
        JSON.stringify({
          ein,
          licenseNumber,
          businessName,
          submittedAt: Date.now(),
        }),
      );
      toast.success("Application submitted! We'll review it shortly.");
      setShowFormAgain(false);
    } catch (err: unknown) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Submission failed. Please try again.",
      );
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-teal" />
      </div>
    );
  }

  return (
    <ScrollArea className="h-[calc(100vh-16rem)]">
      <div className="space-y-4 pr-4 pb-6">
        {/* Header */}
        <div className="flex items-center gap-2">
          <Briefcase className="h-4 w-4 text-teal" />
          <h3 className="text-sm font-semibold text-foreground">
            Upgrade to Business
          </h3>
          <Badge className="ml-auto text-[10px] bg-teal/10 text-teal border-teal/30">
            Self-Service
          </Badge>
        </div>

        {/* Status View */}
        {hasSubmitted && application && (
          <Card className="glassmorphism border-teal/20 bg-transparent">
            <CardHeader className="pb-3 pt-4 px-4">
              <CardTitle className="text-sm text-white flex items-center justify-between gap-2">
                <span className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-teal" />
                  Application Status
                </span>
                {statusBadge(application.status)}
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-3">
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-white/50">Business Name</span>
                  <span className="text-white font-medium">
                    {application.businessName}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-white/50">Business Type</span>
                  <span className="text-white font-medium">
                    {application.businessType}
                  </span>
                </div>
                <div className="flex flex-col gap-1 text-xs">
                  <span className="text-white/50">Description</span>
                  <p className="text-white/80 leading-relaxed bg-muted/40 rounded p-2">
                    {application.description}
                  </p>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-white/50">Submitted</span>
                  <span className="text-white/70">
                    {new Date(
                      Number(application.createdAt / BigInt(1_000_000)),
                    ).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>
              </div>

              {application.status === BusinessApplicationStatus.pending && (
                <div className="flex items-start gap-2 bg-yellow-500/5 border border-yellow-500/20 rounded-md px-3 py-2.5">
                  <Clock className="h-3.5 w-3.5 text-yellow-400 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-yellow-300/80 leading-relaxed">
                    Your application is under review. We typically respond
                    within 1–3 business days.
                  </p>
                </div>
              )}

              {application.status === BusinessApplicationStatus.approved && (
                <div className="flex items-start gap-2 bg-green-500/5 border border-green-500/20 rounded-md px-3 py-2.5">
                  <CheckCircle className="h-3.5 w-3.5 text-green-400 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-green-300/80 leading-relaxed">
                    Congratulations! Your business account is active. You now
                    have access to the Manager Portal.
                  </p>
                </div>
              )}

              {application.status === BusinessApplicationStatus.rejected && (
                <>
                  <div className="flex items-start gap-2 bg-red-500/5 border border-red-500/20 rounded-md px-3 py-2.5">
                    <AlertTriangle className="h-3.5 w-3.5 text-red-400 shrink-0 mt-0.5" />
                    <p className="text-[11px] text-red-300/80 leading-relaxed">
                      Your application was not approved.
                      {application.rejectionReason && (
                        <>
                          {" "}
                          <span className="font-semibold text-red-300">
                            Reason:
                          </span>{" "}
                          {application.rejectionReason}
                        </>
                      )}
                    </p>
                  </div>
                  <Button
                    data-ocid="business-reapply-btn"
                    variant="outline"
                    onClick={() => {
                      setBusinessName(application.businessName);
                      setBusinessType(application.businessType);
                      setDescription(application.description);
                      setTermsAccepted(false);
                      setShowFormAgain(true);
                    }}
                    className="w-full border-teal/40 text-teal hover:bg-teal/10 text-xs h-9 transition-all duration-200"
                  >
                    <Briefcase className="h-3.5 w-3.5 mr-2" />
                    Re-apply
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* Application Form */}
        {(!hasSubmitted || showFormAgain) && (
          <Card className="glassmorphism border-teal/20 bg-transparent">
            <CardHeader className="pb-3 pt-4 px-4">
              <CardTitle className="text-sm text-white flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-teal" />
                Business Application
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-4">
              <p className="text-xs text-white/60 leading-relaxed">
                Apply for a business account to unlock team tip management, tip
                pooling, and the Manager Portal.
              </p>

              <Separator className="bg-white/10" />

              {/* Business Name */}
              <div className="space-y-1.5">
                <Label htmlFor="biz-name" className="text-xs text-white/80">
                  Business Name <span className="text-red-400">*</span>
                </Label>
                <Input
                  id="biz-name"
                  data-ocid="business-name-input"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="e.g. The Corner Bistro"
                  className="bg-muted/50 border-border text-white placeholder:text-white/30 text-sm h-9 focus:border-teal/50"
                />
              </div>

              {/* Business Type */}
              <div className="space-y-1.5">
                <Label htmlFor="biz-type" className="text-xs text-white/80">
                  Business Type <span className="text-red-400">*</span>
                </Label>
                <Select value={businessType} onValueChange={setBusinessType}>
                  <SelectTrigger
                    id="biz-type"
                    data-ocid="business-type-select"
                    className="bg-muted/50 border-border text-white h-9 text-sm focus:border-teal/50"
                  >
                    <SelectValue placeholder="Select type…" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    {BUSINESS_TYPES.map((t) => (
                      <SelectItem
                        key={t}
                        value={t}
                        className="text-white hover:bg-teal/10 text-sm"
                      >
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* EIN */}
              <div className="space-y-1.5">
                <Label htmlFor="biz-ein" className="text-xs text-white/80">
                  Employer Identification Number (EIN){" "}
                  <span className="text-red-400">*</span>
                </Label>
                <Input
                  id="biz-ein"
                  data-ocid="business-ein-input"
                  value={ein}
                  onChange={(e) => {
                    setEin(e.target.value);
                    if (einError) setEinError("");
                  }}
                  onBlur={() => {
                    if (ein && !EIN_REGEX.test(ein))
                      setEinError(
                        "Please enter a valid EIN (format: XX-XXXXXXX)",
                      );
                  }}
                  placeholder="12-3456789"
                  className={`bg-muted/50 border-border text-white placeholder:text-white/30 text-sm h-9 focus:border-teal/50 ${
                    einError ? "border-red-500/60 focus:border-red-500/80" : ""
                  }`}
                />
                {einError ? (
                  <p
                    className="text-[11px] text-red-400"
                    data-ocid="business-ein-field_error"
                  >
                    {einError}
                  </p>
                ) : (
                  <p className="text-[11px] text-white/35">
                    Required to verify your business. Format: XX-XXXXXXX
                  </p>
                )}
              </div>

              {/* License Number */}
              <div className="space-y-1.5">
                <Label htmlFor="biz-license" className="text-xs text-white/80">
                  Business License Number
                  <span className="text-white/35 ml-1 font-normal">
                    (Optional)
                  </span>
                </Label>
                <Input
                  id="biz-license"
                  data-ocid="business-license-input"
                  value={licenseNumber}
                  onChange={(e) => setLicenseNumber(e.target.value)}
                  placeholder="Enter your license number"
                  className="bg-muted/50 border-border text-white placeholder:text-white/30 text-sm h-9 focus:border-teal/50"
                />
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="biz-desc" className="text-xs text-white/80">
                    Description <span className="text-red-400">*</span>
                  </Label>
                  <span
                    className={`text-[10px] ${description.length > MAX_DESCRIPTION - 50 ? "text-yellow-400" : "text-white/40"}`}
                  >
                    {description.length}/{MAX_DESCRIPTION}
                  </span>
                </div>
                <Textarea
                  id="biz-desc"
                  data-ocid="business-description-input"
                  value={description}
                  onChange={(e) =>
                    setDescription(e.target.value.slice(0, MAX_DESCRIPTION))
                  }
                  placeholder="Describe your business and how you plan to use Open Tip Pay…"
                  className="bg-muted/50 border-border text-white placeholder:text-white/30 text-sm min-h-[80px] resize-none focus:border-teal/50"
                  rows={3}
                />
              </div>

              {/* Terms */}
              <div className="flex items-start gap-3 bg-teal/5 border border-teal/20 rounded-md px-3 py-3">
                <Checkbox
                  id="biz-terms"
                  data-ocid="business-terms-checkbox"
                  checked={termsAccepted}
                  onCheckedChange={(v) => setTermsAccepted(!!v)}
                  className="mt-0.5 border-teal/40 data-[state=checked]:bg-teal data-[state=checked]:border-teal"
                />
                <label
                  htmlFor="biz-terms"
                  className="text-[11px] text-white/70 leading-relaxed cursor-pointer"
                >
                  I confirm this is a legitimate business and I agree to Open
                  Tip Pay's{" "}
                  <span className="text-teal font-medium">
                    Business Terms of Service
                  </span>
                  . I understand that misrepresentation may result in permanent
                  suspension.
                </label>
              </div>

              {/* Submit */}
              <Button
                data-ocid="business-submit-btn"
                onClick={handleSubmit}
                disabled={!isFormValid || submit.isPending}
                className="w-full bg-gradient-to-r from-teal/30 to-teal/20 hover:from-teal/40 hover:to-teal/30 border border-teal/40 text-white font-semibold text-sm h-10 transition-all duration-300 disabled:opacity-40"
              >
                {submit.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Submitting…
                  </>
                ) : (
                  <>
                    <Briefcase className="h-4 w-4 mr-2" />
                    Submit Application
                  </>
                )}
              </Button>

              {!isFormValid && (
                <p className="text-[10px] text-white/40 text-center">
                  Fill in all fields and accept the terms to continue
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* What You Get */}
        <Card className="glassmorphism border-teal/20 bg-transparent">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm text-white flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-teal" />
              Business Account Benefits
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <ul className="space-y-2">
              {[
                "Manager Portal access for team tip management",
                "Tip pooling across your team",
                "Business analytics and reports",
                "Priority support from Open Tip Pay",
                "Verified business badge on your profile",
              ].map((benefit) => (
                <li
                  key={benefit}
                  className="flex items-center gap-2 text-xs text-white/70"
                >
                  <CheckCircle className="h-3 w-3 text-teal shrink-0" />
                  {benefit}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </ScrollArea>
  );
}
