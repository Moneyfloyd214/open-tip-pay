import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { CreditCard, CircleCheck as CheckCircle, CircleAlert as AlertCircle, Loader as Loader2, Wifi } from "lucide-react";

interface Stand {
  id: string;
  name: string;
  location: string;
  pos_type: string;
  is_active: boolean;
}

const POS_LABELS: Record<string, { label: string; color: string }> = {
  square:  { label: "Square",  color: "text-blue-400" },
  clover:  { label: "Clover",  color: "text-green-400" },
  toast:   { label: "Toast",   color: "text-orange-400" },
  manual:  { label: "Manual",  color: "text-yellow-400" },
  other:   { label: "Other",   color: "text-muted-foreground" },
};

export default function POSStatusWidget() {
  const [stands, setStands] = useState<Stand[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("stands")
      .select("id, name, location, pos_type, is_active")
      .order("name")
      .then(({ data }) => {
        if (data) setStands(data);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-teal" />
      </div>
    );
  }

  return (
    <div className="glassmorphism rounded-2xl p-5">
      <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
        <CreditCard className="h-4 w-4 text-teal" /> POS Integration Status
      </h3>
      {stands.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border py-8 text-center">
          <Wifi className="mx-auto mb-2 h-6 w-6 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">No stands configured yet.</p>
          <p className="text-xs text-muted-foreground/60 mt-1">Stands appear here once added by a manager.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {stands.map((s) => {
            const pos = POS_LABELS[s.pos_type] ?? POS_LABELS.other;
            return (
              <div key={s.id} className="flex items-center justify-between rounded-xl bg-black/20 px-4 py-3">
                <div className="flex items-center gap-3">
                  {s.is_active
                    ? <CheckCircle className="h-4 w-4 text-teal flex-shrink-0" />
                    : <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0" />
                  }
                  <div>
                    <p className="text-sm font-medium text-foreground">{s.name}</p>
                    <p className="text-xs text-muted-foreground">{s.location}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-semibold ${pos.color}`}>{pos.label}</span>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                    s.is_active ? "bg-teal/20 text-teal" : "bg-destructive/20 text-destructive"
                  }`}>
                    {s.is_active ? "Online" : "Offline"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
