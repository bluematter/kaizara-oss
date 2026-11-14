"use client";

import { useState, useRef, useEffect, useCallback, memo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  MessageSquare,
  Send,
  Sparkles,
  User,
  Loader2,
  Bot,
  X,
  Maximize2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface LabMarkerContext {
  name: string;
  value: number;
  unit: string;
  score: number;
  label: string;
  interpretation?: string;
}

interface HealthChatProps {
  patientId: string;
  patientName: string;
  patientAge: number;
  patientSex: "male" | "female";
  labMarkers?: LabMarkerContext[];
}

// Memoized markdown component for performance
const MemoizedMarkdown = memo(
  ({ content }: { content: string }) => (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        // Style markdown elements
        p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
        strong: ({ children }) => (
          <strong className="font-semibold text-foreground">{children}</strong>
        ),
        em: ({ children }) => <em className="italic">{children}</em>,
        ul: ({ children }) => (
          <ul className="list-disc pl-4 mb-2 space-y-1">{children}</ul>
        ),
        ol: ({ children }) => (
          <ol className="list-decimal pl-4 mb-2 space-y-1">{children}</ol>
        ),
        li: ({ children }) => <li className="text-sm">{children}</li>,
        h1: ({ children }) => (
          <h1 className="text-lg font-bold mb-2">{children}</h1>
        ),
        h2: ({ children }) => (
          <h2 className="text-base font-bold mb-2">{children}</h2>
        ),
        h3: ({ children }) => (
          <h3 className="text-sm font-bold mb-1">{children}</h3>
        ),
        code: ({ children, className }) => {
          const isInline = !className;
          if (isInline) {
            return (
              <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">
                {children}
              </code>
            );
          }
          return (
            <code className="block bg-muted p-3 rounded-md text-xs font-mono overflow-x-auto mb-2">
              {children}
            </code>
          );
        },
        pre: ({ children }) => <>{children}</>,
        blockquote: ({ children }) => (
          <blockquote className="border-l-2 border-primary pl-3 italic text-muted-foreground mb-2">
            {children}
          </blockquote>
        ),
        a: ({ href, children }) => (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline hover:no-underline"
          >
            {children}
          </a>
        ),
        table: ({ children }) => (
          <div className="overflow-x-auto mb-2">
            <table className="min-w-full border-collapse text-sm">
              {children}
            </table>
          </div>
        ),
        th: ({ children }) => (
          <th className="border border-border px-2 py-1 bg-muted font-semibold text-left">
            {children}
          </th>
        ),
        td: ({ children }) => (
          <td className="border border-border px-2 py-1">{children}</td>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  ),
  (prevProps, nextProps) => prevProps.content === nextProps.content
);
MemoizedMarkdown.displayName = "MemoizedMarkdown";

// Suggested questions based on lab data
function getSuggestedQuestions(labMarkers?: LabMarkerContext[]): string[] {
  const suggestions: string[] = [
    "What do my lab results mean overall?",
    "What can I do to improve my health?",
  ];

  if (!labMarkers) return suggestions;

  // Find markers that need attention
  const suboptimal = labMarkers.filter((m) => m.score < 75);
  if (suboptimal.length > 0) {
    const markerName = suboptimal[0].name;
    suggestions.unshift(
      `Why is my ${markerName} ${suboptimal[0].label.toLowerCase()}?`
    );
  }

  // Check for specific markers
  const testosterone = labMarkers.find((m) => m.name === "Testosterone, Total");
  if (testosterone && testosterone.score < 75) {
    suggestions.push("How can I naturally improve my testosterone?");
  }

  const ldl = labMarkers.find((m) => m.name === "LDL Cholesterol");
  if (ldl && ldl.score < 75) {
    suggestions.push("What lifestyle changes can help lower my LDL?");
  }

  const vitD = labMarkers.find((m) => m.name === "Vitamin D, 25-OH");
  if (vitD && vitD.score < 90) {
    suggestions.push("How much vitamin D should I take?");
  }

  return suggestions.slice(0, 4);
}

export function HealthChat({
  patientId,
  patientName,
  patientAge,
  patientSex,
  labMarkers,
}: HealthChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [conversationId, setConversationId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const hasLoadedRef = useRef(false);

  const suggestedQuestions = getSuggestedQuestions(labMarkers);

  // Load conversation history when chat opens
  useEffect(() => {
    if (isOpen && !hasLoadedRef.current && patientId) {
      hasLoadedRef.current = true;
      loadConversation();
    }
  }, [isOpen, patientId]);

  const loadConversation = async () => {
    setIsLoadingHistory(true);
    try {
      const response = await fetch(`/api/conversations?patientId=${patientId}`);
      if (response.ok) {
        const conversation = await response.json();
        setConversationId(conversation.id);

        // Convert database messages to local format
        if (conversation.messages && conversation.messages.length > 0) {
          const loadedMessages: Message[] = conversation.messages
            .filter((m: { role: string }) => m.role === "USER" || m.role === "ASSISTANT")
            .map((m: { id: string; role: string; content: string; createdAt: string }) => ({
              id: m.id,
              role: m.role === "USER" ? "user" : "assistant",
              content: m.content,
              timestamp: new Date(m.createdAt),
            }));
          setMessages(loadedMessages);
        }
      }
    } catch (error) {
      console.error("Failed to load conversation:", error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const saveMessage = async (content: string, role: "USER" | "ASSISTANT") => {
    if (!conversationId) return;

    try {
      await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId,
          content,
          role,
          model: role === "ASSISTANT" ? "google/gemini-2.0-flash-001" : undefined,
        }),
      });
    } catch (error) {
      console.error("Failed to save message:", error);
    }
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      const scrollContainer = scrollRef.current.querySelector(
        "[data-radix-scroll-area-viewport]"
      );
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages, streamingContent]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current && !isLoadingHistory) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, isLoadingHistory]);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isLoading) return;

      const userMessage: Message = {
        id: Date.now().toString(),
        role: "user",
        content: content.trim(),
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setInput("");
      setIsLoading(true);
      setStreamingContent("");

      // Save user message to database
      saveMessage(content.trim(), "USER");

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [...messages, userMessage].map((m) => ({
              role: m.role,
              content: m.content,
            })),
            patientContext: {
              name: patientName,
              age: patientAge,
              sex: patientSex,
            },
            labMarkers: labMarkers?.map((m) => ({
              name: m.name,
              value: m.value,
              unit: m.unit,
              score: m.score,
              label: m.label,
              interpretation: m.interpretation,
            })),
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to get response");
        }

        // Handle streaming response
        const reader = response.body?.getReader();
        if (!reader) throw new Error("No reader available");

        const decoder = new TextDecoder();
        let fullContent = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          fullContent += chunk;
          setStreamingContent(fullContent);
        }

        // Add completed message
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: fullContent,
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, assistantMessage]);
        setStreamingContent("");

        // Save assistant message to database
        saveMessage(fullContent, "ASSISTANT");
      } catch (error) {
        console.error("Chat error:", error);
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content:
            "I apologize, but I encountered an issue. Please try again or contact your care team directly.",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMessage]);
        setStreamingContent("");
      } finally {
        setIsLoading(false);
      }
    },
    [messages, patientName, patientAge, patientSex, labMarkers, isLoading, saveMessage]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  return (
    <>
      {/* FAB Button */}
      <Button
        size="lg"
        onClick={() => setIsOpen(true)}
        className={cn(
          "fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50",
          "bg-primary hover:bg-primary/90 transition-all duration-200",
          "hover:scale-105 active:scale-95"
        )}
      >
        <MessageSquare className="h-6 w-6" />
        <span className="sr-only">Open Health Chat</span>
      </Button>

      {/* Full Screen Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent
          showCloseButton={false}
          className="max-w-none sm:max-w-none w-screen h-[100dvh] inset-0 translate-x-0 translate-y-0 top-0 left-0 m-0 p-0 flex flex-col gap-0 rounded-none border-0"
        >
          {/* Header */}
          <DialogHeader className="px-6 py-4 border-b bg-primary/5 flex-shrink-0">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary">
                <Sparkles className="h-6 w-6 text-primary-foreground" />
              </div>
              <div className="flex-1">
                <DialogTitle className="text-xl">Health Assistant</DialogTitle>
                <DialogDescription className="text-sm">
                  Ask questions about your lab results and health data
                </DialogDescription>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="h-10 w-10"
              >
                <X className="h-5 w-5" />
                <span className="sr-only">Close</span>
              </Button>
            </div>
          </DialogHeader>

          {/* Messages */}
          <ScrollArea className="flex-1 min-h-0 px-6" ref={scrollRef}>
            <div className="py-6 space-y-6 max-w-5xl mx-auto">
              {/* Loading history indicator */}
              {isLoadingHistory && (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">Loading conversation history...</p>
                  </div>
                </div>
              )}

              {!isLoadingHistory && messages.length === 0 && !streamingContent && (
                <div className="space-y-6">
                  {/* Welcome message */}
                  <div className="flex gap-4">
                    <Avatar className="h-10 w-10 shrink-0">
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        <Bot className="h-5 w-5" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="rounded-xl bg-muted p-4 text-sm max-w-[85%]">
                      <p className="font-medium mb-2">
                        Hi {patientName.split(" ")[0]}! 👋
                      </p>
                      <p className="text-muted-foreground">
                        I'm your health assistant. I can help you understand
                        your lab results, explain what your biomarkers mean, and
                        answer questions about your health data.
                      </p>
                      <p className="mt-3 text-xs text-muted-foreground border-t pt-3">
                        💡 Remember: I provide educational information only.
                        Always consult your healthcare provider for medical
                        advice and treatment decisions.
                      </p>
                    </div>
                  </div>

                  {/* Suggested questions */}
                  <div className="space-y-3 pl-14">
                    <p className="text-sm font-medium text-muted-foreground">
                      Try asking:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {suggestedQuestions.map((q, i) => (
                        <Button
                          key={i}
                          variant="outline"
                          size="sm"
                          className="h-auto py-2 px-4 text-sm text-left whitespace-normal hover:bg-primary/10 hover:border-primary"
                          onClick={() => sendMessage(q)}
                        >
                          {q}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Message history */}
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex gap-4",
                    message.role === "user" && "flex-row-reverse"
                  )}
                >
                  <Avatar className="h-10 w-10 shrink-0">
                    <AvatarFallback
                      className={cn(
                        message.role === "user"
                          ? "bg-secondary"
                          : "bg-primary text-primary-foreground"
                      )}
                    >
                      {message.role === "user" ? (
                        <User className="h-5 w-5" />
                      ) : (
                        <Bot className="h-5 w-5" />
                      )}
                    </AvatarFallback>
                  </Avatar>
                  <div
                    className={cn(
                      "rounded-xl p-4 text-sm max-w-[85%]",
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    )}
                  >
                    {message.role === "user" ? (
                      <p className="whitespace-pre-wrap">{message.content}</p>
                    ) : (
                      <MemoizedMarkdown content={message.content} />
                    )}
                  </div>
                </div>
              ))}

              {/* Streaming message */}
              {streamingContent && (
                <div className="flex gap-4">
                  <Avatar className="h-10 w-10 shrink-0">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      <Bot className="h-5 w-5" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="rounded-xl bg-muted p-4 text-sm max-w-[85%]">
                    <MemoizedMarkdown content={streamingContent} />
                    <span className="inline-block w-2 h-4 bg-primary/50 animate-pulse ml-0.5 rounded-sm" />
                  </div>
                </div>
              )}

              {/* Loading indicator */}
              {isLoading && !streamingContent && (
                <div className="flex gap-4">
                  <Avatar className="h-10 w-10 shrink-0">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      <Bot className="h-5 w-5" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="rounded-xl bg-muted p-4">
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        Thinking...
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Input */}
          <div className="p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] border-t bg-background flex-shrink-0">
            <form
              onSubmit={handleSubmit}
              className="flex gap-3 max-w-5xl mx-auto"
            >
              <Input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about your health..."
                disabled={isLoading}
                className="flex-1 h-12 text-base"
              />
              <Button
                type="submit"
                size="lg"
                disabled={!input.trim() || isLoading}
                className="h-12 px-6"
              >
                <Send className="h-5 w-5" />
                <span className="sr-only">Send</span>
              </Button>
            </form>
            <p className="text-xs text-muted-foreground text-center mt-3">
              AI responses are for educational purposes only. Always consult
              your healthcare provider.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
