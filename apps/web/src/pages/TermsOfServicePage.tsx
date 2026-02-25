import { useNavigate } from "react-router";
import { ChevronLeft } from "lucide-react";

export function TermsOfServicePage() {
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
            Terms of Service
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
              Welcome to Versado. These Terms of Service ("Terms") govern your
              use of the Versado application and services. By creating an
              account or using Versado, you agree to be bound by these Terms.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-neutral-900">
              1. Account Registration
            </h2>
            <p className="mb-3">
              To use Versado, you must create an account using your email
              address or Google sign-in. You are responsible for maintaining the
              security of your account credentials and for all activity that
              occurs under your account.
            </p>
            <p>
              You must provide accurate information during registration. You
              must be at least 13 years old to create an account.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-neutral-900">
              2. Acceptable Use
            </h2>
            <p className="mb-3">You agree not to:</p>
            <ul className="list-disc space-y-1.5 pl-5">
              <li>
                Use Versado for any unlawful purpose or in violation of any
                applicable laws
              </li>
              <li>
                Upload content that is offensive, harmful, or infringes on
                others' intellectual property rights
              </li>
              <li>
                Attempt to gain unauthorized access to other users' accounts or
                our systems
              </li>
              <li>
                Use automated tools to scrape, collect, or extract data from
                the service
              </li>
              <li>
                Interfere with or disrupt the integrity or performance of the
                service
              </li>
              <li>
                Share your account credentials or allow others to access your
                account
              </li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-neutral-900">
              3. User Content
            </h2>
            <p className="mb-3">
              You retain ownership of all flashcard decks, cards, and other
              content you create on Versado ("User Content"). By using the
              service, you grant us a limited license to store, process, and
              display your User Content as necessary to provide the service.
            </p>
            <p>
              If you publish decks to the Versado marketplace, you grant other
              users a license to view and study that content. You may remove
              your content from the marketplace at any time.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-neutral-900">
              4. Intellectual Property
            </h2>
            <p>
              The Versado application, including its design, code, algorithms
              (such as the SM-2 spaced repetition system), logos, and branding,
              is owned by Versado and protected by intellectual property laws.
              You may not copy, modify, distribute, or reverse-engineer any
              part of the application.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-neutral-900">
              5. Payments &amp; Subscriptions
            </h2>
            <p className="mb-3">
              Versado offers free and paid subscription tiers. Paid
              subscriptions are processed through Stripe. By subscribing, you
              agree to the pricing and billing terms presented at the time of
              purchase.
            </p>
            <ul className="list-disc space-y-1.5 pl-5">
              <li>
                Subscriptions renew automatically unless cancelled before the
                renewal date
              </li>
              <li>
                You may cancel your subscription at any time through the
                billing settings
              </li>
              <li>
                Refunds are handled on a case-by-case basis in accordance with
                applicable law
              </li>
              <li>
                We reserve the right to change subscription pricing with
                reasonable notice
              </li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-neutral-900">
              6. Service Availability
            </h2>
            <p>
              We strive to keep Versado available at all times but do not
              guarantee uninterrupted access. We may temporarily suspend the
              service for maintenance, updates, or circumstances beyond our
              control. The app includes offline functionality that allows
              continued study during periods of limited connectivity.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-neutral-900">
              7. Account Termination
            </h2>
            <p className="mb-3">
              You may delete your account at any time through the profile
              settings. Upon deletion, all your personal data, flashcard decks,
              study history, and subscription information will be permanently
              removed.
            </p>
            <p>
              We reserve the right to suspend or terminate accounts that
              violate these Terms, with or without notice.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-neutral-900">
              8. Disclaimers
            </h2>
            <p className="mb-3">
              Versado is provided "as is" and "as available" without warranties
              of any kind, whether express or implied. We do not guarantee that
              the service will meet your specific learning goals or
              requirements.
            </p>
            <p>
              While our spaced repetition algorithm is based on established
              cognitive science research, individual learning results may vary.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-neutral-900">
              9. Limitation of Liability
            </h2>
            <p>
              To the maximum extent permitted by law, Versado shall not be
              liable for any indirect, incidental, special, consequential, or
              punitive damages, including loss of data, loss of profits, or
              business interruption, arising from your use of the service.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-neutral-900">
              10. Changes to These Terms
            </h2>
            <p>
              We may update these Terms from time to time. We will notify you
              of material changes by posting the updated Terms in the app. Your
              continued use of Versado after changes are posted constitutes
              your acceptance of the updated Terms.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-neutral-900">
              11. Contact Us
            </h2>
            <p>
              If you have questions about these Terms, please contact us at{" "}
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
