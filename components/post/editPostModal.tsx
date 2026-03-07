"use client";

import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

import { updatePost } from "@/lib/posts";
import { Post } from "@/types/post";

interface EditPostModalProps {
    post: Post;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export default function EditPostModal({ post, open, onOpenChange }: EditPostModalProps) {
    const [title, setTitle] = useState(post.title || "");
    const [blog, setBlog] = useState(post.blog || "");

    const queryClient = useQueryClient();

    useEffect(() => {
        if (open) {
            setTitle(post.title || "");
            setBlog(post.blog || "");
        }
    }, [open, post]);

    const updateMutation = useMutation({
        mutationFn: (data: { title?: string; blog?: string }) => updatePost(post.id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["feed"] });
            queryClient.invalidateQueries({ queryKey: ["post", post.id] });
            queryClient.invalidateQueries({ queryKey: ["posts", "user", post.user_id] });
            onOpenChange(false);
        },
    });

    const handleUpdate = () => {
        const dataToUpdate: { title?: string; blog?: string } = {};
        if (title !== post.title) dataToUpdate.title = title;
        if (blog !== post.blog) dataToUpdate.blog = blog;

        if (Object.keys(dataToUpdate).length > 0) {
            updateMutation.mutate(dataToUpdate);
        } else {
            onOpenChange(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Edit post</DialogTitle>
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
                        onClick={handleUpdate}
                        disabled={updateMutation.isPending}
                        className="w-full"
                    >
                        {updateMutation.isPending ? "Saving..." : "Save Changes"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
