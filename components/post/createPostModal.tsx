"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

import { createPost } from "@/lib/posts";

export default function CreatePostModal() {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [blog, setBlog] = useState("");

  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: createPost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      setTitle("");
      setBlog("");
      setOpen(false);
    },
  });

  const handleCreate = () => {
    if (!title.trim() || !blog.trim()) return;

    createMutation.mutate({
      title,
      blog,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full" size="lg">
          Create Post
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create a post</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Input
            placeholder="Post Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <Textarea
            placeholder="What’s on your mind? (Blog content)"
            value={blog}
            onChange={(e) => setBlog(e.target.value)}
            rows={4}
          />

          <Button
            onClick={handleCreate}
            disabled={createMutation.isPending}
            className="w-full"
          >
            {createMutation.isPending ? "Posting..." : "Post"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
