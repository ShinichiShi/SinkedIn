"use client";

import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Home, MessageSquare, Bell, User, Briefcase, Menu } from "lucide-react";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { firebaseApp } from "@/lib/firebase";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { FaSailboat } from "react-icons/fa6";

export function Navbar() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const pathname = usePathname();
  const auth = getAuth(firebaseApp);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setLoggedIn(!!user);
    });
    return () => unsubscribe();
  }, [auth]);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Hide the navbar on the landing page
  if (pathname === "/") {
    return null;
  }

  return (
    <nav className={cn(
      "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
      isScrolled ? "bg-white/80 backdrop-blur-md shadow-sm dark:bg-gray-900/80" : "bg-transparent"
    )}>
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <FaSailboat className="text-black dark:text-white w-6 h-6" />
            <span className="font-bold text-xl">SinkedIn</span>
          </Link>

          <div className="hidden md:flex items-center space-x-6">
            {loggedIn ? (
              <>
                <Link href="/feed">
                  <Button variant="ghost" size="sm" className="hover:bg-primary/10">
                    <Home className="h-4 w-4 mr-2" />
                    Feed
                  </Button>
                </Link>
                <Link href="/network">
                  <Button variant="ghost" size="sm" className="hover:bg-primary/10">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Network
                  </Button>
                </Link>
                <ThemeToggle />
                <Link href="/profile">
                  <Button variant="outline" size="sm" className="hover:bg-primary/10">
                    <User className="h-4 w-4 mr-2" />
                    Profile
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" size="sm">Login</Button>
                </Link>
                <Link href="/register">
                  <Button variant="default" size="sm">Sign Up</Button>
                </Link>
              </>
            )}
          </div>

          <button
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isMenuOpen && (          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t dark:border-gray-800 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md shadow-lg"
          >
            <div className="container mx-auto px-4 py-4 space-y-3">
              {loggedIn ? (
                <>
                  <Link href="/feed" className="block">
                    <Button variant="ghost" size="sm" className="w-full justify-start">
                      <Home className="h-4 w-4 mr-2" />
                      Feed
                    </Button>
                  </Link>
                  <Link href="/network" className="block">
                    <Button variant="ghost" size="sm" className="w-full justify-start">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Network
                    </Button>
                  </Link>
                  <Link href="/profile" className="block">
                    <Button variant="ghost" size="sm" className="w-full justify-start">
                      <User className="h-4 w-4 mr-2" />
                      Profile
                    </Button>
                  </Link>
                </>
              ) : (
                <div className="space-y-2">
                  <Link href="/login" className="block">
                    <Button variant="ghost" size="sm" className="w-full">Login</Button>
                  </Link>
                  <Link href="/register" className="block">
                    <Button variant="default" size="sm" className="w-full">Sign Up</Button>
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
