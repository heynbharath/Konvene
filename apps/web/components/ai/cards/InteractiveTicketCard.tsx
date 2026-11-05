"use client";

import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Check, Copy, Download, MapPin, Calendar, QrCode } from "lucide-react";
import { sounds } from "../sound";

interface TicketData {
  id?: string;
  ticketId: string;
  qrToken: string;
  eventTitle: string;
  eventSlug?: string;
  venue: string;
  startAt: string;
  attendeeName: string;
  status: string;
  ticketTypeName?: string;
}

export function InteractiveTicketCard({ ticket }: { ticket: TicketData }) {
  const [copied, setCopied] = useState(false);
  const [showQrFull, setShowQrFull] = useState(false);

  const formattedDate = new Date(ticket.startAt).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const handleCopy = () => {
    navigator.clipboard.writeText(ticket.qrToken);
    setCopied(true);
    sounds.playPop();
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative my-3 overflow-hidden rounded-lg border-2 border-ink bg-paperAlt shadow-hard">
      {/* Top Banner */}
      <div className="flex items-center justify-between border-b-2 border-ink bg-signal px-4 py-2 text-paper">
        <div className="flex items-center gap-2">
          <QrCode className="h-4 w-4" />
          <span className="font-mono text-xs font-bold uppercase tracking-wider">
            Verified HMAC-SHA256 Pass
          </span>
        </div>
        <span className="rounded border border-ink bg-paper px-2 py-0.5 font-mono text-[10px] font-bold text-ink">
          {ticket.status || "ISSUED"}
        </span>
      </div>

      {/* Main Ticket Body */}
      <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex-1 space-y-2">
          <div className="font-mono text-[11px] font-bold uppercase tracking-widest text-inkSoft">
            Konvene Pass • {ticket.ticketId}
          </div>
          <h4 className="font-display text-lg font-bold leading-tight text-ink">
            {ticket.eventTitle}
          </h4>

          <div className="space-y-1 font-sans text-xs text-inkSoft">
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-signal" />
              <span>{formattedDate}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-signal" />
              <span>{ticket.venue}</span>
            </div>
          </div>

          <div className="pt-2 border-t border-ink/20">
            <span className="text-[11px] text-inkSoft">Attendee: </span>
            <span className="font-mono text-xs font-bold text-ink">{ticket.attendeeName}</span>
          </div>
        </div>

        {/* Dynamic Signed QR Code */}
        <div className="flex flex-col items-center justify-center rounded-md border-2 border-dashed border-ink bg-paper p-3 shadow-hard-sm">
          <div
            className="cursor-pointer transition-transform hover:scale-105"
            onClick={() => {
              setShowQrFull(!showQrFull);
              sounds.playPop();
            }}
            title="Click to toggle size"
          >
            <QRCodeSVG
              value={ticket.qrToken}
              size={showQrFull ? 160 : 96}
              level="H"
              includeMargin={false}
              fgColor="#15130F"
              bgColor="#F6F1E7"
            />
          </div>
          <span className="mt-1.5 font-mono text-[9px] uppercase tracking-wider text-inkSoft">
            Scan at Entrance
          </span>
        </div>
      </div>

      {/* Perforation line */}
      <div className="relative border-b-2 border-dashed border-ink/40 bg-paper">
        <div className="absolute -left-3 -top-2.5 h-5 w-5 rounded-full border-r-2 border-ink bg-paper" />
        <div className="absolute -right-3 -top-2.5 h-5 w-5 rounded-full border-l-2 border-ink bg-paper" />
      </div>

      {/* Footer Controls */}
      <div className="flex items-center justify-between bg-paperDeep/60 px-4 py-2 text-xs">
        <span className="font-mono text-[10px] text-inkSoft truncate max-w-[200px]">
          Token: {ticket.qrToken.slice(0, 18)}...
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 font-mono text-xs font-bold text-ink hover:text-signal"
        >
          {copied ? <Check className="h-3.5 w-3.5 text-moss" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? "Copied" : "Copy Token"}
        </button>
      </div>
    </div>
  );
}

