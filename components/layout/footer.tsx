"use client"
import { useEffect, useState } from 'react';

export default function Footer() {
  const [hideFooter, setHideFooter] = useState(false);
  let lastScrollY = 0;

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setHideFooter(true);
      } else {
        setHideFooter(false);
      }

      lastScrollY = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <footer
      className={`fixed bottom-0 left-0 w-full border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50 transition-transform duration-300 ${
        hideFooter ? 'translate-y-full' : 'translate-y-0'
      }`}
    >
      <div className="container mx-auto px-4 flex h-14 items-center justify-between py-6">
        <div className='flex md:flex-row flex-col items-start lg:gap-1'>
         <p className="text-sm text-gray-600 dark:text-gray-400">
          © {new Date().getFullYear()} SinkedIn. 
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-400">All rights reserved.</p>
        </div>
       
        <nav className="flex items-center space-x-4">
          <a
            href="/about"
            className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
          >
            About
          </a>
          <a
            href="/privacy"
            className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
          >
            Privacy
          </a>
          <a
            href="/terms"
            className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
          >
            Terms
          </a>
        </nav>
      </div>
    </footer>
  );
}
