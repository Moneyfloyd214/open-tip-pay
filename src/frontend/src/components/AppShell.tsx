import { type ReactNode } from "react";
import { useAuth } from "@/context/AuthContext";
import { Hop as Home, Wallet, Activity, Star, User, ArrowLeft, LogOut, DollarSign } from "lucide-react";

const NAV_ITEMS = [
  { label: "Home",     icon: Home,     href: "/dashboard"    },
  { label: "Wallet",   icon: Wallet,   href: "/wallet/send"  },
  { label: "Activity", icon: Activity, href: "/transactions" },
  { label: "Rewards",  icon: Star,     href: "/rewards"      },
  { label: "Profile",  icon: User,     href: "/profile"      },
];

interface AppShellProps {
  children: ReactNode;
  title?: string;
  showBack?: boolean;
  actions?: ReactNode;
}

export default function AppShell({ children, title, showBack = false, actions }: AppShellProps) {
  const { signOut } = useAuth();
  const path = window.location.pathname;

  return (
    <div className="min-h-screen bg-background">
      {/* Ambient glows */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden -z-10">
        <div className="absolute left-1/4 top-[-10%] h-[500px] w-[500px] rounded-full bg-teal/[0.07] blur-[100px]" />
        <div className="absolute bottom-0 right-1/4 h-[400px] w-[400px] rounded-full bg-teal/[0.04] blur-[100px]" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-border/40 bg-background/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            {showBack ? (
              <button
                onClick={() => window.history.back()}
                className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-white/5 text-muted-foreground hover:text-foreground transition-smooth"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
            ) : (
              <div
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal glow-teal cursor-pointer"
                onClick={() => { window.location.href = "/dashboard"; }}
              >
                <DollarSign className="h-4 w-4 text-white" />
              </div>
            )}
            <span className="text-base font-bold text-foreground">
              {title || "Open Tip Pay"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {actions}
            <button
              onClick={signOut}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-white/5 hover:text-foreground transition-smooth"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Scrollable content */}
      <main className="mx-auto max-w-2xl px-4 pt-6 pb-28">
        {children}
      </main>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 inset-x-0 z-40 border-t border-border/40 bg-background/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-2xl">
          {NAV_ITEMS.map(({ label, icon: Icon, href }) => {
            const active = path === href || (href === "/dashboard" && path === "/");
            return (
              <button
                key={href}
                onClick={() => { window.location.href = href; }}
                className={`flex flex-1 flex-col items-center gap-0.5 py-3 text-[11px] font-semibold transition-smooth ${
                  active ? "text-teal" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="h-5 w-5" />
                {label}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
