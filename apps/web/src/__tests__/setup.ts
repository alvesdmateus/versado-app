import { GlobalRegistrator } from "@happy-dom/global-registrator";

GlobalRegistrator.register();

// Provide import.meta.env stubs for Vite
(globalThis as any).import = {
  meta: {
    env: {
      VITE_API_URL: "http://localhost:3000",
    },
  },
};
