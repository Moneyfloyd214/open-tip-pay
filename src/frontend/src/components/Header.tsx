import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, Settings, User } from "lucide-react";
import type { UserProfile } from "../backend";

interface HeaderProps {
  userProfile: UserProfile | null | undefined;
  onSettingsClick: () => void;
  onLogout: () => void;
}

export default function Header({
  userProfile,
  onSettingsClick,
  onLogout,
}: HeaderProps) {
  const photoUrl = userProfile?.photo?.getDirectURL();

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-navy/90 backdrop-blur-xl shadow-lg shadow-black/20">
      <div className="container mx-auto flex items-center justify-between px-4 py-3 max-w-4xl">
        {/* Logo + wordmark */}
        <div className="flex items-center gap-2.5">
          <img
            src="/assets/generated/opentip-logo.dim_200x200.png"
            alt="Open Tip Pay"
            className="h-9 w-9 rounded-xl shadow-md ring-1 ring-teal/30"
          />
          <div className="flex flex-col leading-tight">
            <span className="text-base font-bold tracking-tight text-white">
              Open Tip Pay
            </span>
            <span className="text-[10px] font-medium tracking-widest uppercase text-teal/70 hidden sm:block">
              P2P Payments
            </span>
          </div>
        </div>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="h-10 w-10 rounded-full p-0 ring-offset-navy hover:ring-2 hover:ring-teal/40 focus-visible:ring-2 focus-visible:ring-teal/40 transition-all duration-200"
              aria-label="User menu"
              data-ocid="header.user_menu_button"
            >
              <Avatar className="h-10 w-10 border-2 border-teal/50 shadow-md">
                {photoUrl ? (
                  <AvatarImage src={photoUrl} alt={userProfile?.username} />
                ) : (
                  <AvatarFallback className="bg-navy-light text-white">
                    <User className="h-5 w-5" />
                  </AvatarFallback>
                )}
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-56 bg-navy-light/95 backdrop-blur-xl border border-white/10 shadow-2xl"
          >
            <div className="px-3 py-2.5">
              <p className="text-sm font-semibold text-white truncate">
                {userProfile?.username ?? "User"}
              </p>
              <p className="text-xs text-white/50 truncate">
                {userProfile?.email ?? ""}
              </p>
            </div>
            <DropdownMenuSeparator className="bg-white/10" />
            <DropdownMenuItem
              onClick={onSettingsClick}
              className="gap-2 text-white/80 hover:text-white focus:text-white cursor-pointer"
              data-ocid="header.settings_menu_item"
            >
              <Settings className="h-4 w-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-white/10" />
            <DropdownMenuItem
              onClick={onLogout}
              className="gap-2 text-red-400 hover:text-red-300 focus:text-red-300 cursor-pointer"
              data-ocid="header.logout_menu_item"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
