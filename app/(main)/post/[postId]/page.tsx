"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchPostById, toggleLikePost, deletePost } from "@/lib/posts";
import CommentSection from "@/components/post/commentSection";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, Heart, Trash2, Edit2 } from "lucide-react";
import EditPostModal from "@/components/post/editPostModal";
import { useState } from "react";

function timeAgo(date: string) {
    const now = Date.now();
    const then = new Date(date).getTime();
    const diff = Math.floor((now - then) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return new Date(date).toLocaleDateString();
}

export default function PostDetailPage() {
    const { postId } = useParams<{ postId: string }>();
    const router = useRouter();
    const user = useAuthStore((s) => s.user);
    const queryClient = useQueryClient();
    const id = parseInt(postId);
    const [editOpen, setEditOpen] = useState(false);

    const { data: post, isLoading } = useQuery({
        queryKey: ["post", id],
        queryFn: () => fetchPostById(id),
        enabled: !isNaN(id),
    });

    const likeMutation = useMutation({
        mutationFn: () => toggleLikePost(id),
        onMutate: async () => {
            await queryClient.cancelQueries({ queryKey: ["post", id] });
            const prev = queryClient.getQueryData(["post", id]);
            queryClient.setQueryData(["post", id], (old: any) =>
                old ? { ...old, isLiked: !old.isLiked, likeCount: old.isLiked ? old.likeCount - 1 : old.likeCount + 1 } : old
            );
            return { prev };
        },
        onError: (_, __, ctx) => queryClient.setQueryData(["post", id], ctx?.prev),
    });

    const deleteMutation = useMutation({
        mutationFn: () => deletePost(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["feed"] });
            router.push("/feed");
        },
    });

    if (isLoading) {
        return (
            <div className="mx-auto max-w-2xl p-4 space-y-4 animate-pulse">
                <div className="h-4 w-24 bg-muted rounded" />
                <div className="rounded-xl border bg-card p-6 space-y-4">
                    <div className="flex gap-3">
                        <div className="h-10 w-10 rounded-full bg-muted" />
                        <div className="space-y-2 flex-1">
                            <div className="h-3 w-32 bg-muted rounded" />
                            <div className="h-2 w-20 bg-muted rounded" />
                        </div>
                    </div>
                    <div className="h-6 w-3/4 bg-muted rounded" />
                    <div className="space-y-2">
                        <div className="h-3 w-full bg-muted rounded" />
                        <div className="h-3 w-5/6 bg-muted rounded" />
                    </div>
                </div>
            </div>
        );
    }

    if (!post) {
        return (
            <div className="mx-auto max-w-2xl p-4 text-center text-muted-foreground pt-20">
                Post not found.
            </div>
        );
    }

    const isOwner = user?.id === post.user_id;

    return (
        <div className="mx-auto max-w-2xl p-4 space-y-4 overflow-y-auto h-full no-scrollbar pb-12">
            <Button variant="ghost" size="sm" onClick={() => router.back()} className="gap-1.5">
                <ArrowLeft size={16} />
                Back
            </Button>

            {/* Post */}
            <div className="rounded-xl border bg-card p-5 space-y-4">
                <div className="flex items-center justify-between">
                    <Link href={`/profile/${post.user.id}`} className="flex items-center gap-2.5 group">
                        <div className="h-10 w-10 rounded-full bg-muted overflow-hidden flex items-center justify-center font-bold">
                            {post.user.picture_url ? (
                                <img src={post.user.picture_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                                post.user.user_name.charAt(0).toUpperCase()
                            )}
                        </div>
                        <div>
                            <p className="font-semibold group-hover:underline">{post.user.user_name}</p>
                            <p className="text-xs text-muted-foreground">{timeAgo(post.createdAt)}</p>
                        </div>
                    </Link>

                    {isOwner && (
                        <div className="flex items-center gap-1">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="text-muted-foreground hover:text-foreground h-8 w-8"
                                onClick={() => setEditOpen(true)}
                            >
                                <Edit2 size={16} />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="text-muted-foreground hover:text-destructive h-8 w-8"
                                onClick={() => deleteMutation.mutate()}
                                disabled={deleteMutation.isPending}
                            >
                                <Trash2 size={16} />
                            </Button>
                        </div>
                    )}
                </div>

                <div className="space-y-2">
                    {post.title && <h1 className="text-xl font-bold leading-snug">{post.title}</h1>}
                    {post.blog && <p className="text-sm leading-relaxed text-muted-foreground">{post.blog}</p>}
                </div>

                {post.medias && post.medias.length > 0 && (
                    <div className={`grid gap-1 overflow-hidden rounded-lg ${post.medias.length > 1 ? "grid-cols-2" : "grid-cols-1"}`}>
                        {post.medias.map((media, i) => (
                            <div key={i} className="aspect-video overflow-hidden">
                                {media.content_type.startsWith("image") ? (
                                    <img src={media.url} alt="Post media" className="w-full h-full object-cover" />
                                ) : (
                                    <video src={media.url} controls className="w-full h-full" />
                                )}
                            </div>
                        ))}
                    </div>
                )}

                <div className="flex items-center gap-1 pt-1 border-t">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => likeMutation.mutate()}
                        className={`flex items-center gap-1.5 h-8 px-2 ${post.isLiked ? "text-red-500" : "text-muted-foreground hover:text-red-500"}`}
                    >
                        <Heart size={16} className={post.isLiked ? "fill-red-500" : ""} />
                        <span className="text-xs font-medium">{post.likeCount} likes</span>
                    </Button>
                </div>
            </div>

            {/* Comments */}
            <div className="rounded-xl border bg-card p-5">
                <CommentSection postId={id} />
            </div>

            <EditPostModal post={post} open={editOpen} onOpenChange={setEditOpen} />
        </div>
    );
}
