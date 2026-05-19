import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertCircle,
  CheckCircle,
  Clock,
  DollarSign,
  Sparkles,
  Wallet,
} from "lucide-react";
import { useState } from "react";
import { Variant_fiat_crypto } from "../backend";
import { useGetDisputes } from "../hooks/useQueries";
import type { Dispute, DisputeStatus } from "../hooks/useQueries";

export default function DisputeResolutionCenter() {
  const { data: disputes, isLoading } = useGetDisputes();
  const [selectedTab, setSelectedTab] = useState<"open" | "resolved" | "ai">(
    "open",
  );

  const openDisputes =
    disputes?.filter(
      (d) => d.status === "Open" || d.status === "Under Review",
    ) || [];
  const resolvedDisputes =
    disputes?.filter((d) => d.status === "Resolved") || [];
  const aiRecommendations = disputes?.filter((d) => d.aiRecommendation) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <img
          src="/assets/generated/dispute-resolution-icon-transparent.dim_32x32.png"
          alt="Dispute Resolution"
          className="h-8 w-8"
        />
        <div>
          <h2 className="text-2xl font-bold text-white">
            Dispute Resolution Center
          </h2>
          <p className="text-sm text-white/60">
            Manage and resolve transaction disputes with AI assistance
          </p>
        </div>
      </div>

      <Card className="border-white/10 bg-white/5 backdrop-blur-sm">
        <CardContent className="p-6">
          <Tabs
            value={selectedTab}
            onValueChange={(v) => setSelectedTab(v as any)}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-3 bg-navy-dark/50">
              <TabsTrigger value="open" className="data-[state=active]:bg-teal">
                <Clock className="mr-2 h-4 w-4" />
                Open ({openDisputes.length})
              </TabsTrigger>
              <TabsTrigger
                value="resolved"
                className="data-[state=active]:bg-teal"
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Resolved ({resolvedDisputes.length})
              </TabsTrigger>
              <TabsTrigger value="ai" className="data-[state=active]:bg-teal">
                <Sparkles className="mr-2 h-4 w-4" />
                AI Recommendations ({aiRecommendations.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="open" className="mt-6">
              <ScrollArea className="h-[500px] pr-4">
                {isLoading ? (
                  <DisputeSkeleton />
                ) : openDisputes.length > 0 ? (
                  <div className="space-y-4">
                    {openDisputes.map((dispute) => (
                      <DisputeCard key={dispute.id} dispute={dispute} />
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    icon={<CheckCircle className="h-12 w-12 text-teal/50" />}
                    message="No open disputes"
                    description="All your transactions are clear!"
                  />
                )}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="resolved" className="mt-6">
              <ScrollArea className="h-[500px] pr-4">
                {isLoading ? (
                  <DisputeSkeleton />
                ) : resolvedDisputes.length > 0 ? (
                  <div className="space-y-4">
                    {resolvedDisputes.map((dispute) => (
                      <DisputeCard key={dispute.id} dispute={dispute} />
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    icon={<CheckCircle className="h-12 w-12 text-teal/50" />}
                    message="No resolved disputes"
                    description="You haven't resolved any disputes yet."
                  />
                )}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="ai" className="mt-6">
              <ScrollArea className="h-[500px] pr-4">
                {isLoading ? (
                  <DisputeSkeleton />
                ) : aiRecommendations.length > 0 ? (
                  <div className="space-y-4">
                    {aiRecommendations.map((dispute) => (
                      <DisputeCard key={dispute.id} dispute={dispute} showAI />
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    icon={<Sparkles className="h-12 w-12 text-teal/50" />}
                    message="No AI recommendations"
                    description="AI recommendations will appear here when disputes are submitted."
                  />
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

interface DisputeCardProps {
  dispute: Dispute;
  showAI?: boolean;
}

function DisputeCard({ dispute, showAI = false }: DisputeCardProps) {
  const amount = Number(dispute.amount) / 100;
  const date = new Date(Number(dispute.timestamp) / 1000000);
  const isCrypto = dispute.currencyType === Variant_fiat_crypto.crypto;

  const getStatusColor = (status: DisputeStatus) => {
    switch (status) {
      case "Open":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "Under Review":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "Resolved":
        return "bg-teal/20 text-teal border-teal/30";
      default:
        return "bg-white/10 text-white/70 border-white/20";
    }
  };

  return (
    <div className="glassmorphism rounded-lg p-4 space-y-3 border border-white/10">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/20">
            <AlertCircle className="h-5 w-5 text-red-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-white">
                {dispute.reason}
              </p>
              {isCrypto ? (
                <Wallet className="h-3.5 w-3.5 text-teal" />
              ) : (
                <DollarSign className="h-3.5 w-3.5 text-white/60" />
              )}
            </div>
            <p className="text-xs text-white/60">
              Transaction: ${amount.toFixed(2)} • {date.toLocaleDateString()}
            </p>
          </div>
        </div>
        <Badge className={`${getStatusColor(dispute.status)} border`}>
          {dispute.status}
        </Badge>
      </div>

      <p className="text-sm text-white/80">{dispute.description}</p>

      {showAI && dispute.aiRecommendation && (
        <div className="mt-3 rounded-lg bg-teal/10 border border-teal/30 p-3">
          <div className="flex items-start gap-2">
            <img
              src="/assets/generated/ai-dispute-assistant-icon-transparent.dim_24x24.png"
              alt="AI Assistant"
              className="h-5 w-5 mt-0.5"
            />
            <div className="flex-1">
              <p className="text-xs font-semibold text-teal mb-1">
                AI Recommendation
              </p>
              <p className="text-xs text-white/80">
                {dispute.aiRecommendation}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-2 pt-2">
        <Button
          size="sm"
          variant="outline"
          className="flex-1 border-teal/30 text-teal hover:bg-teal/10"
        >
          View Details
        </Button>
        {dispute.status !== "Resolved" && (
          <Button size="sm" className="flex-1 bg-teal hover:bg-teal/80">
            Take Action
          </Button>
        )}
      </div>
    </div>
  );
}

function DisputeSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="glassmorphism rounded-lg p-4 space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-48" />
              </div>
            </div>
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
          <Skeleton className="h-12 w-full" />
        </div>
      ))}
    </div>
  );
}

interface EmptyStateProps {
  icon: React.ReactNode;
  message: string;
  description: string;
}

function EmptyState({ icon, message, description }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      {icon}
      <h3 className="mt-4 text-lg font-semibold text-white">{message}</h3>
      <p className="mt-2 text-sm text-white/60">{description}</p>
    </div>
  );
}
