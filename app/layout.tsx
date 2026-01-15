import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "../components/theme-provider";
import { Toaster } from "sonner";
import Header from "../components/header";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { ConvexClientProvider } from "./ConvexClientProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "AI Content Platform",
  description: "",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>{/* <link rel="icon" href="/logo-text.png" sizes="any" /> */}</head>
      <body className={`${inter.className}`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <ClerkProvider
            publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
            appearance={{
              baseTheme: dark,
              variables: {
                colorBackground: "#0B0D10",
                colorInputBackground: "#111318",
                colorInputText: "#ffffff",
                colorText: "#ffffff",
                colorTextSecondary: "#a0a0a0",
                colorPrimary: "#a855f7",
                colorDanger: "#ef4444",
                borderRadius: "0.5rem",
                fontFamily: inter.style.fontFamily,
              },
              elements: {
                formButtonPrimary: "bg-gradient-to-b from-[#F5F5F5] to-[#D4D4D8] text-[#0B0D10] border border-[#E5E7EB] rounded-[10px] font-medium hover:from-[#FAFAFA] hover:to-[#E4E4E7] active:from-[#E4E4E7] active:to-[#C4C4C8] shadow-xs",
                card: "bg-[#111318] border border-[#1F2228]",
                headerTitle: "text-white",
                headerSubtitle: "text-gray-400",
                socialButtonsBlockButton: "bg-[#111318] border border-[#1F2228] hover:bg-[#16181D]",
                formFieldInput: "bg-[#111318] border-[#1F2228] text-white",
                formFieldLabel: "text-gray-300",
                dividerLine: "bg-zinc-800",
                dividerText: "text-gray-400",
                footerActionLink: "text-purple-400 hover:text-purple-300",
              },
            }}
            afterSignOutUrl="/"
          >
            <ConvexClientProvider>
              <Header />
              <main className="min-h-screen text-white overflow-x-hidden relative z-10">
                <Toaster richColors />

                {children}
              </main>
            </ConvexClientProvider>
          </ClerkProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}