import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router";
import { registerSW } from "virtual:pwa-register";
import "./i18n";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AuthProvider } from "./contexts/AuthContext";
import { SyncProvider } from "./contexts/SyncContext";
import { ToastProvider } from "./contexts/ToastContext";
import { ErrorNotificationProvider } from "./contexts/ErrorNotificationContext";
import { ErrorBoundary } from "./components/shared/ErrorBoundary";
import { router } from "./router";
import "./index.css";

const root = document.getElementById("root");
if (!root) throw new Error("Root element not found");

createRoot(root).render(
  <StrictMode>
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
        <SyncProvider>
          <ToastProvider>
            <ErrorNotificationProvider>
              <RouterProvider router={router} />
            </ErrorNotificationProvider>
          </ToastProvider>
        </SyncProvider>
      </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  </StrictMode>
);

// Register service worker for PWA support
const updateSW = registerSW({
  onNeedRefresh() {
    window.dispatchEvent(
      new CustomEvent("sw-update-available", { detail: { updateSW } })
    );
  },
  onOfflineReady() {
    console.log("App ready to work offline");
  },
});
