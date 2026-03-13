"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import {
  getConversations,
  getConversationWithUser,
  sendMessage,
  Message,
} from "@/lib/messages";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Send } from "lucide-react";
import Link from "next/link";

function timeAgo(date: string) {
  const diff = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (diff < 60) return `${diff}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}

export default function MessagesPage() {
  const loggedUser = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const initialUserId = searchParams.get("userId") ? Number(searchParams.get("userId")) : null;
  const [selectedUserId, setSelectedUserId] = useState<number | null>(initialUserId);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: conversations, isLoading: convosLoading } = useQuery({
    queryKey: ["conversations"],
    queryFn: getConversations,
    refetchInterval: 5000,
  });

  const { data: messages, isLoading: messagesLoading } = useQuery({
    queryKey: ["messages", selectedUserId],
    queryFn: () => getConversationWithUser(selectedUserId!),
    enabled: !!selectedUserId,
    refetchInterval: 3000,
  });

  const sendMutation = useMutation({
    mutationFn: () => sendMessage(selectedUserId!, newMessage),
    onMutate: async () => {
      const optimistic: Message = {
        id: -Date.now(),
        message: newMessage,
        sender_id: loggedUser!.id,
        receiver_id: selectedUserId!,
        is_read: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await queryClient.cancelQueries({ queryKey: ["messages", selectedUserId] });
      const prev = queryClient.getQueryData<Message[]>(["messages", selectedUserId]);
      queryClient.setQueryData<Message[]>(["messages", selectedUserId], (old) =>
        [...(old ?? []), optimistic]
      );
      setNewMessage("");
      return { prev };
    },
    onError: (_, __, ctx) => {
      queryClient.setQueryData(["messages", selectedUserId], ctx?.prev);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["messages", selectedUserId] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!newMessage.trim() || !selectedUserId) return;
    sendMutation.mutate();
  };

  const selectedConv = conversations?.find((c) => c.user.id === selectedUserId);

  return (
    <div className="flex h-[calc(100vh-56px)] overflow-hidden border-t bg-background">
      {/* Sidebar */}
      <div className={`flex flex-col border-r w-full md:w-80 shrink-0 ${selectedUserId ? "hidden md:flex" : "flex"}`}>
        <div className="p-4 border-b">
          <h2 className="text-lg font-bold">Messages</h2>
        </div>
        <div className="flex-1 overflow-y-auto no-scrollbar">
          {convosLoading ? (
            <div className="space-y-1 p-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3 p-3 animate-pulse rounded-xl">
                  <div className="h-10 w-10 rounded-full bg-muted shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-24 bg-muted rounded" />
                    <div className="h-2 w-36 bg-muted rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : !conversations || conversations.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">
              No conversations yet.
            </div>
          ) : (
            conversations.map((conv) => (
              <div
                key={conv.user.id}
                onClick={() => setSelectedUserId(conv.user.id)}
                className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-muted/50 transition rounded-none ${selectedUserId === conv.user.id ? "bg-muted/60" : ""}`}
              >
                <div className="h-10 w-10 shrink-0 rounded-full bg-muted flex items-center justify-center font-bold text-sm overflow-hidden">
                  {conv.user.picture_url ? (
                    <img src={conv.user.picture_url} className="w-full h-full object-cover" alt="" referrerPolicy="no-referrer" />
                  ) : (
                    conv.user.user_name.charAt(0).toUpperCase()
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{conv.user.user_name}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {conv.lastMessage.message}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground shrink-0">{timeAgo(conv.lastMessage.createdAt)}</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Chat area */}
      {selectedUserId ? (
        <div className={`flex flex-col flex-1 min-w-0 ${!selectedUserId ? "hidden md:flex" : "flex"}`}>
          {/* Chat header */}
          <div className="flex h-14 shrink-0 items-center gap-3 border-b px-4">
            <Button variant="ghost" size="icon" className="md:hidden h-8 w-8" onClick={() => setSelectedUserId(null)}>
              <ArrowLeft size={16} />
            </Button>
            <div className="h-8 w-8 shrink-0 rounded-full bg-muted flex items-center justify-center text-xs font-bold overflow-hidden">
              {selectedConv?.user.picture_url ? (
                <img src={selectedConv.user.picture_url} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                (selectedConv?.user.user_name ?? "?").charAt(0).toUpperCase()
              )}
            </div>
            <Button variant="link" className="font-semibold p-0 h-auto" asChild>
              <Link href={`/profile/${selectedUserId}`}>{selectedConv?.user.user_name ?? "Chat"}</Link>
            </Button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar">
            {messagesLoading ? (
              <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
                Loading messages...
              </div>
            ) : !messages || messages.length === 0 ? (
              <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
                Start the conversation
              </div>
            ) : (
              messages.map((msg) => {
                const isMine = msg.sender_id === loggedUser?.id;
                return (
                  <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[70%] rounded-2xl px-4 py-2 text-sm ${isMine ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-muted rounded-bl-sm"}`}>
                      <p className="break-words">{msg.message}</p>
                      <p className={`text-xs mt-1 ${isMine ? "text-primary-foreground/60 text-right" : "text-muted-foreground"}`}>
                        {timeAgo(msg.createdAt)}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t flex gap-2 shrink-0">
            <Input
              placeholder="Type a message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              className="flex-1"
            />
            <Button
              onClick={handleSend}
              disabled={sendMutation.isPending || !newMessage.trim()}
              size="icon"
              className="rounded-full"
            >
              <Send size={16} />
            </Button>
          </div>
        </div>
      ) : (
        <div className="hidden md:flex flex-1 items-center justify-center text-sm text-muted-foreground">
          Select a conversation to start chatting
        </div>
      )}
    </div>
  );
}
