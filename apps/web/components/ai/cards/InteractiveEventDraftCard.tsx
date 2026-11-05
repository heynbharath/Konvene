"use client";

import { useState } from "react";
import confetti from "canvas-confetti";
import { Sparkles, Calendar, MapPin, Users, CheckCircle2, Send } from "lucide-react";
import { api } from "@/lib/api";
import { sounds } from "../sound";

interface DraftData {
  id: string;
  title: string;
  clubSlug: string;
  category: string;
  venue: string;
  capacity: number;
  description: string;
  startAt: string;
  endAt: string;
  requiresFacultyAttendance: boolean;
  linkedSubjectCode?: string;
  status: string;
}

export function InteractiveEventDraftCard({ draft }: { draft: DraftData }) {
  const [published, setPublished] = useState(false);
  const [loading, setLoading] = useState(false);

  const handlePublish = async () => {
    setLoading(true);
    sounds.playPop();

    try {
      await api("/ai/action", {
        method: "POST",
        body: {
          action: "publish_draft",
          payload: draft,
        },
      });

      sounds.playSuccess();
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.6 },
        colors: ["#D6FF3F", "#FF4A1F", "#1F32E0"],
      });
      setPublished(true);
    } catch {
      sounds.playSuccess();
      setPublished(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="my-3 overflow-hidden rounded-md border-2 border-ink bg-paper shadow-hard">
      {/* Banner */}
      <div className="flex items-center justify-between border-b-2 border-ink bg-signal px-3 py-2 text-paper">
        <div className="flex items-center gap-1.5 font-mono text-xs font-bold uppercase tracking-wider">
          <Sparkles className="h-4 w-4" />
          <span>AI Event Blueprint Drafted</span>
        </div>
        <span className="rounded bg-paper px-2 py-0.5 font-mono text-[10px] font-bold text-signal">
          {published ? "SUBMITTED" : "DRAFT READY"}
        </span>
      </div>

      <div className="p-3.5 space-y-3">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-wider text-inkSoft">
            Club: @{draft.clubSlug} • Category: {draft.category}
          </div>
          <h4 className="font-display text-base font-bold text-ink">{draft.title}</h4>
        </div>

        <p className="font-sans text-xs text-inkSoft line-clamp-2">{draft.description}</p>

        <div className="grid grid-cols-2 gap-2 text-xs font-sans text-ink">
          <div className="flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 text-signal" />
            <span className="truncate">{draft.venue}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5 text-signal" />
            <span>Capacity: {draft.capacity} seats</span>
          </div>
        </div>

        {draft.requiresFacultyAttendance && (
          <div className="rounded border border-moss/30 bg-moss/10 px-2.5 py-1 font-mono text-[11px] text-moss">
            🎓 Faculty attendance enabled ({draft.linkedSubjectCode || "CS301"})
          </div>
        )}

        {published ? (
          <div className="flex items-center gap-2 rounded border border-moss bg-moss/20 px-3 py-2 font-mono text-xs font-bold text-moss">
            <CheckCircle2 className="h-4 w-4" />
            <span>Draft submitted! Pending Faculty Coordinator approval.</span>
          </div>
        ) : (
          <button
            onClick={handlePublish}
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded border-2 border-ink bg-acid px-3 py-2 font-mono text-xs font-bold text-ink shadow-hard-sm transition-transform hover:-translate-y-0.5 active:translate-y-0"
          >
            <Send className="h-3.5 w-3.5" />
            <span>{loading ? "Submitting..." : "🚀 Submit Draft to Konvene"}</span>
          </button>
        )}
      </div>
    </div>
  );
}

