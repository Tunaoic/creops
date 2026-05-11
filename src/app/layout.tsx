import type { Metadata } from "next";
import { Toaster } from "sonner";
import "./globals.css";
import { ClerkAwareProvider } from "@/components/clerk-aware-provider";
import { getLocale } from "@/lib/i18n";
import { isClerkEnabled } from "@/lib/auth-config";

export const metadata: Metadata = {
  title: "CreOps — Content Workflow Platform",
  description:
    "1 source → N formats × M channels. Standardize content production for creator teams.",
};

/**
 * Root layout — minimal chrome shared by EVERY route, including public
 * landing, sign-in/sign-up, onboarding, and the authed dashboard.
 *
 * The authed-app chrome (Sidebar, TopBar, StatusBar, CommandPalette) lives
 * in src/app/(app)/layout.tsx so that public pages aren't forced to render
 * a dashboard shell.
 */
export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [locale, clerkOn] = await Promise.all([getLocale(), isClerkEnabled()]);

  // Inline script — runs synchronously before first paint to set [data-theme]
  // from localStorage. Prevents flash of wrong theme on reload.
  const themeBootstrap = `(function(){try{var t=localStorage.getItem('cowork-theme');if(t==='light'||t==='dark'){document.documentElement.setAttribute('data-theme',t)}else{document.documentElement.setAttribute('data-theme','dark')}}catch(e){}})();`;

  return (
    <ClerkAwareProvider clerkEnabled={clerkOn}>
      <html lang={locale} data-theme="dark" suppressHydrationWarning>
        <head>
          <script dangerouslySetInnerHTML={{ __html: themeBootstrap }} />
        </head>
        <body className="min-h-screen">
          {children}
          <Toaster
            position="top-center"
            richColors
            toastOptions={{
              className: "rounded-2xl border-border",
            }}
          />
        </body>
      </html>
    </ClerkAwareProvider>
  );
}
