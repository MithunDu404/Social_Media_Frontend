"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getComments, createComment, deleteComment, toggleCommentLike, updateComment } from "@/lib/comments";
import { getReplies, createReply, deleteReply, toggleReplyLike, updateReply } from "@/lib/replies";
import { Comment, Reply } from "@/types/comment";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Heart, Trash2, ChevronDown, ChevronUp, Send, Edit2 } from "lucide-react";
import Link from "next/link";

function timeAgo(date: string) {
    const now = Date.now();
    const then = new Date(date).getTime();
    const diff = Math.floor((now - then) / 1000);
    if (diff < 60) return `${diff}s`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
    return `${Math.floor(diff / 86400)}d`;
}

function UserAvatar({ name, picture_url, size = "sm" }: { name: string; picture_url?: string | null; size?: "sm" | "md" }) {
    const sz = size === "sm" ? "h-8 w-8 text-xs" : "h-9 w-9 text-sm";
    return (
        <div className={`${sz} shrink-0 rounded-full bg-muted flex items-center justify-center font-bold overflow-hidden`}>
            {picture_url ? (
                <img src={picture_url} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
                name.charAt(0).toUpperCase()
            )}
        </div>
    );
}

function ReplyItem({ reply, postId, commentId }: { reply: Reply; postId: number; commentId: number }) {
    const user = useAuthStore((s) => s.user);
    const queryClient = useQueryClient();
    const [isEditing, setIsEditing] = useState(false);
    const [editReplyText, setEditReplyText] = useState(reply.reply);

    const likeMutation = useMutation({
        mutationFn: () => toggleReplyLike(reply.id),
        onMutate: async () => {
            await queryClient.cancelQueries({ queryKey: ["replies", commentId] });
            const prev = queryClient.getQueryData<Reply[]>(["replies", commentId]);
            queryClient.setQueryData<Reply[]>(["replies", commentId], (old) =>
                old?.map((r) => r.id === reply.id ? { ...r, _count: { likes: (r._count?.likes ?? 0) + 1 } } : r)
            );
            return { prev };
        },
        onError: (_, __, ctx) => queryClient.setQueryData(["replies", commentId], ctx?.prev),
    });

    const deleteMutation = useMutation({
        mutationFn: () => deleteReply(reply.id),
        onSuccess: () => {
            queryClient.setQueryData<Reply[]>(["replies", commentId], (old) =>
                old?.filter((r) => r.id !== reply.id)
            );
            queryClient.invalidateQueries({ queryKey: ["comments", postId] });
        },
    });

    const updateReplyMutation = useMutation({
        mutationFn: () => updateReply(reply.id, editReplyText),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["replies", commentId] });
            setIsEditing(false);
        },
    });

    const handleEditSave = () => {
        if (!editReplyText.trim() || editReplyText === reply.reply) {
            setIsEditing(false);
            return;
        }
        updateReplyMutation.mutate();
    };

    return (
        <div className="flex gap-2.5 pl-4 border-l-2 border-muted">
            <UserAvatar name={reply.user.user_name} picture_url={reply.user.picture_url} />
            <div className="flex-1 space-y-1">
                <div className="bg-muted/50 rounded-xl px-3 py-2">
                    <Link href={`/profile/${reply.user.id}`} className="text-xs font-semibold hover:underline">
                        {reply.user.user_name}
                    </Link>
                    {isEditing ? (
                        <div className="mt-1 space-y-2">
                            <Textarea
                                value={editReplyText}
                                onChange={(e) => setEditReplyText(e.target.value)}
                                className="min-h-[60px] text-sm bg-background"
                            />
                            <div className="flex gap-2 justify-end">
                                <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => { setIsEditing(false); setEditReplyText(reply.reply); }}>
                                    Cancel
                                </Button>
                                <Button size="sm" className="h-7 text-xs" onClick={handleEditSave} disabled={updateReplyMutation.isPending}>
                                    {updateReplyMutation.isPending ? "Saving..." : "Save"}
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <p className="text-sm mt-0.5">{reply.reply}</p>
                    )}
                </div>
                {!isEditing && (
                    <div className="flex items-center gap-2 px-1">
                        <span className="text-xs text-muted-foreground">{timeAgo(reply.createdAt)}</span>
                        <button onClick={() => likeMutation.mutate()} className="text-xs text-muted-foreground hover:text-red-500 flex items-center gap-1">
                            <Heart size={12} /> {reply._count?.likes ?? 0}
                        </button>
                        {user?.id === reply.user_id && (
                            <>
                                <button onClick={() => setIsEditing(true)} className="text-xs text-muted-foreground hover:text-foreground">
                                    <Edit2 size={12} />
                                </button>
                                <button onClick={() => deleteMutation.mutate()} className="text-xs text-muted-foreground hover:text-destructive">
                                    <Trash2 size={12} />
                                </button>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

function CommentItem({ comment, postId }: { comment: Comment; postId: number }) {
    const user = useAuthStore((s) => s.user);
    const queryClient = useQueryClient();
    const [showReplies, setShowReplies] = useState(false);
    const [replyText, setReplyText] = useState("");
    const [showReplyInput, setShowReplyInput] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editCommentText, setEditCommentText] = useState(comment.comment);

    const { data: replies } = useQuery({
        queryKey: ["replies", comment.id],
        queryFn: () => getReplies(comment.id),
        enabled: showReplies,
    });

    const likeMutation = useMutation({
        mutationFn: () => toggleCommentLike(comment.id),
        onMutate: async () => {
            await queryClient.cancelQueries({ queryKey: ["comments", postId] });
            const prev = queryClient.getQueryData<Comment[]>(["comments", postId]);
            queryClient.setQueryData<Comment[]>(["comments", postId], (old) =>
                old?.map((c) => c.id === comment.id ? { ...c, _count: { likes: (c._count?.likes ?? 0) + 1, replies: c._count?.replies ?? 0 } } : c)
            );
            return { prev };
        },
        onError: (_, __, ctx) => queryClient.setQueryData(["comments", postId], ctx?.prev),
    });

    const deleteMutation = useMutation({
        mutationFn: () => deleteComment(comment.id),
        onSuccess: () => {
            queryClient.setQueryData<Comment[]>(["comments", postId], (old) =>
                old?.filter((c) => c.id !== comment.id)
            );
        },
    });

    const replyMutation = useMutation({
        mutationFn: () => createReply(comment.id, replyText),
        onSuccess: (newReply) => {
            queryClient.setQueryData<Reply[]>(["replies", comment.id], (old) =>
                [...(old ?? []), newReply]
            );
            setReplyText("");
            setShowReplies(true);
        },
    });

    const updateCommentMutation = useMutation({
        mutationFn: () => updateComment(comment.id, editCommentText),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["comments", postId] });
            setIsEditing(false);
        },
    });

    const handleEditSave = () => {
        if (!editCommentText.trim() || editCommentText === comment.comment) {
            setIsEditing(false);
            return;
        }
        updateCommentMutation.mutate();
    };

    return (
        <div className="space-y-2">
            <div className="flex gap-2.5">
                <UserAvatar name={comment.user.user_name} picture_url={comment.user.picture_url} />
                <div className="flex-1 space-y-1">
                    <div className="bg-muted/50 rounded-xl px-3 py-2">
                        <Link href={`/profile/${comment.user.id}`} className="text-xs font-semibold hover:underline">
                            {comment.user.user_name}
                        </Link>
                        {isEditing ? (
                            <div className="mt-1 space-y-2">
                                <Textarea
                                    value={editCommentText}
                                    onChange={(e) => setEditCommentText(e.target.value)}
                                    className="min-h-[60px] text-sm bg-background"
                                />
                                <div className="flex gap-2 justify-end">
                                    <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => { setIsEditing(false); setEditCommentText(comment.comment); }}>
                                        Cancel
                                    </Button>
                                    <Button size="sm" className="h-7 text-xs" onClick={handleEditSave} disabled={updateCommentMutation.isPending}>
                                        {updateCommentMutation.isPending ? "Saving..." : "Save"}
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <p className="text-sm mt-0.5">{comment.comment}</p>
                        )}
                    </div>
                    {!isEditing && (
                        <div className="flex items-center gap-3 px-1">
                            <span className="text-xs text-muted-foreground">{timeAgo(comment.createdAt)}</span>
                            <button onClick={() => likeMutation.mutate()} className="text-xs text-muted-foreground hover:text-red-500 flex items-center gap-1">
                                <Heart size={12} /> {comment._count?.likes ?? 0}
                            </button>
                            <button onClick={() => setShowReplyInput(!showReplyInput)} className="text-xs font-medium text-muted-foreground hover:text-foreground">
                                Reply
                            </button>
                            {user?.id === comment.user_id && (
                                <>
                                    <button onClick={() => setIsEditing(true)} className="text-xs text-muted-foreground hover:text-foreground">
                                        <Edit2 size={12} />
                                    </button>
                                    <button onClick={() => deleteMutation.mutate()} className="text-xs text-muted-foreground hover:text-destructive">
                                        <Trash2 size={12} />
                                    </button>
                                </>
                            )}
                        </div>
                    )}

                    {showReplyInput && !isEditing && (
                        <div className="flex gap-2 mt-1">
                            <input
                                className="flex-1 text-sm bg-muted/50 rounded-full px-3 py-1.5 outline-none border border-transparent focus:border-primary"
                                placeholder={`Reply to ${comment.user.user_name}...`}
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                onKeyDown={(e) => { if (e.key === "Enter" && replyText.trim()) replyMutation.mutate(); }}
                            />
                            <Button size="icon" className="h-8 w-8 rounded-full" onClick={() => replyMutation.mutate()} disabled={!replyText.trim() || replyMutation.isPending}>
                                <Send size={14} />
                            </Button>
                        </div>
                    )}

                    {(comment._count?.replies ?? 0) > 0 && (
                        <button
                            onClick={() => setShowReplies(!showReplies)}
                            className="flex items-center gap-1 text-xs font-medium text-primary px-1 mt-1"
                        >
                            {showReplies ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                            {showReplies ? "Hide" : `View ${comment._count?.replies} ${comment._count?.replies === 1 ? "reply" : "replies"}`}
                        </button>
                    )}
                </div>
            </div>

            {showReplies && replies && (
                <div className="ml-10 space-y-2">
                    {replies.map((reply) => (
                        <ReplyItem key={reply.id} reply={reply} postId={postId} commentId={comment.id} />
                    ))}
                </div>
            )}
        </div>
    );
}

