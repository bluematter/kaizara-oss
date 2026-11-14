"use client";

import { useState, useRef, useEffect } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Send,
  Check,
  CheckCheck,
  Search,
  MessageSquare,
  ArrowLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format, isToday, isYesterday, formatDistanceToNow } from "date-fns";

interface Message {
  id: string;
  content: string;
  sender: "patient" | "doctor";
  timestamp: Date;
  read: boolean;
}

interface Conversation {
  id: string;
  patient: {
    id: string;
    name: string;
    initials: string;
  };
  lastMessage: string;
  lastMessageTime: Date;
  unreadCount: number;
  messages: Message[];
}

// Mock conversations data
const mockConversations: Conversation[] = [
  {
    id: "conv-1",
    patient: {
      id: "jamie-rivera",
      name: "Jamie Rivera",
      initials: "MA",
    },
    lastMessage: "Perfect, I'll do that. Also, my next shipment arrives Thursday - should I continue with the same dosing schedule?",
    lastMessageTime: new Date(Date.now() - 4 * 60 * 60 * 1000),
    unreadCount: 1,
    messages: [
      {
        id: "1",
        content: "Hi Jamie, I've reviewed your latest lab results. Your testosterone levels are looking much better since starting the protocol!",
        sender: "doctor",
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        read: true,
      },
      {
        id: "2",
        content: "That's great to hear! I've definitely been feeling more energetic.",
        sender: "patient",
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000),
        read: true,
      },
      {
        id: "3",
        content: "I did have a question about the BPC-157 dosing. Should I take it with food or on an empty stomach?",
        sender: "patient",
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 35 * 60 * 1000),
        read: true,
      },
      {
        id: "4",
        content: "Great question! BPC-157 can be taken either way, but some patients find better absorption on an empty stomach. I'd recommend taking it 30 minutes before meals if possible.",
        sender: "doctor",
        timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        read: true,
      },
      {
        id: "5",
        content: "Perfect, I'll do that. Also, my next shipment arrives Thursday - should I continue with the same dosing schedule?",
        sender: "patient",
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
        read: false,
      },
    ],
  },
  {
    id: "conv-2",
    patient: {
      id: "emily-chen",
      name: "Emily Chen",
      initials: "EC",
    },
    lastMessage: "Thank you for the quick response, Dr. Hale!",
    lastMessageTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    unreadCount: 0,
    messages: [
      {
        id: "1",
        content: "Hi Dr. Hale, I wanted to check if my lab results came back yet?",
        sender: "patient",
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        read: true,
      },
      {
        id: "2",
        content: "Hi Emily! Yes, just received them. Everything looks good - your vitamin D levels have improved significantly. I'll have the full report uploaded to your portal by end of day.",
        sender: "doctor",
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000),
        read: true,
      },
      {
        id: "3",
        content: "Thank you for the quick response, Dr. Hale!",
        sender: "patient",
        timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        read: true,
      },
    ],
  },
  {
    id: "conv-3",
    patient: {
      id: "james-wilson",
      name: "James Wilson",
      initials: "JW",
    },
    lastMessage: "I'll schedule that follow-up appointment soon.",
    lastMessageTime: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    unreadCount: 0,
    messages: [
      {
        id: "1",
        content: "Good morning! Just a reminder that we should schedule a follow-up to review your progress on the protocol.",
        sender: "doctor",
        timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
        read: true,
      },
      {
        id: "2",
        content: "I'll schedule that follow-up appointment soon.",
        sender: "patient",
        timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        read: true,
      },
    ],
  },
  {
    id: "conv-4",
    patient: {
      id: "robert-martinez",
      name: "Robert Martinez",
      initials: "RM",
    },
    lastMessage: "Looking forward to seeing you at the appointment.",
    lastMessageTime: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    unreadCount: 0,
    messages: [
      {
        id: "1",
        content: "Hi Robert, just confirming your appointment for next Tuesday at 2 PM.",
        sender: "doctor",
        timestamp: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
        read: true,
      },
      {
        id: "2",
        content: "Looking forward to seeing you at the appointment.",
        sender: "patient",
        timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        read: true,
      },
    ],
  },
];

