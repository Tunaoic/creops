import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { MarketingFooter } from "@/components/marketing-footer";

export const metadata = {
  title: "Privacy Policy · CreOps",
  description:
    "How CreOps collects, uses, and protects your data. Plain-English summary plus the full policy.",
};

/**
 * Privacy Policy — launch-readiness placeholder.
 *
 * This is a working privacy policy that accurately describes what
 * CreOps does in V1, written in plain English. Not legal advice;
 * before going to scale, swap for a lawyer-vetted version. App
 * stores, Google's app review, and most regulators only require
 * that you HAVE one + that it accurately describes data handling.
 *
 * If product behavior changes (e.g. adding tracking, new third
 * parties), update this page — it's the source of truth for users.
 */
export default function PrivacyPage() {
  const updated = "May 2026";
  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <PageHeader />
      <main className="flex-1 max-w-3xl mx-auto px-6 sm:px-8 py-12 sm:py-16">
        <p className="text-[14px] text-text-muted mb-3">Last updated: {updated}</p>
        <h1 className="text-title-2 text-text mb-6">Privacy Policy</h1>

        <Lead>
          We collect the minimum data needed to make CreOps work for you.
          We never sell it. We never post on your behalf. Plain English
          below, with the formal version after.
        </Lead>

        <H2>The TL;DR</H2>
        <ul className="space-y-2 text-[15px] text-text-muted leading-relaxed mb-8 pl-4 list-disc marker:text-text-subtle">
          <li>
            We collect your name + email (from Clerk signup) and whatever
            content you put into CreOps (topics, tasks, comments).
          </li>
          <li>
            We use it only to operate the product for you. We do not
            train AI models on your content.
          </li>
          <li>
            Social-channel connections (YouTube etc.) are{" "}
            <strong className="text-text">read-only</strong>. We pull
            view counts and engagement. We cannot post, edit, or delete.
          </li>
          <li>
            Cookies: a sign-in session cookie (Clerk) and a language
            preference cookie. No third-party advertising trackers.
          </li>
          <li>
            We use Vercel (hosting), Turso (database, region: Singapore),
            Clerk (auth), and Resend (email delivery). Each is bound by
            standard data processing terms.
          </li>
          <li>
            You can delete your workspace + all its data at any time
            from Settings → Workspaces.
          </li>
        </ul>

        <H2>1. Data we collect</H2>
        <Body>
          <strong className="text-text">Account data:</strong> name, email
          address, and authentication identifiers — provided by you via
          Clerk when you sign up. We store an internal user ID linked to
          the Clerk identity.
        </Body>
        <Body>
          <strong className="text-text">Workspace content:</strong>{" "}
          everything you create inside CreOps — topics, deliverables,
          tasks, comments, file URLs, due dates, channel labels,
          activity logs, notifications.
        </Body>
        <Body>
          <strong className="text-text">Social-channel tokens:</strong>{" "}
          when you connect a YouTube, TikTok, Instagram, or Facebook
          account via OAuth, we store the access token (and refresh
          token, if provided) so we can pull performance metrics. Tokens
          are scoped to read-only access. We do not request or store
          posting / write permissions.
        </Body>
        <Body>
          <strong className="text-text">Diagnostic data:</strong> server
          logs (route, status, latency) for debugging. No user-typed
          content is logged. Logs are kept up to 30 days.
        </Body>

        <H2>2. How we use it</H2>
        <ul className="space-y-2 text-[15px] text-text-muted leading-relaxed mb-8 pl-4 list-disc marker:text-text-subtle">
          <li>To run the product for your workspace.</li>
          <li>To send transactional email (invites, account, password reset).</li>
          <li>To pull metrics from connected social channels.</li>
          <li>To detect abuse and keep the service stable.</li>
        </ul>
        <Body>
          We do not use your content to train machine-learning models.
          We do not show ads. We do not share data with marketing or
          advertising partners.
        </Body>

        <H2>3. Sub-processors we rely on</H2>
        <Body>
          To deliver the product we use these third parties. Each handles
          a narrow slice of your data under their own privacy terms:
        </Body>
        <ul className="space-y-2 text-[15px] text-text-muted leading-relaxed mb-8 pl-4 list-disc marker:text-text-subtle">
          <li>
            <strong className="text-text">Vercel</strong> — hosting and
            edge serving (USA, global edge).
          </li>
          <li>
            <strong className="text-text">Turso</strong> — workspace
            database, libSQL (Singapore region for our deployment).
          </li>
          <li>
            <strong className="text-text">Clerk</strong> — authentication,
            session management, user profiles (USA).
          </li>
          <li>
            <strong className="text-text">Resend</strong> — transactional
            email delivery for invites and notifications (USA).
          </li>
          <li>
            <strong className="text-text">Google / Meta / TikTok</strong>{" "}
            — when you connect a social channel, you authorize their
            APIs to share account-level read access with CreOps.
          </li>
        </ul>

        <H2>4. Cookies</H2>
        <Body>
          CreOps uses a small set of first-party cookies:
        </Body>
        <ul className="space-y-2 text-[15px] text-text-muted leading-relaxed mb-8 pl-4 list-disc marker:text-text-subtle">
          <li>
            <strong className="text-text">Session cookie (Clerk)</strong>{" "}
            — required for sign-in. Without it, you cannot use the
            product.
          </li>
          <li>
            <strong className="text-text">Language preference</strong> —
            remembers your EN / VI choice.
          </li>
          <li>
            <strong className="text-text">Dev impersonation cookie</strong>{" "}
            — only present in our local development mode. Never set in
            production.
          </li>
        </ul>
        <Body>
          No third-party advertising or cross-site tracking cookies.
        </Body>

        <H2>5. Your rights</H2>
        <ul className="space-y-2 text-[15px] text-text-muted leading-relaxed mb-8 pl-4 list-disc marker:text-text-subtle">
          <li>
            <strong className="text-text">Access:</strong> ask us for a
            copy of all data we hold about you.
          </li>
          <li>
            <strong className="text-text">Deletion:</strong> delete your
            workspace and content from Settings → Workspaces, or email
            us to delete your account entirely.
          </li>
          <li>
            <strong className="text-text">Correction:</strong> edit your
            profile via Clerk or workspace data from Settings.
          </li>
          <li>
            <strong className="text-text">Portability:</strong> email us
            for a machine-readable export of your workspace.
          </li>
          <li>
            <strong className="text-text">Revoke social access:</strong>{" "}
            disconnect a channel from Insights → Connections, and revoke
            access at the platform&apos;s own settings page.
          </li>
        </ul>

        <H2>6. Security</H2>
        <Body>
          All traffic between you and CreOps is HTTPS. Authentication is
          handled by Clerk, which provides industry-standard session
          security. Workspace data is stored in Turso&apos;s private
          libSQL service. Social-channel tokens are stored in the
          database; production hardening (encryption at rest) is on the
          roadmap before general availability.
        </Body>
        <Body>
          If we discover a security incident affecting your data, we
          will notify you by email and via the dashboard within 72 hours.
        </Body>

        <H2>7. Children</H2>
        <Body>
          CreOps is not intended for users under 16. We do not knowingly
          collect data from children. If you believe a child has created
          an account, email us and we will delete it.
        </Body>

        <H2>8. Changes to this policy</H2>
        <Body>
          When we change this policy, we will update the &ldquo;last
          updated&rdquo; date at the top and notify active users via
          email or in-app banner if the change is material.
        </Body>

        <H2>9. Contact</H2>
        <Body>
          Questions, requests, or complaints: reach us at the contact
          listed on the marketing site. We will respond within 30 days.
        </Body>
      </main>
      <MarketingFooter />
    </div>
  );
}

function PageHeader() {
  return (
    <header className="border-b border-border bg-bg/85 backdrop-blur-md sticky top-0 z-30">
      <div className="max-w-6xl mx-auto px-6 sm:px-8 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center">
            <span className="font-semibold text-[13px] text-accent leading-none">
              CO
            </span>
          </div>
          <span className="text-[17px] font-semibold tracking-tight text-text">
            CreOps
          </span>
        </Link>
        <Link
          href="/"
          className="text-[14px] text-text-muted hover:text-text inline-flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" strokeWidth={1.75} />
          Back to home
        </Link>
      </div>
    </header>
  );
}

function H2({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-[20px] font-semibold text-text mt-10 mb-3">
      {children}
    </h2>
  );
}

function Lead({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[16px] text-text leading-relaxed mb-10 pb-6 border-b border-border">
      {children}
    </p>
  );
}

function Body({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[15px] text-text-muted leading-relaxed mb-4">
      {children}
    </p>
  );
}
