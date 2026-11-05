"use client";

import { useState } from "react";
import Link from "next/link";
import confetti from "canvas-confetti";
import { Calendar, MapPin, Sparkles, ArrowRight, CheckCircle2, GraduationCap } from "lucide-react";
import { sounds } from "../sound";
import { InteractiveTicketCard } from "./InteractiveTicketCard";

interface EventItem {
  id: string;
  title: string;
  slug: string;
  category: string;
  venue: string;
  startAt: string;
  endAt?: string;
  clubName?: string;
  clubSlug?: string;
  requiresFacultyAttendance?: boolean;
  linkedSubject?: string | null;
  ticketTypes?: Array<{ id: string; name: string; capacity: number }>;
}

export function InteractiveEventCard({ event }: { event: EventItem }) {
  const [loading, setLoading] = useState(false);
  const [issuedTicket, setIssuedTicket] = useState<any | null>(null);

  const formattedDate = new Date(event.startAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const categoryColor: Record<string, string> = {
    HACKATHON: "bg-acid text-ink",
    WORKSHOP: "bg-cobalt text-paper",
    TALK: "bg-signal text-paper",
    MUSIC: "bg-berry text-paper",
    FEST: "bg-acid text-ink",
    TECHNICAL: "bg-paperDeep text-ink",
  };

  const handle1ClickRsvp = async () => {
    setLoading(true);
    sounds.playPop();

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
      const res = await fetch(`${apiUrl}/ai/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "rsvp",
          payload: {
            eventId: event.id,
            eventTitle: event.title,
            venue: event.venue,
            startAt: event.startAt,
            attendeeName: "Student Attendee (ENG24CT0058)",
          },
        }),
      });

      const data = await res.json();
      if (data.ok && data.ticket) {
        sounds.playSuccess();
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.7 },
          colors: ["#FF4A1F", "#D6FF3F", "#1F32E0", "#15130F"],
        });
        setIssuedTicket(data.ticket);
      }
    } catch {
      // Fallback ticket for offline / demo mode
      sounds.playSuccess();
      confetti({ particleCount: 50, spread: 60 });
      setIssuedTicket({
        id: "tkt-" + Date.now(),
        ticketId: "TKT-" + Math.random().toString(36).substring(2, 7).toUpperCase(),
        qrToken: "konvene-demo-signed-token-" + Date.now(),
        eventTitle: event.title,
        venue: event.venue,
        startAt: event.startAt,
        status: "ISSUED",
        attendeeName: "Student Attendee",
      });
    } finally {
      setLoading(false);
    }
  };

  if (issuedTicket) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-1.5 text-xs font-bold text-moss">
          <CheckCircle2 className="h-4 w-4" />
          <span>You are confirmed! Signed QR Pass issued below:</span>
        </div>
        <InteractiveTicketCard ticket={issuedTicket} />
      </div>
    );
  }

  return (
    <div className="relative my-2.5 overflow-hidden rounded-md border-2 border-ink bg-paper shadow-hard transition-transform hover:-translate-y-0.5">
      {/* Category header */}
      <div className="flex items-center justify-between border-b-2 border-ink bg-paperAlt px-3 py-1.5 text-xs">
        <span
          className={`rounded border border-ink px-2 py-0.5 font-mono text-[10px] font-bold uppercase ${
            categoryColor[event.category] || "bg-paper text-ink"
          }`}
        >
          {event.category}
        </span>
        <span className="font-mono text-[11px] font-semibold text-inkSoft truncate max-w-[180px]">
          {event.clubName || "Campus Club"}
        </span>
      </div>

      {/* Body */}
      <div className="p-3.5 space-y-2.5">
        <h4 className="font-display text-base font-bold text-ink leading-snug">
          {event.title}
        </h4>

        <div className="flex flex-wrap gap-x-4 gap-y-1 font-sans text-xs text-inkSoft">
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-signal" />
            <span>{formattedDate}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 text-signal" />
            <span>{event.venue}</span>
          </div>
        </div>

        {/* Academic attendance badge if applicable */}
        {event.requiresFacultyAttendance && (
          <div className="flex items-center gap-1.5 rounded border border-moss/40 bg-moss/10 px-2 py-1 text-[11px] font-semibold text-moss">
            <GraduationCap className="h-3.5 w-3.5 shrink-0" />
            <span>
              Attendance credited for {event.linkedSubject || "CS301 (Dr. Rao)"}
            </span>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={handle1ClickRsvp}
            disabled={loading}
            className="flex flex-1 items-center justify-center gap-1.5 rounded border-2 border-ink bg-signal px-3 py-1.5 font-mono text-xs font-bold text-paper shadow-hard-sm transition-transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>{loading ? "Issuing Ticket..." : "⚡ 1-Click Free RSVP"}</span>
          </button>

          <Link
            href={`/events/${event.slug}`}
            className="flex items-center justify-center rounded border-2 border-ink bg-paperAlt px-3 py-1.5 font-mono text-xs font-bold text-ink hover:bg-paperDeep"
          >
            <span>Details</span>
            <ArrowRight className="ml-1 h-3 w-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}

