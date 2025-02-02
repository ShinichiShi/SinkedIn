"use client";

import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Home, MessageSquare, Bell, User, Briefcase } from "lucide-react";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { firebaseApp } from "@/lib/firebase";
import { motion } from "framer-motion";

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const auth = getAuth(firebaseApp); // Initialize Firebase Auth
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setLoggedIn(!!user); // Set state to true if a user is logged in, false otherwise
    });

    return () => unsubscribe(); // Clean up the listener on component unmount
  }, []);

  // Hide the navbar on the landing page
  if (pathname === "/") {
    return null;
  }

  return (
    <nav className="border-b bg-transparent relative z-50">
      <div className="container flex h-14 justify-between mx-[10%] items-center md:mx-auto">
        <div className="flex md:mr-4">
          <Link href="/" className="flex items-center space-x-2 md:mr-4">
            <span className="font-bold">SinkedIn</span>
          </Link>
        </div>

        <div className="flex flex-1 items-center space-x-2 md:justify-end">
          <div className="hidden items-center space-x-4 md:flex">
            {loggedIn ? (<>
              <Link href="/feed">
              <Button variant="ghost" size="icon" title="Feed">
                <Home className="h-[1.2rem] w-[1.2rem]" />
              </Button>
            </Link>
            {/* <Link href="/messages">
              <Button variant="ghost" size="icon" title="Messages">
                <MessageSquare className="h-[1.2rem] w-[1.2rem]" />
              </Button>
            </Link> */}
            {/* <Link href="/notifications">
              <Button variant="ghost" size="icon" title="Notifications">
                <Bell className="h-[1.2rem] w-[1.2rem]" />
              </Button>
            </Link> */}
            <ThemeToggle />
              <Link href="/profile">
                <Button variant="ghost" size="icon" title="Profile">
                  <User className="h-[1.2rem] w-[1.2rem]" />
                </Button>
              </Link>
              </>
            ) : (
              <>
              <Link href="/login">
                <Button size="sm" title="Login">
                  Login
                </Button>
              </Link>
              <Link href="/register">
                <Button size="sm" title="Login">
                  Sign Up
                </Button>
              </Link>
              </>
            )}
          </div>
              {loggedIn ? (
                <div className="inline-flex items-center justify-center w-screen md:hidden">
                  <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="p-2 h-10 text-sm text-lite rounded-lg"
                >
                  <svg
                    className="w-5 h-5"
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 17 14"
                  >
                    <path
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M1 1h15M1 7h15M1 13h15"
                    />
                  </svg>
                </motion.button>
              </div>
                )
                :(
                  <div className="inline-flex items-center gap-3 justify-center w-[70vw] md:hidden">
                    <Link href="/login">
                      <Button size="sm" title="Login">
                        Login
                      </Button>
                    </Link>
                    <Link href="/register">
                      <Button size="sm" title="Login">
                        Sign Up
                      </Button>
                    </Link>
                  </div>)}
        </div>
      </div>
      <div 
    className={`
      ${isMenuOpen ? "max-h-screen opacity-100" : "max-h-0 opacity-0"} 
      md:hidden 
      fixed 
      top-14 
      left-0 
      w-full 
      z-50 
      transition-all 
      duration-500 
      overflow-hidden
    `} 
    id="navbar-hamburger"
  >
    <ul className="bg-background flex flex-col text-center uppercase font-extrabold">
      <li>
        <Link href="/feed" className="block py-2 px-3 text-white bg-background rounded" aria-current="page" onClick={() => setIsMenuOpen(!isMenuOpen)}>Feed</Link>
      </li>
      <li>
        <Link href="/network" className="block py-2 px-3 text-white bg-background rounded" aria-current="page" onClick={() => setIsMenuOpen(!isMenuOpen)}>Network</Link>
      </li>
      <li>
        {loggedIn ? (
          <Link href="/profile" className="block py-2 px-3 text-white bg-background rounded" aria-current="page" onClick={() => setIsMenuOpen(!isMenuOpen)}>Profile</Link>
        ) : (
          <Link href="/login" className="block py-2 px-3 text-white bg-background rounded" aria-current="page" onClick={() => setIsMenuOpen(!isMenuOpen)}>Login</Link>
        )}
      </li>
    </ul>
  </div>
</nav>
  );
}
