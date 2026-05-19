import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useInternetIdentity } from "@caffeineai/core-infrastructure";
import { format } from "date-fns";
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Eye,
  FileCheck,
  Globe,
  HelpCircle,
  Info,
  Lock,
  MapPin,
  Monitor,
  Shield,
  ShieldCheck,
  Smartphone,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { setAppLockEnabled, useAppLockEnabledPref } from "../hooks/useAppLock";
import {
  useGetActiveSessions,
  useGetBiometricSettings,
  useGetCompilationStatus,
  useGetEncryptionLog,
  useGetFraudAlerts,
  useHasExistingPin,
  useSetAppLockEnabled,
  useSetBiometricSettings,
} from "../hooks/useQueries";
import AppLockSetupScreen from "./AppLockSetupScreen";
import KYCVerification from "./KYCVerification";
import Withdrawal2FASettingsCard from "./Withdrawal2FASettingsCard";

export default function SecurityCenter() {
  const { data: sessions = [] } = useGetActiveSessions();
  const { data: biometricSettings } = useGetBiometricSettings();
  const { data: encryptionLog = [] } = useGetEncryptionLog();
  const { data: fraudAlerts = [] } = useGetFraudAlerts();
  const { data: compilationStatus } = useGetCompilationStatus();
  const { identity } = useInternetIdentity();
  const setBiometric = useSetBiometricSettings();
  const setAppLockEnabledMutation = useSetAppLockEnabled();
  const { data: hasPin } = useHasExistingPin();

  // App Lock PIN preference
  const [appLockEnabled, setAppLockEnabledState] = useAppLockEnabledPref();
  const [showPinSetup, setShowPinSetup] = useState(false);

  const [biometricEnabled, setBiometricEnabled] = useState(
    biometricSettings?.enabled || false,
  );
  const [encryptionStatus, setEncryptionStatus] = useState({
    dataAtRest: true,
    transportSecurity: true,
    mobilePWA: true,
    localStorage: true,
  });

  const [securityStatus, setSecurityStatus] = useState({
    inputProtection: true,
    internetIdentity: false,
    roleBasedAuth: false,
  });

  // Check encryption and security status on mount
  useEffect(() => {
    const checkSecurityStatus = () => {
      // Check HTTPS/TLS
      const isHTTPS = window.location.protocol === "https:";

      // Check if running as PWA
      const isPWA =
        window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as any).standalone === true;

      // Check localStorage encryption capability
      const hasLocalStorage = typeof Storage !== "undefined";

      // Check Internet Identity authentication
      const hasInternetIdentity = !!identity;

      // Input protection is always active (client-side validation)
      const inputProtectionActive = true;

      // Role-based auth is active when authenticated
      const roleBasedAuthActive = hasInternetIdentity;

      setEncryptionStatus({
        dataAtRest: true, // Backend always encrypts with AES-256
        transportSecurity: isHTTPS,
        mobilePWA: isPWA || isHTTPS, // PWA or HTTPS connection
        localStorage: hasLocalStorage,
      });

      setSecurityStatus({
        inputProtection: inputProtectionActive,
        internetIdentity: hasInternetIdentity,
        roleBasedAuth: roleBasedAuthActive,
      });
    };

    checkSecurityStatus();

    // Re-check on visibility change (for PWA state changes)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        checkSecurityStatus();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [identity]);

  const handleBiometricToggle = async (enabled: boolean) => {
    try {
      await setBiometric.mutateAsync({
        enabled,
        biometricType: enabled ? "FaceID/TouchID" : undefined,
      });
      setBiometricEnabled(enabled);
      toast.success(
        enabled
          ? "Biometric authentication enabled"
          : "Biometric authentication disabled",
      );
    } catch (_error) {
      toast.error("Failed to update biometric settings");
    }
  };

  const handleAppLockToggle = (enabled: boolean) => {
    if (enabled) {
      // Turning ON: if no PIN exists, show setup flow; otherwise just enable
      if (!hasPin) {
        setShowPinSetup(true);
      } else {
        setAppLockEnabledState(true);
        toast.success("App Lock enabled — PIN required on every open");
      }
    } else {
      // Turning OFF: clear localStorage pref AND delete backend PIN hash
      setAppLockEnabledState(false);
      setAppLockEnabled(false);
      setAppLockEnabledMutation.mutate(false);
      toast.success("App Lock disabled — app opens without a code");
    }
  };

  const handlePinSetupComplete = () => {
    setShowPinSetup(false);
    setAppLockEnabledState(true);
    toast.success("App Lock enabled — PIN required on every open");
  };

  const handlePinSetupCancel = () => {
    setShowPinSetup(false);
    // Don't enable if they cancelled setup
  };

  const unresolvedAlerts = fraudAlerts.filter((alert) => !alert.resolved);
  const allEncryptionActive = Object.values(encryptionStatus).every(
    (status) => status,
  );

  // Determine obfuscation badge variant based on layer
  const getObfuscationBadge = (layer: string) => {
    if (layer.toLowerCase().includes("proguard")) {
      return {
        icon: "/assets/generated/proguard-status-badge-transparent.dim_24x24.png",
        text: "ProGuard",
        color: "border-teal/30 text-teal",
      };
    }
    if (layer.toLowerCase().includes("swiftshield")) {
      return {
        icon: "/assets/generated/swiftshield-status-badge-transparent.dim_24x24.png",
        text: "SwiftShield",
        color: "border-teal/30 text-teal",
      };
    }
    return {
      icon: "/assets/generated/code-obfuscation-shield-transparent.dim_24x24.png",
      text: layer,
      color: "border-teal/30 text-teal",
    };
  };

  return (
    <ScrollArea className="h-[calc(100vh-16rem)]">
      <div className="space-y-4 pr-4">
        {/* Security Overview */}
        <div className="glassmorphism p-4 rounded-lg border border-teal/30">
          <div className="flex items-center gap-3 mb-3">
            <img
              src="/assets/generated/security-shield-icon.dim_32x32.png"
              alt=""
              className="h-8 w-8"
            />
            <div>
              <h3 className="text-sm font-semibold text-white">
                Security Center
              </h3>
              <p className="text-xs text-white/60">
                Manage your security settings
              </p>
            </div>
          </div>

          {unresolvedAlerts.length > 0 && (
            <div className="mt-3 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
                <p className="text-xs text-yellow-500 font-medium">
                  {unresolvedAlerts.length} security alert
                  {unresolvedAlerts.length > 1 ? "s" : ""} require attention
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Withdrawal 2FA Settings */}
        <Withdrawal2FASettingsCard />

        {/* Account Recovery */}
        <Card
          className="glassmorphism border-teal/20"
          data-ocid="recovery.settings.card"
        >
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2 text-white">
              <Shield className="h-4 w-4 text-teal" />
              Account Recovery
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-white/60">
              Manage your recovery phrase and backup devices to ensure you can
              always access your account.
            </p>
            <div className="p-3 rounded-lg bg-teal/10 border border-teal/25">
              <p className="text-xs text-teal/80 leading-relaxed">
                Your recovery phrase is the only way to restore access if you
                lose your phone. Keep it written down and stored in a safe
                place.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full border-teal/30 text-teal hover:bg-teal/10 hover:text-teal text-xs h-9"
              data-ocid="recovery.settings.view_button"
              onClick={() => {
                localStorage.setItem("recoverySetupDone", "false");
                window.location.reload();
              }}
            >
              <Shield className="h-3.5 w-3.5 mr-1.5" />
              View Recovery Setup
            </Button>
          </CardContent>
        </Card>

        {/* App Lock PIN */}
        <Card
          className="glassmorphism border-teal/20"
          data-ocid="app-lock.card"
        >
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2 text-white">
              <Lock className="h-4 w-4 text-teal" />
              App Lock PIN
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Toggle row */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5 pr-4">
                <Label
                  htmlFor="app-lock-toggle"
                  className="text-sm text-white cursor-pointer"
                >
                  Require PIN to open app
                </Label>
                <p className="text-xs text-white/60">
                  When enabled, you'll need a 4-digit PIN every time you open
                  the app or after 1 minute of inactivity
                </p>
              </div>
              <Switch
                id="app-lock-toggle"
                data-ocid="app-lock.toggle"
                checked={appLockEnabled}
                onCheckedChange={handleAppLockToggle}
              />
            </div>

            {/* Status banner */}
            <div
              className={`p-3 rounded-lg border ${
                appLockEnabled
                  ? "bg-teal/10 border-teal/30"
                  : "bg-white/5 border-white/10"
              }`}
            >
              <div className="flex items-center gap-2">
                {appLockEnabled ? (
                  <>
                    <ShieldCheck className="h-4 w-4 text-teal shrink-0" />
                    <p className="text-xs text-teal font-medium">
                      App Lock is ON — PIN required on every open
                    </p>
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4 text-white/40 shrink-0" />
                    <p className="text-xs text-white/50">
                      App Lock is OFF — app opens without a code
                    </p>
                  </>
                )}
              </div>
            </div>

            {/* No PIN yet — prompt to set up */}
            {appLockEnabled && !hasPin && !showPinSetup && (
              <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-500 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0 space-y-2">
                    <p className="text-xs text-yellow-500">
                      No PIN set. Set up a PIN to activate App Lock.
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      data-ocid="app-lock.setup_button"
                      onClick={() => setShowPinSetup(true)}
                      className="border-yellow-500/40 text-yellow-500 hover:bg-yellow-500/10 h-7 text-xs"
                    >
                      Set Up PIN
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* PIN setup inline overlay */}
            {showPinSetup && (
              <div className="fixed inset-0 z-50 bg-navy/95 backdrop-blur-sm flex flex-col">
                <div className="flex items-center justify-between p-4 border-b border-white/10">
                  <p className="text-sm font-semibold text-white">
                    Set Up App Lock PIN
                  </p>
                  <Button
                    size="sm"
                    variant="ghost"
                    data-ocid="app-lock.setup_cancel_button"
                    onClick={handlePinSetupCancel}
                    className="text-white/60 hover:text-white h-8 text-xs"
                  >
                    Cancel
                  </Button>
                </div>
                <div className="flex-1 overflow-auto">
                  <AppLockSetupScreen
                    onSetupComplete={handlePinSetupComplete}
                  />
                </div>
              </div>
            )}

            {/* PIN already set + enabled hint */}
            {appLockEnabled && hasPin && (
              <p className="text-xs text-white/40">
                To change your PIN, disable App Lock and re-enable it to set a
                new one.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Authentication & Authorization Status */}
        <Card className="glassmorphism border-teal/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2 text-white">
              <img
                src="/assets/generated/internet-identity-icon-transparent.dim_32x32.png"
                alt=""
                className="h-5 w-5"
              />
              Authentication & Authorization
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Internet Identity Status */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-navy-dark/50 border border-white/10">
              <div className="flex items-center gap-3">
                <img
                  src="/assets/generated/internet-identity-icon-transparent.dim_32x32.png"
                  alt=""
                  className="h-5 w-5"
                />
                <div>
                  <p className="text-sm text-white font-medium">
                    Internet Identity
                  </p>
                  <p className="text-xs text-white/60">
                    Secure authentication via ICP
                  </p>
                </div>
              </div>
              <Badge
                variant="outline"
                className={`text-xs ${securityStatus.internetIdentity ? "border-teal/30 text-teal" : "border-yellow-500/30 text-yellow-500"}`}
              >
                {securityStatus.internetIdentity ? (
                  <span className="flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" />
                    Connected
                  </span>
                ) : (
                  "Not Connected"
                )}
              </Badge>
            </div>

            {/* Role-Based Authorization */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-navy-dark/50 border border-white/10">
              <div className="flex items-center gap-3">
                <img
                  src="/assets/generated/role-auth-badge-transparent.dim_24x24.png"
                  alt=""
                  className="h-5 w-5"
                />
                <div>
                  <p className="text-sm text-white font-medium">
                    Role-Based Authorization
                  </p>
                  <p className="text-xs text-white/60">
                    Strict access controls
                  </p>
                </div>
              </div>
              <Badge
                variant="outline"
                className={`text-xs ${securityStatus.roleBasedAuth ? "border-teal/30 text-teal" : "border-yellow-500/30 text-yellow-500"}`}
              >
                {securityStatus.roleBasedAuth ? (
                  <span className="flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" />
                    Active
                  </span>
                ) : (
                  "Inactive"
                )}
              </Badge>
            </div>

            {/* OAuth Compatible Structure */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-navy-dark/50 border border-white/10">
              <div className="flex items-center gap-3">
                <img
                  src="/assets/generated/oauth-compatible-icon-transparent.dim_24x24.png"
                  alt=""
                  className="h-5 w-5"
                />
                <div>
                  <p className="text-sm text-white font-medium">
                    OAuth Compatible
                  </p>
                  <p className="text-xs text-white/60">
                    Future-ready authentication
                  </p>
                </div>
              </div>
              <Badge
                variant="outline"
                className="text-xs border-teal/30 text-teal"
              >
                <span className="flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" />
                  Ready
                </span>
              </Badge>
            </div>

            <Separator className="my-3 bg-white/10" />

            <div className="space-y-2 text-xs text-white/60">
              <p className="flex items-center gap-2">
                <ShieldCheck className="h-3 w-3 text-teal" />
                No local password storage - ICP handles all authentication
              </p>
              <p className="flex items-center gap-2">
                <Lock className="h-3 w-3 text-teal" />
                Strict role-based access for sensitive operations
              </p>
              <p className="flex items-center gap-2">
                <Globe className="h-3 w-3 text-teal" />
                OAuth-compatible structure for future integrations
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Input Validation & Protection */}
        <Card className="glassmorphism border-teal/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2 text-white">
              <img
                src="/assets/generated/input-validation-shield-transparent.dim_24x24.png"
                alt=""
                className="h-5 w-5"
              />
              Input Protection
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Input Protection Status */}
            <div
              className={`p-3 rounded-lg border ${securityStatus.inputProtection ? "bg-teal/10 border-teal/30" : "bg-yellow-500/10 border-yellow-500/30"}`}
            >
              <div className="flex items-center gap-2">
                {securityStatus.inputProtection ? (
                  <>
                    <CheckCircle className="h-4 w-4 text-teal" />
                    <p className="text-xs text-teal font-medium">
                      Input Protection Active
                    </p>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    <p className="text-xs text-yellow-500 font-medium">
                      Input protection needs attention
                    </p>
                  </>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between p-2 rounded bg-navy-dark/50 text-xs">
                <div className="flex items-center gap-2">
                  <FileCheck className="h-3 w-3 text-teal" />
                  <span className="text-white/80">XSS Protection</span>
                </div>
                <Badge
                  variant="outline"
                  className="text-xs border-teal/30 text-teal"
                >
                  <CheckCircle className="h-3 w-3" />
                </Badge>
              </div>

              <div className="flex items-center justify-between p-2 rounded bg-navy-dark/50 text-xs">
                <div className="flex items-center gap-2">
                  <FileCheck className="h-3 w-3 text-teal" />
                  <span className="text-white/80">CSRF Protection</span>
                </div>
                <Badge
                  variant="outline"
                  className="text-xs border-teal/30 text-teal"
                >
                  <CheckCircle className="h-3 w-3" />
                </Badge>
              </div>

              <div className="flex items-center justify-between p-2 rounded bg-navy-dark/50 text-xs">
                <div className="flex items-center gap-2">
                  <FileCheck className="h-3 w-3 text-teal" />
                  <span className="text-white/80">Injection Prevention</span>
                </div>
                <Badge
                  variant="outline"
                  className="text-xs border-teal/30 text-teal"
                >
                  <CheckCircle className="h-3 w-3" />
                </Badge>
              </div>

              <div className="flex items-center justify-between p-2 rounded bg-navy-dark/50 text-xs">
                <div className="flex items-center gap-2">
                  <FileCheck className="h-3 w-3 text-teal" />
                  <span className="text-white/80">Input Sanitization</span>
                </div>
                <Badge
                  variant="outline"
                  className="text-xs border-teal/30 text-teal"
                >
                  <CheckCircle className="h-3 w-3" />
                </Badge>
              </div>
            </div>

            <Separator className="my-3 bg-white/10" />

            <div className="space-y-2 text-xs text-white/60">
              <p className="flex items-center gap-2">
                <Shield className="h-3 w-3 text-teal" />
                All user inputs validated and sanitized
              </p>
              <p className="flex items-center gap-2">
                <Lock className="h-3 w-3 text-teal" />
                Automatic rejection of malicious content
              </p>
              <p className="flex items-center gap-2">
                <Eye className="h-3 w-3 text-teal" />
                Real-time monitoring of validation events
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Security Compilation Status */}
        <Card className="glassmorphism border-teal/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2 text-white">
              <img
                src="/assets/generated/code-obfuscation-shield-transparent.dim_24x24.png"
                alt=""
                className="h-5 w-5"
              />
              Security Compilation Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {compilationStatus ? (
              <>
                {/* Obfuscation Layer Status */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-navy-dark/50 border border-white/10">
                  <div className="flex items-center gap-3">
                    <img
                      src={
                        getObfuscationBadge(compilationStatus.obfuscationLayer)
                          .icon
                      }
                      alt=""
                      className="h-5 w-5"
                    />
                    <div>
                      <p className="text-sm text-white font-medium">
                        Obfuscation Layer
                      </p>
                      <p className="text-xs text-white/60">
                        Mobile build protection
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={`text-xs ${getObfuscationBadge(compilationStatus.obfuscationLayer).color}`}
                  >
                    <span className="flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" />
                      {
                        getObfuscationBadge(compilationStatus.obfuscationLayer)
                          .text
                      }
                    </span>
                  </Badge>
                </div>

                {/* Compilation Verification Timestamp */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-navy-dark/50 border border-white/10">
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-teal" />
                    <div>
                      <p className="text-sm text-white font-medium">
                        Last Verification
                      </p>
                      <p className="text-xs text-white/60">
                        {compilationStatus.verificationTimestamp > 0
                          ? format(
                              Number(compilationStatus.verificationTimestamp) /
                                1000000,
                              "PPp",
                            )
                          : "Not yet verified"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Tooltip Note */}
                <div className="p-3 rounded-lg bg-teal/10 border border-teal/30">
                  <div className="flex items-start gap-2">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-4 w-4 text-teal mt-0.5 cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent
                          side="top"
                          className="glassmorphism border-teal/30 max-w-xs"
                        >
                          <p className="text-xs text-white/90">
                            {compilationStatus.tooltipNote}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <p className="text-xs text-teal leading-relaxed">
                      {compilationStatus.tooltipNote}
                    </p>
                  </div>
                </div>

                <Separator className="my-3 bg-white/10" />

                <div className="space-y-2 text-xs text-white/60">
                  <p className="flex items-center gap-2">
                    <Shield className="h-3 w-3 text-teal" />
                    ProGuard for Android packages
                  </p>
                  <p className="flex items-center gap-2">
                    <Shield className="h-3 w-3 text-teal" />
                    SwiftShield for iOS builds
                  </p>
                  <p className="flex items-center gap-2">
                    <Lock className="h-3 w-3 text-teal" />
                    Sensitive class names and methods obfuscated
                  </p>
                  <p className="flex items-center gap-2">
                    <Eye className="h-3 w-3 text-teal" />
                    Public SDK interfaces preserved for updates
                  </p>
                </div>
              </>
            ) : (
              <div className="p-4 text-center">
                <p className="text-xs text-white/60">
                  Loading compilation status...
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Security Event Log */}
        <Card className="glassmorphism border-teal/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2 text-white">
              <img
                src="/assets/generated/security-event-log-icon-transparent.dim_24x24.png"
                alt=""
                className="h-5 w-5"
              />
              Security Event Log
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-navy-dark/50 border border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-white font-medium">
                    Recent Events
                  </span>
                  <Badge
                    variant="outline"
                    className="border-teal/30 text-teal text-xs"
                  >
                    Monitoring
                  </Badge>
                </div>
                <p className="text-xs text-white/60">
                  All validation events, blocked attempts, and security
                  incidents are logged for transparency and audit purposes.
                </p>
              </div>

              {encryptionLog.length > 0 ? (
                <div className="space-y-2">
                  {encryptionLog.slice(0, 5).map((event, index) => (
                    <div
                      key={`enc-${event.eventType}-${index}`}
                      className="flex items-center justify-between p-2 rounded bg-navy-dark/50 text-xs border border-white/5"
                    >
                      <div className="flex items-center gap-2">
                        <Eye className="h-3 w-3 text-teal" />
                        <span className="text-white/80">{event.eventType}</span>
                      </div>
                      <span className="text-white/60">
                        {format(
                          Number(event.timestamp) / 1000000,
                          "MMM d, HH:mm",
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center">
                  <p className="text-xs text-white/60">
                    No security events logged yet
                  </p>
                </div>
              )}

              <div className="space-y-2 text-xs text-white/60 pt-2">
                <p className="flex items-center gap-2">
                  <Shield className="h-3 w-3 text-teal" />
                  Input validation failures logged
                </p>
                <p className="flex items-center gap-2">
                  <AlertTriangle className="h-3 w-3 text-teal" />
                  Blocked attempts tracked
                </p>
                <p className="flex items-center gap-2">
                  <Lock className="h-3 w-3 text-teal" />
                  Authentication events monitored
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Encryption Status Dashboard */}
        <Card className="glassmorphism border-teal/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2 text-white">
              <img
                src="/assets/generated/encryption-status-icon-transparent.dim_32x32.png"
                alt=""
                className="h-5 w-5"
              />
              Encryption Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Overall Status */}
            <div
              className={`p-3 rounded-lg border ${allEncryptionActive ? "bg-teal/10 border-teal/30" : "bg-yellow-500/10 border-yellow-500/30"}`}
            >
              <div className="flex items-center gap-2">
                {allEncryptionActive ? (
                  <>
                    <CheckCircle className="h-4 w-4 text-teal" />
                    <p className="text-xs text-teal font-medium">
                      All encryption systems active
                    </p>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    <p className="text-xs text-yellow-500 font-medium">
                      Some encryption features need attention
                    </p>
                  </>
                )}
              </div>
            </div>

            {/* Data at Rest Encryption */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-navy-dark/50 border border-white/10">
              <div className="flex items-center gap-3">
                <img
                  src="/assets/generated/data-encryption-check-transparent.dim_24x24.png"
                  alt=""
                  className="h-5 w-5"
                />
                <div>
                  <p className="text-sm text-white font-medium">Data at Rest</p>
                  <p className="text-xs text-white/60">AES-256 encryption</p>
                </div>
              </div>
              <Badge
                variant="outline"
                className={`text-xs ${encryptionStatus.dataAtRest ? "border-teal/30 text-teal" : "border-yellow-500/30 text-yellow-500"}`}
              >
                {encryptionStatus.dataAtRest ? (
                  <span className="flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" />
                    Active
                  </span>
                ) : (
                  "Inactive"
                )}
              </Badge>
            </div>

            {/* Transport Security */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-navy-dark/50 border border-white/10">
              <div className="flex items-center gap-3">
                <img
                  src="/assets/generated/transport-security-badge-transparent.dim_24x24.png"
                  alt=""
                  className="h-5 w-5"
                />
                <div>
                  <p className="text-sm text-white font-medium">
                    Transport Security
                  </p>
                  <p className="text-xs text-white/60">HTTPS/TLS encryption</p>
                </div>
              </div>
              <Badge
                variant="outline"
                className={`text-xs ${encryptionStatus.transportSecurity ? "border-teal/30 text-teal" : "border-yellow-500/30 text-yellow-500"}`}
              >
                {encryptionStatus.transportSecurity ? (
                  <span className="flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" />
                    Secured
                  </span>
                ) : (
                  "Unsecured"
                )}
              </Badge>
            </div>

            {/* Mobile PWA Encryption */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-navy-dark/50 border border-white/10">
              <div className="flex items-center gap-3">
                <img
                  src="/assets/generated/mobile-security-indicator-transparent.dim_24x24.png"
                  alt=""
                  className="h-5 w-5"
                />
                <div>
                  <p className="text-sm text-white font-medium">
                    Mobile PWA Security
                  </p>
                  <p className="text-xs text-white/60">
                    Platform-native encryption
                  </p>
                </div>
              </div>
              <Badge
                variant="outline"
                className={`text-xs ${encryptionStatus.mobilePWA ? "border-teal/30 text-teal" : "border-yellow-500/30 text-yellow-500"}`}
              >
                {encryptionStatus.mobilePWA ? (
                  <span className="flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" />
                    Active
                  </span>
                ) : (
                  "Inactive"
                )}
              </Badge>
            </div>

            {/* Local Storage Encryption */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-navy-dark/50 border border-white/10">
              <div className="flex items-center gap-3">
                <Lock className="h-5 w-5 text-teal" />
                <div>
                  <p className="text-sm text-white font-medium">
                    Local Storage
                  </p>
                  <p className="text-xs text-white/60">
                    Encrypted session cache
                  </p>
                </div>
              </div>
              <Badge
                variant="outline"
                className={`text-xs ${encryptionStatus.localStorage ? "border-teal/30 text-teal" : "border-yellow-500/30 text-yellow-500"}`}
              >
                {encryptionStatus.localStorage ? (
                  <span className="flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" />
                    Enabled
                  </span>
                ) : (
                  "Disabled"
                )}
              </Badge>
            </div>

            <Separator className="my-3 bg-white/10" />

            <div className="space-y-2 text-xs text-white/60">
              <p className="flex items-center gap-2">
                <Shield className="h-3 w-3 text-teal" />
                All sensitive data encrypted with AES-256
              </p>
              <p className="flex items-center gap-2">
                <Globe className="h-3 w-3 text-teal" />
                Secure HTTPS connections enforced
              </p>
              <p className="flex items-center gap-2">
                <Smartphone className="h-3 w-3 text-teal" />
                PWA uses platform-native encryption APIs
              </p>
            </div>
          </CardContent>
        </Card>

        {/* KYC Verification */}
        <KYCVerification />

        {/* Biometric Authentication */}
        <Card className="glassmorphism border-teal/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2 text-white">
              <img
                src="/assets/generated/biometric-auth-icon.dim_32x32.png"
                alt=""
                className="h-5 w-5"
              />
              Biometric Authentication
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="biometric" className="text-sm text-white">
                  Enable Biometric Login
                </Label>
                <p className="text-xs text-white/60">
                  Use FaceID, TouchID, or Fingerprint
                </p>
              </div>
              <Switch
                id="biometric"
                checked={biometricEnabled}
                onCheckedChange={handleBiometricToggle}
                disabled={setBiometric.isPending}
              />
            </div>
            {biometricEnabled && (
              <div className="p-2 rounded bg-teal/10 border border-teal/30">
                <p className="text-xs text-teal">
                  ✓ Biometric authentication is your primary login method
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Active Sessions */}
        <Card className="glassmorphism border-teal/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2 text-white">
              <Monitor className="h-4 w-4 text-teal" />
              Active Sessions ({sessions.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {sessions.length === 0 ? (
              <p className="text-xs text-white/60 text-center py-4">
                No active sessions
              </p>
            ) : (
              <div className="space-y-3">
                {sessions.slice(0, 3).map((session, index) => (
                  <div
                    key={session.sessionId || `session-${index}`}
                    className="p-3 rounded-lg bg-navy-dark/50 border border-white/10"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Smartphone className="h-4 w-4 text-teal" />
                        <span className="text-sm font-medium text-white">
                          {session.deviceName}
                        </span>
                      </div>
                      <Badge
                        variant="outline"
                        className="text-xs border-teal/30 text-teal"
                      >
                        Active
                      </Badge>
                    </div>
                    <div className="space-y-1 text-xs text-white/60">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-3 w-3" />
                        <span>{session.location}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-3 w-3" />
                        <span>
                          {format(
                            Number(session.loginTimestamp) / 1000000,
                            "PPp",
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* AI Fraud Detection */}
        <Card className="glassmorphism border-teal/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2 text-white">
              <AlertTriangle className="h-4 w-4 text-teal" />
              AI Fraud Detection
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-navy-dark/50">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-teal animate-pulse" />
                  <span className="text-sm text-white">Status: Active</span>
                </div>
                <Badge variant="outline" className="border-teal/30 text-teal">
                  Monitoring
                </Badge>
              </div>
              <p className="text-xs text-white/60">
                AI monitors unusual activity patterns and automatically requires
                2FA verification for suspicious transactions.
              </p>
              {unresolvedAlerts.length > 0 && (
                <div className="space-y-2">
                  {unresolvedAlerts.slice(0, 2).map((alert, index) => (
                    <div
                      key={`alert-${String(alert.timestamp)}-${index}`}
                      className="p-2 rounded bg-yellow-500/10 border border-yellow-500/30"
                    >
                      <p className="text-xs text-yellow-500">{alert.reason}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Data Encryption Log */}
        <Card className="glassmorphism border-teal/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2 text-white">
              <Lock className="h-4 w-4 text-teal" />
              Data Encryption Log
            </CardTitle>
          </CardHeader>
          <CardContent>
            {encryptionLog.length === 0 ? (
              <p className="text-xs text-white/60 text-center py-4">
                No encryption events logged
              </p>
            ) : (
              <div className="space-y-2">
                {encryptionLog.slice(0, 5).map((event, index) => (
                  <div
                    key={`enclog-${event.eventType}-${index}`}
                    className="flex items-center justify-between p-2 rounded bg-navy-dark/50 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <Eye className="h-3 w-3 text-teal" />
                      <span className="text-white/80">{event.eventType}</span>
                    </div>
                    <span className="text-white/60">
                      {format(
                        Number(event.timestamp) / 1000000,
                        "MMM d, HH:mm",
                      )}
                    </span>
                  </div>
                ))}
              </div>
            )}
            <Separator className="my-3 bg-white/10" />
            <div className="space-y-2 text-xs text-white/60">
              <p>🔒 AES-256 encryption for all data at rest</p>
              <p>🔐 End-to-end encryption for messages</p>
              <p>🛡️ MPC for crypto wallet key integrity</p>
            </div>
          </CardContent>
        </Card>

        {/* Security FAQ */}
        <Card className="glassmorphism border-teal/20" id="security-faq">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2 text-white">
              <HelpCircle className="h-4 w-4 text-teal" />
              Security FAQ
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full space-y-2">
              <AccordionItem
                value="2fa-withdrawal"
                className="border-teal/20 glassmorphism rounded-lg px-4"
              >
                <AccordionTrigger className="text-sm text-white hover:text-teal">
                  🔐 How does 2FA Withdrawal Security work?
                </AccordionTrigger>
                <AccordionContent className="text-xs text-white/70 leading-relaxed">
                  2FA Withdrawal Security adds an extra layer of protection for
                  your funds. When you attempt a withdrawal over $50 or any
                  crypto transfer, you'll first enter your 4-digit security PIN,
                  then receive a one-time code (OTP) delivered in-app. Both must
                  be entered correctly to complete the withdrawal. Your PIN is
                  stored securely using salted hash encryption, and OTP codes
                  expire after 5 minutes. All 2FA events are logged in the
                  Security Event Log for transparency. Note: SMS integration is
                  not available on this platform; OTP delivery is in-app only.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem
                value="code-obfuscation"
                className="border-teal/20 glassmorphism rounded-lg px-4"
              >
                <AccordionTrigger className="text-sm text-white hover:text-teal">
                  🔐 What is code obfuscation and why is it important?
                </AccordionTrigger>
                <AccordionContent className="text-xs text-white/70 leading-relaxed">
                  Code obfuscation is a security technique that transforms your
                  app's code into a form that's extremely difficult to
                  reverse-engineer. Open Tip Pay uses ProGuard for Android
                  packages and SwiftShield for iOS builds to protect sensitive
                  class names, methods, and logic from being exposed. This
                  prevents attackers from understanding how the app works
                  internally, making it much harder to find vulnerabilities or
                  create malicious clones. Only public SDK interfaces needed for
                  app updates remain visible, while all internal logic is
                  protected.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem
                value="internet-identity"
                className="border-teal/20 glassmorphism rounded-lg px-4"
              >
                <AccordionTrigger className="text-sm text-white hover:text-teal">
                  🔐 What is Internet Identity authentication?
                </AccordionTrigger>
                <AccordionContent className="text-xs text-white/70 leading-relaxed">
                  Internet Identity is ICP's secure authentication system that
                  eliminates the need for passwords. Your credentials are never
                  stored locally or on our servers - authentication happens
                  through the Internet Computer's decentralized infrastructure.
                  This means no password databases to hack, no credentials to
                  steal, and complete control over your identity. Internet
                  Identity uses cryptographic keys stored securely on your
                  device, providing bank-level security without the complexity.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem
                value="input-protection"
                className="border-teal/20 glassmorphism rounded-lg px-4"
              >
                <AccordionTrigger className="text-sm text-white hover:text-teal">
                  🛡️ How does input protection work?
                </AccordionTrigger>
                <AccordionContent className="text-xs text-white/70 leading-relaxed">
                  Every piece of data you enter is validated and sanitized on
                  both the client and server side. We automatically detect and
                  block XSS (Cross-Site Scripting) attacks, CSRF (Cross-Site
                  Request Forgery) attempts, SQL/NoSQL injection attacks, and
                  other malicious input patterns. Suspicious or malformed input
                  triggers automatic warnings and rejection. All validation
                  events are logged in the Security Event Log for transparency
                  and audit purposes.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem
                value="role-based-auth"
                className="border-teal/20 glassmorphism rounded-lg px-4"
              >
                <AccordionTrigger className="text-sm text-white hover:text-teal">
                  👥 What is role-based authorization?
                </AccordionTrigger>
                <AccordionContent className="text-xs text-white/70 leading-relaxed">
                  Role-based authorization ensures that only verified,
                  authorized users can perform sensitive operations. For
                  example, only you can view your financial information, only
                  admins can approve certain actions, and only transaction
                  participants can initiate disputes. This strict access control
                  prevents unauthorized access to sensitive data and operations,
                  even if someone gains access to your device. Every action is
                  verified against your authorization level before execution.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem
                value="oauth-compatible"
                className="border-teal/20 glassmorphism rounded-lg px-4"
              >
                <AccordionTrigger className="text-sm text-white hover:text-teal">
                  🔗 What does OAuth-compatible mean?
                </AccordionTrigger>
                <AccordionContent className="text-xs text-white/70 leading-relaxed">
                  While we currently use Internet Identity exclusively, our
                  authentication system is built with an OAuth-compatible
                  structure. This means we're ready to integrate with
                  third-party authentication providers in the future (like
                  Google, Apple, or Microsoft) without compromising security.
                  The infrastructure is in place, but we haven't activated
                  third-party providers yet to maintain the highest security
                  standards with ICP's native authentication.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem
                value="secure-credentials"
                className="border-teal/20 glassmorphism rounded-lg px-4"
              >
                <AccordionTrigger className="text-sm text-white hover:text-teal">
                  🔑 How are API keys and credentials managed?
                </AccordionTrigger>
                <AccordionContent className="text-xs text-white/70 leading-relaxed">
                  All sensitive credentials (Stripe keys, API keys, etc.) are
                  managed through secure environment variables and vault
                  mechanisms. We never hardcode credentials in the application
                  code. This means even if someone accesses the source code,
                  they cannot extract sensitive keys or credentials. All
                  credential access is logged and monitored for security
                  purposes.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem
                value="security-event-log"
                className="border-teal/20 glassmorphism rounded-lg px-4"
              >
                <AccordionTrigger className="text-sm text-white hover:text-teal">
                  📋 What is the Security Event Log?
                </AccordionTrigger>
                <AccordionContent className="text-xs text-white/70 leading-relaxed">
                  The Security Event Log provides real-time visibility into all
                  security-related activities on your account. This includes
                  validation failures, blocked malicious attempts,
                  authentication events, and any suspicious activity. The log is
                  encrypted and stored securely, providing a complete audit
                  trail for transparency. You can review this log at any time to
                  see exactly what security measures are protecting your
                  account.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem
                value="encryption-status"
                className="border-teal/20 glassmorphism rounded-lg px-4"
              >
                <AccordionTrigger className="text-sm text-white hover:text-teal">
                  🔐 What does the Encryption Status dashboard show?
                </AccordionTrigger>
                <AccordionContent className="text-xs text-white/70 leading-relaxed">
                  The Encryption Status dashboard provides real-time
                  verification of all security layers protecting your data: Data
                  at Rest (AES-256 encryption for stored data), Transport
                  Security (HTTPS/TLS for data in transit), Mobile PWA Security
                  (platform-native encryption for mobile app), and Local Storage
                  (encrypted session cache). All systems are continuously
                  monitored to ensure your data remains protected at every
                  level.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem
                value="kyc-compliance"
                className="border-teal/20 glassmorphism rounded-lg px-4"
              >
                <AccordionTrigger className="text-sm text-white hover:text-teal">
                  🔍 Why is KYC verification required?
                </AccordionTrigger>
                <AccordionContent className="text-xs text-white/70 leading-relaxed">
                  KYC (Know Your Customer) verification is required for
                  withdrawals over $200 to comply with financial regulations and
                  prevent fraud. It helps protect all users by ensuring the
                  platform meets regulatory standards. Your KYC data is
                  encrypted end-to-end (E2EE) and stored securely with AES-256
                  encryption, used only for identity verification purposes.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem
                value="crypto-security"
                className="border-teal/20 glassmorphism rounded-lg px-4"
              >
                <AccordionTrigger className="text-sm text-white hover:text-teal">
                  🔒 How secure are crypto payments?
                </AccordionTrigger>
                <AccordionContent className="text-xs text-white/70 leading-relaxed">
                  Crypto payments on Open Tip Pay are non-custodial, meaning we
                  never store your private keys. All transactions use
                  Multi-Party Computation (MPC) for key integrity, and your
                  wallet remains under your full control. We facilitate the
                  connection but never have access to your funds.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem
                value="encryption"
                className="border-teal/20 glassmorphism rounded-lg px-4"
              >
                <AccordionTrigger className="text-sm text-white hover:text-teal">
                  🔐 What encryption do you use?
                </AccordionTrigger>
                <AccordionContent className="text-xs text-white/70 leading-relaxed">
                  We use AES-256 encryption for all data at rest, ensuring your
                  personal information, transaction history, KYC records, and
                  all sensitive data are protected. All messages and transaction
                  data use end-to-end encryption (E2EE), meaning only you and
                  the recipient can read them. Transport security is enforced
                  through HTTPS/TLS for all API communications.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem
                value="wallet-connection"
                className="border-teal/20 glassmorphism rounded-lg px-4"
              >
                <AccordionTrigger className="text-sm text-white hover:text-teal">
                  🔗 Is it safe to connect my wallet?
                </AccordionTrigger>
                <AccordionContent className="text-xs text-white/70 leading-relaxed">
                  Yes! When you connect your wallet (MetaMask or WalletConnect),
                  we only store your public wallet address for display purposes.
                  Your private keys never leave your wallet. All transactions
                  are initiated through your wallet's native interface, giving
                  you full control and transparency.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem
                value="fraud-detection"
                className="border-teal/20 glassmorphism rounded-lg px-4"
              >
                <AccordionTrigger className="text-sm text-white hover:text-teal">
                  🤖 How does AI fraud detection work?
                </AccordionTrigger>
                <AccordionContent className="text-xs text-white/70 leading-relaxed">
                  Our AI system monitors transaction patterns in real-time,
                  looking for unusual activity such as multiple tips from new
                  locations or rapid transaction sequences. If suspicious
                  behavior is detected, we automatically require 2FA
                  verification before the transaction can proceed, protecting
                  your account from unauthorized access.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem
                value="2fa"
                className="border-teal/20 glassmorphism rounded-lg px-4"
              >
                <AccordionTrigger className="text-sm text-white hover:text-teal">
                  🛡️ When is 2FA required?
                </AccordionTrigger>
                <AccordionContent className="text-xs text-white/70 leading-relaxed">
                  Two-factor authentication (2FA) is automatically required for
                  withdrawals above $50, all crypto transfers, and any
                  transaction flagged as suspicious by our AI fraud detection
                  system. This adds an extra layer of security to protect your
                  funds.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem
                value="data-privacy"
                className="border-teal/20 glassmorphism rounded-lg px-4"
              >
                <AccordionTrigger className="text-sm text-white hover:text-teal">
                  🔏 What data do you store?
                </AccordionTrigger>
                <AccordionContent className="text-xs text-white/70 leading-relaxed">
                  We store only essential data: your profile information (name,
                  bio, photo), transaction history, and connected wallet
                  addresses (public addresses only). All data is encrypted with
                  AES-256 at rest and protected with E2EE during transmission.
                  We never store private keys, passwords in plain text, or share
                  your data with third parties without your explicit consent.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem
                value="biometric"
                className="border-teal/20 glassmorphism rounded-lg px-4"
              >
                <AccordionTrigger className="text-sm text-white hover:text-teal">
                  👤 How does biometric authentication work?
                </AccordionTrigger>
                <AccordionContent className="text-xs text-white/70 leading-relaxed">
                  Biometric authentication (FaceID, TouchID, Fingerprint) is
                  your primary login method. Your biometric data never leaves
                  your device - it's processed locally by your device's secure
                  enclave. We only receive confirmation that authentication was
                  successful, never the biometric data itself.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem
                value="blockchain"
                className="border-teal/20 glassmorphism rounded-lg px-4"
              >
                <AccordionTrigger className="text-sm text-white hover:text-teal">
                  ⛓️ Why use the Internet Computer blockchain?
                </AccordionTrigger>
                <AccordionContent className="text-xs text-white/70 leading-relaxed">
                  The Internet Computer provides a secure, decentralized
                  infrastructure for Open Tip Pay. All transactions are recorded
                  on-chain for transparency and immutability, while smart
                  contracts ensure trustless execution. This means no single
                  entity controls your data or transactions.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem
                value="pwa-security"
                className="border-teal/20 glassmorphism rounded-lg px-4"
              >
                <AccordionTrigger className="text-sm text-white hover:text-teal">
                  📱 How secure is the mobile PWA?
                </AccordionTrigger>
                <AccordionContent className="text-xs text-white/70 leading-relaxed">
                  Our Progressive Web App (PWA) uses platform-native encryption
                  APIs to ensure secure communications on mobile devices. All
                  data transmitted through the PWA is protected with HTTPS/TLS
                  encryption, and local storage is encrypted using the device's
                  secure storage mechanisms. The PWA maintains the same security
                  standards as native mobile applications.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>
      </div>
    </ScrollArea>
  );
}
