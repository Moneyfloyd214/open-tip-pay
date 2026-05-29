import { ClerkProvider } from "@clerk/clerk-react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";

// Evaluated once at module load — never changes, never causes re-renders
const CLERK_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string;
if (!CLERK_KEY) throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY");

const rootEl = document.getElementById("root");
if (!rootEl) throw new Error("Root element #root not found — check index.html");

// ClerkProvider is the outermost React boundary.
// App (and everything inside it) is a child — Clerk mounts exactly once.
ReactDOM.createRoot(rootEl).render(
  <ClerkProvider publishableKey={CLERK_KEY}>
    <App />
  </ClerkProvider>
);
