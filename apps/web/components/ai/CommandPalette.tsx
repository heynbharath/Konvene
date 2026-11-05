"use client";

import { useEffect, useState, useRef } from "react";
import { Sparkles, Calendar, Ticket, GraduationCap, Users, X, CornerDownLeft, Search } from "lucide-react";
import { sounds } from "./sound";

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAction: (prompt: string) => void;
}

export function CommandPalette({ isOpen, onClose, onSelectAction }: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      sounds.playPop();
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery("");
    }
  }, [isOpen]);

  const quickActions = [
    {
      icon: <Calendar className="h-4 w-4 text-signal" />,
      label: "Find upcoming hackathons with attendance credit",
      category: "Events",
      prompt: "Show me upcoming hackathons that offer attendance credit for CS301",
    },
    {
      icon: <Ticket className="h-4 w-4 text-cobalt" />,
      label: "Show my tickets and signed QR codes",
      category: "Tickets",
      prompt: "Show my registered tickets and live QR code passes",
    },
    {
      icon: <GraduationCap className="h-4 w-4 text-moss" />,
      label: "Check Dr. Rao CS301 attendance eligibility",
      category: "Academics",
      prompt: "How does attendance crediting work for CS301 Compiler Design?",
    },
    {
      icon: <Sparkles className="h-4 w-4 text-acid" />,
      label: "Draft a new workshop for GDSC (120 seats)",
      category: "Club Leads",
      prompt: "Draft an AI Agents Workshop for GDSC with 120 seats and CS301 attendance credit",
    },
    {
      icon: <Users className="h-4 w-4 text-berry" />,
      label: "List active campus clubs and advisors",
      category: "Clubs",
      prompt: "List all active campus clubs and their faculty advisors",
    },
  ];

  const filtered = query
    ? quickActions.filter(
        (a) =>
          a.label.toLowerCase().includes(query.toLowerCase()) ||
          a.category.toLowerCase().includes(query.toLowerCase())
      )
    : quickActions;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 sm:pt-28">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-ink/70 backdrop-blur-sm transition-opacity"
        onClick={() => {
          sounds.playPop();
          onClose();
        }}
      />

      {/* Palette Modal */}
      <div className="relative w-full max-w-xl mx-4 overflow-hidden rounded-lg border-2 border-ink bg-paper shadow-hard-lg">
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 border-b-2 border-ink bg-paperAlt px-4 py-3">
          <Search className="h-5 w-5 text-signal" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && query.trim()) {
                onSelectAction(query.trim());
                onClose();
              } else if (e.key === "Escape") {
                onClose();
              }
            }}
            placeholder="Ask Konvene Scout or search events, tickets, clubs..."
            className="flex-1 bg-transparent font-sans text-sm font-medium text-ink placeholder:text-inkSoft/60 focus:outline-none"
          />
          <div className="flex items-center gap-1.5">
            <span className="rounded border border-ink/30 bg-paper px-1.5 py-0.5 font-mono text-[10px] font-bold text-inkSoft">
              ESC
            </span>
            <button
              onClick={onClose}
              className="text-inkSoft hover:text-ink"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Suggestion list */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {query.trim() && (
            <button
              onClick={() => {
                onSelectAction(query.trim());
                onClose();
              }}
              className="flex w-full items-center justify-between rounded-md border border-dashed border-signal bg-signal/10 px-3 py-2 text-left font-mono text-xs font-bold text-ink hover:bg-signal/20"
            >
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-signal" />
                <span>Ask Scout: &quot;{query}&quot;</span>
              </div>
              <CornerDownLeft className="h-3.5 w-3.5 text-signal" />
            </button>
          )}

          <div className="px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-inkSoft">
            Instant Actions & Prompts
          </div>

          {filtered.map((action, idx) => (
            <button
              key={idx}
              onClick={() => {
                onSelectAction(action.prompt);
                onClose();
              }}
              className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left transition-colors hover:bg-paperAlt active:bg-paperDeep"
            >
              <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded border border-ink/20 bg-paper">
                  {action.icon}
                </div>
                <div>
                  <div className="font-sans text-xs font-semibold text-ink">{action.label}</div>
                  <div className="font-mono text-[10px] text-inkSoft">{action.category}</div>
                </div>
              </div>
              <span className="font-mono text-[10px] text-inkSoft opacity-0 group-hover:opacity-100">
                ↵
              </span>
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t-2 border-ink bg-paperAlt px-4 py-2 font-mono text-[11px] text-inkSoft">
          <div className="flex items-center gap-2">
            <span>Powered by Groq 120B</span>
            <span>•</span>
            <span className="text-signal font-bold">~800 tok/s</span>
          </div>
          <div>Press ↵ to run</div>
        </div>
      </div>
    </div>
  );
}

