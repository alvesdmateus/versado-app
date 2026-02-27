import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { useTranslation } from "react-i18next";
import { ApiError } from "@/lib/api-client";
import { getErrorInfo } from "@/lib/error-messages";
import { ErrorNotification } from "@/components/shared/ErrorNotification";

interface ErrorNotificationOptions {
  onRetry?: () => void;
}

interface ErrorNotificationContextValue {
  showErrorNotification: (
    error: unknown,
    options?: ErrorNotificationOptions
  ) => void;
}

const ErrorNotificationContext =
  createContext<ErrorNotificationContextValue | null>(null);

export function useErrorNotification() {
  const ctx = useContext(ErrorNotificationContext);
  if (!ctx)
    throw new Error(
      "useErrorNotification must be used within ErrorNotificationProvider"
    );
  return ctx;
}

interface ErrorState {
  title: string;
  description: string;
  errorCode: string;
  onRetry?: () => void;
}

export function ErrorNotificationProvider({
  children,
}: {
  children: ReactNode;
}) {
  const { t } = useTranslation("errors");
  const [errorState, setErrorState] = useState<ErrorState | null>(null);

  const showErrorNotification = useCallback(
    (error: unknown, options?: ErrorNotificationOptions) => {
      let status = 0;
      let code: string | undefined;
      let message: string | undefined;

      if (error instanceof ApiError) {
        // Skip 404 — handled separately
        if (error.status === 404) return;
        status = error.status;
        code = error.code;
        message = error.message;
      }

      const info = getErrorInfo(t, status, code, message);
      setErrorState({
        ...info,
        onRetry: options?.onRetry,
      });
    },
    [t]
  );

  const handleDismiss = useCallback(() => {
    setErrorState(null);
  }, []);

  return (
    <ErrorNotificationContext.Provider value={{ showErrorNotification }}>
      {children}
      <ErrorNotification
        isOpen={errorState !== null}
        title={errorState?.title ?? ""}
        description={errorState?.description ?? ""}
        errorCode={errorState?.errorCode ?? ""}
        onRetry={errorState?.onRetry}
        onDismiss={handleDismiss}
      />
    </ErrorNotificationContext.Provider>
  );
}
