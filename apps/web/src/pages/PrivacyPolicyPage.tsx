import { useNavigate } from "react-router";
import { ChevronLeft } from "lucide-react";

export function PrivacyPolicyPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-neutral-200 bg-neutral-0 px-5 py-4">
        <div className="mx-auto flex max-w-2xl items-center">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1 text-neutral-600 transition-colors hover:text-neutral-900"
          >
            <ChevronLeft className="h-5 w-5" />
            <span className="text-sm">Back</span>
          </button>
          <h1 className="flex-1 text-center text-lg font-semibold text-neutral-900 pr-14">
            Privacy Policy
          </h1>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-2xl px-5 py-8">
        <p className="mb-8 text-sm text-neutral-400">
          Last updated: February 25, 2026
        </p>

        <div className="space-y-8 text-sm leading-relaxed text-neutral-700">
          <section>
            <p>
              Versado ("we", "our", or "us") is committed to protecting your
              privacy. This Privacy Policy explains how we collect, use, and
              safeguard your information when you use our flashcard and spaced
              repetition application.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-neutral-900">
              1. Information We Collect
            </h2>

            <h3 className="mb-2 font-medium text-neutral-800">
              Account Information
            </h3>
            <p className="mb-3">
              When you create an account, we collect your display name, email
              address, and password (stored as a secure hash). If you sign in
              with Google, we receive your Google account ID, name, email, and
              profile picture.
            </p>

            <h3 className="mb-2 font-medium text-neutral-800">
              Learning Data
            </h3>
            <p className="mb-3">
              We collect data related to your study activity, including
              flashcard decks you create or purchase, card content, study
              session history, review ratings, spaced repetition scheduling
              data (intervals, ease factors, repetition counts), and
              performance statistics.
            </p>

            <h3 className="mb-2 font-medium text-neutral-800">
              Billing Information
            </h3>
            <p className="mb-3">
              Payment processing is handled entirely by Stripe. We do not
              store your credit card number or full payment details. We retain
              only your Stripe customer ID and subscription status.
            </p>

            <h3 className="mb-2 font-medium text-neutral-800">
              Device &amp; Usage Data
            </h3>
            <p>
              We may collect basic usage data such as pages visited, feature
              usage patterns, and device type to improve the app experience.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-neutral-900">
              2. How We Use Your Information
            </h2>
            <ul className="list-disc space-y-1.5 pl-5">
              <li>Provide and maintain the Versado service</li>
              <li>
                Schedule flashcard reviews using the SM-2 spaced repetition
                algorithm
              </li>
              <li>Track your learning progress and streak data</li>
              <li>Process payments and manage subscriptions</li>
              <li>Send transactional emails (password resets, email verification)</li>
              <li>Improve and optimize the app experience</li>
              <li>Respond to support requests</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-neutral-900">
              3. Third-Party Services
            </h2>
            <p className="mb-3">We use the following third-party services:</p>
            <ul className="list-disc space-y-1.5 pl-5">
              <li>
                <strong>Google OAuth</strong> — For optional social sign-in.
                Subject to{" "}
                <a
                  href="https://policies.google.com/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-500 hover:text-primary-600 underline"
                >
                  Google's Privacy Policy
                </a>
                .
              </li>
              <li>
                <strong>Stripe</strong> — For payment processing. Subject to{" "}
                <a
                  href="https://stripe.com/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-500 hover:text-primary-600 underline"
                >
                  Stripe's Privacy Policy
                </a>
                .
              </li>
              <li>
                <strong>Resend</strong> — For transactional emails (password
                resets, email verification).
              </li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-neutral-900">
              4. Data Storage &amp; Security
            </h2>
            <p className="mb-3">
              Your data is stored in secure PostgreSQL databases. Passwords are
              hashed using bcrypt. Authentication tokens are short-lived (15
              minutes) with secure refresh token rotation (7 days). We use
              HTTPS for all data transmission.
            </p>
            <p>
              The app may store data locally on your device using IndexedDB and
              localStorage for offline functionality and preferences (such as
              dark mode settings).
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-neutral-900">
              5. Your Rights
            </h2>
            <p className="mb-3">You have the right to:</p>
            <ul className="list-disc space-y-1.5 pl-5">
              <li>
                <strong>Access</strong> your personal data through your profile
                settings
              </li>
              <li>
                <strong>Update</strong> your display name, email, and
                preferences
              </li>
              <li>
                <strong>Delete</strong> your account and all associated data
                through the profile settings page
              </li>
              <li>
                <strong>Change your password</strong> or link/unlink social
                sign-in methods
              </li>
            </ul>
            <p className="mt-3">
              When you delete your account, all your personal data, flashcard
              decks, study history, and subscription information are permanently
              removed.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-neutral-900">
              6. Cookies &amp; Local Storage
            </h2>
            <p>
              We use HTTP-only cookies for authentication (refresh tokens) and
              localStorage for user preferences (theme settings, UI state). We
              do not use third-party tracking cookies or advertising trackers.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-neutral-900">
              7. Children's Privacy
            </h2>
            <p>
              Versado is not directed at children under the age of 13. We do
              not knowingly collect personal information from children under 13.
              If you believe we have inadvertently collected such information,
              please contact us and we will promptly delete it.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-neutral-900">
              8. Changes to This Policy
            </h2>
            <p>
              We may update this Privacy Policy from time to time. We will
              notify you of any material changes by posting the new policy in
              the app. Your continued use of Versado after changes are posted
              constitutes your acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-neutral-900">
              9. Contact Us
            </h2>
            <p>
              If you have questions about this Privacy Policy or your data,
              please contact us at{" "}
              <a
                href="mailto:support@versado.app"
                className="text-primary-500 hover:text-primary-600 underline"
              >
                support@versado.app
              </a>
              .
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
