import { Printer } from "lucide-react";
import { useState } from "react";
import QRCodeGenerator from "./QRCodeGenerator";

const DEMO_STANDS = [
  {
    id: "lucas-oil-grill",
    name: "Lucas Oil Grill",
    description: "Main concourse, Gate A",
  },
  {
    id: "end-zone-bites",
    name: "End Zone Bites",
    description: "North end zone, Level 1",
  },
  {
    id: "colts-fan-eats",
    name: "Colts Fan Eats",
    description: "South concourse, Level 2",
  },
];

const DEMO_STAFF = [
  {
    id: "marcus-davis",
    name: "Marcus Davis",
    role: "Suite Runner",
    section: "VIP Suite",
  },
  {
    id: "priya-patel",
    name: "Priya Patel",
    role: "Concession Staff",
    section: "Club Level",
  },
  {
    id: "tyrone-jackson",
    name: "Tyrone Jackson",
    role: "Valet",
    section: "Field Level",
  },
  {
    id: "sara-nguyen",
    name: "Sara Nguyen",
    role: "Usher",
    section: "Upper Deck",
  },
  {
    id: "derek-williams",
    name: "Derek Williams",
    role: "Food Runner",
    section: "End Zone",
  },
  {
    id: "keisha-thompson",
    name: "Keisha Thompson",
    role: "Merchandise Staff",
    section: "Main Concourse",
  },
];

function getRoleColor(role: string): string {
  switch (role) {
    case "Suite Runner":
      return "bg-purple-500/20 text-purple-300 border-purple-500/30";
    case "Valet":
      return "bg-yellow-500/20 text-yellow-300 border-yellow-500/30";
    case "Concession Staff":
      return "bg-teal/20 text-teal border-teal/30";
    case "Usher":
      return "bg-blue-500/20 text-blue-300 border-blue-500/30";
    case "Food Runner":
      return "bg-orange-500/20 text-orange-300 border-orange-500/30";
    case "Merchandise Staff":
      return "bg-pink-500/20 text-pink-300 border-pink-500/30";
    default:
      return "bg-muted/30 text-muted-foreground border-border";
  }
}

