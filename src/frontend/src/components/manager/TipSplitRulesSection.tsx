import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Edit2, Plus, ShieldCheck, Trash2, Utensils } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  useGetTipSplitRoles,
  useRemoveTipSplitRole,
  useUpsertTipSplitRole,
} from "../../hooks/useQueries";

interface TipSplitRole {
  id: string;
  roleName: string;
  pointValue: number;
  isCustom: boolean;
}

const DEFAULT_ROLES: TipSplitRole[] = [
  { id: "role-1", roleName: "Head Bartender", pointValue: 3, isCustom: false },
  { id: "role-2", roleName: "Bartender", pointValue: 2, isCustom: false },
  { id: "role-3", roleName: "Barback", pointValue: 1, isCustom: false },
  {
    id: "role-4",
    roleName: "Concession Worker",
    pointValue: 1,
    isCustom: false,
  },
  { id: "role-5", roleName: "Suite Runner", pointValue: 2, isCustom: false },
];

const DEFAULT_CERTIFIED_STAFF = ["Marcus Thompson", "Jade Williams"];

export default function TipSplitRulesSection() {
  useGetTipSplitRoles(); // wire backend hook
  const upsertRole = useUpsertTipSplitRole();
  const removeRole = useRemoveTipSplitRole();

  const [roles, setRoles] = useState<TipSplitRole[]>(DEFAULT_ROLES);
  const [editTarget, setEditTarget] = useState<TipSplitRole | null>(null);
  const [editPoints, setEditPoints] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");
  const [newRolePoints, setNewRolePoints] = useState("");

  // Sales Category Split toggle
  const [salesCategoryEnabled, setSalesCategoryEnabled] = useState(() => {
    return localStorage.getItem("salesCategorySplitEnabled") === "true";
  });
  const [certifiedStaff, _setCertifiedStaff] = useState<string[]>(() => {
    const raw = localStorage.getItem("tipsCertifiedStaff");
    if (raw) {
      try {
        return JSON.parse(raw) as string[];
      } catch {
        /* fall through */
      }
    }
    return DEFAULT_CERTIFIED_STAFF;
  });

  useEffect(() => {
    localStorage.setItem(
      "salesCategorySplitEnabled",
      String(salesCategoryEnabled),
    );
  }, [salesCategoryEnabled]);

  const handleToggleSalesCategory = () => {
    setSalesCategoryEnabled((prev) => !prev);
  };

  const handleSaveEdit = async () => {
    if (!editTarget) return;
    const pts = Number.parseInt(editPoints, 10);
    if (Number.isNaN(pts) || pts < 1) {
      toast.error("Enter a valid point value (≥ 1)");
      return;
    }
    try {
      await upsertRole.mutateAsync({
        id: editTarget.id,
        roleName: editTarget.roleName,
        pointValue: pts,
        isCustom: editTarget.isCustom,
      });
      setRoles((prev) =>
        prev.map((r) =>
          r.id === editTarget.id ? { ...r, pointValue: pts } : r,
        ),
      );
      toast.success(`${editTarget.roleName} updated to ${pts} pts`);
    } catch {
      // demo mode — just update local state
      setRoles((prev) =>
        prev.map((r) =>
          r.id === editTarget.id ? { ...r, pointValue: pts } : r,
        ),
      );
      toast.success(`${editTarget.roleName} updated to ${pts} pts`);
    }
    setEditTarget(null);
    setEditPoints("");
  };

  const handleAddRole = async () => {
    if (!newRoleName.trim()) {
      toast.error("Enter a role name");
      return;
    }
    const pts = Number.parseInt(newRolePoints, 10);
    if (Number.isNaN(pts) || pts < 1) {
      toast.error("Enter a valid point value (≥ 1)");
      return;
    }
    const newRole: TipSplitRole = {
      id: `role-custom-${Date.now()}`,
      roleName: newRoleName.trim(),
      pointValue: pts,
      isCustom: true,
    };
    try {
      await upsertRole.mutateAsync(newRole);
    } catch {
      // demo mode — continue
    }
    setRoles((prev) => [...prev, newRole]);
    toast.success(`${newRoleName} added`);
    setShowAdd(false);
    setNewRoleName("");
    setNewRolePoints("");
  };

  const handleDelete = async (role: TipSplitRole) => {
    try {
      await removeRole.mutateAsync(role.id);
    } catch {
      // demo mode — continue
    }
    setRoles((prev) => prev.filter((r) => r.id !== role.id));
    toast.success(`${role.roleName} removed`);
  };

  return (
    <div className="space-y-4" data-ocid="tip-split-rules-section">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-foreground">
            Tip Split Rules
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Point values used for automated tip pool calculation
          </p>
        </div>
        <Button
          type="button"
          onClick={() => setShowAdd(true)}
          className="bg-teal/20 border border-teal/40 text-teal hover:bg-teal/30 text-xs h-8 px-3"
          data-ocid="add-tip-split-role-btn"
        >
          <Plus className="h-3 w-3 mr-1" /> Add Role
        </Button>
      </div>

      {/* Sales Category Split toggle */}
      <div
        className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 space-y-3"
        data-ocid="sales-category-split-toggle-row"
      >
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground">
              Sales Category Split
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Split alcohol and food tips separately by staff certification
            </p>
          </div>
          <button
            type="button"
            onClick={handleToggleSalesCategory}
            aria-checked={salesCategoryEnabled}
            role="switch"
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 transition-colors duration-200 ${
              salesCategoryEnabled
                ? "bg-teal border-teal"
                : "bg-muted/50 border-border"
            }`}
            data-ocid="sales-category-split-toggle"
          >
            <span
              className={`pointer-events-none inline-block h-4 w-4 translate-y-0.5 rounded-full bg-white shadow-lg transition-transform duration-200 ${
                salesCategoryEnabled ? "translate-x-5" : "translate-x-0.5"
              }`}
            />
          </button>
        </div>

        {/* Sub-sections shown when toggle is ON */}
        {salesCategoryEnabled && (
          <div className="space-y-3 pt-2 border-t border-border/50">
            {/* Alcohol Tips Rules */}
            <div className="rounded-lg bg-amber-500/5 border border-amber-400/20 p-3 space-y-2">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-amber-400 shrink-0" />
                <p className="text-xs font-bold text-amber-400">
                  Alcohol Tips Rules
                </p>
                <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal/15 text-teal border border-teal/30">
                  TIPS Certified Staff Only
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Only staff marked as TIPS Certified will receive a share of
                alcohol tips.
              </p>
              <div className="space-y-1">
                {certifiedStaff.map((name) => (
                  <div key={name} className="flex items-center gap-2">
                    <ShieldCheck className="h-3 w-3 text-teal shrink-0" />
                    <span className="text-xs text-foreground">{name}</span>
                    <span className="text-[10px] text-teal/70 ml-auto">
                      TIPS Certified
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Food Tips Rules */}
            <div className="rounded-lg bg-teal/5 border border-teal/20 p-3 space-y-2">
              <div className="flex items-center gap-2">
                <Utensils className="h-4 w-4 text-teal shrink-0" />
                <p className="text-xs font-bold text-teal">Food Tips Rules</p>
              </div>
              <p className="text-[11px] text-muted-foreground">
                All food and concession staff share food tips equally by role
                weight.
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-2">
        {roles.map((role, i) => (
          <div
            key={role.id}
            className="bg-gray-800/50 border border-gray-700 rounded-xl p-3 flex items-center gap-3"
            data-ocid={`tip-split-role.${i + 1}`}
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">
                {role.roleName}
              </p>
              {!role.isCustom && (
                <span className="text-[10px] text-teal/60">Default role</span>
              )}
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-teal font-bold text-base">
                {role.pointValue}
              </span>
              <span className="text-xs text-muted-foreground">pts</span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setEditTarget(role);
                  setEditPoints(String(role.pointValue));
                }}
                className="h-7 w-7 rounded-lg bg-muted/30 border border-border flex items-center justify-center hover:bg-muted/50 transition-all"
                aria-label="Edit role points"
                data-ocid={`tip-split-role-edit.${i + 1}`}
              >
                <Edit2 className="h-3 w-3 text-muted-foreground" />
              </button>
              {role.isCustom && (
                <button
                  type="button"
                  onClick={() => handleDelete(role)}
                  className="h-7 w-7 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center hover:bg-red-500/20 transition-all"
                  aria-label="Delete role"
                  data-ocid={`tip-split-role-delete.${i + 1}`}
                >
                  <Trash2 className="h-3 w-3 text-red-400" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Edit points modal */}
      <Dialog
        open={!!editTarget}
        onOpenChange={(open) => {
          if (!open) {
            setEditTarget(null);
            setEditPoints("");
          }
        }}
      >
        <DialogContent className="bg-card/95 backdrop-blur-xl border-teal/20 max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Edit2 className="h-4 w-4 text-teal" /> Edit Point Value
            </DialogTitle>
          </DialogHeader>
          {editTarget && (
            <div className="space-y-4 py-2">
              <div className="bg-muted/20 rounded-lg p-3">
                <p className="text-sm font-semibold text-foreground">
                  {editTarget.roleName}
                </p>
                <p className="text-xs text-muted-foreground">
                  Current: {editTarget.pointValue} points
                </p>
              </div>
              <div>
                <label
                  htmlFor="edit-role-points-input"
                  className="text-xs font-semibold text-muted-foreground mb-1.5 block"
                >
                  New Point Value
                </label>
                <Input
                  id="edit-role-points-input"
                  type="number"
                  min="1"
                  step="1"
                  placeholder="e.g. 3"
                  value={editPoints}
                  onChange={(e) => setEditPoints(e.target.value)}
                  className="bg-muted/30 border-border text-foreground"
                  data-ocid="edit-role-points-input"
                />
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setEditTarget(null);
                setEditPoints("");
              }}
              className="border-border text-muted-foreground"
              data-ocid="edit-role-cancel"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSaveEdit}
              className="bg-teal/20 border border-teal/40 text-teal hover:bg-teal/30"
              data-ocid="edit-role-save"
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add custom role modal */}
      <Dialog
        open={showAdd}
        onOpenChange={(open) => {
          if (!open) {
            setShowAdd(false);
            setNewRoleName("");
            setNewRolePoints("");
          }
        }}
      >
        <DialogContent className="bg-card/95 backdrop-blur-xl border-teal/20 max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Plus className="h-4 w-4 text-teal" /> Add Custom Role
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label
                htmlFor="new-role-name-input"
                className="text-xs font-semibold text-muted-foreground mb-1.5 block"
              >
                Role Name
              </label>
              <Input
                id="new-role-name-input"
                placeholder="e.g. Field Level Runner"
                value={newRoleName}
                onChange={(e) => setNewRoleName(e.target.value)}
                className="bg-muted/30 border-border text-foreground"
                data-ocid="new-role-name-input"
              />
            </div>
            <div>
              <label
                htmlFor="new-role-points-input"
                className="text-xs font-semibold text-muted-foreground mb-1.5 block"
              >
                Point Value
              </label>
              <Input
                id="new-role-points-input"
                type="number"
                min="1"
                step="1"
                placeholder="e.g. 2"
                value={newRolePoints}
                onChange={(e) => setNewRolePoints(e.target.value)}
                className="bg-muted/30 border-border text-foreground"
                data-ocid="new-role-points-input"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowAdd(false);
                setNewRoleName("");
                setNewRolePoints("");
              }}
              className="border-border text-muted-foreground"
              data-ocid="add-role-cancel"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleAddRole}
              className="bg-teal/20 border border-teal/40 text-teal hover:bg-teal/30"
              data-ocid="add-role-save"
            >
              Add Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
