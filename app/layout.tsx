import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Navbar } from "@/components/layout/navbar";
import { AuthProvider } from "@/contexts/AuthContext";
import Chatbot from "@/components/chatbot";
const inter = Inter({ subsets: ["latin"] });
import { SpeedInsights } from "@vercel/speed-insights/next"
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { clsx } from "clsx";
import { cn } from "@/lib/utils";

import Footer from "@/components/layout/footer";


export default function RootLayout({
  
  children,
}: {
  children: React.ReactNode;
}) {  
    
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <title>SinkedIn</title>
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/favicon.ico" />
        <meta name="description" content="SinkedIn - Share and learn from failures!" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="theme-color" content="#000000" />
      </head>

    <body className="min-h-screen bg-background font-sans antialiased overflow-x-hidden">
  <ThemeProvider   attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
    <AuthProvider>
      <div className="flex min-h-screen flex-col relative">
        <Navbar />
           <ToastContainer 
                position="top-right" 
                autoClose={3000}
                hideProgressBar={false}
                newestOnTop
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="colored"
              />
        <main className="flex-1 pt-16 flex flex-col">
          {children}
        </main>
         <Footer />
              </div>
              {/* <Chatbot /> */}
            </AuthProvider>
          </ThemeProvider>
          <SpeedInsights />
        </body>
    </html>
  );
}
