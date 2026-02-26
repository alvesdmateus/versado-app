import { createBrowserRouter } from "react-router";
import { AuthLayout } from "./layouts/AuthLayout";
import { AppLayout } from "./layouts/AppLayout";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { ForgotPasswordPage } from "./pages/ForgotPasswordPage";
import { ResetPasswordPage } from "./pages/ResetPasswordPage";
import { VerifyEmailPage } from "./pages/VerifyEmailPage";
import { HomePage } from "./pages/HomePage";
import { DecksPage } from "./pages/DecksPage";
import { MarketplacePage } from "./pages/MarketplacePage";
import { ProfilePage } from "./pages/ProfilePage";
import { StudySessionPage } from "./pages/StudySessionPage";
import { DeckDetailPage } from "./pages/DeckDetailPage";
import { MarketplaceDetailPage } from "./pages/MarketplaceDetailPage";
import { BillingPage } from "./pages/BillingPage";
import { FluentPage } from "./pages/FluentPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { AuthCallbackPage } from "./pages/AuthCallbackPage";
import { OnboardingPage } from "./pages/OnboardingPage";
import { StudyHistoryPage } from "./pages/StudyHistoryPage";
import { StudyStatsPage } from "./pages/StudyStatsPage";
import { DiscoverPage } from "./pages/DiscoverPage";
import { PrivacyPolicyPage } from "./pages/PrivacyPolicyPage";
import { TermsOfServicePage } from "./pages/TermsOfServicePage";

export const router = createBrowserRouter([
  {
    path: "/auth",
    element: <AuthLayout />,
    children: [
      { path: "login", element: <LoginPage /> },
      { path: "register", element: <RegisterPage /> },
      { path: "forgot-password", element: <ForgotPasswordPage /> },
      { path: "reset-password", element: <ResetPasswordPage /> },
      { path: "verify-email", element: <VerifyEmailPage /> },
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
      { path: "discover", element: <DiscoverPage /> },
      { path: "market", element: <MarketplacePage /> },
      { path: "market/:deckId", element: <MarketplaceDetailPage /> },
      { path: "profile", element: <ProfilePage /> },
      { path: "billing", element: <BillingPage /> },
      { path: "fluent", element: <FluentPage /> },
      { path: "history", element: <StudyHistoryPage /> },
      { path: "stats", element: <StudyStatsPage /> },
      { path: "not-found", element: <NotFoundPage /> },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
  {
    path: "/auth/callback",
    element: <AuthCallbackPage />,
  },
  {
    path: "/privacy",
    element: <PrivacyPolicyPage />,
  },
  {
    path: "/terms",
    element: <TermsOfServicePage />,
  },
  {
    path: "/onboarding",
    element: (
      <ProtectedRoute>
        <OnboardingPage />
      </ProtectedRoute>
    ),
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
