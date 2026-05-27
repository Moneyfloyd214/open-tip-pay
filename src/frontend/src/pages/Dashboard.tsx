import { useAuth, useUser, UserButton } from "@clerk/clerk-react";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function Dashboard() {
  const { userId } = useAuth();
  const { user } = useUser();
  const [dbStatus, setDbStatus] = useState<"checking" | "connected" | "error">("checking");

  useEffect(() => {
    supabase
      .from("_test_connection")
      .select("*")
      .limit(1)
      .then(({ error }) => {
        // A "relation does not exist" error still means the DB is reachable
        if (!error || error.code === "42P01") {
          setDbStatus("connected");
        } else {
          setDbStatus("error");
        }
      });
  }, []);

  const statusColor =
    dbStatus === "connected"
      ? "bg-emerald-500"
      : dbStatus === "error"
        ? "bg-red-500"
        : "bg-yellow-400";

  const statusLabel =
    dbStatus === "connected"
      ? "Connected"
      : dbStatus === "error"
        ? "Error"
        : "Checking…";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top nav */}
      <header className="border-b border-gray-200 bg-white px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600">
              <svg
                className="h-5 w-5 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
            <span className="text-lg font-semibold text-gray-900">Platform</span>
          </div>
          <UserButton afterSignOutUrl="/" />
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto max-w-6xl px-6 py-10">
        {/* Welcome */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back{user?.firstName ? `, ${user.firstName}` : ""}
          </h1>
          <p className="mt-1 text-sm text-gray-500">User ID: {userId}</p>
        </div>

        {/* Stats grid */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            { label: "Total Transactions", value: "—" },
            { label: "Active Users", value: "—" },
            { label: "Revenue (MTD)", value: "—" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
            >
              <p className="text-sm font-medium text-gray-500">{stat.label}</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Supabase connection status */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-gray-900">
                Supabase Database
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Transaction data layer — ready for schema migrations
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`h-2.5 w-2.5 rounded-full ${statusColor}`} />
              <span className="text-sm font-medium text-gray-700">{statusLabel}</span>
            </div>
          </div>

          <div className="mt-4 rounded-lg bg-gray-50 px-4 py-3 font-mono text-xs text-gray-600">
            <span className="text-blue-600">supabase</span>
            <span className="text-gray-400">.from(</span>
            <span className="text-emerald-600">'transactions'</span>
            <span className="text-gray-400">).select(</span>
            <span className="text-emerald-600">'*'</span>
            <span className="text-gray-400">)</span>
          </div>
        </div>
      </main>
    </div>
  );
}
