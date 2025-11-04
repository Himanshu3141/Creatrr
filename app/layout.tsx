import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { ConvexClientProvider } from  "@/app/ConvexClientProvider";
import { dark } from "@clerk/themes";

const inter = Inter({
  subsets: ["latin"],
});

// export const metadata: Metadata = {
//   title: "AI Content Platform",
//   description: "Content Creation Platform powered by AI",
// };

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      appearance={{
        theme: dark, // ✅ correct property name
      }}
    >
      <ConvexClientProvider>
        <html lang="en">
          <body className={inter.className}>
            <ThemeProvider attribute="class" defaultTheme="dark">
              <main className="bg-slate-900 min-h-screen text-white overflow-x-hidden">
                {children}
              </main>
            </ThemeProvider>
          </body>
        </html>
      </ConvexClientProvider>
    </ClerkProvider>
  );
}
