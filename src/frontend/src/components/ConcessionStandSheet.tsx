import { X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import QRCodeGenerator from "./QRCodeGenerator";

interface ConcessionStandSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

interface StaffMember {
  id: string;
  name: string;
  role: string;
  section: string;
}

const CONCESSION_STAFF: StaffMember[] = [
  {
    id: "staff-1",
    name: "Marcus Williams",
    role: "Suite Runner",
    section: "VIP Suites",
  },
  {
    id: "staff-2",
    name: "DeShawn Carter",
    role: "Valet",
    section: "Main Entrance",
  },
  {
    id: "staff-3",
    name: "Tyler Brooks",
    role: "Concession Staff",
    section: "Section 103",
  },
  {
    id: "staff-4",
    name: "Angela Martinez",
    role: "Usher",
    section: "Lower Bowl",
  },
  { id: "staff-5", name: "Jordan Reed", role: "Security", section: "Gate B" },
  {
    id: "staff-6",
    name: "Keisha Thompson",
    role: "Event Coordinator",
    section: "Field Level",
  },
];

function getRoleBadgeStyle(role: string): string {
  switch (role) {
    case "Suite Runner":
      return "bg-purple-500/20 text-purple-300 border-purple-500/30";
    case "Valet":
      return "bg-yellow-500/20 text-yellow-300 border-yellow-500/30";
    case "Concession Staff":
      return "bg-teal-500/20 text-teal-300 border-teal-500/30";
    case "Usher":
      return "bg-blue-500/20 text-blue-300 border-blue-500/30";
    case "Security":
      return "bg-red-500/20 text-red-300 border-red-500/30";
    case "Event Coordinator":
      return "bg-green-500/20 text-green-300 border-green-500/30";
    default:
      return "bg-gray-500/20 text-gray-300 border-gray-500/30";
  }
}

export default function ConcessionStandSheet({
  isOpen,
  onClose,
}: ConcessionStandSheetProps) {
  const [activeTab, setActiveTab] = useState<"pool" | "individual">("pool");
  const [poolTotal, setPoolTotal] = useState<number>(245.0);
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);
  const [staffTips, setStaffTips] = useState<Record<string, number>>({});

  if (!isOpen) return null;

  const selectedStaff =
    CONCESSION_STAFF.find((s) => s.id === selectedStaffId) ?? null;

  const handleSimulatePoolTip = () => {
    setPoolTotal((prev) => prev + 5);
    toast.success("Fan tip of $5.00 added to the crew pool!");
  };

  const handleSimulateStaffTip = () => {
    if (!selectedStaff) return;
    setStaffTips((prev) => ({
      ...prev,
      [selectedStaff.id]: (prev[selectedStaff.id] ?? 0) + 5,
    }));
    toast.success(`Fan tip of $5.00 sent to ${selectedStaff.name}!`);
  };

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className="absolute bottom-0 left-0 right-0 rounded-t-3xl bg-[#0a0f1e]/95 backdrop-blur-xl border-t border-white/10 max-h-[90vh] overflow-y-auto"
        data-ocid="concession_stand.sheet"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-white/10">
          <div>
            <h2 className="text-base font-bold bg-gradient-to-r from-teal-400 to-white bg-clip-text text-transparent">
              Colts Tip Pay
            </h2>
            <p className="text-xs text-white/60 mt-0.5">
              Concession Stand Tipping
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close tipping sheet"
            data-ocid="concession_stand.close_button"
            className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/20 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tab pills */}
        <div className="flex gap-2 px-5 pt-4 pb-2">
          <button
            type="button"
            data-ocid="concession_stand.tab.pool"
            onClick={() => setActiveTab("pool")}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-all duration-200 ${
              activeTab === "pool"
                ? "bg-teal-500 text-white shadow-lg shadow-teal-500/30"
                : "bg-white/5 text-gray-400 hover:bg-white/10"
            }`}
          >
            Tip the Crew
          </button>
          <button
            type="button"
            data-ocid="concession_stand.tab.individual"
            onClick={() => setActiveTab("individual")}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-all duration-200 ${
              activeTab === "individual"
                ? "bg-teal-500 text-white shadow-lg shadow-teal-500/30"
                : "bg-white/5 text-gray-400 hover:bg-white/10"
            }`}
          >
            Tip a Staff Member
          </button>
        </div>

        {/* Tab content */}
        <div className="px-5 pb-8 pt-4">
          {activeTab === "pool" ? (
            <div
              className="flex flex-col items-center gap-5"
              data-ocid="concession_stand.pool_tab"
            >
              <p className="text-white font-semibold text-base">
                Scan to Tip the Crew
              </p>

              <div className="rounded-2xl bg-white p-3 shadow-xl shadow-teal-500/20">
                <QRCodeGenerator
                  value="colts-tip-pay://pool/stand-1"
                  size={200}
                />
              </div>

              <p className="text-xs text-gray-400 text-center max-w-xs leading-relaxed">
                This QR code sits on the counter. Fans scan it to tip the entire
                crew. The manager splits the pool in the Manager Portal at end
                of shift.
              </p>

              <div
                className="rounded-2xl bg-teal-500/10 border border-teal-500/30 px-6 py-4 text-center"
                data-ocid="concession_stand.pool_total"
              >
                <p className="text-xs text-teal-400/80 uppercase tracking-wider font-semibold mb-1">
                  Pool Total
                </p>
                <p className="text-3xl font-bold text-teal-300">
                  ${poolTotal.toFixed(2)}
                </p>
              </div>

              <button
                type="button"
                data-ocid="concession_stand.simulate_pool_tip_button"
                onClick={handleSimulatePoolTip}
                className="w-full max-w-xs rounded-xl bg-teal-500 hover:bg-teal-400 text-white font-semibold py-3 px-6 transition-colors shadow-lg shadow-teal-500/30"
              >
                Simulate Fan Tip (+$5)
              </button>
            </div>
          ) : (
            <div data-ocid="concession_stand.individual_tab">
              <p className="text-white font-semibold text-base mb-4">
                Select a Staff Member to Tip
              </p>

              <div
                className="grid grid-cols-2 gap-3"
                data-ocid="concession_stand.staff.list"
              >
                {CONCESSION_STAFF.map((staff, i) => (
                  <button
                    key={staff.id}
                    type="button"
                    data-ocid={`concession_stand.staff.item.${i + 1}`}
                    onClick={() => setSelectedStaffId(staff.id)}
                    className={`rounded-xl border p-3 text-left cursor-pointer transition-all duration-200 bg-white/5 hover:bg-white/10 ${
                      selectedStaffId === staff.id
                        ? "border-teal-400 ring-1 ring-teal-400"
                        : "border-white/10"
                    }`}
                  >
                    <p className="text-white text-sm font-bold leading-snug">
                      {staff.name}
                    </p>
                    <span
                      className={`inline-block mt-1.5 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${getRoleBadgeStyle(
                        staff.role,
                      )}`}
                    >
                      {staff.role}
                    </span>
                    <p className="text-[11px] text-gray-400 mt-1.5">
                      {staff.section}
                    </p>
                  </button>
                ))}
              </div>

              {selectedStaff && (
                <div
                  className="mt-5 rounded-2xl border border-teal-500/30 bg-teal-500/5 p-5 flex flex-col items-center gap-4"
                  data-ocid="concession_stand.staff_qr_panel"
                >
                  <div className="text-center">
                    <p className="text-white font-bold">{selectedStaff.name}</p>
                    <span
                      className={`inline-block mt-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${getRoleBadgeStyle(
                        selectedStaff.role,
                      )}`}
                    >
                      {selectedStaff.role}
                    </span>
                  </div>

                  <p className="text-xs text-white font-semibold">
                    Personal QR Code
                  </p>

                  <div className="rounded-xl bg-white p-2.5 shadow-lg shadow-teal-500/20">
                    <QRCodeGenerator
                      value={`colts-tip-pay://staff/${selectedStaff.id}`}
                      size={150}
                    />
                  </div>

                  <div
                    className="rounded-xl bg-white/5 border border-white/10 px-5 py-3 text-center w-full"
                    data-ocid="concession_stand.staff_tips_today"
                  >
                    <p className="text-xs text-gray-400 mb-0.5">Tips today</p>
                    <p className="text-2xl font-bold text-teal-300">
                      ${(staffTips[selectedStaff.id] ?? 0).toFixed(2)}
                    </p>
                  </div>

                  <button
                    type="button"
                    data-ocid="concession_stand.simulate_staff_tip_button"
                    onClick={handleSimulateStaffTip}
                    className="w-full rounded-xl bg-teal-500 hover:bg-teal-400 text-white font-semibold py-3 px-6 transition-colors shadow-lg shadow-teal-500/30"
                  >
                    Simulate Fan Tip (+$5)
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
