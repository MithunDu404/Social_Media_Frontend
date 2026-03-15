"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchFeedPosts, toggleLikePost, deletePost } from "@/lib/posts";
import { searchUsers, toggleFollow } from "@/lib/users";
import PostCard from "@/components/post/postCard";
import CreatePostModal from "@/components/post/createPostModal";
import { useAuthStore } from "@/store/authStore";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Post } from "@/types/post";
import { User } from "@/types/auth";

function FeedSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="rounded-2xl glass-card p-4 space-y-3 animate-pulse">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-full bg-muted" />
            <div className="space-y-1.5">
              <div className="h-3 w-24 rounded bg-muted" />
              <div className="h-2 w-16 rounded bg-muted" />
            </div>
          </div>
          <div className="space-y-2">
            <div className="h-4 w-3/4 rounded bg-muted" />
            <div className="h-3 w-full rounded bg-muted" />
            <div className="h-3 w-2/3 rounded bg-muted" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function FeedPage() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);

  const { data: posts, isLoading } = useQuery({
    queryKey: ["feed"],
    queryFn: () => fetchFeedPosts(),
  });

  const { data: suggestedUsers } = useQuery({
    queryKey: ["suggestedUsers"],
    queryFn: () => searchUsers(),
    staleTime: 2 * 60 * 1000,
  });

  const likeMutation = useMutation({
    mutationFn: (postId: number) => toggleLikePost(postId),
    onMutate: async (postId) => {
      await queryClient.cancelQueries({ queryKey: ["feed"] });
      const previousPosts = queryClient.getQueryData<Post[]>(["feed"]);
      queryClient.setQueryData<Post[]>(["feed"], (old) =>
        old?.map((post) =>
          post.id === postId
            ? { ...post, isLiked: !post.isLiked, likeCount: post.isLiked ? post.likeCount - 1 : post.likeCount + 1 }
            : post
        )
      );
      return { previousPosts };
    },
    onError: (_, __, context) => {
      queryClient.setQueryData(["feed"], context?.previousPosts);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (postId: number) => deletePost(postId),
    onSuccess: (_, postId) => {
      queryClient.setQueryData<Post[]>(["feed"], (old) =>
        old?.filter((p) => p.id !== postId)
      );
    },
  });

  const followMutation = useMutation({
    mutationFn: (userId: number) => toggleFollow(userId),
    onMutate: async (userId) => {
      await queryClient.cancelQueries({ queryKey: ["suggestedUsers"] });
      const previous = queryClient.getQueryData<User[]>(["suggestedUsers"]);
      queryClient.setQueryData<User[]>(["suggestedUsers"], (old) =>
        old?.map((u) =>
          u.id === userId ? { ...u, isFollowing: !u.isFollowing } : u
        )
      );
      return { previous };
    },
    onSuccess: (data, userId) => {
      queryClient.setQueryData<User[]>(["suggestedUsers"], (old) =>
        old?.map((u) =>
          u.id === userId ? { ...u, isFollowing: data.following } : u
        )
      );
    },
    onError: (_, __, context) => {
      queryClient.setQueryData(["suggestedUsers"], context?.previous);
    },
  });

  const suggestions =
    suggestedUsers
      ?.filter((u) => u.id !== user?.id && !u.isFollowing)
      .slice(0, 6) ?? [];

  return (
    <div className="mx-auto max-w-7xl h-full overflow-x-hidden md:p-2 p-4">
      <div className="grid h-full min-h-0 grid-cols-1 gap-6 md:grid-cols-[5fr_9fr_5fr]">

        {/* Left – Profile Card */}
        <aside className="hidden md:block min-h-0">
          <div className="sticky top-3 rounded-2xl glass-card p-5 flex flex-col items-center gap-4 animate-fade-in">
            <div className="avatar-ring">
              <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center text-2xl font-bold overflow-hidden">
                {user?.picture_url ? (
                  <img src={user.picture_url} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  user?.user_name?.charAt(0).toUpperCase()
                )}
              </div>
            </div>
            <div className="text-center">
              <p className="font-semibold text-lg">{user?.user_name}</p>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
            <Button variant="outline" className="w-full mt-2 transition-all duration-300 hover:shadow-md" asChild>
              <Link href={`/profile/${user?.id}`}>View Profile</Link>
            </Button>
          </div>
        </aside>

        {/* Center – Feed */}
        <main className="min-h-0 min-w-0 space-y-4 overflow-y-auto no-scrollbar pb-20 md:pb-4">
          <div className="rounded-2xl glass-card p-4 animate-fade-in">
            <CreatePostModal />
          </div>

          {isLoading ? (
            <FeedSkeleton />
          ) : posts && posts.length > 0 ? (
            posts.map((post, index) => (
              <div key={post.id} className="animate-fade-in" style={{ animationDelay: `${index * 0.05}s` }}>
                <PostCard
                  post={post}
                  onLike={() => likeMutation.mutate(post.id)}
                  onDelete={user?.id === post.user_id ? () => deleteMutation.mutate(post.id) : undefined}
                />
              </div>
            ))
          ) : (
            <div className="rounded-2xl glass-card p-10 text-center text-muted-foreground animate-fade-in">
              <p className="text-lg font-medium">Your feed is empty</p>
              <p className="text-sm mt-1">Follow some people to see their posts here.</p>
            </div>
          )}
        </main>

        {/* Right – Suggested Users */}
        <aside className="hidden md:block min-h-0">
          <div className="sticky top-3 rounded-2xl glass-card p-5 space-y-4 animate-fade-in" style={{ animationDelay: "0.1s" }}>
            <p className="text-sm font-semibold">Suggested for you</p>
            <div className="space-y-3">
              {suggestions.length > 0 ? (
                suggestions.map((u) => (
                  <div key={u.id} className="flex items-center gap-2.5 p-1 rounded-lg hover:bg-accent/50 transition-colors duration-200">
                    <Link href={`/profile/${u.id}`} className="h-8 w-8 shrink-0 rounded-full bg-muted flex items-center justify-center text-xs font-bold overflow-hidden ring-1 ring-border">
                      {u.picture_url ? (
                        <img src={u.picture_url} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        u.user_name?.charAt(0).toUpperCase()
                      )}
                    </Link>
                    <div className="flex-1 min-w-0">
                      <Link href={`/profile/${u.id}`} className="text-sm font-medium hover:underline truncate block">
                        {u.user_name}
                      </Link>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`h-auto py-1 px-2 text-xs font-semibold transition-colors duration-200 ${u.isFollowing
                        ? "text-muted-foreground"
                        : "text-primary hover:text-primary/80"
                        }`}
                      onClick={() => followMutation.mutate(u.id)}
                      disabled={followMutation.isPending}
                    >
                      {u.isFollowing ? "Unfollow" : "Follow"}
                    </Button>
                  </div>
                ))
              ) : (
                <p className="text-xs text-muted-foreground text-center">No suggestions</p>
              )}
            </div>
          </div>
        </aside>

      </div>
    </div>
  );
}
