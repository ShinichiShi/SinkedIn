"use client";

import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { MapPin, Pencil } from "lucide-react";

export function ProfileHeader() {
  return (
    <div className="relative">
      <div className="h-32 bg-gradient-to-r from-red-400 to-red-600 rounded-t-lg"></div>
      <div className="p-6">
        <Avatar className="w-32 h-32 border-4 border-background absolute -top-16 left-6" />
        <div className="mt-16">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold">John Doe</h1>
              <p className="text-muted-foreground">Professional Dream Chaser | Serial Job Rejectee</p>
              <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>Parents' Basement, Somewhere</span>
              </div>
            </div>
            <Button variant="outline" size="sm">
              <Pencil className="h-4 w-4 mr-2" />
              Edit Failures
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}