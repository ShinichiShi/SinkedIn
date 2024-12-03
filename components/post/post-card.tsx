"use client";

import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ThumbsDown, MessageCircle, Share2 } from "lucide-react";
import { motion } from "framer-motion";

interface PostCardProps {
  author: string;
  role: string;
  content: string;
  time: string;
}

export function PostCard({ author, role, content, time }: PostCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="p-4">
        <div className="flex items-center gap-3 mb-4">
          <Avatar className="w-10 h-10" />
          <div>
            <p className="font-semibold">{author}</p>
            <p className="text-sm text-muted-foreground">{role}</p>
            <p className="text-xs text-muted-foreground">{time}</p>
          </div>
        </div>
        
        <p className="mb-4">{content}</p>
        
        <div className="flex gap-4 pt-4 border-t">
          <Button variant="ghost" size="sm">
            <ThumbsDown className="h-4 w-4 mr-2" />
            Relate
          </Button>
          <Button variant="ghost" size="sm">
            <MessageCircle className="h-4 w-4 mr-2" />
            Sympathize
          </Button>
          <Button variant="ghost" size="sm">
            <Share2 className="h-4 w-4 mr-2" />
            Share Pain
          </Button>
        </div>
      </Card>
    </motion.div>
  );
}