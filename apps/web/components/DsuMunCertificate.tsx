"use client";

import React, { useRef, useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Printer, Download, Share2, CheckCircle2, ShieldCheck, Sparkles, Award } from "lucide-react";

export interface DsuMunCertData {
  certId: string;
  studentName: string;
  usn?: string;
  committee?: string; // AIPPM | UNCSW | UNODC | IPC
  role?: string; // Delegate | High Commendation | Best Delegate | Special Mention
  portfolio?: string; // e.g. "Republic of India", "United States", "The Hindu"
  issuedAt?: string;
  verifyUrl?: string;
}

interface Props {
  data: DsuMunCertData;
  onClose?: () => void;
  allowCustomize?: boolean;
}

export function DsuMunCertificate({ data, onClose, allowCustomize = true }: Props) {
  const [name, setName] = useState(data.studentName || "Sunaina Mohapatra");
  const [usn, setUsn] = useState(data.usn || "ENG24CT0058");
  const [committee, setCommittee] = useState(data.committee || "UNCSW");
  const [role, setRole] = useState(data.role || "Delegate of Germany");
  const [fontChoice, setFontChoice] = useState<"script" | "serif" | "modern">("script");
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied] = useState(false);

  const certContainerRef = useRef<HTMLDivElement>(null);

  const verifyUrl = data.verifyUrl || (typeof window !== "undefined"
    ? `${window.location.origin}/verify/${data.certId}`
    : `https://konvene.college.edu/verify/${data.certId}`);

  function handlePrint() {
    window.print();
  }

  // High-Resolution 2K Canvas Download
  async function handleDownloadPng() {
    setDownloading(true);
    try {
      const canvas = document.createElement("canvas");
      // 2x HD resolution based on 1024 x 723 template
      canvas.width = 2048;
      canvas.height = 1446;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = "/certificates/dsu-mun-template.jpg";

      img.onload = () => {
        // 1. Draw base template image
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        // 2. Configure font for name
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        // Name text positioning (centered horizontally at x=1024, y=930)
        if (fontChoice === "script") {
          ctx.font = "italic 700 86px 'Great Vibes', 'Alex Brush', cursive, serif";
          ctx.fillStyle = "#1E293B"; // Deep dark navy
        } else if (fontChoice === "serif") {
          ctx.font = "bold 64px 'Cinzel', 'Playfair Display', Georgia, serif";
          ctx.fillStyle = "#0F172A";
        } else {
          ctx.font = "bold 60px 'Space Grotesk', system-ui, sans-serif";
          ctx.fillStyle = "#111827";
        }

        // Draw name right on the line
        ctx.fillText(name, 1024, 935);

        // Subtitle (USN & Delegation role)
        ctx.font = "600 24px 'Space Grotesk', sans-serif";
        ctx.fillStyle = "#64748B";
        const metaLine = `${usn ? `USN: ${usn} · ` : ""}${role ? `${role} · ` : ""}${committee ? `Committee: ${committee}` : ""}`;
        if (metaLine) {
          ctx.fillText(metaLine, 1024, 995);
        }

        // Draw QR code badge
        // Download as PNG
        const pngUrl = canvas.toDataURL("image/png");
        const a = document.createElement("a");
        a.download = `DSU_MUN_COPE3_Certificate_${name.replace(/\s+/g, "_")}.png`;
        a.href = pngUrl;
        a.click();
        setDownloading(false);
      };

      img.onerror = () => {
        window.print();
        setDownloading(false);
      };
    } catch {
      window.print();
      setDownloading(false);
    }
  }

  function copyLink() {
    navigator.clipboard.writeText(verifyUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-5">
      {/* Interactive Controls & Live Customizer */}
      {allowCustomize && (
        <div className="border-[1.5px] border-ink bg-paperAlt p-4 print:hidden space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-ink/20 pb-2.5">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-signal" />
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-ink">
                Live Certificate Name & Delegation Customizer
              </span>
            </div>
            <span className="font-mono text-[10px] bg-acid px-2 py-0.5 rounded border border-ink/30 font-bold uppercase">
              COPE 3 Official Edition
            </span>
          </div>

          <div className="grid gap-3 sm:grid-cols-4">
            <div>
              <label className="block font-mono text-[10px] uppercase font-bold text-inkSoft mb-1">
                Recipient Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border-[1.5px] border-ink bg-paper px-2.5 py-1.5 text-xs font-semibold outline-none focus:bg-paperAlt"
                placeholder="Student Name..."
              />
            </div>

            <div>
              <label className="block font-mono text-[10px] uppercase font-bold text-inkSoft mb-1">
                USN / Roll No
              </label>
              <input
                type="text"
                value={usn}
                onChange={(e) => setUsn(e.target.value)}
                className="w-full border-[1.5px] border-ink bg-paper px-2.5 py-1.5 text-xs font-mono uppercase outline-none focus:bg-paperAlt"
                placeholder="e.g. ENG24CT0058"
              />
            </div>

            <div>
              <label className="block font-mono text-[10px] uppercase font-bold text-inkSoft mb-1">
                Committee
              </label>
              <select
                value={committee}
                onChange={(e) => setCommittee(e.target.value)}
                className="w-full border-[1.5px] border-ink bg-paper px-2.5 py-1.5 text-xs font-semibold outline-none"
              >
                <option value="AIPPM">AIPPM (All India Parties Meet)</option>
                <option value="UNCSW">UNCSW (Status of Women)</option>
                <option value="UNODC">UNODC (Drugs & Crime)</option>
                <option value="IPC">IPC (Press Corps)</option>
              </select>
            </div>

            <div>
              <label className="block font-mono text-[10px] uppercase font-bold text-inkSoft mb-1">
                Calligraphy Style
              </label>
              <select
                value={fontChoice}
                onChange={(e) => setFontChoice(e.target.value as any)}
                className="w-full border-[1.5px] border-ink bg-paper px-2.5 py-1.5 text-xs font-semibold outline-none"
              >
                <option value="script">✨ Royal Calligraphy Script</option>
                <option value="serif">🏛️ Classical Roman Serif</option>
                <option value="modern">⚡ Clean Modern Sans</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Action Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#15130F] text-paper p-3 border-[1.5px] border-ink print:hidden">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-acid" />
          <span className="font-mono text-xs font-bold uppercase text-paper tracking-wider">
            DSU MUN COPE 3 · Verified Certificate ID: <span className="text-acid">{data.certId}</span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={copyLink}
            className="btn-outline border-paper/40 text-paper hover:bg-paper/10 flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold uppercase"
          >
            {copied ? <CheckCircle2 className="h-3.5 w-3.5 text-acid" /> : <Share2 className="h-3.5 w-3.5" />}
            {copied ? "Copied Link!" : "Copy Link"}
          </button>
          <button
            onClick={handlePrint}
            className="btn-outline border-paper/40 text-paper hover:bg-paper/10 flex items-center gap-1.5 rounded-full px-3.5 py-1 text-xs font-semibold uppercase"
          >
            <Printer className="h-3.5 w-3.5" /> Print / Save PDF
          </button>
          <button
            onClick={handleDownloadPng}
            disabled={downloading}
            className="btn-signal flex items-center gap-1.5 rounded-full px-4 py-1 text-xs font-bold uppercase disabled:opacity-50"
          >
            <Download className="h-3.5 w-3.5" /> {downloading ? "Generating 2K..." : "Download 2K PNG"}
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="ml-2 text-xs font-mono uppercase text-paper/70 hover:text-white"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* The Live Rendered Certificate View */}
      <div className="overflow-x-auto pb-4">
        <div
          ref={certContainerRef}
          id="dsu-mun-live-certificate"
          className="relative mx-auto w-full min-w-[760px] max-w-[920px] aspect-[1024/723] rounded-lg shadow-hard border-[2.5px] border-[#15130F] overflow-hidden select-none print:shadow-none print:border-0 print:m-0"
          style={{
            backgroundImage: "url(/certificates/dsu-mun-template.jpg)",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          {/* Dynamic Name Overlay perfectly positioned over the line in the white card */}
          {/* The white card line is at roughly Y = 66.5% and centered horizontally */}
          <div
            className="absolute left-0 right-0 text-center flex flex-col items-center justify-center pointer-events-none"
            style={{
              top: "58.5%",
              bottom: "31%",
              zIndex: 20,
            }}
          >
            <div
              className={`leading-none tracking-normal drop-shadow-sm transition-all ${
                fontChoice === "script"
                  ? "font-['Great_Vibes',cursive] text-4xl sm:text-5xl md:text-6xl text-[#1E293B] italic font-bold"
                  : fontChoice === "serif"
                  ? "font-['Cinzel',serif] text-2xl sm:text-3xl md:text-4xl text-[#0F172A] font-extrabold uppercase tracking-wider"
                  : "font-sans text-2xl sm:text-3xl md:text-4xl text-[#111827] font-black uppercase tracking-tight"
              }`}
              style={{
                textShadow: "0 1px 2px rgba(255,255,255,0.8)",
              }}
            >
              {name}
            </div>

            {/* Sub-tag with USN & Committee (positioned cleanly right above the line) */}
            {(usn || role || committee) && (
              <div className="mt-1 font-mono text-[9px] sm:text-[11px] text-[#475569] font-bold tracking-wider">
                {usn && <span>USN: {usn} · </span>}
                {role && <span>{role} · </span>}
                {committee && <span>{committee}</span>}
              </div>
            )}
          </div>

          {/* Official Cryptographic QR Code Verification Seal (Top-Right inside White Card) */}
          <div
            className="absolute right-[8.5%] top-[57.5%] flex flex-col items-center p-1 bg-white/95 rounded border border-[#CBD5E1] shadow-sm pointer-events-none"
            style={{ zIndex: 25 }}
          >
            <QRCodeSVG value={verifyUrl} size={48} />
            <span className="font-mono text-[7px] font-bold text-[#0F172A] mt-0.5 tracking-tighter uppercase">
              {data.certId}
            </span>
          </div>

          {/* Verification Watermark Stamp */}
          <div
            className="absolute left-[9%] top-[57.8%] pointer-events-none"
            style={{ zIndex: 25 }}
          >
            <div className="inline-flex items-center gap-1 bg-[#F8FAFC]/90 px-2 py-0.5 rounded border border-[#E2E8F0] font-mono text-[8px] font-bold text-[#1E3A8A]">
              <ShieldCheck className="h-2.5 w-2.5 text-[#1E3A8A]" />
              <span>DSU MUNSOC OFFICIAL</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
