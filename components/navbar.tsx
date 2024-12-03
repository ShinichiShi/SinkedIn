"use client";

import Link from "next/link";
import { ThemeToggle } from "./theme-toggle";
import { Button } from "./ui/button";
import { Home, MessageSquare, Bell, User } from 'lucide-react';

export function Navbar() {
  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <span className="font-bold">SinkedIn</span>
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <div className="flex items-center space-x-4">
            <Link href="/feed">
              <Button variant="ghost" size="icon">
                <Home className="h-[1.2rem] w-[1.2rem]" />
              </Button>
            </Link>
            <Link href="/messages">
              <Button variant="ghost" size="icon">
                <MessageSquare className="h-[1.2rem] w-[1.2rem]" />
              </Button>
            </Link>
            <Button variant="ghost" size="icon">
              <Bell className="h-[1.2rem] w-[1.2rem]" />
            </Button>
            <Link href="/profile">
              <Button variant="ghost" size="icon">
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
