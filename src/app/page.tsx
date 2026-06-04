import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  Layers,
  Users,
  Sparkles,
  Briefcase,
  Mail,
  TrendingUp,
  Check,
  CheckCircle2,
  Clock,
  FileText,
  Plug,
  Send,
} from "lucide-react";
import { isClerkEnabled } from "@/lib/auth-config";
import { getCurrentUserIdAsync } from "@/lib/current-user";
import { MarketingFooter } from "@/components/marketing-footer";

export const dynamic = "force-dynamic";

/**
 * Public landing page at `/`.
 *
 * - Production (Clerk on): if logged in → /dashboard. Else render this.
 * - Dev (Clerk off): always /dashboard since impersonation handles
 *   "logged in" implicitly.
 *
 * proxy.ts allowlists `/` so logged-out visitors see this page instead
 * of a generic Clerk sign-in slap.
 */
export default async function LandingPage() {
  const clerkOn = await isClerkEnabled();
  if (!clerkOn) redirect("/dashboard");

  const userId = await getCurrentUserIdAsync();
  if (userId) redirect("/dashboard");

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <TopNav />
      <main className="flex-1">
        <Hero />
        <SocialProof />
        <HowItWorks />
        <Features />
        <Pricing />
        <FinalCTA />
      </main>
      <MarketingFooter />
    </div>
  );
}

// ============================================================================
// Top nav
// ============================================================================

function TopNav() {
  return (
    <header className="sticky top-0 z-30 bg-bg/85 backdrop-blur-md border-b border-border">
      <div className="px-6 sm:px-8 py-4 flex items-center justify-between max-w-6xl mx-auto">
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

        <nav className="hidden sm:flex items-center gap-7 text-[14px] text-text-muted">
          <a
            href="#how-it-works"
            className="hover:text-text transition-colors"
          >
            How it works
          </a>
          <a
            href="#features"
            className="hover:text-text transition-colors"
          >
            Features
          </a>
          <a
            href="#pricing"
            className="hover:text-text transition-colors"
          >
            Pricing
          </a>
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/sign-in"
            className="text-[14px] text-text-muted hover:text-text transition-colors"
          >
            Sign in
          </Link>
          <Link
            href="/sign-up"
            className="btn-primary text-[14px] inline-flex items-center gap-1.5"
          >
            Get started
            <ArrowRight className="w-3.5 h-3.5" strokeWidth={2.25} />
          </Link>
        </div>
      </div>
    </header>
  );
}

// ============================================================================
// Hero
// ============================================================================

function Hero() {
  return (
    <section className="px-6 sm:px-8 max-w-6xl mx-auto pt-16 sm:pt-24 pb-20 text-center">
      <p className="text-[14px] text-accent font-medium mb-5 inline-flex items-center gap-2 bg-accent/10 px-3 py-1.5 rounded-full">
        <Sparkles className="w-3.5 h-3.5" strokeWidth={1.75} />
        Content workflow built for creator teams
      </p>
      <h1 className="text-[44px] sm:text-[60px] font-semibold tracking-tight leading-[1.05] text-text mb-6 max-w-3xl mx-auto">
        Ship every idea as a long video, a short, a blog, and a thread{" "}
        <span className="text-accent">— from one place.</span>
      </h1>
      <p className="text-[18px] sm:text-[19px] text-text-muted leading-relaxed max-w-2xl mx-auto mb-10">
        CreOps standardizes how your team turns one piece of source content
        into every format your channels need — and tracks who owes what
        until each one is live.
      </p>
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <Link
          href="/sign-up"
          className="btn-primary text-[15px] inline-flex items-center gap-2 px-6 py-3 w-full sm:w-auto justify-center"
        >
          Start free
          <ArrowRight className="w-4 h-4" strokeWidth={2.25} />
        </Link>
        <Link
          href="/sign-in"
          className="text-[15px] px-5 py-3 rounded-full border border-border bg-surface hover:bg-surface-hover text-text-muted hover:text-text transition-colors w-full sm:w-auto text-center"
        >
          Sign in
        </Link>
      </div>
      <p className="text-[13px] text-text-subtle mt-5 inline-flex items-center gap-1.5">
        <Check className="w-3 h-3 text-accent" strokeWidth={2.5} />
        Free forever for teams up to 5 · No credit card
      </p>
    </section>
  );
}

// ============================================================================
// Social proof — honest "early access" framing
// ============================================================================

