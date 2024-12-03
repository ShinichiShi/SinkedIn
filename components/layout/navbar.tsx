"use client";

import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Home, MessageSquare, Bell, User, BriefcaseX } from "lucide-react";

export function Navbar() {
  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <BriefcaseX className="h-6 w-6" />
            <span className="font-bold">SinkedIn</span>
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <div className="flex items-center space-x-4">
            <Link href="/feed">
              <Button variant="ghost" size="icon" title="Feed">
                <Home className="h-[1.2rem] w-[1.2rem]" />
              </Button>
            </Link>
            <Link href="/messages">
              <Button variant="ghost" size="icon" title="Messages">
                <MessageSquare className="h-[1.2rem] w-[1.2rem]" />
              </Button>
            </Link>
            <Link href="/notifications">
              <Button variant="ghost" size="icon" title="Notifications">
                <Bell className="h-[1.2rem] w-[1.2rem]" />
              </Button>
            </Link>
            <Link href="/profile">
              <Button variant="ghost" size="icon" title="Profile">
                <User className="h-[1.2rem] w-[1.2rem]" />
              </Button>
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </div>
    </nav>
  );
}