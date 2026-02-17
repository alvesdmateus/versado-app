import { createBrowserRouter } from "react-router";
import { AuthLayout } from "./layouts/AuthLayout";
import { AppLayout } from "./layouts/AppLayout";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { HomePage } from "./pages/HomePage";
import { DecksPage } from "./pages/DecksPage";
import { MarketplacePage } from "./pages/MarketplacePage";
import { ProfilePage } from "./pages/ProfilePage";
import { StudySessionPage } from "./pages/StudySessionPage";
import { DeckDetailPage } from "./pages/DeckDetailPage";
import { MarketplaceDetailPage } from "./pages/MarketplaceDetailPage";
import { BillingPage } from "./pages/BillingPage";
import { NotFoundPage } from "./pages/NotFoundPage";

export const router = createBrowserRouter([
  {
    path: "/auth",
    element: <AuthLayout />,
    children: [
      { path: "login", element: <LoginPage /> },
      { path: "register", element: <RegisterPage /> },
    ],
  },
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <HomePage /> },
      { path: "decks", element: <DecksPage /> },
      { path: "decks/:deckId", element: <DeckDetailPage /> },
      { path: "market", element: <MarketplacePage /> },
      { path: "market/:deckId", element: <MarketplaceDetailPage /> },
      { path: "profile", element: <ProfilePage /> },
      { path: "billing", element: <BillingPage /> },
      { path: "not-found", element: <NotFoundPage /> },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
  {
    path: "/study/:deckId",
    element: (
      <ProtectedRoute>
        <StudySessionPage />
      </ProtectedRoute>
    ),
  },
]);
