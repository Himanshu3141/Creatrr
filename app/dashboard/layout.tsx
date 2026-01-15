"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  PenTool,
  FileText,
  LayoutGrid,
  Menu,
  X,
  Settings,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UserButton } from "@clerk/nextjs";
import { cn } from "@/lib/utils";
import { api } from "@/convex/_generated/api";
import { useConvexQuery } from "@/hooks/use-convex-query";
import Logo from "@/components/logo";
import type { Doc } from "@/convex/_generated/dataModel";

// Type definitions
type SidebarItem = {
  title: string;
  href: string;
  icon: LucideIcon;
};

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const sidebarItems: SidebarItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Create Post",
    href: "/dashboard/create",
    icon: PenTool,
  },
  {
    title: "My Posts",
    href: "/dashboard/posts",
    icon: FileText,
  },
  {
    title: "Feed",
    href: "/feed",
    icon: LayoutGrid,
  },
];

const convexApi = api as any;

export default function DashboardLayout({
  children,
}: DashboardLayoutProps): React.JSX.Element {
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const pathname: string = usePathname();

  // Get draft info for badge
  const { data: draftPost } = useConvexQuery<Doc<"posts"> | null | undefined>(
    convexApi.posts.getUserDraft
  );

  const toggleSidebar = (): void => setIsSidebarOpen(!isSidebarOpen);

  return (
    <div className="min-h-screen text-[#A1A1AA]">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-[#0B0D10]/80 z-40 lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 h-full w-64 backdrop-blur-sm border-r border-[#1F2228] z-50 transition-transform duration-300 lg:translate-x-0",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
        style={{
          background: "linear-gradient(180deg, #0B0D10 0%, #0E1117 40%, #111318 100%)",
        }}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#1F2228]">
          <Logo href={"/"} size="md" />

          {/* Mobile Close Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="lg:hidden"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-2">
          {sidebarItems.map((item: SidebarItem, index: number) => {
            const isActive: boolean =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));

            return (
              <Link
                key={index}
                href={item.href}
                onClick={() => setIsSidebarOpen(false)}
              >
                <div
                  className={cn(
                    "flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group",
                    isActive
                      ? "bg-[#16181D] border border-[#1F2228] text-[#EDEEF0]"
                      : "text-[#A1A1AA] hover:text-[#EDEEF0] hover:bg-[#111318]"
                  )}
                >
                  <item.icon
                    className={cn(
                      "h-5 w-5 transition-colors",
                      isActive
                        ? "text-[#D1D5DB]"
                        : "text-[#6B7280] group-hover:text-[#EDEEF0]"
                    )}
                  />
                  <span className="font-medium">{item.title}</span>

                  {/* Badge for Create Post if draft exists */}
                  {item.title === "Create Post" && draftPost && (
                    <Badge
                      variant="secondary"
                      className="ml-auto text-xs bg-orange-500/20 text-orange-300 border-orange-500/30"
                    >
                      Draft
                    </Badge>
                  )}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="absolute bottom-4 left-4 right-4">
          <Link href="/dashboard/settings">
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start text-[#A1A1AA] hover:text-[#EDEEF0] rounded-xl p-4"
            >
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <div className="ml-0 lg:ml-64">
        {/* Top Header */}
        <header
          className="fixed w-full top-0 right-0 z-30 backdrop-blur-md border-b border-[#1F2228]"
          style={{
            background: "linear-gradient(180deg, #0B0D10 0%, #0E1117 40%, #111318 100%)",
          }}
          // style={{ left: "auto", width: "calc(100% - 16rem)" }}
        >
          <div className="flex items-center justify-between px-4 lg:px-8 py-4">
            {/* Left Side - Mobile Menu + Search */}
            <div className="flex items-center space-x-4">
              {/* Mobile Menu Button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleSidebar}
                className="lg:hidden"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </div>

            {/* Right Side - Notifications + User */}
            <div className="flex items-center space-x-4">
              {/* User Button */}
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
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="mt-16">{children}</main>
      </div>
    </div>
  );
}