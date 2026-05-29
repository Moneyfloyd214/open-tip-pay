import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import { AuthProvider } from "./context/AuthContext";

const rootEl = document.getElementById("root");
if (!rootEl) throw new Error("Root element #root not found — check index.html");

ReactDOM.createRoot(rootEl).render(
  <AuthProvider>
    <App />
  </AuthProvider>
);
