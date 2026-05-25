import type { PartnerBrandingConfig } from "@/backend";
import { createActor } from "@/backend";
import { useActor } from "@caffeineai/core-infrastructure";
import { useQuery } from "@tanstack/react-query";
import { type ReactNode, createContext, useContext, useEffect } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface BrandingContextValue {
  partnerBranding: PartnerBrandingConfig | null;
  brandName: string;
  poweredByText: string;
  isWhiteLabel: boolean;
  isLoading: boolean;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const BrandingContext = createContext<BrandingContextValue>({
  partnerBranding: null,
  brandName: "Open Tip Pay",
  poweredByText: "",
  isWhiteLabel: false,
  isLoading: false,
});

// Map full partner names to their short brand prefix used in "X Tip Pay"
const PARTNER_BRAND_MAP: Record<string, string> = {
  "Indianapolis Colts": "Colts",
};

function getPartnerBrandPrefix(partnerName: string): string {
  return PARTNER_BRAND_MAP[partnerName] ?? partnerName;
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function BrandingProvider({ children }: { children: ReactNode }) {
  const { actor, isFetching } = useActor(createActor);

  // On public routes (e.g. /kitchen) there is no InternetIdentityProvider,
  // so the actor never initialises and isFetching stays true forever.
  // Treat "no actor after a tick" as "actor unavailable" so the query is
  // never attempted and we fall through to Colts defaults immediately.
  const actorReady = !!actor && !isFetching;

  const { data: partnerBranding = null, isLoading } =
    useQuery<PartnerBrandingConfig | null>({
      queryKey: ["partnerBranding"],
      queryFn: async () => {
        if (!actor) return null;
        try {
          return await actor.getPartnerBranding();
        } catch {
          // If the call fails (e.g. unauthenticated context), fall back to defaults
          return null;
        }
      },
      // Only fire when we have a confirmed ready actor; never on public routes
      enabled: actorReady,
      staleTime: 5 * 60 * 1000,
    });

  // Allow partner branding to apply in all modes (including demo)
  const effectiveBranding = partnerBranding;

  // Default to Colts branding when no saved config exists and data has loaded.
  // When the actor is not available (public routes), isLoading stays false
  // because the query is disabled — so useColtsDefault becomes true immediately.
  // A saved config (even with isActive=false) takes precedence over this default.
  const useColtsDefault = partnerBranding === null && !isLoading;

  const isWhiteLabel = useColtsDefault || !!effectiveBranding?.isActive;

  const brandName = useColtsDefault
    ? "Colts Tip Pay"
    : isWhiteLabel && effectiveBranding
      ? `${getPartnerBrandPrefix(effectiveBranding.partnerName)} Tip Pay`
      : "Open Tip Pay";

  const poweredByText = isWhiteLabel ? "powered by Open Tip Pay" : "";

  // Inject --partner-primary CSS variable when white-label is active
  useEffect(() => {
    const root = document.documentElement;
    if (isWhiteLabel && effectiveBranding?.primaryColor) {
      root.style.setProperty(
        "--partner-primary",
        effectiveBranding.primaryColor,
      );
    } else {
      root.style.removeProperty("--partner-primary");
    }
    return () => {
      root.style.removeProperty("--partner-primary");
    };
  }, [isWhiteLabel, effectiveBranding?.primaryColor]);

  // Never report isLoading=true when the actor is unavailable (public routes).
  // isFetching may stay true forever on those routes, which would block
  // downstream consumers (like KitchenDisplayPage) with a perpetual loading state.
  const reportLoading = actorReady ? isLoading || isFetching : false;

  return (
    <BrandingContext.Provider
      value={{
        partnerBranding: effectiveBranding,
        brandName,
        poweredByText,
        isWhiteLabel,
        isLoading: reportLoading,
      }}
    >
      {children}
    </BrandingContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useBranding(): BrandingContextValue {
  return useContext(BrandingContext);
}