function SocialProof() {
  return (
    <section className="border-y border-border bg-surface/40 py-8">
      <div className="max-w-6xl mx-auto px-6 sm:px-8">
        <p className="text-[12px] uppercase tracking-wider text-text-subtle font-semibold text-center mb-6">
          Built for the workflow real creator teams actually run
        </p>
        <div className="grid grid-cols-3 gap-4 sm:gap-8 text-center">
          <Stat value="1 source" label="produces 5 deliverables" />
          <Stat value="4 channels" label="connected for reporting" />
          <Stat value="0 spreadsheets" label="needed to ship a topic" />
        </div>
      </div>
    </section>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <p className="text-[22px] sm:text-[28px] font-semibold text-accent tabular-nums leading-tight">
        {value}
      </p>
      <p className="text-[13px] text-text-muted mt-1">{label}</p>
    </div>
  );
}

// ============================================================================
// How it works — 3-step visual
// ============================================================================

function HowItWorks() {
  const steps = [
    {
      n: "01",
      icon: FileText,
      title: "Brief one topic",
      body: "Name the topic, drop the source video or notes, pick which formats you want — long video, shorts, blog, thread.",
    },
    {
      n: "02",
      icon: CheckCircle2,
      title: "Auto-spawn deliverables + tasks",
      body: "CreOps generates the right tasks per format (edit, copy, thumbnail, schedule). Assign people, set due dates.",
    },
    {
      n: "03",
      icon: TrendingUp,
      title: "Ship, then see how it performed",
      body: "Mark aired with the published URL. Performance dashboard pulls real numbers back from each connected channel.",
    },
  ];
  return (
    <section
      id="how-it-works"
      className="px-6 sm:px-8 max-w-6xl mx-auto py-20"
    >
      <div className="text-center mb-14">
        <p className="text-[12px] uppercase tracking-wider text-text-subtle font-semibold mb-3">
          How it works
        </p>
        <h2 className="text-[34px] sm:text-[40px] font-semibold tracking-tight text-text">
          One topic in.{" "}
          <span className="text-text-muted">Five deliverables out.</span>
        </h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {steps.map((s) => {
          const Icon = s.icon;
          return (
            <div
              key={s.n}
              className="bg-surface rounded-2xl border border-border p-6"
            >
              <div className="flex items-center justify-between mb-5">
                <span className="text-[12px] font-mono text-text-subtle tracking-wider">
                  {s.n}
                </span>
                <Icon
                  className="w-5 h-5 text-accent"
                  strokeWidth={1.75}
                />
              </div>
              <h3 className="text-[18px] font-semibold text-text mb-2">
                {s.title}
              </h3>
              <p className="text-[14px] text-text-muted leading-relaxed">
                {s.body}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ============================================================================
// Features grid — what's actually built
// ============================================================================

function Features() {
  const items = [
    {
      icon: Layers,
      title: "One source, many deliverables",
      body: "Long video, shorts, blog, posts, threads. Tasks auto-generated per template and assignable per channel.",
    },
    {
      icon: Users,
      title: "Multi-assignee + watchers",
      body: "Assign tasks to multiple people. Add watchers who get every progress update without doing the work.",
    },
    {
      icon: CheckCircle2,
      title: "Approve / Request changes",
      body: "Creator reviews submitted output, approves or sends back with reason. State machine prevents invalid moves.",
    },
    {
      icon: Briefcase,
      title: "Multiple private workspaces",
      body: "Run separate spaces per client, brand, or project. Switch in the sidebar — content stays scoped.",
    },
    {
      icon: Mail,
      title: "Email invites that just work",
      body: "Send a real email link. Teammate clicks, signs up, lands inside your workspace automatically.",
    },
    {
      icon: TrendingUp,
      title: "Performance reporting back into topics",
      body: "Connect YouTube, TikTok, Meta. We pull view counts, watch time, engagement — never post on your behalf.",
    },
  ];
  return (
    <section
      id="features"
      className="px-6 sm:px-8 max-w-6xl mx-auto py-20 border-t border-border"
    >
      <div className="text-center mb-14">
        <p className="text-[12px] uppercase tracking-wider text-text-subtle font-semibold mb-3">
          What you get
        </p>
        <h2 className="text-[34px] sm:text-[40px] font-semibold tracking-tight text-text">
          Everything between idea and aired.
        </h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.title}
              className="bg-surface rounded-2xl border border-border p-6"
            >
              <div className="w-10 h-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center mb-4">
                <Icon className="w-5 h-5" strokeWidth={1.75} />
              </div>
              <h3 className="text-[16px] font-semibold text-text mb-2">
                {item.title}
              </h3>
              <p className="text-[13px] text-text-muted leading-relaxed">
                {item.body}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ============================================================================
// Pricing — honest about Pro being placeholder
// ============================================================================

function Pricing() {
  return (
    <section
      id="pricing"
      className="px-6 sm:px-8 max-w-6xl mx-auto py-20 border-t border-border"
    >
      <div className="text-center mb-12">
        <p className="text-[12px] uppercase tracking-wider text-text-subtle font-semibold mb-3">
          Pricing
        </p>
        <h2 className="text-[34px] sm:text-[40px] font-semibold tracking-tight text-text mb-3">
          Free while we&apos;re in early access.
        </h2>
        <p className="text-[16px] text-text-muted max-w-xl mx-auto">
          Everything below is free. Pro tier ships when we add billing —
          existing teams keep their current limits.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto">
        <PricingCard
          name="Free"
          price="$0"
          subtitle="Everything you need to ship"
          highlighted
          features={[
            "Up to 5 team members per workspace",
            "Up to 3 private workspaces",
            "Unlimited topics + deliverables",
            "Multi-format spawn (video, blog, posts)",
            "Email invites",
            "Performance dashboard with social channel data",
          ]}
          ctaLabel="Start free"
          ctaHref="/sign-up"
        />
        <PricingCard
          name="Pro"
          price="Coming soon"
          subtitle="For larger teams"
          features={[
            "Unlimited team members",
            "Unlimited workspaces",
            "Priority email support",
            "Custom approval workflows",
            "Early access to new platforms (TikTok, IG, Meta)",
            "AI cost subsidy",
          ]}
          ctaLabel="Join waitlist"
          ctaHref="/sign-up"
          disabled
        />
      </div>
    </section>
  );
}

function PricingCard({
  name,
  price,
  subtitle,
  features,
  ctaLabel,
  ctaHref,
  highlighted,
  disabled,
}: {
  name: string;
  price: string;
  subtitle: string;
  features: string[];
  ctaLabel: string;
  ctaHref: string;
  highlighted?: boolean;
  disabled?: boolean;
}) {
  return (
    <div
      className={
        highlighted
          ? "rounded-2xl border-2 border-accent bg-surface p-7 relative"
          : "rounded-2xl border border-border bg-surface p-7"
      }
    >
      {highlighted && (
        <span className="absolute -top-3 left-7 text-[11px] font-semibold uppercase tracking-wider px-3 py-1 rounded-full bg-accent text-accent-fg">
          Current
        </span>
      )}
      <div className="mb-5">
        <h3 className="text-[20px] font-semibold text-text">{name}</h3>
        <p className="text-[13px] text-text-muted mt-1">{subtitle}</p>
      </div>
      <p className="text-[36px] font-semibold text-text mb-1 tabular-nums">
        {price}
      </p>
      <p className="text-[13px] text-text-subtle mb-6">
        {disabled ? "Want it sooner? Tell us." : "per workspace · forever"}
      </p>
      <ul className="space-y-2.5 mb-7">
        {features.map((f) => (
          <li
            key={f}
            className="flex items-start gap-2 text-[13px] text-text-muted leading-relaxed"
          >
            <Check
              className="w-3.5 h-3.5 text-accent mt-0.5 shrink-0"
              strokeWidth={2.5}
            />
            <span>{f}</span>
          </li>
        ))}
      </ul>
      <Link
        href={ctaHref}
        className={
          disabled
            ? "block text-center text-[14px] py-2.5 rounded-full border border-border text-text-muted hover:bg-surface-hover transition-colors"
            : "btn-primary block text-center text-[14px] py-2.5"
        }
      >
        {ctaLabel}
      </Link>
    </div>
  );
}

// ============================================================================
// Final CTA
// ============================================================================

function FinalCTA() {
  return (
    <section className="px-6 sm:px-8 py-20 border-t border-border bg-surface/40">
      <div className="max-w-3xl mx-auto text-center">
        <h2 className="text-[34px] sm:text-[40px] font-semibold tracking-tight text-text mb-4">
          Standardize your workflow in 2 minutes.
        </h2>
        <p className="text-[16px] text-text-muted mb-8 max-w-xl mx-auto">
          Create a workspace, invite your team, brief your first topic. Ship
          the long video, shorts, and blog by end of day.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/sign-up"
            className="btn-primary text-[15px] inline-flex items-center gap-2 px-6 py-3 w-full sm:w-auto justify-center"
          >
            Get started free
            <ArrowRight className="w-4 h-4" strokeWidth={2.25} />
          </Link>
          <Link
            href="#how-it-works"
            className="text-[15px] text-text-muted hover:text-text inline-flex items-center gap-1.5 transition-colors"
          >
            <Clock className="w-3.5 h-3.5" />
            How it works
          </Link>
        </div>
      </div>
    </section>
  );
}
