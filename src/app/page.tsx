import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Layers, Users, Sparkles } from "lucide-react";
import { isClerkEnabled } from "@/lib/auth-config";
import { getCurrentUserIdAsync } from "@/lib/current-user";

export const dynamic = "force-dynamic";

/**
 * Public landing page at `/`.
 *
 * - In production (Clerk on): if logged in → redirect to /dashboard.
 *   If not logged in → render the marketing landing.
 * - In dev (Clerk off): always redirect to /dashboard since impersonation
 *   handles "logged in" state implicitly.
 *
 * The proxy.ts allows / to be public so logged-out visitors see this
 * page instead of being slapped with a generic Clerk sign-in form.
 */
export default async function LandingPage() {
  const clerkOn = await isClerkEnabled();

  // Dev mode — no real auth, just go straight to the dashboard
  if (!clerkOn) {
    redirect("/dashboard");
  }

  // Prod mode — if logged in, skip the landing
  const userId = await getCurrentUserIdAsync();
  if (userId) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-bg">
      {/* Top nav */}
      <header className="px-8 py-5 flex items-center justify-between max-w-6xl mx-auto">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center">
            <span className="font-semibold text-[13px] text-accent leading-none">
              CO
            </span>
          </div>
          <span className="text-[17px] font-semibold tracking-tight">CreOps</span>
        </div>
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
      </header>

      {/* Hero */}
      <main className="px-8 max-w-6xl mx-auto">
        <section className="pt-20 pb-24 text-center">
          <p className="text-[15px] text-accent font-medium mb-5 inline-flex items-center gap-2 bg-accent/10 px-3 py-1 rounded-full">
            <Sparkles className="w-3.5 h-3.5" strokeWidth={1.75} />
            Content workflow for creator teams
          </p>
          <h1 className="text-[56px] font-semibold tracking-tight leading-[1.05] text-text mb-6 max-w-3xl mx-auto">
            One source video.<br />
            <span className="text-text-muted">Many formats. Many channels.</span>
          </h1>
          <p className="text-[19px] text-text-muted leading-relaxed max-w-2xl mx-auto mb-10">
            Standardize how your team turns one piece of content into a long-form
            video, shorts, blog post, and threads — without losing track of who
            owes what.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link
              href="/sign-up"
              className="btn-primary text-[15px] inline-flex items-center gap-2 px-6 py-3"
            >
              Start free
              <ArrowRight className="w-4 h-4" strokeWidth={2.25} />
            </Link>
            <Link
              href="/sign-in"
              className="text-[15px] px-5 py-3 rounded-full border border-border bg-surface hover:bg-surface-hover text-text-muted hover:text-text transition-colors"
            >
              Sign in
            </Link>
          </div>
          <p className="text-[13px] text-text-subtle mt-5">
            Free forever for teams up to 5 · No credit card
          </p>
        </section>

        {/* Features */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-5 pb-20">
          <FeatureCard
            icon={<Layers className="w-5 h-5" strokeWidth={1.75} />}
            title="One source, N deliverables"
            body="Long video, shorts, blog, posts, threads. Auto-spawned tasks per template, assignable per channel."
          />
          <FeatureCard
            icon={<Users className="w-5 h-5" strokeWidth={1.75} />}
            title="Multi-assignee + watchers"
            body="Assign tasks to multiple people. Add watchers who get every progress update without doing the work themselves."
          />
          <FeatureCard
            icon={<Sparkles className="w-5 h-5" strokeWidth={1.75} />}
            title="Approve / Request changes"
            body="Creator reviews submitted output, approves or sends back with reason. State machine prevents invalid transitions."
          />
        </section>

        {/* Footer CTA */}
        <section className="border-t border-border pt-16 pb-20 text-center">
          <h2 className="text-[34px] font-semibold tracking-tight text-text mb-4">
            Ready to standardize your workflow?
          </h2>
          <p className="text-[17px] text-text-muted mb-8 max-w-xl mx-auto">
            Set up your team in 2 minutes. First topic shipped same day.
          </p>
          <Link
            href="/sign-up"
            className="btn-primary text-[15px] inline-flex items-center gap-2 px-6 py-3"
          >
            Get started free
            <ArrowRight className="w-4 h-4" strokeWidth={2.25} />
          </Link>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border px-8 py-8 text-center">
        <p className="text-[13px] text-text-subtle">
          CreOps · Content workflow platform
        </p>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="bg-surface rounded-2xl border border-border p-6">
      <div className="w-10 h-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center mb-4">
        {icon}
      </div>
      <h3 className="text-[17px] font-semibold text-text mb-2">{title}</h3>
      <p className="text-[14px] text-text-muted leading-relaxed">{body}</p>
    </div>
  );
}
