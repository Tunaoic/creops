import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { MarketingFooter } from "@/components/marketing-footer";

export const metadata = {
  title: "Terms of Service · CreOps",
  description:
    "The agreement between you and CreOps. Plain-English summary plus the full terms.",
};

/**
 * Terms of Service — launch-readiness placeholder.
 *
 * Same caveat as /privacy: this is a working draft that accurately
 * describes how CreOps is offered today. Not a substitute for a
 * lawyer-vetted document at scale, but enough to launch publicly
 * and pass app-store / browser checks.
 */
export default function TermsPage() {
  const updated = "May 2026";
  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <PageHeader />
      <main className="flex-1 max-w-3xl mx-auto px-6 sm:px-8 py-12 sm:py-16">
        <p className="text-[14px] text-text-muted mb-3">Last updated: {updated}</p>
        <h1 className="text-title-2 text-text mb-6">Terms of Service</h1>

        <Lead>
          The deal: you use CreOps to run your content workflow, we keep
          it running and don&apos;t mess with your data. Plain English
          summary first, then the formal terms.
        </Lead>

        <H2>The TL;DR</H2>
        <ul className="space-y-2 text-[15px] text-text-muted leading-relaxed mb-8 pl-4 list-disc marker:text-text-subtle">
          <li>You own your content. We just store and serve it for you.</li>
          <li>
            Don&apos;t use CreOps for illegal stuff, spam, or to harm
            others. We can suspend accounts that do.
          </li>
          <li>
            Service is provided &ldquo;as is&rdquo; — we work hard to
            make it reliable, but we can&apos;t promise zero downtime.
          </li>
          <li>
            Either of us can end this agreement at any time. You can
            delete your workspace; we can suspend for abuse.
          </li>
          <li>
            If you have a complaint, email us. We&apos;ll try to fix it
            before any lawsuit.
          </li>
        </ul>

        <H2>1. The agreement</H2>
        <Body>
          By creating an account or using CreOps (&ldquo;the
          service&rdquo;), you agree to these terms. If you&apos;re
          using CreOps on behalf of a company, you confirm you have
          authority to bind that company.
        </Body>

        <H2>2. Your account</H2>
        <Body>
          You&apos;re responsible for keeping your sign-in credentials
          secure and for activity that happens under your account. If
          you share workspace access with teammates, make sure you trust
          them — they can see and edit anything in the workspace.
        </Body>
        <Body>
          You must be at least 16 years old to use CreOps.
        </Body>

        <H2>3. Your content</H2>
        <Body>
          You retain all ownership of content you put into CreOps —
          topics, briefs, files, comments, scripts, everything. By
          using the service, you grant us a limited license to store,
          process, transmit, and display that content solely to operate
          the product for you.
        </Body>
        <Body>
          We will not use your content to train AI models. We will not
          sell your content. We will not show your content to other
          users outside your workspace.
        </Body>

        <H2>4. Acceptable use</H2>
        <Body>You agree not to use CreOps to:</Body>
        <ul className="space-y-2 text-[15px] text-text-muted leading-relaxed mb-8 pl-4 list-disc marker:text-text-subtle">
          <li>Violate any law, regulation, or third-party right.</li>
          <li>
            Send spam, phishing emails, or harassment via our invite
            email system.
          </li>
          <li>
            Reverse engineer, scrape, or attempt to access other
            users&apos; data.
          </li>
          <li>
            Upload malware, attempt denial-of-service, or otherwise
            interfere with the service.
          </li>
          <li>
            Misuse the social-channel integrations (we&apos;re bound by
            YouTube, Meta, TikTok&apos;s terms — if you do, we have to
            disconnect you).
          </li>
        </ul>
        <Body>
          We may suspend or terminate accounts that violate these terms
          without prior notice if the activity is serious.
        </Body>

        <H2>5. Pricing</H2>
        <Body>
          CreOps is currently free during early access. We will give at
          least 30 days&apos; notice before charging for any feature
          you&apos;re already using.
        </Body>
        <Body>
          Free-plan limits (members, workspaces) are displayed in the
          product and may change. Existing teams will keep their then-
          current limits when changes happen, where reasonable.
        </Body>

        <H2>6. Third-party integrations</H2>
        <Body>
          When you connect a social channel (YouTube, TikTok, Meta), you
          also agree to that platform&apos;s terms. We pull data via
          their official APIs in a read-only capacity. If a platform
          revokes our access (theirs or yours), the integration stops
          working and you&apos;ll see an &ldquo;Expired&rdquo; status in
          Insights → Connections.
        </Body>

        <H2>7. Service availability</H2>
        <Body>
          We aim for high uptime but the service is provided &ldquo;as
          is&rdquo; and &ldquo;as available&rdquo;. We don&apos;t
          guarantee uninterrupted access. Planned maintenance is
          announced in-app where possible.
        </Body>

        <H2>8. Ending the agreement</H2>
        <Body>
          You can stop using CreOps anytime by deleting your workspace
          from Settings → Workspaces. That removes your content from our
          database. Soft-deleted backups may persist up to 30 days
          before final purge.
        </Body>
        <Body>
          We can suspend or terminate access for violation of these
          terms, for non-payment (if you&apos;re on a paid plan), or if
          we&apos;re legally required to.
        </Body>

        <H2>9. Disclaimers</H2>
        <Body>
          To the maximum extent permitted by law, CreOps is provided
          without warranties of any kind. We disclaim implied warranties
          of merchantability, fitness for a particular purpose, and
          non-infringement.
        </Body>

        <H2>10. Limitation of liability</H2>
        <Body>
          To the maximum extent permitted by law, our total liability for
          any claim related to the service is limited to the amount you
          paid us in the 12 months before the event giving rise to the
          claim — or, if you&apos;re on the free plan, USD 50.
        </Body>

        <H2>11. Changes to these terms</H2>
        <Body>
          When we change material terms, we will update the &ldquo;last
          updated&rdquo; date at the top and email active users. Your
          continued use after the change date means you accept the new
          terms.
        </Body>

        <H2>12. Governing law</H2>
        <Body>
          These terms are governed by the laws of the jurisdiction where
          our entity is registered. Disputes go to the courts of that
          jurisdiction unless local consumer-protection law gives you a
          different right.
        </Body>

        <H2>13. Contact</H2>
        <Body>
          Email us via the contact listed on the marketing site for any
          legal notice, complaint, or termination request. We&apos;ll
          respond within 30 days.
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
