import {
  ClerkProvider,
  SignIn,
  SignedIn,
  SignedOut,
  RedirectToSignIn,
} from "@clerk/clerk-react";
import { useEffect } from "react";
import Dashboard from "./pages/Dashboard";

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string;

function MissingKeyScreen() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        background: "#f8fafc",
        fontFamily: "system-ui, sans-serif",
        padding: "2rem",
        gap: "1rem",
        textAlign: "center",
      }}
    >
      <div
        style={{
          background: "#fff",
          border: "1px solid #e2e8f0",
          borderRadius: "0.75rem",
          padding: "2rem 2.5rem",
          maxWidth: 480,
          boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 48,
            height: 48,
            borderRadius: "0.5rem",
            background: "#fef3c7",
            marginBottom: "1rem",
          }}
        >
          <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
            <path
              d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
              stroke="#d97706"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <h1 style={{ fontSize: "1.125rem", fontWeight: 700, color: "#1e293b", margin: "0 0 0.5rem" }}>
          Clerk key not configured
        </h1>
        <p style={{ fontSize: "0.875rem", color: "#64748b", margin: "0 0 1.25rem", lineHeight: 1.6 }}>
          Add your Clerk publishable key to the <code style={{ background: "#f1f5f9", padding: "0.1em 0.3em", borderRadius: 4 }}>.env</code> file to continue.
        </p>
        <div
          style={{
            background: "#f8fafc",
            border: "1px solid #e2e8f0",
            borderRadius: "0.5rem",
            padding: "0.75rem 1rem",
            fontFamily: "monospace",
            fontSize: "0.8rem",
            color: "#0f172a",
            textAlign: "left",
          }}
        >
          VITE_CLERK_PUBLISHABLE_KEY=pk_test_…
        </div>
      </div>
    </div>
  );
}

function RedirectToDashboard() {
  useEffect(() => {
    window.location.replace("/dashboard");
  }, []);
  return null;
}

function Router() {
  const path = window.location.pathname;

  if (path === "/dashboard") {
    return (
      <>
        <SignedIn>
          <Dashboard />
        </SignedIn>
        <SignedOut>
          <RedirectToSignIn />
        </SignedOut>
      </>
    );
  }

  return (
    <>
      <SignedIn>
        <RedirectToDashboard />
      </SignedIn>
      <SignedOut>
        <div
          style={{
            display: "flex",
            minHeight: "100vh",
            alignItems: "center",
            justifyContent: "center",
            background: "#f8fafc",
          }}
        >
          <SignIn routing="hash" afterSignInUrl="/dashboard" />
        </div>
      </SignedOut>
    </>
  );
}

export default function App() {
  if (!clerkPubKey || clerkPubKey.startsWith("pk_test_your_clerk")) {
    return <MissingKeyScreen />;
  }

  return (
    <ClerkProvider publishableKey={clerkPubKey}>
      <Router />
    </ClerkProvider>
  );
}
