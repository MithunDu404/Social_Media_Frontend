"use client";

import { useState, useRef } from "react";
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
import { uploadToCloudinary } from "@/lib/upload";
import { useAuthStore } from "@/store/authStore";
import PostCard from "@/components/post/postCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Edit2, MapPin, MessageCircle, Camera, Loader2, X } from "lucide-react";
import Link from "next/link";
import { Post } from "@/types/post";
import { User } from "@/types/auth";

export default function UserProfilePage() {
    const params = useParams();
    const userId = Number(params.id);
    const loggedUser = useAuthStore((s) => s.user);
    const updateUser = useAuthStore((s) => s.updateUser);
    const queryClient = useQueryClient();
    const [editOpen, setEditOpen] = useState(false);
    const [editName, setEditName] = useState("");
    const [editAbout, setEditAbout] = useState("");
    const [editLocation, setEditLocation] = useState("");
    const [editPicture, setEditPicture] = useState<File | null>(null);
    const [editPicturePreview, setEditPicturePreview] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [followModal, setFollowModal] = useState<"followers" | "following" | null>(null);

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
        onSuccess: (data) => {
            queryClient.setQueryData<User[]>(["suggestedUsers"], (old) =>
                old?.map((u) =>
                    u.id === userId ? { ...u, isFollowing: data.following } : u
                )
            );
        },
        onError: (_, __, ctx) => {
            if (ctx?.prev) queryClient.setQueryData(["followers", userId], ctx.prev);
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ["followers", userId] });
        },
    });

    const updateMutation = useMutation({
        mutationFn: async () => {
            let picture_url = undefined;
            if (editPicture) {
                setIsUploading(true);
                try {
                    const result = await uploadToCloudinary(editPicture, setUploadProgress);
                    picture_url = result.url;
                } catch (error) {
                    setIsUploading(false);
                    throw error;
                }
                setIsUploading(false);
            }
            return updateProfile(userId, { user_name: editName, about: editAbout, location: editLocation, picture_url });
        },
        onSuccess: (updated) => {
            queryClient.setQueryData(["user", userId], (old: any) => ({ ...old, ...updated }));
            if (isOwnProfile) {
                updateUser({ user_name: updated.user_name, picture_url: updated.picture_url });
            }
            setEditOpen(false);
            setEditPicture(null);
            if (editPicturePreview) URL.revokeObjectURL(editPicturePreview);
            setEditPicturePreview(null);
        },
    });

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            if (!file.type.startsWith("image/")) {
                alert("Please select an image file.");
                return;
            }
            setEditPicture(file);
            if (editPicturePreview) URL.revokeObjectURL(editPicturePreview);
            setEditPicturePreview(URL.createObjectURL(file));
        }
    };

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
                <div className="rounded-2xl glass-card p-6 space-y-4">
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
            <div className="rounded-2xl glass-card p-6 space-y-5 animate-fade-in">
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
                    {/* Avatar with gradient ring */}
                    <div className="relative shrink-0">
                        <div className="avatar-ring">
                            <div className="h-24 w-24 rounded-full bg-muted flex items-center justify-center text-3xl font-bold overflow-hidden">
                                {profile.picture_url ? (
                                    <img src={profile.picture_url} alt={profile.user_name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                ) : (
                                    profile.user_name.charAt(0).toUpperCase()
                                )}
                            </div>
                        </div>
                        {isOwnProfile && (
                            <button
                                onClick={() => { 
                                    setEditName(profile.user_name); 
                                    setEditAbout(profile.about ?? ""); 
                                    setEditLocation(profile.location ?? ""); 
                                    setEditPicture(null);
                                    if (editPicturePreview) URL.revokeObjectURL(editPicturePreview);
                                    setEditPicturePreview(null);
                                    setEditOpen(true); 
                                }}
                                className="absolute top-0 right-0 h-7 w-7 rounded-full bg-background border border-border shadow flex items-center justify-center hover:bg-muted transition-all duration-200 hover:scale-110"
                                title="Edit profile"
                            >
                                <Edit2 size={13} />
                            </button>
                        )}
                    </div>

                    <div className="flex-1 text-center sm:text-left space-y-1">
                        <div className="flex flex-col sm:flex-row items-center gap-3">
                            <h1 className="text-2xl font-bold">{profile.user_name}</h1>
                            {!isOwnProfile && (
                                <div className="flex gap-2">
                                    <Button
                                        variant={isFollowing ? "outline" : "default"}
                                        size="sm"
                                        onClick={() => followMutation.mutate()}
                                        disabled={followMutation.isPending}
                                        className="transition-all duration-300 hover:shadow-md"
                                    >
                                        {followMutation.isPending ? "..." : isFollowing ? "Unfollow" : "Follow"}
                                    </Button>
                                    <Button variant="outline" size="sm" asChild className="transition-all duration-300 hover:shadow-md">
                                        <Link href={`/messages?userId=${userId}`}>
                                            <MessageCircle size={14} className="mr-1.5" />
                                            Message
                                        </Link>
                                    </Button>
                                </div>
                            )}
                        </div>

                        {profile.about && <p className="text-sm text-muted-foreground">{profile.about}</p>}

                        <div className="flex flex-wrap justify-center sm:justify-start gap-3 text-sm text-muted-foreground">
                            {profile.location && (
                                <span className="flex items-center gap-1"><MapPin size={13} /> {profile.location}</span>
                            )}
                        </div>

                        <div className="flex justify-center sm:justify-start gap-6 text-sm font-medium pt-1">
                            <span><strong>{posts?.length ?? 0}</strong> posts</span>
                            <button
                                onClick={() => setFollowModal("followers")}
                                className="hover:underline cursor-pointer text-left transition-colors duration-200 hover:text-primary"
                            >
                                <strong>{followerCount}</strong> followers
                            </button>
                            <button
                                onClick={() => setFollowModal("following")}
                                className="hover:underline cursor-pointer text-left transition-colors duration-200 hover:text-primary"
                            >
                                <strong>{followingCount}</strong> following
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Posts */}
            <div className="space-y-4">
                <h2 className="text-base font-semibold text-muted-foreground uppercase tracking-wide animate-fade-in">Posts</h2>
                {postsLoading ? (
                    <div className="space-y-4 animate-pulse">
                        {[1, 2].map((i) => (
                            <div key={i} className="rounded-2xl glass-card p-4 h-24" />
                        ))}
                    </div>
                ) : posts && posts.length > 0 ? (
                    posts.map((post, index) => (
                        <div key={post.id} className="animate-fade-in" style={{ animationDelay: `${index * 0.05}s` }}>
                            <PostCard
                                post={post}
                                onLike={() => likeMutation.mutate(post.id)}
                                onDelete={isOwnProfile ? () => deleteMutation.mutate(post.id) : undefined}
                            />
                        </div>
                    ))
                ) : (
                    <div className="rounded-2xl glass-card p-8 text-center text-muted-foreground text-sm animate-fade-in">
                        {isOwnProfile ? "You haven't posted anything yet." : "No posts yet."}
                    </div>
                )}
            </div>

            {/* Edit Profile Dialog */}
            {isOwnProfile && (
                <Dialog open={editOpen} onOpenChange={setEditOpen}>
                    <DialogContent className="glass-card border-0">
                        <DialogHeader><DialogTitle>Edit Profile</DialogTitle></DialogHeader>
                        <div className="space-y-4">
                            <div className="flex justify-center mb-4">
                                <div className="relative group">
                                    <div className="h-24 w-24 rounded-full bg-muted flex items-center justify-center overflow-hidden ring-2 ring-border">
                                        {editPicturePreview ? (
                                            <img src={editPicturePreview} alt="Preview" className="w-full h-full object-cover" />
                                        ) : profile.picture_url ? (
                                            <img src={profile.picture_url} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                        ) : (
                                            <span className="text-3xl font-bold">{editName.charAt(0).toUpperCase()}</span>
                                        )}
                                    </div>
                                    <button 
                                        className="absolute bottom-0 right-0 h-8 w-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center hover:bg-primary/90 transition shadow-sm"
                                        onClick={() => fileInputRef.current?.click()}
                                    >
                                        <Camera size={16} />
                                    </button>
                                    <input 
                                        type="file" 
                                        ref={fileInputRef} 
                                        className="hidden" 
                                        accept="image/*" 
                                        onChange={handleFileChange} 
                                    />
                                    {editPicturePreview && (
                                         <button 
                                             className="absolute top-0 right-0 h-6 w-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center hover:bg-destructive/90 transition shadow-sm"
                                             onClick={() => {
                                                 setEditPicture(null);
                                                 URL.revokeObjectURL(editPicturePreview);
                                                 setEditPicturePreview(null);
                                                 if (fileInputRef.current) fileInputRef.current.value = "";
                                             }}
                                         >
                                             <X size={12} />
                                         </button>
                                    )}
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium">Username</label>
                                <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="bg-background/50 backdrop-blur-sm" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium">Bio</label>
                                <Textarea rows={3} value={editAbout} onChange={(e) => setEditAbout(e.target.value)} placeholder="Tell us about yourself..." className="bg-background/50 backdrop-blur-sm" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium">Location</label>
                                <Input value={editLocation} onChange={(e) => setEditLocation(e.target.value)} placeholder="City, Country" className="bg-background/50 backdrop-blur-sm" />
                            </div>
                            {isUploading && (
                                <div className="space-y-1.5 pb-2">
                                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                                        <span className="flex items-center gap-1.5">
                                            <Loader2 size={12} className="animate-spin" />
                                            Uploading image…
                                        </span>
                                        <span>{uploadProgress}%</span>
                                    </div>
                                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                                        <div
                                            className="h-full rounded-full bg-gradient-to-r from-primary to-purple-500 transition-all duration-300"
                                            style={{ width: `${uploadProgress}%` }}
                                        />
                                    </div>
                                </div>
                            )}
                            <Button className="w-full transition-all duration-300 hover:shadow-lg hover:shadow-primary/25" onClick={() => updateMutation.mutate()} disabled={updateMutation.isPending || isUploading}>
                                {updateMutation.isPending || isUploading ? "Saving..." : "Save Changes"}
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            )}

            {/* Followers / Following Modal */}
            <Dialog open={followModal !== null} onOpenChange={(o) => !o && setFollowModal(null)}>
                <DialogContent className="max-w-sm glass-card border-0">
                    <DialogHeader>
                        <DialogTitle className="capitalize">{followModal}</DialogTitle>
                    </DialogHeader>
                    <div className="flex flex-col gap-1 max-h-80 overflow-y-auto pr-1">
                        {(() => {
                            const list = followModal === "followers"
                                ? followersData?.users
                                : followingsData?.users;
                            if (!list || list.length === 0) {
                                return (
                                    <p className="text-sm text-muted-foreground text-center py-6">
                                        No {followModal} yet.
                                    </p>
                                );
                            }
                            return list.map((u) => (
                                <Link
                                    key={u.id}
                                    href={`/profile/${u.id}`}
                                    onClick={() => setFollowModal(null)}
                                    className="flex items-center gap-3 p-2 rounded-xl hover:bg-accent/50 transition-all duration-200"
                                >
                                    <div className="h-9 w-9 shrink-0 rounded-full bg-muted flex items-center justify-center font-bold text-sm overflow-hidden ring-1 ring-border">
                                        {u.picture_url ? (
                                            <img src={u.picture_url} alt={u.user_name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                        ) : (
                                            u.user_name.charAt(0).toUpperCase()
                                        )}
                                    </div>
                                    <span className="text-sm font-medium">{u.user_name}</span>
                                </Link>
                            ));
                        })()}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
