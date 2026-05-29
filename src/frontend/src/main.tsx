import { ClerkProvider } from "@clerk/clerk-react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";

const clerkKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string;
if (!clerkKey) throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY");

const rootEl = document.getElementById("root");
if (!rootEl) throw new Error("Root element #root not found — check index.html");

ReactDOM.createRoot(rootEl).render(
  <ClerkProvider publishableKey={clerkKey} afterSignOutUrl="/">
    <App />
  </ClerkProvider>
);
