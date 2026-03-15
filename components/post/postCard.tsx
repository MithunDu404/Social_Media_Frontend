"use client";

import { useState } from "react";
import Link from "next/link";
import { Heart, MessageCircle, Trash2, MoreHorizontal, Edit2 } from "lucide-react";
import { Post } from "@/types/post";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
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
  const [fullScreenImage, setFullScreenImage] = useState<string | null>(null);

  return (
    <div className="rounded-2xl glass-card p-4 space-y-3 hover-lift transition-all duration-300">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link href={`/profile/${post.user.id}`} className="flex items-center gap-2.5 group">
          <div className="h-9 w-9 shrink-0 rounded-full bg-muted flex items-center justify-center text-sm font-bold overflow-hidden ring-1 ring-border transition-all duration-300 group-hover:ring-primary/50">
            {post.user.picture_url ? (
              <img src={post.user.picture_url} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
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
            <DropdownMenuContent align="end" className="glass-card border-0">
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
          className={`grid gap-1 overflow-hidden rounded-xl ${post.medias.length === 1 ? "grid-cols-1" :
            post.medias.length === 2 ? "grid-cols-2" :
              "grid-cols-2"
            }`}
        >
          {post.medias.slice(0, 4).map((media, i) => (
            <div key={i} className="aspect-video overflow-hidden rounded-lg">
              {media.content_type.startsWith("image") ? (
                <img 
                  src={media.url} 
                  alt="Post media" 
                  className="w-full h-full object-cover transition-transform duration-500 hover:scale-105 cursor-pointer" 
                  onClick={(e) => { e.preventDefault(); setFullScreenImage(media.url); }}
                />
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
          className={`flex items-center gap-1.5 h-8 px-2 transition-all duration-300 ${post.isLiked ? "text-red-500" : "text-muted-foreground hover:text-red-500"}`}
        >
          <Heart size={16} className={`transition-all duration-300 ${post.isLiked ? "fill-red-500 scale-110" : ""}`} />
          <span className="text-xs font-medium">{post.likeCount}</span>
        </Button>

        <Button variant="ghost" size="sm" className="flex items-center gap-1.5 h-8 px-2 text-muted-foreground hover:text-foreground transition-colors duration-200" asChild>
          <Link href={`/post/${post.id}`}>
            <MessageCircle size={16} />
            <span className="text-xs font-medium">{post.commentCount}</span>
          </Link>
        </Button>
      </div>

      <Dialog open={!!fullScreenImage} onOpenChange={(open) => !open && setFullScreenImage(null)}>
        <DialogContent className="max-w-[90vw] max-h-[90vh] p-0 border-0 bg-transparent shadow-none flex items-center justify-center [&>button]:text-white [&>button]:bg-black/50 [&>button]:hover:bg-black/80 [&>button]:p-2 [&>button]:rounded-full">
          <DialogTitle className="sr-only">Image preview</DialogTitle>
          {fullScreenImage && (
            <img src={fullScreenImage} alt="Full screen" className="max-w-full max-h-[90vh] object-contain rounded-lg" />
          )}
        </DialogContent>
      </Dialog>

      <EditPostModal post={post} open={editOpen} onOpenChange={setEditOpen} />
    </div>
  );
}
