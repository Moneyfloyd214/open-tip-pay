import { type ReactNode, createContext, useContext, useEffect } from "react";

interface BrandingContextValue {
  partnerBranding: null;
  brandName: string;
  poweredByText: string;
  isWhiteLabel: boolean;
  isLoading: boolean;
}

const BrandingContext = createContext<BrandingContextValue>({
  partnerBranding: null,
  brandName: "Colts Tip Pay",
  poweredByText: "powered by Open Tip Pay",
  isWhiteLabel: true,
  isLoading: false,
});

export function BrandingProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    document.documentElement.style.removeProperty("--partner-primary");
  }, []);

  return (
    <BrandingContext.Provider
      value={{
        partnerBranding: null,
        brandName: "Colts Tip Pay",
        poweredByText: "powered by Open Tip Pay",
        isWhiteLabel: true,
        isLoading: false,
      }}
    >
      {children}
    </BrandingContext.Provider>
  );
}

export function useBranding(): BrandingContextValue {
  return useContext(BrandingContext);
}
