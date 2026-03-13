"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    getNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteReadNotifications,
    Notification,
    NotificationReason,
} from "@/lib/notifications";
import { Button } from "@/components/ui/button";
import { Heart, UserPlus, MessageCircle, MessageSquare, Reply } from "lucide-react";

const reasonConfig: Record<NotificationReason, { label: string; icon: React.ReactNode; color: string }> = {
    POST_LIKE: { label: "liked your post.", icon: <Heart size={14} />, color: "text-red-500" },
    COMMENT_LIKE: { label: "liked your comment.", icon: <Heart size={14} />, color: "text-red-400" },
    REPLY_LIKE: { label: "liked your reply.", icon: <Heart size={14} />, color: "text-pink-500" },
    FOLLOW: { label: "started following you.", icon: <UserPlus size={14} />, color: "text-blue-500" },
    COMMENT: { label: "commented on your post.", icon: <MessageCircle size={14} />, color: "text-green-500" },
    REPLY: { label: "replied to your comment.", icon: <Reply size={14} />, color: "text-emerald-500" },
    MESSAGE: { label: "sent you a message.", icon: <MessageSquare size={14} />, color: "text-violet-500" },
};

function NotificationSkeleton() {
    return (
        <div className="space-y-3">
            {[1, 2, 3].map((i) => (
                <div key={i} className="rounded-xl border bg-card p-4 flex items-center gap-3 animate-pulse">
                    <div className="h-10 w-10 rounded-full bg-muted shrink-0" />
                    <div className="flex-1 space-y-2">
                        <div className="h-3 w-48 bg-muted rounded" />
                        <div className="h-2 w-24 bg-muted rounded" />
                    </div>
                </div>
            ))}
        </div>
    );
}

function timeAgo(date: string) {
    const diff = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
}

export default function NotificationsPage() {
    const queryClient = useQueryClient();

    const { data: notifications, isLoading } = useQuery({
        queryKey: ["notifications"],
        queryFn: () => getNotifications(),
    });

    const markReadMutation = useMutation({
        mutationFn: (id: number) => markNotificationAsRead(id),
        onSuccess: (_, id) => {
            queryClient.setQueryData<Notification[]>(["notifications"], (old) =>
                old?.map((n) => (n.id === id ? { ...n, is_read: true } : n))
            );
        },
    });

    const markAllReadMutation = useMutation({
        mutationFn: markAllNotificationsAsRead,
        onSuccess: () => {
            queryClient.setQueryData<Notification[]>(["notifications"], (old) =>
                old?.map((n) => ({ ...n, is_read: true }))
            );
        },
    });

    const deleteMutation = useMutation({
        mutationFn: deleteReadNotifications,
        onSuccess: () => {
            queryClient.setQueryData<Notification[]>(["notifications"], (old) =>
                old?.filter((n) => !n.is_read)
            );
        },
    });

    const unreadCount = notifications?.filter((n) => !n.is_read).length ?? 0;

    return (
        <div className="mx-auto max-w-2xl p-4 h-full overflow-y-auto no-scrollbar pb-12 space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Notifications</h1>
                    {unreadCount > 0 && (
                        <p className="text-sm text-muted-foreground">{unreadCount} unread</p>
                    )}
                </div>
                <div className="flex gap-2">
                    {unreadCount > 0 && (
                        <Button variant="outline" size="sm" onClick={() => markAllReadMutation.mutate()} disabled={markAllReadMutation.isPending}>
                            Mark all read
                        </Button>
                    )}
                    <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={() => deleteMutation.mutate()} disabled={deleteMutation.isPending}>
                        Clear read
                    </Button>
                </div>
            </div>

            {isLoading ? (
                <NotificationSkeleton />
            ) : !notifications || notifications.length === 0 ? (
                <div className="rounded-xl border bg-card p-10 text-center text-muted-foreground text-sm">
                    No notifications yet.
                </div>
            ) : (
                <div className="space-y-2">
                    {notifications.map((notif) => {
                        const config = reasonConfig[notif.reason] ?? { label: "interacted with you.", icon: null, color: "text-muted-foreground" };
                        return (
                            <div
                                key={notif.id}
                                className={`flex items-center gap-3 p-4 rounded-xl border transition-colors cursor-pointer ${notif.is_read ? "bg-card" : "bg-primary/5 border-primary/20"}`}
                                onClick={() => { if (!notif.is_read) markReadMutation.mutate(notif.id); }}
                            >
                                {/* Notification icon */}
                                <div className={`shrink-0 ${config.color}`}>{config.icon}</div>

                                {/* Avatar */}
                                <div className="h-9 w-9 shrink-0 rounded-full bg-muted flex items-center justify-center text-xs font-bold overflow-hidden">
                                    {notif.creator?.picture_url ? (
                                        <img src={notif.creator.picture_url} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                    ) : (
                                        notif.creator?.user_name?.charAt(0).toUpperCase() ?? "?"
                                    )}
                                </div>

                                {/* Text */}
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm">
                                        <span className="font-semibold">{notif.creator?.user_name ?? "Someone"}</span>{" "}
                                        {config.label}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-0.5">{timeAgo(notif.createdAt)}</p>
                                </div>

                                {!notif.is_read && (
                                    <div className="h-2 w-2 shrink-0 rounded-full bg-primary" />
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
