import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Component, type ErrorInfo, type ReactNode } from "react";
import ReactDOM from "react-dom/client";
import "./index.css";

// Allow BigInt to be JSON-serialized (needed for Candid responses)
BigInt.prototype.toJSON = function () {
  return this.toString();
};

declare global {
  interface BigInt {
    toJSON(): string;
  }
}

// ─── Vanilla-JS fallback helpers (no React dependency) ────────────────────────
const FALLBACK_STYLE = `
  display:flex;flex-direction:column;align-items:center;justify-content:center;
  min-height:100vh;background:#0d1b2a;color:#fff;
  padding:2rem;text-align:center;gap:1.5rem;font-family:system-ui,sans-serif;
`;

function injectFallback(el: HTMLElement, msg = "Loading app…") {
  el.innerHTML = `
    <div style="${FALLBACK_STYLE}">
      <div style="font-size:2rem;font-weight:800;letter-spacing:-0.02em;">Open Tip Pay</div>
      <div style="color:#2dd4bf;font-size:0.9rem;">${msg}</div>
      <div style="width:40px;height:40px;border:3px solid rgba(45,212,191,0.2);border-top-color:#2dd4bf;
        border-radius:50%;animation:spin 1s linear infinite;"></div>
      <style>@keyframes spin{to{transform:rotate(360deg)}}</style>
    </div>
  `;
}

function injectErrorScreen(el: HTMLElement) {
  el.innerHTML = `
    <div style="${FALLBACK_STYLE}">
      <div style="font-size:2rem;font-weight:800;letter-spacing:-0.02em;">Open Tip Pay</div>
      <p style="color:rgba(255,255,255,0.6);font-size:0.875rem;max-width:300px;line-height:1.5;margin:0;">
        Having trouble connecting… Tap to try again.
      </p>
      <button onclick="window.location.reload()"
        style="padding:0.875rem 2rem;background:#2dd4bf;color:#0d1b2a;border:none;
        border-radius:0.75rem;cursor:pointer;font-weight:700;font-size:1rem;">
        Try Again
      </button>
    </div>
  `;
}

// ─── Global error handlers — catch async errors before React mounts ───────────
window.onerror = (_msg, _src, _line, _col, error) => {
  console.error("[Open Tip Pay] Uncaught global error:", error);
  const el = document.getElementById("root");
  if (el && (!el.children.length || el.innerHTML.trim() === "")) {
    injectErrorScreen(el);
  }
  return false; // don't suppress — let React error boundary also handle it
};

window.onunhandledrejection = (event) => {
  console.error("[Open Tip Pay] Unhandled promise rejection:", event.reason);
  const el = document.getElementById("root");
  if (el && (!el.children.length || el.innerHTML.trim() === "")) {
    injectErrorScreen(el);
  }
};

// ─── Top-level error boundary ─────────────────────────────────────────────────
class AppErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[Open Tip Pay] Render error:", error, info);
  }

  render() {
    if (this.state.hasError) {
      // Never show raw error text to users — friendly recovery screen only
      return (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "100vh",
            background: "#0d1b2a",
            color: "#fff",
            padding: "2rem",
            textAlign: "center",
            gap: "1.25rem",
            fontFamily: "system-ui, sans-serif",
          }}
        >
          <div
            style={{
              fontSize: "2rem",
              fontWeight: 800,
              letterSpacing: "-0.02em",
            }}
          >
            Open Tip Pay
          </div>
          <p
            style={{
              color: "rgba(255,255,255,0.6)",
              fontSize: "0.875rem",
              maxWidth: 300,
              margin: 0,
              lineHeight: 1.5,
            }}
          >
            Having trouble connecting… Tap to try again.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            style={{
              padding: "0.875rem 2rem",
              background: "#2dd4bf",
              color: "#0d1b2a",
              border: "none",
              borderRadius: "0.75rem",
              cursor: "pointer",
              fontWeight: 700,
              fontSize: "1rem",
            }}
          >
            Try Again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ─── React Query client ───────────────────────────────────────────────────────
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        const msg = error instanceof Error ? error.message : String(error);
        if (
          msg.includes("CANISTER_ID") ||
          msg.includes("not set") ||
          msg.includes("canister-not-configured") ||
          msg.includes("undefined") ||
          msg.includes("Invalid canister")
        ) {
          return false;
        }
        return failureCount < 2;
      },
      refetchOnWindowFocus: false,
    },
    mutations: {
      onError: (error) => {
        console.error("[Open Tip Pay] Mutation error:", error);
      },
    },
  },
});

// ─── Bootstrap ────────────────────────────────────────────────────────────────
const rootEl = document.getElementById("root");
if (!rootEl) {
  document.body.innerHTML = `<div style="${FALLBACK_STYLE}"><div style="font-size:2rem;font-weight:800;">Open Tip Pay</div><p style="color:rgba(255,255,255,0.6);">Critical startup error. Please reload.</p><button onclick="window.location.reload()" style="padding:0.875rem 2rem;background:#2dd4bf;color:#0d1b2a;border:none;border-radius:0.75rem;cursor:pointer;font-weight:700;">Reload</button></div>`;
  throw new Error(
    "[Open Tip Pay] Root element #root not found — check index.html",
  );
}

// Hide the inline loading-fallback div once we're about to mount React
const inlineFallback = document.getElementById("loading-fallback");
if (inlineFallback) {
  inlineFallback.style.display = "none";
}

// Hard render timeout — if React has not put any children in #root within 3s,
// inject a vanilla-JS fallback that auto-reloads after 5 more seconds.
const renderDeadlineTimer = setTimeout(() => {
  if (!rootEl.children.length || rootEl.innerHTML.trim() === "") {
    console.warn(
      "[Open Tip Pay] Render deadline exceeded — injecting fallback",
    );
    injectFallback(rootEl, "Loading app…");
    // Auto-reload after 5 more seconds as a last resort
    setTimeout(() => window.location.reload(), 5_000);
  }
}, 3_000);

// Dynamically import App to catch module-graph initialization errors.
// backend.ts imports from ./declarations which may fail before deploy.
// A dynamic import() catches that crash so we can show a fallback UI.
(async () => {
  let AppComponent: React.ComponentType | null = null;
  try {
    const mod = await import("./App");
    AppComponent = mod.default;
  } catch (importErr) {
    console.error(
      "[Open Tip Pay] App module failed to load — showing fallback:",
      importErr,
    );
    clearTimeout(renderDeadlineTimer);
    injectErrorScreen(rootEl);
    return;
  }

  const FinalApp = AppComponent;

  try {
    ReactDOM.createRoot(rootEl).render(
      <AppErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <FinalApp />
        </QueryClientProvider>
      </AppErrorBoundary>,
    );
    // React mounted successfully — clear the deadline timer
    clearTimeout(renderDeadlineTimer);
  } catch (err) {
    console.error("[Open Tip Pay] Fatal mount error:", err);
    clearTimeout(renderDeadlineTimer);
    injectErrorScreen(rootEl);
  }
})();
