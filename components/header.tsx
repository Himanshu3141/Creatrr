"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import {
  SignInButton,
  SignUpButton,
  UserButton,
  SignedIn,
  SignedOut,
  SignOutButton,
} from "@clerk/nextjs";
import { useStoreUserEffect as useStoreUser } from "../hooks/use-store-user";
import { BarLoader } from "react-spinners";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "./ui/button";
import { LayoutDashboard } from "lucide-react";
import Logo from "./logo";

export default function Header() {
  const { isLoading, isAuthenticated } = useStoreUser();
  const path = usePathname();
  const router = useRouter();

  // Redirect authenticated users from landing page to feed
  useEffect(() => {
    if (!isLoading && isAuthenticated && path === "/") {
      router.push("/feed");
    }
  }, [isLoading, isAuthenticated, path, router]);

  // Hide header on dashboard and public profile/post pages
  if (path.includes("/dashboard")) {
    return null;
  }

  // Hide header on public profile and post pages (but not on feed)
  if (path !== "/" && path !== "/feed" && path.split("/").length >= 2) {
    return null;
  }

  return (
    <header className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-3xl px-4">
      {/* Center - Glass Navigation Container */}
      <div 
        className="backdrop-blur-md border border-[#1F2228] rounded-full px-4 sm:px-6 md:px-8 py-3 flex items-center justify-between gap-2"
        style={{
          background: "linear-gradient(180deg, #0B0D10 0%, #0E1117 40%, #111318 100%)",
        }}
      >
        {/* Logo */}
        <Logo 
          href={isAuthenticated ? "/feed" : "/"} 
          size="md"
        />

        {/* Navigation for landing page only - Hidden on mobile to save space */}
        {path === "/" && (
          <div className="hidden lg:flex space-x-6 flex-1 justify-center">
            <Link
              href="#features"
              className="text-[#EDEEF0] font-medium transition-all duration-300 hover:text-[#D1D5DB] cursor-pointer"
            >
              Features
            </Link>
            <Link
              href="#testimonials"
              className="text-[#EDEEF0] font-medium transition-all duration-300 hover:text-[#D1D5DB] cursor-pointer"
            >
              Testimonials
            </Link>
          </div>
        )}

        {/* Auth Actions */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <SignedIn>
            {/* Show Dashboard link on feed page */}
            {path === "/feed" && (
              <Link href="/dashboard">
                <Button variant="outline" className="hidden sm:flex" size="sm">
                  <LayoutDashboard className="h-4 w-4" />
                  <span className="hidden md:inline ml-2">Dashboard</span>
                </Button>
              </Link>
            )}

            <UserButton
              appearance={{
                elements: {
                  avatarBox: "w-8 h-8 rounded-lg border border-[#1F2228]",
                  userButtonPopoverCard:
                    "shadow-xl backdrop-blur-md bg-[#111318] border border-[#1F2228]",
                  userPreviewMainIdentifier: "font-semibold text-[#EDEEF0]",
                },
              }}
            />

            {/* Explicit logout button (modern API) */}
            <SignOutButton redirectUrl="/">
              <Button variant="glass" size="sm" className="hidden sm:inline-flex">
                Logout
              </Button>
            </SignOutButton>
          </SignedIn>

          <SignedOut>
            <SignInButton>
              <Button variant="glass" className="" size="sm">
                Sign In
              </Button>
            </SignInButton>

            <SignUpButton>
              <Button variant="primary" size="sm" className="whitespace-nowrap">
                Get Started
              </Button>
            </SignUpButton>
          </SignedOut>
        </div>

        {isLoading && (
          <div className="fixed bottom-0 left-0 w-full z-40 flex justify-center">
            <BarLoader width={"95%"} color="#D8B4FE" />
          </div>
        )}
      </div>
    </header>
  );
}