export default function CommentSection({ postId }: { postId: number }) {
    const user = useAuthStore((s) => s.user);
    const queryClient = useQueryClient();
    const [commentText, setCommentText] = useState("");

    const { data: comments, isLoading } = useQuery({
        queryKey: ["comments", postId],
        queryFn: () => getComments(postId),
    });

    const createMutation = useMutation({
        mutationFn: () => createComment(postId, commentText),
        onSuccess: (newComment) => {
            queryClient.setQueryData<Comment[]>(["comments", postId], (old) =>
                [newComment, ...(old ?? [])]
            );
            setCommentText("");
        },
    });

    return (
        <div className="space-y-4">
            <h3 className="font-semibold text-sm">{comments?.length ?? 0} Comments</h3>

            {/* New comment input */}
            {user && (
                <div className="flex gap-2.5">
                    <UserAvatar name={user.user_name} picture_url={user.picture_url} />
                    <div className="flex-1 flex gap-2">
                        <Textarea
                            placeholder="Write a comment..."
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                            rows={2}
                            className="flex-1 resize-none text-sm"
                        />
                        <Button
                            size="icon"
                            className="h-9 w-9 self-end rounded-full"
                            onClick={() => { if (commentText.trim()) createMutation.mutate(); }}
                            disabled={!commentText.trim() || createMutation.isPending}
                        >
                            <Send size={14} />
                        </Button>
                    </div>
                </div>
            )}

            {/* Comment list */}
            {isLoading ? (
                <div className="space-y-3">
                    {[1, 2].map((i) => (
                        <div key={i} className="flex gap-2.5 animate-pulse">
                            <div className="h-8 w-8 shrink-0 rounded-full bg-muted" />
                            <div className="flex-1 bg-muted rounded-xl h-14" />
                        </div>
                    ))}
                </div>
            ) : comments && comments.length > 0 ? (
                <div className="space-y-4">
                    {comments.map((comment) => (
                        <CommentItem key={comment.id} comment={comment} postId={postId} />
                    ))}
                </div>
            ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No comments yet. Be the first!</p>
            )}
        </div>
    );
}
