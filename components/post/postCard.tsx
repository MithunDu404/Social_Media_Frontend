"use client";

import { useState } from "react";
import Link from "next/link";
import { Heart, MessageCircle, Trash2, MoreHorizontal, Edit2 } from "lucide-react";
import { Post } from "@/types/post";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuthStore } from "@/store/authStore";
import EditPostModal from "./editPostModal";

function timeAgo(date: string) {
  const now = Date.now();
  const then = new Date(date).getTime();
  const diff = Math.floor((now - then) / 1000);
  if (diff < 60) return `${diff}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}

interface Props {
  post: Post;
  onLike: () => void;
  onDelete?: () => void;
}

export default function PostCard({ post, onLike, onDelete }: Props) {
  const user = useAuthStore((s) => s.user);
  const isOwner = user?.id === post.user_id;
  const [editOpen, setEditOpen] = useState(false);

  return (
    <div className="rounded-xl border bg-card p-4 space-y-3 hover:bg-muted/30 transition-colors">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link href={`/profile/${post.user.id}`} className="flex items-center gap-2.5 group">
          <div className="h-9 w-9 shrink-0 rounded-full bg-muted flex items-center justify-center text-sm font-bold overflow-hidden">
            {post.user.picture_url ? (
              <img src={post.user.picture_url} alt="" className="w-full h-full object-cover" />
            ) : (
              post.user.user_name.charAt(0).toUpperCase()
            )}
          </div>
          <div>
            <p className="text-sm font-semibold group-hover:underline">{post.user.user_name}</p>
            <p className="text-xs text-muted-foreground">
              {timeAgo(post.createdAt)}
              {new Date(post.updatedAt).getTime() - new Date(post.createdAt).getTime() > 5000 && (
                <span className="ml-1.5 text-xs text-muted-foreground/70 italic">· Edited {timeAgo(post.updatedAt)} ago</span>
              )}
            </p>
          </div>
        </Link>

        {isOwner && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal size={16} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setEditOpen(true)}>
                <Edit2 size={14} className="mr-2" />
                Edit post
              </DropdownMenuItem>
              {onDelete && (
                <DropdownMenuItem
                  onClick={onDelete}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 size={14} className="mr-2" />
                  Delete post
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Content */}
      <Link href={`/post/${post.id}`} className="block space-y-1">
        {post.title && (
          <h3 className="text-base font-semibold leading-snug">{post.title}</h3>
        )}
        {post.blog && (
          <p className="text-sm leading-relaxed text-muted-foreground line-clamp-4">{post.blog}</p>
        )}
      </Link>

      {/* Media */}
      {post.medias && post.medias.length > 0 && (
        <div
          className={`grid gap-1 overflow-hidden rounded-lg ${post.medias.length === 1 ? "grid-cols-1" :
            post.medias.length === 2 ? "grid-cols-2" :
              "grid-cols-2"
            }`}
        >
          {post.medias.slice(0, 4).map((media, i) => (
            <div key={i} className="aspect-video overflow-hidden">
              {media.content_type.startsWith("image") ? (
                <img src={media.url} alt="Post media" className="w-full h-full object-cover" />
              ) : (
                <video src={media.url} controls className="w-full h-full object-cover" />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-1 pt-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={onLike}
          className={`flex items-center gap-1.5 h-8 px-2 ${post.isLiked ? "text-red-500" : "text-muted-foreground hover:text-red-500"}`}
        >
          <Heart size={16} className={post.isLiked ? "fill-red-500" : ""} />
          <span className="text-xs font-medium">{post.likeCount}</span>
        </Button>

        <Button variant="ghost" size="sm" className="flex items-center gap-1.5 h-8 px-2 text-muted-foreground" asChild>
          <Link href={`/post/${post.id}`}>
            <MessageCircle size={16} />
            <span className="text-xs font-medium">{post.commentCount}</span>
          </Link>
        </Button>
      </div>

      <EditPostModal post={post} open={editOpen} onOpenChange={setEditOpen} />
    </div>
  );
}
