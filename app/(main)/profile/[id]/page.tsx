"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import {
    getUserProfile,
    toggleFollow,
    getFollowers,
    getFollowings,
    updateProfile,
    FollowData,
} from "@/lib/users";
import { fetchUserPosts, toggleLikePost, deletePost } from "@/lib/posts";
import { useAuthStore } from "@/store/authStore";
import PostCard from "@/components/post/postCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { MapPin, MessageCircle } from "lucide-react";
import Link from "next/link";
import { Post } from "@/types/post";

export default function UserProfilePage() {
    const params = useParams();
    const userId = Number(params.id);
    const loggedUser = useAuthStore((s) => s.user);
    const queryClient = useQueryClient();
    const [editOpen, setEditOpen] = useState(false);
    const [editName, setEditName] = useState("");
    const [editAbout, setEditAbout] = useState("");
    const [editLocation, setEditLocation] = useState("");

    const { data: profile, isLoading } = useQuery({
        queryKey: ["user", userId],
        queryFn: () => getUserProfile(userId),
        enabled: !!userId,
    });

    const { data: posts, isLoading: postsLoading } = useQuery({
        queryKey: ["posts", "user", userId],
        queryFn: () => fetchUserPosts(userId),
        enabled: !!userId,
    });

    const { data: followersData } = useQuery({
        queryKey: ["followers", userId],
        queryFn: () => getFollowers(userId),
        enabled: !!userId,
    });

    const { data: followingsData } = useQuery({
        queryKey: ["followings", userId],
        queryFn: () => getFollowings(userId),
        enabled: !!userId,
    });

    const followMutation = useMutation({
        mutationFn: () => toggleFollow(userId),
        onMutate: async () => {
            await queryClient.cancelQueries({ queryKey: ["followers", userId] });
            const prev = queryClient.getQueryData<FollowData>(["followers", userId]);
            if (prev && loggedUser) {
                const isCurrentlyFollowing = prev.users.some((u) => u.id === loggedUser.id);
                queryClient.setQueryData<FollowData>(["followers", userId], {
                    count: isCurrentlyFollowing ? prev.count - 1 : prev.count + 1,
                    users: isCurrentlyFollowing
                        ? prev.users.filter((u) => u.id !== loggedUser.id)
                        : [...prev.users, { id: loggedUser.id, user_name: loggedUser.user_name, picture_url: loggedUser.picture_url }],
                });
            }
            return { prev };
        },
        onError: (_, __, ctx) => {
            if (ctx?.prev) queryClient.setQueryData(["followers", userId], ctx.prev);
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ["followers", userId] });
        },
    });

    const updateMutation = useMutation({
        mutationFn: () => updateProfile(userId, { user_name: editName, about: editAbout, location: editLocation }),
        onSuccess: (updated) => {
            queryClient.setQueryData(["user", userId], (old: any) => ({ ...old, ...updated }));
            setEditOpen(false);
        },
    });

    const likeMutation = useMutation({
        mutationFn: (postId: number) => toggleLikePost(postId),
        onMutate: async (postId) => {
            await queryClient.cancelQueries({ queryKey: ["posts", "user", userId] });
            const prev = queryClient.getQueryData<Post[]>(["posts", "user", userId]);
            queryClient.setQueryData<Post[]>(["posts", "user", userId], (old) =>
                old?.map((p) => p.id === postId ? { ...p, isLiked: !p.isLiked, likeCount: p.isLiked ? p.likeCount - 1 : p.likeCount + 1 } : p)
            );
            return { prev };
        },
        onError: (_, __, ctx) => queryClient.setQueryData(["posts", "user", userId], ctx?.prev),
    });

    const deleteMutation = useMutation({
        mutationFn: (postId: number) => deletePost(postId),
        onSuccess: (_, postId) => {
            queryClient.setQueryData<Post[]>(["posts", "user", userId], (old) =>
                old?.filter((p) => p.id !== postId)
            );
        },
    });

    const isOwnProfile = loggedUser?.id === userId;
    const followerCount = followersData?.count ?? 0;
    const followingCount = followingsData?.count ?? 0;
    const isFollowing = followersData?.users?.some((f) => f.id === loggedUser?.id) ?? false;

    if (isLoading) {
        return (
            <div className="mx-auto max-w-3xl p-4 space-y-4 animate-pulse">
                <div className="rounded-xl border bg-card p-6 space-y-4">
                    <div className="flex gap-5">
                        <div className="h-24 w-24 rounded-full bg-muted shrink-0" />
                        <div className="flex-1 space-y-3 pt-2">
                            <div className="h-5 w-40 bg-muted rounded" />
                            <div className="h-3 w-64 bg-muted rounded" />
                            <div className="flex gap-4">
                                <div className="h-3 w-16 bg-muted rounded" />
                                <div className="h-3 w-20 bg-muted rounded" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!profile) {
        return <div className="p-8 text-center text-muted-foreground">User not found.</div>;
    }

    return (
        <div className="mx-auto max-w-3xl p-4 h-full overflow-y-auto no-scrollbar pb-12 space-y-4">
            {/* Profile Header */}
            <div className="rounded-xl border bg-card p-6 space-y-5">
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
                    <div className="h-24 w-24 shrink-0 rounded-full bg-muted flex items-center justify-center text-3xl font-bold overflow-hidden">
                        {profile.picture_url ? (
                            <img src={profile.picture_url} alt={profile.user_name} className="w-full h-full object-cover" />
                        ) : (
                            profile.user_name.charAt(0).toUpperCase()
                        )}
                    </div>

                    <div className="flex-1 text-center sm:text-left space-y-2">
                        <div className="flex flex-col sm:flex-row items-center gap-3">
                            <h1 className="text-2xl font-bold">{profile.user_name}</h1>
                            <div className="flex gap-2">
                                {isOwnProfile ? (
                                    <Dialog open={editOpen} onOpenChange={(o) => {
                                        setEditOpen(o);
                                        if (o) { setEditName(profile.user_name); setEditAbout(profile.about ?? ""); setEditLocation(profile.location ?? ""); }
                                    }}>
                                        <DialogTrigger asChild>
                                            <Button variant="outline" size="sm">Edit Profile</Button>
                                        </DialogTrigger>
                                        <DialogContent>
                                            <DialogHeader><DialogTitle>Edit Profile</DialogTitle></DialogHeader>
                                            <div className="space-y-4">
                                                <div className="space-y-1.5">
                                                    <label className="text-sm font-medium">Username</label>
                                                    <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label className="text-sm font-medium">Bio</label>
                                                    <Textarea rows={3} value={editAbout} onChange={(e) => setEditAbout(e.target.value)} placeholder="Tell us about yourself..." />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label className="text-sm font-medium">Location</label>
                                                    <Input value={editLocation} onChange={(e) => setEditLocation(e.target.value)} placeholder="City, Country" />
                                                </div>
                                                <Button className="w-full" onClick={() => updateMutation.mutate()} disabled={updateMutation.isPending}>
                                                    {updateMutation.isPending ? "Saving..." : "Save Changes"}
                                                </Button>
                                            </div>
                                        </DialogContent>
                                    </Dialog>
                                ) : (
                                    <>
                                        <Button
                                            variant={isFollowing ? "outline" : "default"}
                                            size="sm"
                                            onClick={() => followMutation.mutate()}
                                            disabled={followMutation.isPending}
                                        >
                                            {followMutation.isPending ? "..." : isFollowing ? "Unfollow" : "Follow"}
                                        </Button>
                                        <Button variant="outline" size="sm" asChild>
                                            <Link href={`/messages?userId=${userId}`}>
                                                <MessageCircle size={14} className="mr-1.5" />
                                                Message
                                            </Link>
                                        </Button>
                                    </>
                                )}
                            </div>
                        </div>

                        {profile.about && <p className="text-sm text-muted-foreground">{profile.about}</p>}

                        <div className="flex flex-wrap justify-center sm:justify-start gap-3 text-sm text-muted-foreground">
                            {profile.location && (
                                <span className="flex items-center gap-1"><MapPin size={13} /> {profile.location}</span>
                            )}
                        </div>

                        <div className="flex justify-center sm:justify-start gap-6 text-sm font-medium pt-1">
                            <span><strong>{posts?.length ?? 0}</strong> posts</span>
                            <span><strong>{followerCount}</strong> followers</span>
                            <span><strong>{followingCount}</strong> following</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Posts */}
            <div className="space-y-4">
                <h2 className="text-base font-semibold text-muted-foreground uppercase tracking-wide">Posts</h2>
                {postsLoading ? (
                    <div className="space-y-4 animate-pulse">
                        {[1, 2].map((i) => (
                            <div key={i} className="rounded-xl border bg-card p-4 h-24" />
                        ))}
                    </div>
                ) : posts && posts.length > 0 ? (
                    posts.map((post) => (
                        <PostCard
                            key={post.id}
                            post={post}
                            onLike={() => likeMutation.mutate(post.id)}
                            onDelete={isOwnProfile ? () => deleteMutation.mutate(post.id) : undefined}
                        />
                    ))
                ) : (
                    <div className="rounded-xl border bg-card p-8 text-center text-muted-foreground text-sm">
                        {isOwnProfile ? "You haven't posted anything yet." : "No posts yet."}
                    </div>
                )}
            </div>
        </div>
    );
}
