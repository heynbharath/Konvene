"use client";

import React, { useRef, useState } from "react";
import { Printer, Download, Share2, CheckCircle2, ShieldCheck, Sparkles } from "lucide-react";

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
  // Clean initial recipient name: prevent Dean / Faculty names or titles from showing on student certificate
  const cleanInitialName = () => {
    let raw = data.studentName || "";
    if (
      raw.includes("Dean") ||
      raw.includes("Dr. Rao") ||
      raw.includes("Dr. K. S. Arvind") ||
      raw.includes("usr-admin") ||
      raw.toLowerCase().includes("faculty")
    ) {
      return "Sunaina Mohapatra";
    }
    raw = raw.replace(/\s*\([^)]*\)/g, "").trim();
    return raw || "Sunaina Mohapatra";
  };

  const [name, setName] = useState(cleanInitialName);
  const [usn, setUsn] = useState(data.usn || "ENG24CT0058");
  const [committee, setCommittee] = useState(data.committee || "UNCSW");
  const [role, setRole] = useState(data.role || "Delegate of Germany");
  const [fontChoice, setFontChoice] = useState<"serif" | "script" | "modern">("serif");
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
        // In the 1024x723 template, the line is at Y = 485.
        // In 2048x1446 canvas, line is at Y = 485 * 2 = 970.
        // We set textBaseline = "bottom" so the text sits right on the line at Y = 964
        ctx.textAlign = "center";
        ctx.textBaseline = "bottom";

        if (fontChoice === "serif") {
          ctx.font = "bold 56px 'Cinzel', 'Playfair Display', Georgia, serif";
          ctx.fillStyle = "#0F172A";
        } else if (fontChoice === "script") {
          ctx.font = "italic 400 70px 'Great Vibes', 'Alex Brush', cursive, serif";
          ctx.fillStyle = "#1E293B";
        } else {
          ctx.font = "bold 46px 'Space Grotesk', system-ui, sans-serif";
          ctx.fillStyle = "#111827";
        }

        // Draw cleaned name directly above the line
        const displayName = name.replace(/\s*\([^)]*\)/g, "").trim();
        ctx.fillText(displayName, 1024, 964);

        // Download as PNG
        const pngUrl = canvas.toDataURL("image/png");
        const a = document.createElement("a");
        a.download = `DSU_MUN_COPE3_Certificate_${displayName.replace(/\s+/g, "_")}.png`;
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

  const cleanDisplayName = name.replace(/\s*\([^)]*\)/g, "").trim();

  return (
    <div className="space-y-4">
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
                <option value="AIPPM">AIPPM (All India Political Parties Meet)</option>
                <option value="UNCSW">UNCSW (Commission on the Status of Women)</option>
                <option value="UNODC">UNODC (Office on Drugs and Crime)</option>
                <option value="IPC">IPC (International Press Corps)</option>
              </select>
            </div>

            <div>
              <label className="block font-mono text-[10px] uppercase font-bold text-inkSoft mb-1">
                Typography Style
              </label>
              <select
                value={fontChoice}
                onChange={(e) => setFontChoice(e.target.value as any)}
                className="w-full border-[1.5px] border-ink bg-paper px-2.5 py-1.5 text-xs font-semibold outline-none"
              >
                <option value="serif">🏛️ Classical Roman Serif (Recommended)</option>
                <option value="script">✨ Royal Calligraphy Script</option>
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
      <div className="overflow-x-auto pb-2">
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
          {/* Dynamic Name Overlay positioned strictly above the line at Y = 67.1% */}
          {/* Top text 'This Certificate is proudly awarded to' ends at 61.2% */}
          {/* Black line sits at Y = 67.08% (485px / 723px) */}
          <div
            className="absolute left-[22%] right-[22%] flex items-end justify-center pointer-events-none"
            style={{
              top: "61.5%",
              height: "5.4%",
              zIndex: 20,
            }}
          >
            <div
              className={`leading-none tracking-normal transition-all text-center pb-1 ${
                fontChoice === "serif"
                  ? "font-['Cinzel',serif] text-xl sm:text-2xl md:text-3xl text-[#0F172A] font-bold uppercase tracking-wider"
                  : fontChoice === "script"
                  ? "font-['Great_Vibes',cursive] text-2xl sm:text-3xl md:text-4xl text-[#1E293B] italic font-normal"
                  : "font-sans text-lg sm:text-xl md:text-2xl text-[#111827] font-bold uppercase tracking-tight"
              }`}
              style={{
                textShadow: "0 1px 2px rgba(255,255,255,0.7)",
              }}
            >
              {cleanDisplayName}
            </div>
          </div>
        </div>

        {/* Official Delegation Breakdown & Cryptographic Record Card */}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-[1.5px] border-ink bg-[#15130F] text-paper p-3 text-xs font-mono rounded">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-acid font-bold">DELEGATE:</span>
            <span className="text-white font-semibold">{cleanDisplayName}</span>
            {usn && <span className="text-paper/60">({usn})</span>}
            <span className="text-paper/40">·</span>
            <span className="text-acid font-semibold">{committee}</span>
            <span className="text-paper/40">·</span>
            <span className="text-paper/80">{role}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[11px] text-paper/70">
              Record ID: <strong className="text-acid">{data.certId}</strong>
            </span>
            <a
              href={verifyUrl}
              target="_blank"
              rel="noreferrer"
              className="text-acid underline text-[11px] hover:text-white"
            >
              Verify Ledger ↗
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
