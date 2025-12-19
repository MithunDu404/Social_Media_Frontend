"use client";
// Need Changes
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchPosts, toggleLikePost } from "@/lib/posts";
import PostCard from "@/components/post/postCard";

export default function FeedPage() {
  const queryClient = useQueryClient();

  const { data: posts, isLoading } = useQuery({
    queryKey: ["posts"],
    queryFn: fetchPosts,
  });

  const likeMutation = useMutation({
    mutationFn: (postId: number) => toggleLikePost(postId),

    onMutate: async (postId) => {
      await queryClient.cancelQueries({ queryKey: ["posts"] });

      const previousPosts = queryClient.getQueryData<any[]>(["posts"]);

      queryClient.setQueryData<any[]>(["posts"], (old) =>
        old?.map((post) =>
          post.id === postId
            ? {
                ...post,
                isLiked: !post.isLiked,
                likeCount: post.isLiked? post.likeCount-1 : post.likeCount+1
              }
            : post
        )
      );

      return { previousPosts };
    },

    onError: (_, __, context) => {
      queryClient.setQueryData(["posts"], context?.previousPosts);
    },
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
    <div className="mx-auto max-w-7xl overflow-x-hidden h-full md:p-2 p-4">
      <div className="grid h-full min-h-0 grid-cols-1 gap-6 md:grid-cols-[5fr_9fr_5fr]">

        {/* Left – Profile */}
        <aside className="hidden md:block min-h-0">
          <div className="sticky top-3 rounded-xl border p-4">
            <p className="text-sm font-medium">Your Profile</p>
            <p className="text-xs text-muted-foreground">
              Profile details go here
            </p>
          </div>
        </aside>

        {/* Center – Feed */}
        <main className="min-h-0 min-w-0 space-y-6 overflow-y-auto no-scrollbar">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onLike={() => likeMutation.mutate(post.id)}
            />
          ))}
        </main>

        {/* Right – Suggestions */}
        <aside className="hidden md:block min-h-0">
          <div className="h-full overflow-y-auto pr-2 no-scrollbar">
            <div className="mt-3 mb-4 rounded-xl border p-4">
              <p className="text-sm font-medium">Suggested for you</p>
              <p className="text-xs text-muted-foreground">
                User suggestions here
              </p>
            </div>

            {/* Example list */}
            <div className="space-y-3">
              {[...Array(20)].map((_, i) => (
                <div
                  key={i}
                  className="rounded-lg border p-3 text-sm"
                >
                  Suggested User {i + 1}
                </div>
              ))}
            </div>
          </div>
        </aside>

      </div>
    </div>
  );
}
