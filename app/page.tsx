"use client";

import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowRight, ThumbsDown, Users, Coffee } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen">
      <main className="container mx-auto px-6 py-16">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center space-y-6"
        >
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
            Welcome to <span className="text-primary">SinkedIn</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            The professional network where failure is the new success. Share your rejections, 
            celebrate your setbacks, and connect with fellow underachievers.
          </p>
          
          <div className="flex gap-4 justify-center mt-8">
            <Link href="/login">
              <Button size="lg">
                Join the Struggle <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/about">
              <Button variant="outline" size="lg">
                See Epic Fails
              </Button>
            </Link>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="grid md:grid-cols-3 gap-8 mt-20"
        >
          <div className="p-6 rounded-lg border bg-card">
            <ThumbsDown className="h-12 w-12 text-primary mb-4" />
            <h3 className="text-xl font-semibold mb-2">Professional Setbacks</h3>
            <p className="text-muted-foreground">Share your rejected applications and celebrate career mishaps.</p>
          </div>
          
          <div className="p-6 rounded-lg border bg-card">
            <Users className="h-12 w-12 text-primary mb-4" />
            <h3 className="text-xl font-semibold mb-2">Failure Network</h3>
            <p className="text-muted-foreground">Connect with others who are equally unsuccessful.</p>
          </div>
          
          <div className="p-6 rounded-lg border bg-card">
            <Coffee className="h-12 w-12 text-primary mb-4" />
            <h3 className="text-xl font-semibold mb-2">Daily Disappointments</h3>
            <p className="text-muted-foreground">Share your daily struggles and workplace disasters.</p>
          </div>
        </motion.div>
      </main>
    </div>
  );
}