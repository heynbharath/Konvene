"use client";

import { useState, useEffect, useRef } from "react";
import {
  Sparkles,
  Send,
  X,
  Maximize2,
  Minimize2,
  Trash2,
  Volume2,
  VolumeX,
  Bot,
  User,
  Zap,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { api } from "@/lib/api";
import { sounds } from "./sound";
import { CommandPalette } from "./CommandPalette";
import { InteractiveEventCard } from "./cards/InteractiveEventCard";
import { InteractiveTicketCard } from "./cards/InteractiveTicketCard";
import { InteractiveAttendanceCard } from "./cards/InteractiveAttendanceCard";
import { InteractiveEventDraftCard } from "./cards/InteractiveEventDraftCard";
import { InteractiveClubCard } from "./cards/InteractiveClubCard";

interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  reasoning?: string;
  actionCards?: any[];
  timestamp: string;
}

const INITIAL_MESSAGE: Message = {
  id: "msg-welcome",
  role: "assistant",
  content: `Hey! I'm **Konvene Scout**, your campus operating system copilot. 

I can find hackathons, issue signed HMAC-SHA256 ticket passes, verify CS301 faculty attendance credit, draft events for your club, or look up active societies. What are we building today?`,
  timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
};

export function KonveneCopilot() {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [expandedReasoning, setExpandedReasoning] = useState<Record<string, boolean>>({});

  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [quickPrompts, setQuickPrompts] = useState<string[]>([
    "🔥 Upcoming Hackathons",
    "🎟️ Show My Tickets",
    "🎓 Check CS301 Attendance",
    "✨ Draft Event for GDSC",
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      inputRef.current?.focus();
    }
  }, [messages, isOpen]);

  // Global ⌘K keyboard listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((prev) => !prev);
      } else if (e.key === "Escape") {
        if (paletteOpen) setPaletteOpen(false);
        else if (isOpen) setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [paletteOpen, isOpen]);

  const handleToggleSound = () => {
    sounds.enabled = !soundEnabled;
    setSoundEnabled(!soundEnabled);
    sounds.playPop();
  };

  const handleClearChat = () => {
    sounds.playPop();
    setMessages([INITIAL_MESSAGE]);
  };

  const handleSendMessage = async (userPrompt?: string) => {
    const text = (userPrompt || inputValue).trim();
    if (!text || loading) return;

    sounds.playPop();
    const userMsg: Message = {
      id: "usr-" + Date.now(),
      role: "user",
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue("");
    setLoading(true);

    try {
      const payloadMessages = [...messages, userMsg].map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const data = await api("/ai/chat", {
        method: "POST",
        body: {
          messages: payloadMessages,
          user: {
            name: "Student Attendee",
            email: "student@konvene.dev",
            usn: "ENG24CT0058",
          },
        },
      });

      sounds.playSuccess();
      const assistantMsg: Message = {
        id: "ai-" + Date.now(),
        role: "assistant",
        content: data.message || "Done!",
        reasoning: data.reasoning,
        actionCards: data.actionCards || [],
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, assistantMsg]);
      if (data.quickSuggestions && data.quickSuggestions.length > 0) {
        setQuickPrompts(data.quickSuggestions);
      }
    } catch (err: any) {
      const fallbackMsg: Message = {
        id: "ai-err-" + Date.now(),
        role: "assistant",
        content: `⚡ **Scout Update**: ${
          err.message || "Campus server request completed."
        }\n\nYou can explore active events on the [Events page](/events) or view your credentials on [Verify](/verify).`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleCommandPaletteAction = (prompt: string) => {
    setIsOpen(true);
    handleSendMessage(prompt);
  };

  return (
    <>
      {/* ⌘K Global Spotlight Modal */}
      <CommandPalette
        isOpen={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        onSelectAction={handleCommandPaletteAction}
      />

      {/* Floating Neo-Brutalist Trigger Badge (Bottom Right) */}
      {!isOpen && (
        <button
          onClick={() => {
            sounds.playPop();
            setIsOpen(true);
          }}
          className="fixed bottom-6 right-6 z-40 group flex items-center gap-2.5 rounded-full border-2 border-ink bg-paperAlt px-4 py-2.5 shadow-hard transition-all hover:-translate-x-1 hover:-translate-y-1 hover:shadow-hard-lg hover:bg-paper active:translate-x-0 active:translate-y-0"
        >
          {/* Pulsing online status indicator */}
          <span className="relative flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-signal opacity-75" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-signal" />
          </span>

          <div className="flex items-center gap-1.5 font-display text-sm font-bold text-ink">
            <Zap className="h-4 w-4 text-signal fill-signal" />
            <span>Konvene Scout</span>
          </div>

          <span className="hidden sm:inline-flex rounded border border-ink/40 bg-paper px-1.5 py-0.5 font-mono text-[10px] font-bold text-inkSoft">
            ⌘K
          </span>
        </button>
      )}

      {/* Slide-out Neo-Brutalist Copilot Drawer */}
      {isOpen && (
        <div
          className={`fixed bottom-4 right-4 z-50 flex flex-col overflow-hidden rounded-xl border-2 border-ink bg-paper shadow-hard-lg transition-all duration-200 ${
            isExpanded
              ? "w-[94vw] sm:w-[680px] h-[86vh]"
              : "w-[94vw] sm:w-[440px] h-[78vh]"
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b-2 border-ink bg-paperAlt px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded border border-ink bg-signal text-paper shadow-hard-sm">
                <Zap className="h-4 w-4 fill-paper" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-display text-sm font-bold text-ink">Konvene Scout</h3>
                  <span className="rounded border border-moss/40 bg-moss/20 px-1.5 py-0.2 font-mono text-[9px] font-bold text-moss">
                    GROQ 120B
                  </span>
                </div>
                <div className="font-mono text-[10px] text-inkSoft">
                  Autonomous Campus Assistant
                </div>
              </div>
            </div>

            {/* Header Action Controls */}
            <div className="flex items-center gap-1 text-inkSoft">
              <button
                onClick={handleToggleSound}
                className="p-1.5 hover:text-ink rounded hover:bg-paper"
                title={soundEnabled ? "Mute sounds" : "Enable sounds"}
              >
                {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
              </button>

              <button
                onClick={handleClearChat}
                className="p-1.5 hover:text-ink rounded hover:bg-paper"
                title="Clear conversation"
              >
                <Trash2 className="h-4 w-4" />
              </button>

              <button
                onClick={() => {
                  sounds.playPop();
                  setIsExpanded(!isExpanded);
                }}
                className="p-1.5 hover:text-ink rounded hover:bg-paper hidden sm:inline-block"
                title={isExpanded ? "Standard width" : "Expand width"}
              >
                {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </button>

              <button
                onClick={() => {
                  sounds.playPop();
                  setIsOpen(false);
                }}
                className="p-1.5 hover:text-ink rounded hover:bg-paper"
                title="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Messages Viewport */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-paper bg-dot-grid bg-dots">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${
                  msg.role === "user" ? "items-end" : "items-start"
                }`}
              >
                {/* Role indicator label */}
                <div className="mb-1 flex items-center gap-1 font-mono text-[10px] text-inkSoft">
                  {msg.role === "user" ? (
                    <>
                      <span>You</span>
                      <User className="h-3 w-3" />
                    </>
                  ) : (
                    <>
                      <Bot className="h-3 w-3 text-signal" />
                      <span>Scout</span>
                      <span>•</span>
                      <span>{msg.timestamp}</span>
                    </>
                  )}
                </div>

                {/* Message Bubble Card */}
                <div
                  className={`max-w-[92%] rounded-lg border-2 border-ink p-3.5 shadow-hard-sm ${
                    msg.role === "user"
                      ? "bg-paperAlt text-ink font-medium"
                      : "bg-paper text-ink"
                  }`}
                >
                  {/* Markdown formatted content */}
                  <div className="font-sans text-xs sm:text-sm whitespace-pre-wrap leading-relaxed space-y-2">
                    {msg.content}
                  </div>

                  {/* Collapsible Model Reasoning toggle if present */}
                  {msg.reasoning && (
                    <div className="mt-3 border-t border-ink/20 pt-2">
                      <button
                        onClick={() =>
                          setExpandedReasoning((prev) => ({
                            ...prev,
                            [msg.id]: !prev[msg.id],
                          }))
                        }
                        className="flex items-center gap-1 font-mono text-[10px] font-bold text-inkSoft hover:text-ink"
                      >
                        <Sparkles className="h-3 w-3 text-signal" />
                        <span>
                          {expandedReasoning[msg.id]
                            ? "Hide Agent Reasoning"
                            : "View Agent Reasoning"}
                        </span>
                        {expandedReasoning[msg.id] ? (
                          <ChevronUp className="h-3 w-3" />
                        ) : (
                          <ChevronDown className="h-3 w-3" />
                        )}
                      </button>
                      {expandedReasoning[msg.id] && (
                        <div className="mt-2 rounded bg-paperAlt p-2 font-mono text-[11px] text-inkSoft leading-tight border border-ink/20">
                          {msg.reasoning}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Render Generative UI Action Cards */}
                  {msg.actionCards && msg.actionCards.length > 0 && (
                    <div className="mt-3 space-y-3">
                      {msg.actionCards.map((card: any, idx: number) => {
                        if (card.type === "EVENT_LIST" && card.events) {
                          return (
                            <div key={idx} className="space-y-2">
                              {card.events.map((evt: any) => (
                                <InteractiveEventCard key={evt.id} event={evt} />
                              ))}
                            </div>
                          );
                        }

                        if (card.type === "TICKET_CARD" && card.tickets) {
                          return (
                            <div key={idx} className="space-y-2">
                              {card.tickets.map((tkt: any, tIdx: number) => (
                                <InteractiveTicketCard key={tIdx} ticket={tkt} />
                              ))}
                            </div>
                          );
                        }

                        if (card.type === "RSVP_CONFIRMATION" && card.ticket) {
                          return (
                            <InteractiveTicketCard key={idx} ticket={card.ticket} />
                          );
                        }

                        if (card.type === "ATTENDANCE_CARD" && card.data) {
                          return (
                            <InteractiveAttendanceCard key={idx} data={card.data} />
                          );
                        }

                        if (card.type === "EVENT_DRAFT_CARD" && card.draft) {
                          return (
                            <InteractiveEventDraftCard key={idx} draft={card.draft} />
                          );
                        }

                        if (card.type === "CLUB_LIST" && card.clubs) {
                          return (
                            <InteractiveClubCard key={idx} clubs={card.clubs} />
                          );
                        }

                        return null;
                      })}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Agent Thinking Indicator */}
            {loading && (
              <div className="flex items-center gap-2 rounded-md border-2 border-dashed border-ink/40 bg-paperAlt p-3 font-mono text-xs text-inkSoft animate-pulse">
                <Zap className="h-4 w-4 text-signal fill-signal animate-bounce" />
                <span>Scout is querying campus records with Groq (~800 tok/s)...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggestion Pills */}
          <div className="border-t border-ink/20 bg-paperAlt/50 px-3 py-2 overflow-x-auto">
            <div className="flex items-center gap-1.5 whitespace-nowrap">
              {quickPrompts.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(prompt)}
                  disabled={loading}
                  className="rounded-full border border-ink bg-paper px-2.5 py-1 font-mono text-[11px] font-bold text-ink shadow-hard-sm transition-transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>

          {/* Input Footer */}
          <div className="border-t-2 border-ink bg-paperAlt p-3">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask Scout or request 1-click tickets..."
                disabled={loading}
                className="flex-1 rounded-md border-2 border-ink bg-paper px-3 py-2 font-sans text-xs sm:text-sm text-ink placeholder:text-inkSoft/60 focus:outline-none focus:ring-2 focus:ring-signal"
              />
              <button
                type="submit"
                disabled={loading || !inputValue.trim()}
                className="flex h-9 w-9 items-center justify-center rounded-md border-2 border-ink bg-signal text-paper shadow-hard-sm transition-transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

