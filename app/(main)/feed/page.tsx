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
        <div key={i} className="rounded-xl border bg-card p-4 space-y-3 animate-pulse">
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
    // Don't refetch within 2 minutes so the optimistic cache update isn't stomped
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
      // Cancel any in-flight refetch so it doesn't overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey: ["suggestedUsers"] });
      const previous = queryClient.getQueryData<User[]>(["suggestedUsers"]);
      // Optimistic update: immediately flip isFollowing in the cache
      queryClient.setQueryData<User[]>(["suggestedUsers"], (old) =>
        old?.map((u) =>
          u.id === userId ? { ...u, isFollowing: !u.isFollowing } : u
        )
      );
      return { previous };
    },
    onSuccess: (data, userId) => {
      // Permanently write the server-confirmed value so future refetches
      // don't clobber the state (data.following is the source of truth)
      queryClient.setQueryData<User[]>(["suggestedUsers"], (old) =>
        old?.map((u) =>
          u.id === userId ? { ...u, isFollowing: data.following } : u
        )
      );
    },
    onError: (_, __, context) => {
      // Roll back on failure
      queryClient.setQueryData(["suggestedUsers"], context?.previous);
    },
  });

  // Filter out own user and already-followed users from suggestions
  const suggestions =
    suggestedUsers
      ?.filter((u) => u.id !== user?.id && !u.isFollowing)
      .slice(0, 6) ?? [];

  return (
    <div className="mx-auto max-w-7xl h-full overflow-x-hidden md:p-2 p-4">
      <div className="grid h-full min-h-0 grid-cols-1 gap-6 md:grid-cols-[5fr_9fr_5fr]">

        {/* Left – Profile Card */}
        <aside className="hidden md:block min-h-0">
          <div className="sticky top-3 rounded-xl border p-4 flex flex-col items-center gap-4 bg-card">
            <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center text-2xl font-bold overflow-hidden">
              {user?.picture_url ? (
                <img src={user.picture_url} alt="" className="w-full h-full object-cover" />
              ) : (
                user?.user_name?.charAt(0).toUpperCase()
              )}
            </div>
            <div className="text-center">
              <p className="font-semibold text-lg">{user?.user_name}</p>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
            <Button variant="outline" className="w-full mt-2" asChild>
              <Link href={`/profile/${user?.id}`}>View Profile</Link>
            </Button>
          </div>
        </aside>

        {/* Center – Feed */}
        <main className="min-h-0 min-w-0 space-y-4 overflow-y-auto no-scrollbar pb-20 md:pb-4">
          <div className="rounded-xl border p-4">
            <CreatePostModal />
          </div>

          {isLoading ? (
            <FeedSkeleton />
          ) : posts && posts.length > 0 ? (
            posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onLike={() => likeMutation.mutate(post.id)}
                onDelete={user?.id === post.user_id ? () => deleteMutation.mutate(post.id) : undefined}
              />
            ))
          ) : (
            <div className="rounded-xl border bg-card p-10 text-center text-muted-foreground">
              <p className="text-lg font-medium">Your feed is empty</p>
              <p className="text-sm mt-1">Follow some people to see their posts here.</p>
            </div>
          )}
        </main>

        {/* Right – Suggested Users with Follow Button */}
        <aside className="hidden md:block min-h-0">
          <div className="sticky top-3 rounded-xl border p-4 bg-card space-y-4">
            <p className="text-sm font-semibold">Suggested for you</p>
            <div className="space-y-3">
              {suggestions.length > 0 ? (
                suggestions.map((u) => (
                  <div key={u.id} className="flex items-center gap-2.5">
                    <Link href={`/profile/${u.id}`} className="h-8 w-8 shrink-0 rounded-full bg-muted flex items-center justify-center text-xs font-bold overflow-hidden">
                      {u.picture_url ? (
                        <img src={u.picture_url} alt="" className="w-full h-full object-cover" />
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
                      className={`h-auto py-1 px-2 text-xs font-semibold ${u.isFollowing
                        ? "text-muted-foreground"
                        : "text-primary"
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
