import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Loader2, Search, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useSearchUsers } from "../hooks/useQueries";
import UserNotFound from "./UserNotFound";

interface SearchBarProps {
  onSelectUser: (username: string) => void;
}

export default function SearchBar({ onSelectUser }: SearchBarProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const { data: searchResults = [], isLoading } = useSearchUsers(searchTerm);

  // Close search when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setIsFocused(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleClear = () => {
    setSearchTerm("");
    setIsFocused(false);
  };

  const handleSelectResult = (username: string) => {
    setSearchTerm("");
    setIsFocused(false);
    onSelectUser(username);
  };

  const showResults = isFocused && searchTerm.length > 0;
  const showUserNotFound =
    showResults && !isLoading && searchResults.length === 0;

  return (
    <>
      {/* Backdrop blur overlay */}
      {showResults && (
        <div
          role="button"
          tabIndex={0}
          aria-label="Close search results"
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity duration-300"
          onClick={() => setIsFocused(false)}
          onKeyDown={(e) => {
            if (e.key === "Escape") setIsFocused(false);
          }}
        />
      )}

      {/* Search container */}
      <div ref={searchRef} className="relative z-50 mb-6">
        {/* Search input */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-teal/70 pointer-events-none" />
          <Input
            type="text"
            placeholder="Search by @username or phone number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onFocus={() => setIsFocused(true)}
            className="w-full pl-12 pr-12 py-6 text-base bg-navy-light/50 border-2 border-teal/30 rounded-2xl text-white placeholder:text-white/50 focus:border-teal focus:ring-2 focus:ring-teal/50 transition-all duration-300 shadow-lg shadow-teal/10"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Search results dropdown */}
        {showResults && (
          <div className="absolute top-full left-0 right-0 mt-2 max-h-96 overflow-y-auto bg-navy-light/95 backdrop-blur-xl border-2 border-teal/30 rounded-2xl shadow-2xl shadow-teal/20 animate-in fade-in slide-in-from-top-2 duration-300">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-teal" />
              </div>
            ) : showUserNotFound ? (
              <UserNotFound searchTerm={searchTerm} />
            ) : (
              <div className="py-2">
                {searchResults.map((result) => (
                  <button
                    type="button"
                    key={result.username}
                    onClick={() => handleSelectResult(result.username)}
                    className="w-full px-6 py-4 flex items-center gap-4 hover:bg-teal/10 transition-colors duration-200 border-b border-white/5 last:border-b-0"
                  >
                    {/* Profile Picture */}
                    <Avatar className="h-12 w-12 border-2 border-teal/50">
                      {result.photo ? (
                        <AvatarImage
                          src={result.photo.getDirectURL()}
                          alt={result.username}
                        />
                      ) : (
                        <AvatarFallback className="bg-navy text-white text-sm">
                          {result.username.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      )}
                    </Avatar>

                    {/* User Info */}
                    <div className="flex-1 text-left">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-white">
                          @{result.username}
                        </p>
                        {result.isVerified && (
                          <img
                            src="/assets/generated/verified-badge-transparent.dim_16x16.png"
                            alt="Verified"
                            className="h-4 w-4"
                          />
                        )}
                      </div>
                      {result.bio && (
                        <p className="text-sm text-white/60 line-clamp-1 mt-0.5">
                          {result.bio}
                        </p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