function formatMessageDate(date: Date): string {
  if (isToday(date)) {
    return "Today";
  } else if (isYesterday(date)) {
    return "Yesterday";
  }
  return format(date, "EEEE, MMMM d");
}

function formatMessageTime(date: Date): string {
  return format(date, "h:mm a");
}

function formatConversationTime(date: Date): string {
  if (isToday(date)) {
    return format(date, "h:mm a");
  } else if (isYesterday(date)) {
    return "Yesterday";
  }
  return format(date, "MMM d");
}

export default function MessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>(mockConversations);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showMobileList, setShowMobileList] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedConversation = conversations.find((c) => c.id === selectedId);

  // Filter conversations by search
  const filteredConversations = conversations.filter((c) =>
    c.patient.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      const scrollContainer = scrollRef.current.querySelector("[data-radix-scroll-area-viewport]");
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [selectedConversation?.messages]);

  // Focus input when conversation is selected
  useEffect(() => {
    if (selectedId && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [selectedId]);

  const handleSelectConversation = (id: string) => {
    setSelectedId(id);
    setShowMobileList(false);
    // Mark messages as read
    setConversations((prev) =>
      prev.map((c) =>
        c.id === id
          ? {
              ...c,
              unreadCount: 0,
              messages: c.messages.map((m) => ({ ...m, read: true })),
            }
          : c
      )
    );
  };

  const handleSend = async () => {
    if (!input.trim() || isSending || !selectedId) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      content: input.trim(),
      sender: "doctor",
      timestamp: new Date(),
      read: true,
    };

    setConversations((prev) =>
      prev.map((c) =>
        c.id === selectedId
          ? {
              ...c,
              messages: [...c.messages, newMessage],
              lastMessage: newMessage.content,
              lastMessageTime: newMessage.timestamp,
            }
          : c
      )
    );
    setInput("");
    setIsSending(true);

    // Simulate sending delay
    setTimeout(() => {
      setIsSending(false);
    }, 300);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Group messages by date
  const groupedMessages: { date: string; messages: Message[] }[] = [];
  if (selectedConversation) {
    let currentDate = "";
    selectedConversation.messages.forEach((message) => {
      const dateKey = formatMessageDate(message.timestamp);
      if (dateKey !== currentDate) {
        currentDate = dateKey;
        groupedMessages.push({ date: dateKey, messages: [message] });
      } else {
        groupedMessages[groupedMessages.length - 1].messages.push(message);
      }
    });
  }

  const totalUnread = conversations.reduce((acc, c) => acc + c.unreadCount, 0);

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Messages</h2>
          <p className="text-muted-foreground">
            {totalUnread > 0 ? `${totalUnread} unread` : "All caught up"}
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex rounded-xl border bg-card overflow-hidden min-h-0">
        {/* Conversation List */}
        <div
          className={cn(
            "w-full md:w-80 lg:w-96 border-r flex flex-col",
            !showMobileList && "hidden md:flex"
          )}
          style={{ flexShrink: 0 }}
        >
          {/* Search */}
          <div className="p-3 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search conversations..."
                className="pl-9 h-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Conversation List */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden">
            <div className="divide-y">
              {filteredConversations.map((conv) => (
                <div
                  key={conv.id}
                  onClick={() => handleSelectConversation(conv.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === "Enter" && handleSelectConversation(conv.id)}
                  className={cn(
                    "p-4 text-left hover:bg-muted/50 transition-colors flex items-start gap-3 cursor-pointer",
                    selectedId === conv.id && "bg-muted"
                  )}
                >
                  <div className="relative" style={{ flexShrink: 0 }}>
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {conv.patient.initials}
                      </AvatarFallback>
                    </Avatar>
                    {conv.unreadCount > 0 && (
                      <div className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                        <span className="text-[10px] text-primary-foreground font-medium">
                          {conv.unreadCount}
                        </span>
                      </div>
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
                    <div className="flex items-center justify-between mb-1">
                      <span className={cn("font-medium", conv.unreadCount > 0 && "font-semibold")} style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {conv.patient.name}
                      </span>
                      <span className="text-xs text-muted-foreground ml-2" style={{ flexShrink: 0 }}>
                        {formatConversationTime(conv.lastMessageTime)}
                      </span>
                    </div>
                    <p
                      className={cn(
                        "text-sm",
                        conv.unreadCount > 0 ? "text-foreground font-medium" : "text-muted-foreground"
                      )}
                      style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                    >
                      {conv.lastMessage}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Message Thread */}
        <div
          className={cn(
            "flex-1 flex flex-col min-w-0",
            showMobileList && "hidden md:flex"
          )}
        >
          {selectedConversation ? (
            <>
              {/* Thread Header */}
              <div className="flex items-center gap-3 p-4 border-b bg-card shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden shrink-0"
                  onClick={() => setShowMobileList(true)}
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {selectedConversation.patient.initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold truncate">{selectedConversation.patient.name}</h3>
                  <p className="text-xs text-muted-foreground">Patient</p>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <a href={`/patients/${selectedConversation.patient.id}`}>View Profile</a>
                </Button>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 min-h-0 px-4" ref={scrollRef}>
                <div className="py-4 space-y-6 max-w-3xl mx-auto">
                  {groupedMessages.map((group) => (
                    <div key={group.date}>
                      {/* Date Divider */}
                      <div className="flex items-center justify-center mb-4">
                        <span className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full">
                          {group.date}
                        </span>
                      </div>

                      {/* Messages */}
                      <div className="space-y-2">
                        {group.messages.map((message, idx) => {
                          const isDoctor = message.sender === "doctor";
                          const showAvatar =
                            idx === 0 || group.messages[idx - 1].sender !== message.sender;

                          return (
                            <div
                              key={message.id}
                              className={cn(
                                "flex items-end gap-2",
                                isDoctor ? "flex-row-reverse" : "flex-row"
                              )}
                            >
                              {/* Avatar */}
                              <div className="w-8 shrink-0">
                                {showAvatar && !isDoctor && (
                                  <Avatar className="h-8 w-8">
                                    <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                      {selectedConversation.patient.initials}
                                    </AvatarFallback>
                                  </Avatar>
                                )}
                              </div>

                              {/* Message Bubble */}
                              <div
                                className={cn(
                                  "max-w-[75%] rounded-2xl px-4 py-2.5",
                                  isDoctor
                                    ? "bg-primary text-primary-foreground rounded-br-md"
                                    : "bg-muted rounded-bl-md"
                                )}
                              >
                                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                                <div
                                  className={cn(
                                    "flex items-center gap-1 mt-1",
                                    isDoctor ? "justify-end" : "justify-start"
                                  )}
                                >
                                  <span
                                    className={cn(
                                      "text-[10px]",
                                      isDoctor ? "text-primary-foreground/70" : "text-muted-foreground"
                                    )}
                                  >
                                    {formatMessageTime(message.timestamp)}
                                  </span>
                                  {isDoctor && (
                                    <CheckCheck className="h-3 w-3 text-primary-foreground/70" />
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              {/* Input */}
              <div className="p-4 border-t bg-card shrink-0">
                <div className="flex gap-2 max-w-3xl mx-auto">
                  <Input
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type a message..."
                    className="flex-1 h-11 rounded-full px-4"
                  />
                  <Button
                    onClick={handleSend}
                    disabled={!input.trim() || isSending}
                    size="icon"
                    className="h-11 w-11 rounded-full shrink-0"
                  >
                    <Send className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-center p-8">
              <div>
                <MessageSquare className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="font-semibold text-lg mb-2">Select a conversation</h3>
                <p className="text-sm text-muted-foreground max-w-sm">
                  Choose a patient from the list to view and respond to their messages
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
