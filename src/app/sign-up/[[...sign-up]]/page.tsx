import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-title-2 text-text">Get started with CreOps</h1>
          <p className="text-[15px] text-text-muted mt-2">
            Standardize your content workflow in 2 minutes
          </p>
        </div>
        <SignUp
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
