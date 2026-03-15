"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import {
  getConversations,
  getConversationWithUser,
  sendMessage,
  markMessageAsRead,
  Message,
} from "@/lib/messages";
import { getUserProfile } from "@/lib/users";
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

  const selectedConv = conversations?.find((c) => c.user.id === selectedUserId);
  const { data: targetUser } = useQuery({
    queryKey: ["user", selectedUserId],
    queryFn: () => getUserProfile(selectedUserId!),
    enabled: !!selectedUserId && !selectedConv,
  });

  useEffect(() => {
    if (messages && loggedUser && selectedUserId) {
      const unreadMessages = messages.filter(
        (m) => m.receiver_id === loggedUser.id && !m.is_read
      );

      if (unreadMessages.length > 0) {
        queryClient.setQueryData<Message[]>(["messages", selectedUserId], (old) =>
          old?.map((m) => (m.receiver_id === loggedUser.id && !m.is_read ? { ...m, is_read: true } : m))
        );

        queryClient.setQueryData<any[]>(["conversations"], (old) =>
          old?.map((c) => {
             if (c.user.id === selectedUserId && c.lastMessage.receiver_id === loggedUser.id && !c.lastMessage.is_read) {
                 return { ...c, lastMessage: { ...c.lastMessage, is_read: true } };
             }
             return c;
          })
        );

        unreadMessages.forEach((msg) => {
          markMessageAsRead(msg.id).catch(console.error);
        });
      }
    }
  }, [messages, loggedUser, selectedUserId, queryClient]);


  const sendMutation = useMutation({
    mutationFn: (text: string) => sendMessage(selectedUserId!, text),
    onMutate: async (text) => {
      const optimistic: Message = {
        id: -Date.now(),
        message: text,
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
    sendMutation.mutate(newMessage);
  };

  const displayUser = selectedConv?.user || targetUser;

  return (
    <div className="flex h-[calc(100vh-56px)] overflow-hidden bg-background">
      {/* Sidebar */}
      <div className={`flex flex-col w-full md:w-80 shrink-0 glass ${selectedUserId ? "hidden md:flex" : "flex"}`}>
        <div className="p-4 border-b border-border/50">
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
            conversations.map((conv) => {
              const isUnread = conv.lastMessage.receiver_id === loggedUser?.id && !conv.lastMessage.is_read;
              
              return (
                <div
                  key={conv.user.id}
                  onClick={() => setSelectedUserId(conv.user.id)}
                  className={`flex items-center gap-3 p-3 cursor-pointer transition-all duration-200 relative ${selectedUserId === conv.user.id ? "bg-accent/60" : "hover:bg-accent/30"}`}
                >
                  <div className="h-10 w-10 shrink-0 rounded-full bg-muted flex items-center justify-center font-bold text-sm overflow-hidden ring-1 ring-border">
                    {conv.user.picture_url ? (
                      <img src={conv.user.picture_url} className="w-full h-full object-cover" alt="" referrerPolicy="no-referrer" />
                    ) : (
                      conv.user.user_name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="flex-1 min-w-0 pr-4">
                    <p className={`font-medium text-sm truncate ${isUnread ? 'text-foreground' : ''}`}>{conv.user.user_name}</p>
                    <p className={`text-xs truncate ${isUnread ? 'text-foreground font-semibold' : 'text-muted-foreground'}`}>
                      {conv.lastMessage.message}
                    </p>
                  </div>
                  <span className={`text-xs shrink-0 ${isUnread ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                    {timeAgo(conv.lastMessage.createdAt)}
                  </span>
                  
                  {isUnread && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-primary rounded-full animate-pulse"></div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Chat area */}
      {selectedUserId ? (
        <div className={`flex flex-col flex-1 min-w-0 border-l border-border/50 ${!selectedUserId ? "hidden md:flex" : "flex"}`}>
          {/* Chat header */}
          <div className="flex h-14 shrink-0 items-center gap-3 border-b border-border/50 px-4 glass">
            <Button variant="ghost" size="icon" className="md:hidden h-8 w-8" onClick={() => setSelectedUserId(null)}>
              <ArrowLeft size={16} />
            </Button>
            <div className="h-8 w-8 shrink-0 rounded-full bg-muted flex items-center justify-center text-xs font-bold overflow-hidden ring-1 ring-border">
              {displayUser?.picture_url ? (
                <img src={displayUser.picture_url} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                (displayUser?.user_name ?? "?").charAt(0).toUpperCase()
              )}
            </div>
            <Button variant="link" className="font-semibold p-0 h-auto" asChild disabled={!displayUser}>
              <Link href={`/profile/${selectedUserId}`}>{displayUser?.user_name ?? "Loading..."}</Link>
            </Button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar">
            {messagesLoading ? (
              <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
                Loading messages...
              </div>
            ) : !messages || messages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-muted-foreground text-sm space-y-3">
                <div className="avatar-ring">
                  <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center text-2xl font-bold overflow-hidden">
                     {displayUser?.picture_url ? (
                      <img src={displayUser.picture_url} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      (displayUser?.user_name ?? "?").charAt(0).toUpperCase()
                    )}
                  </div>
                </div>
                <p>Start the conversation with {displayUser?.user_name || "this user"}</p>
              </div>
            ) : (
              messages.map((msg) => {
                const isMine = msg.sender_id === loggedUser?.id;
                return (
                  <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"} animate-fade-in`}>
                    <div className={`max-w-[70%] rounded-2xl px-4 py-2 text-sm transition-all duration-200 ${isMine ? "bg-gradient-to-br from-primary to-purple-600 text-primary-foreground rounded-br-sm" : "glass rounded-bl-sm"}`}>
                      <p className="break-words">{msg.message}</p>
                      <div className={`flex items-center gap-1 mt-1 justify-end ${isMine ? "text-primary-foreground/60 text-right" : "text-muted-foreground"}`}>
                        <span className="text-[10px]">{timeAgo(msg.createdAt)}</span>
                        {isMine && (
                          <span className="text-[10px] ml-1">
                            {msg.is_read ? '· Read' : '· Sent'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-border/50 flex gap-2 shrink-0 glass">
            <Input
              placeholder="Type a message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              className="flex-1 bg-background/50 backdrop-blur-sm"
            />
            <Button
              onClick={handleSend}
              disabled={sendMutation.isPending || !newMessage.trim()}
              size="icon"
              className="rounded-full transition-all duration-300 hover:shadow-lg hover:shadow-primary/25"
            >
              <Send size={16} />
            </Button>
          </div>
        </div>
      ) : (
        <div className="hidden md:flex flex-1 items-center justify-center text-sm text-muted-foreground border-l border-border/50">
          Select a conversation to start chatting
        </div>
      )}
    </div>
  );
}
