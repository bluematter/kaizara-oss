"use client";

import { useState, useRef, useEffect } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Check, CheckCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, isToday, isYesterday } from "date-fns";

interface Message {
  id: string;
  content: string;
  sender: "patient" | "doctor";
  timestamp: Date;
  read: boolean;
}

interface PatientMessagesProps {
  patientName: string;
  doctorName: string;
  doctorTitle?: string;
}

// Mock messages for demo
const mockMessages: Message[] = [
  {
    id: "1",
    content: "Hi Jamie, I've reviewed your latest lab results. Your testosterone levels are looking much better since starting the protocol!",
    sender: "doctor",
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
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
    timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // Yesterday
    read: true,
  },
  {
    id: "5",
    content: "Perfect, I'll do that. Also, my next shipment arrives Thursday - should I continue with the same dosing schedule?",
    sender: "patient",
    timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000),
    read: true,
  },
  {
    id: "6",
    content: "Yes, continue with the current protocol. We'll reassess after your next labs in February. Let me know if you have any other questions!",
    sender: "doctor",
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
    read: true,
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

export function PatientMessages({ patientName, doctorName, doctorTitle = "MD" }: PatientMessagesProps) {
  const [messages, setMessages] = useState<Message[]>(mockMessages);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      const scrollContainer = scrollRef.current.querySelector("[data-radix-scroll-area-viewport]");
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isSending) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      content: input.trim(),
      sender: "patient",
      timestamp: new Date(),
      read: false,
    };

    setMessages((prev) => [...prev, newMessage]);
    setInput("");
    setIsSending(true);

    // Simulate sending delay
    setTimeout(() => {
      setIsSending(false);
      // Mark as read after "delivery"
      setMessages((prev) =>
        prev.map((m) => (m.id === newMessage.id ? { ...m, read: true } : m))
      );
    }, 500);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Group messages by date
  const groupedMessages: { date: string; messages: Message[] }[] = [];
  let currentDate = "";

  messages.forEach((message) => {
    const dateKey = formatMessageDate(message.timestamp);
    if (dateKey !== currentDate) {
      currentDate = dateKey;
      groupedMessages.push({ date: dateKey, messages: [message] });
    } else {
      groupedMessages[groupedMessages.length - 1].messages.push(message);
    }
  });

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Doctor Header */}
      <div className="flex items-center gap-3 p-4 border-b bg-card shrink-0">
        <Avatar className="h-12 w-12">
          <AvatarFallback className="bg-primary text-primary-foreground text-lg">
            {doctorName.split(" ").map((n) => n[0]).join("")}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold truncate">{doctorName}</h3>
          <p className="text-sm text-muted-foreground">{doctorTitle} • Your Care Provider</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-emerald animate-pulse" />
          <span className="text-xs text-muted-foreground">Available</span>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 min-h-0 px-4" ref={scrollRef}>
        <div className="py-4 space-y-6">
          {groupedMessages.map((group) => (
            <div key={group.date}>
              {/* Date Divider */}
              <div className="flex items-center justify-center mb-4">
                <span className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full">
                  {group.date}
                </span>
              </div>

              {/* Messages for this date */}
              <div className="space-y-2">
                {group.messages.map((message, idx) => {
                  const isPatient = message.sender === "patient";
                  const showAvatar =
                    idx === 0 ||
                    group.messages[idx - 1].sender !== message.sender;

                  return (
                    <div
                      key={message.id}
                      className={cn(
                        "flex items-end gap-2",
                        isPatient ? "flex-row-reverse" : "flex-row"
                      )}
                    >
                      {/* Avatar */}
                      <div className="w-8 shrink-0">
                        {showAvatar && !isPatient && (
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                              {doctorName.split(" ").map((n) => n[0]).join("")}
                            </AvatarFallback>
                          </Avatar>
                        )}
                      </div>

                      {/* Message Bubble */}
                      <div
                        className={cn(
                          "max-w-[75%] rounded-2xl px-4 py-2.5",
                          isPatient
                            ? "bg-primary text-primary-foreground rounded-br-md"
                            : "bg-muted rounded-bl-md"
                        )}
                      >
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        <div
                          className={cn(
                            "flex items-center gap-1 mt-1",
                            isPatient ? "justify-end" : "justify-start"
                          )}
                        >
                          <span
                            className={cn(
                              "text-[10px]",
                              isPatient ? "text-primary-foreground/70" : "text-muted-foreground"
                            )}
                          >
                            {formatMessageTime(message.timestamp)}
                          </span>
                          {isPatient && (
                            message.read ? (
                              <CheckCheck className="h-3 w-3 text-primary-foreground/70" />
                            ) : (
                              <Check className="h-3 w-3 text-primary-foreground/70" />
                            )
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
      <div className="p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] border-t bg-card shrink-0">
        <div className="flex gap-2">
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
        <p className="text-[10px] text-muted-foreground text-center mt-2">
          Messages are secure and HIPAA compliant
        </p>
      </div>
    </div>
  );
}
