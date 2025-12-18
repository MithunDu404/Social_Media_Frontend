"use client";
// Need Changes
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchPosts, likePost, unlikePost } from "@/lib/posts";
import PostCard from "@/components/post/postCard";

export default function FeedPage() {
  const queryClient = useQueryClient();

  const { data: posts, isLoading } = useQuery({
    queryKey: ["posts"],
    queryFn: fetchPosts,
  });

  const likeMutation = useMutation({
    mutationFn: (postId: number) => likePost(postId),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["posts"] }),
  });

  const unlikeMutation = useMutation({
    mutationFn: (postId: number) => unlikePost(postId),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["posts"] }),
  });

  if (isLoading) {
    return <p className="text-center">Loading feed...</p>;
  }

  if (!posts || posts.length === 0) {
    return (
      <p className="text-center text-muted-foreground">
        No posts yet
      </p>
    );
  }

  return (
    <div className="mx-auto max-w-7xl overflow-x-hidden md:p-2 p-4">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-[5fr_9fr_5fr]">

        {/* Left – Profile */}
        <aside className="hidden md:block">
          <div className="sticky top-10 rounded-xl border p-4">
            <p className="text-sm font-medium">Your Profile</p>
            <p className="text-xs text-muted-foreground">
              Profile details go here
            </p>
          </div>
        </aside>

        {/* Center – Feed */}
        <main className="min-w-0 space-y-6">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onLike={() => unlikeMutation.mutate(post.id)}
            />
          ))}
        </main>

        {/* Right – Suggestions */}
        <aside className="hidden md:block">
          <div className="sticky top-10 rounded-xl border p-4">
            <p className="text-sm font-medium">
              Suggested for you
            </p>
            <p className="text-xs text-muted-foreground">
              User suggestions here
            </p>
          </div>
        </aside>

      </div>
    </div>
  );
}
