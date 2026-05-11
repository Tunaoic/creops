import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-title-2 text-text">Welcome to CreOps</h1>
          <p className="text-[15px] text-text-muted mt-2">
            Sign in to your content workflow
          </p>
        </div>
        <SignIn
          appearance={{
            elements: {
              rootBox: "mx-auto",
              card: "bg-surface border border-border rounded-2xl shadow-2xl",
            },
          }}
        />
      </div>
    </div>
  );
}