export default function BadgeGenerator() {
  const [activeSubTab, setActiveSubTab] = useState<"staff" | "stands">("staff");

  const origin =
    typeof window !== "undefined"
      ? window.location.origin
      : "https://open-tip-pay-gn6.caffeine.xyz";

  const activeStandIds = (() => {
    try {
      const raw = localStorage.getItem("demo_active_stands");
      return raw ? new Set(JSON.parse(raw) as string[]) : null;
    } catch {
      return null;
    }
  })();

  const visibleStands = activeStandIds
    ? DEMO_STANDS.filter((s) => activeStandIds.has(s.id))
    : DEMO_STANDS;

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      {/* Print styles injected inline */}
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #badge-print-root,
          #badge-print-root * { visibility: visible !important; }
          #badge-print-root {
            position: absolute;
            inset: 0;
            padding: 16px;
            background: #fff;
          }
          .no-print { display: none !important; }
          .badge-grid {
            display: grid !important;
            grid-template-columns: repeat(3, 1fr) !important;
            gap: 12px !important;
          }
          .badge-card {
            break-inside: avoid;
            border: 1.5px solid #00C6AD !important;
            border-radius: 10px !important;
            background: #fff !important;
            color: #111 !important;
            padding: 10px !important;
          }
          .badge-card .badge-name { color: #111 !important; font-weight: 700; font-size: 13px; }
          .badge-card .badge-role { color: #006450 !important; font-size: 10px; }
          .badge-card .badge-section { color: #444 !important; font-size: 10px; }
          .badge-card canvas { width: 90px !important; height: 90px !important; }
          .stand-card {
            break-inside: avoid;
            border: 1.5px solid #00C6AD !important;
            border-radius: 10px !important;
            background: #fff !important;
            color: #111 !important;
            padding: 14px !important;
          }
          .stand-card canvas { width: 100px !important; height: 100px !important; }
          .print-section-label { font-size: 11px !important; color: #555 !important; margin-bottom: 8px; page-break-before: auto; }
          .badge-subtab-bar { display: none !important; }
        }
      `}</style>

      <div id="badge-print-root">
        {/* Actions bar — hidden on print */}
        <div className="no-print flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-bold text-foreground">
              Badge Generator
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Print QR codes for stands and staff badges
            </p>
          </div>
          <button
            type="button"
            data-ocid="badge-generator.print_button"
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal/20 hover:bg-teal/30 border border-teal/40 text-teal text-sm font-semibold transition-all duration-200 shadow-lg shadow-teal/10"
          >
            <Printer className="h-4 w-4" />
            Print All Badges
          </button>
        </div>

        {/* Sub-tab bar */}
        <div className="badge-subtab-bar no-print flex gap-1 mb-6 bg-muted/20 border border-border rounded-xl p-1">
          <button
            type="button"
            data-ocid="badge-generator.staff_tab"
            onClick={() => setActiveSubTab("staff")}
            className={`flex-1 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
              activeSubTab === "staff"
                ? "bg-teal/20 text-teal border border-teal/40 shadow-sm shadow-teal/10"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/30 border border-transparent"
            }`}
          >
            Badge Generator - Staff
          </button>
          <button
            type="button"
            data-ocid="badge-generator.stands_tab"
            onClick={() => setActiveSubTab("stands")}
            className={`flex-1 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
              activeSubTab === "stands"
                ? "bg-teal/20 text-teal border border-teal/40 shadow-sm shadow-teal/10"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/30 border border-transparent"
            }`}
          >
            Badge Generator - Stands
          </button>
        </div>

        {/* ── Staff Badges ───────────────────────────────────────────────── */}
        {activeSubTab === "staff" && (
          <section>
            <p className="print-section-label text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
              Staff Badges
            </p>
            <div className="badge-grid grid grid-cols-2 sm:grid-cols-3 gap-4">
              {DEMO_STAFF.map((staff, i) => (
                <div
                  key={staff.id}
                  data-ocid={`badge-generator.staff.item.${i + 1}`}
                  className="badge-card glassmorphism rounded-2xl border border-teal/20 hover:border-teal/40 p-4 flex flex-col items-center gap-2.5 text-center transition-all duration-200 shadow-md"
                >
                  {/* Logo strip */}
                  <div className="w-full rounded-md bg-teal/10 border border-teal/20 py-1 flex items-center justify-center">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-teal">
                      COLTS TIP PAY
                    </span>
                  </div>

                  {/* Avatar */}
                  <div className="h-11 w-11 rounded-full bg-teal/15 border-2 border-teal/30 flex items-center justify-center shadow-inner">
                    <span className="text-teal font-bold text-base">
                      {staff.name.charAt(0)}
                    </span>
                  </div>

                  {/* Name + role */}
                  <div>
                    <p className="badge-name font-bold text-foreground text-sm leading-tight">
                      {staff.name}
                    </p>
                    <span
                      className={`mt-1 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${getRoleColor(
                        staff.role,
                      )}`}
                    >
                      {staff.role}
                    </span>
                    <p className="badge-section text-[10px] text-muted-foreground mt-1">
                      {staff.section}
                    </p>
                  </div>

                  {/* QR code */}
                  <div className="rounded-lg bg-white p-1.5 shadow-sm">
                    <QRCodeGenerator
                      value={`${origin}/tip/${staff.id}`}
                      size={90}
                    />
                  </div>

                  <p className="text-[10px] text-muted-foreground/60 leading-relaxed">
                    Scan to send a tip
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Stand QR Codes ─────────────────────────────────────────────── */}
        {activeSubTab === "stands" && (
          <section>
            <p className="print-section-label text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
              Stand QR Codes
            </p>
            <div className="badge-grid grid grid-cols-1 sm:grid-cols-3 gap-4">
              {visibleStands.map((stand, i) => (
                <div
                  key={stand.id}
                  data-ocid={`badge-generator.stand.item.${i + 1}`}
                  className="stand-card glassmorphism rounded-2xl border border-teal/25 p-5 flex flex-col items-center gap-3 text-center shadow-lg"
                >
                  {/* Stand branding strip */}
                  <div className="w-full rounded-lg bg-teal/10 border border-teal/20 px-3 py-1.5 flex items-center justify-center gap-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-teal">
                      COLTS TIP PAY
                    </span>
                  </div>

                  <div className="rounded-xl bg-white p-2 shadow-md">
                    <QRCodeGenerator
                      value={`${origin}/tip-pool/${stand.id}`}
                      size={120}
                    />
                  </div>

                  <div>
                    <p className="badge-name font-bold text-foreground text-sm leading-snug">
                      {stand.name}
                    </p>
                    <p className="badge-section text-[11px] text-muted-foreground mt-0.5">
                      {stand.description}
                    </p>
                    <p className="text-[10px] text-muted-foreground/60 mt-1">
                      Scan to tip the crew
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}
