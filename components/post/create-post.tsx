"use client";

import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Image, Link2 } from "lucide-react";

export function CreatePost() {
  return (
    <Card className="p-4">
      <div className="flex gap-4">
        <Avatar className="w-10 h-10" />
        <div className="flex-1">
          <Textarea placeholder="Share your latest failure..." className="min-h-[100px]" />
          <div className="flex justify-between items-center mt-4">
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Image className="h-4 w-4 mr-2" />
                Add Proof
              </Button>
              <Button variant="outline" size="sm">
                <Link2 className="h-4 w-4 mr-2" />
                Rejection Letter
              </Button>
            </div>
            <Button>Confess</Button>
          </div>
        </div>
      </div>
    </Card>
  );
}