"use client";

import { Heart } from "lucide-react";
import { Post } from "@/types/post";
import { Button } from "@/components/ui/button";

// Needs Changes

interface Props {
  post: Post;
  onLike: () => void;
}

export default function PostCard({ post, onLike }: Props) {
  return (
    <div className="rounded-xl border bg-background p-4 space-y-4">
      
      {/* Author */}
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center text-sm font-semibold">
          {post.user.user_name.toUpperCase()[0]}
        </div>

        <div>
          <p className="text-sm font-medium">
            {post.user.user_name}
          </p>
          <p className="text-xs text-muted-foreground">
            {new Date(post.createdAt).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Content */}
      {post.title && (
        <p className="text-sm leading-relaxed">
          {post.title}
        </p>
      )}

      {/* Media */}
      {post.medias && post.medias.length > 0 && (
        <div className="space-y-3">
          {post.medias.map((media, index) => (
            <div
              key={index}
              className="overflow-hidden rounded-lg border"
            >
              {media.content_type === "image" ? (
                <img
                  src={media.url}
                  alt="Post media"
                  className="w-full max-h-125 object-cover"
                />
              ) : (
                <video
                  src={media.url}
                  controls
                  className="w-full max-h-125 rounded-lg"
                />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-4 pt-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={onLike}
          className="flex items-center gap-1"
        >
          <Heart size={16} className="fill-red-500 text-red-500" />
          {post._count.likes}
        </Button>

        <span className="text-sm text-muted-foreground">
          {post._count.comments} comments
        </span>
      </div>
    </div>
  );
}
