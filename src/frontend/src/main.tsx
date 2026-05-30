import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import { AuthProvider } from "./context/AuthContext";

const rootEl = document.getElementById("root");
if (!rootEl) throw new Error("Root element #root not found — check index.html");

const fallback = document.getElementById("loading-fallback");
if (fallback) fallback.style.display = "none";

ReactDOM.createRoot(rootEl).render(
  <AuthProvider>
    <App />
  </AuthProvider>
);
