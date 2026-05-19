import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  useIsStripeConfigured,
  useSetStripeConfiguration,
} from "../hooks/useQueries";

export default function StripeSetupDialog() {
  const { data: isConfigured, isLoading } = useIsStripeConfigured();
  const setConfig = useSetStripeConfiguration();

  const [open, setOpen] = useState(false);
  const [secretKey, setSecretKey] = useState("");
  const [countries, setCountries] = useState("US,CA,GB");

  useEffect(() => {
    if (!isLoading && isConfigured === false) {
      setOpen(true);
    }
  }, [isConfigured, isLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!secretKey.trim()) {
      toast.error("Please enter your Stripe secret key");
      return;
    }

    try {
      const countryList = countries
        .split(",")
        .map((c) => c.trim().toUpperCase())
        .filter((c) => c.length === 2);

      await setConfig.mutateAsync({
        secretKey: secretKey.trim(),
        allowedCountries: countryList,
      });

      toast.success("Stripe configured successfully!");
      setOpen(false);
    } catch (error: any) {
      console.error("Stripe setup error:", error);
      toast.error(error.message || "Failed to configure Stripe");
    }
  };

  if (isLoading || isConfigured) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Configure Stripe Payments</DialogTitle>
          <DialogDescription>
            Enter your Stripe credentials to enable payment processing.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="secretKey">Stripe Secret Key *</Label>
            <Input
              id="secretKey"
              type="password"
              placeholder="sk_test_..."
              value={secretKey}
              onChange={(e) => setSecretKey(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="countries">
              Allowed Countries (comma-separated)
            </Label>
            <Input
              id="countries"
              type="text"
              placeholder="US,CA,GB"
              value={countries}
              onChange={(e) => setCountries(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Use 2-letter country codes (e.g., US, CA, GB)
            </p>
          </div>

          <Button
            type="submit"
            disabled={setConfig.isPending}
            className="w-full bg-teal hover:bg-teal-dark"
          >
            {setConfig.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Configuring...
              </>
            ) : (
              "Configure Stripe"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
