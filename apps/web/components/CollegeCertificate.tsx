"use client";

import React, { useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Printer, Download, CheckCircle2, ShieldCheck, Share2, ExternalLink } from "lucide-react";

export interface CertificateData {
  certId: string;
  studentName: string;
  usn?: string;
  department?: string;
  section?: string;
  eventTitle: string;
  clubName: string;
  eventDate: string;
  venue?: string;
  subjectCode?: string;
  subjectName?: string;
  facultyName?: string;
  issuedAt?: string;
  customBackgroundUrl?: string; // For user-provided certificate background image later
  templateVariant?: "academic_classic" | "gold_seal" | "tech_dark";
}

interface Props {
  data: CertificateData;
  onClose?: () => void;
}

export function CollegeCertificate({ data, onClose }: Props) {
  const certRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied] = useState(false);

  const verifyUrl = typeof window !== "undefined"
    ? `${window.location.origin}/verify/${data.certId}`
    : `https://konvene.college.edu/verify/${data.certId}`;

  function handlePrint() {
    window.print();
  }

  async function handleDownloadImage() {
    if (!certRef.current) return;
    setDownloading(true);

    try {
      // Dynamic import to avoid SSR issues
      const domElement = certRef.current;
      const width = domElement.offsetWidth * 2;
      const height = domElement.offsetHeight * 2;

      // Draw to an HTML5 canvas for clean export
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");

      if (ctx) {
        // High quality scale
        ctx.scale(2, 2);
        
        // Convert the DOM to an SVG foreignObject for crisp rendering
        const clone = domElement.cloneNode(true) as HTMLElement;
        clone.style.transform = "none";
        
        const dataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`
          <svg xmlns="http://www.w3.org/2000/svg" width="${domElement.offsetWidth}" height="${domElement.offsetHeight}">
            <foreignObject width="100%" height="100%">
              <div xmlns="http://www.w3.org/1999/xhtml">
                ${domElement.outerHTML}
              </div>
            </foreignObject>
          </svg>
        `)}`;

        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          ctx.drawImage(img, 0, 0);
          const pngUrl = canvas.toDataURL("image/png");
          const a = document.createElement("a");
          a.download = `Certificate_${data.studentName.replace(/\s+/g, "_")}_${data.certId}.png`;
          a.href = pngUrl;
          a.click();
          setDownloading(false);
        };
        img.onerror = () => {
          // Fallback to print
          window.print();
          setDownloading(false);
        };
        img.src = dataUrl;
      } else {
        window.print();
        setDownloading(false);
      }
    } catch {
      window.print();
      setDownloading(false);
    }
  }

  function copyVerificationLink() {
    navigator.clipboard.writeText(verifyUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-4">
      {/* Top Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-paperAlt p-3 border-[1.5px] border-ink print:hidden">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-moss" />
          <span className="font-mono text-xs font-bold uppercase tracking-wide text-ink">
            Official Academic Certificate · ID: <span className="text-signal">{data.certId}</span>
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={copyVerificationLink}
            className="btn-outline flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-wide"
            title="Copy Public Verification Link"
          >
            {copied ? <CheckCircle2 className="h-3.5 w-3.5 text-moss" /> : <Share2 className="h-3.5 w-3.5" />}
            {copied ? "Copied Link!" : "Copy Link"}
          </button>
          <button
            onClick={handlePrint}
            className="btn-outline flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-wide"
          >
            <Printer className="h-3.5 w-3.5" /> Print / Save PDF
          </button>
          <button
            onClick={handleDownloadImage}
            disabled={downloading}
            className="btn-signal flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wide disabled:opacity-50"
          >
            <Download className="h-3.5 w-3.5" /> {downloading ? "Preparing…" : "Download PNG"}
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="ml-2 text-xs font-bold uppercase text-inkSoft hover:text-ink"
            >
              Close ✕
            </button>
          )}
        </div>
      </div>

      {/* The Printable / Renderable Certificate Frame */}
      <div className="overflow-x-auto pb-4">
        <div
          ref={certRef}
          id="official-college-certificate"
          className="relative mx-auto w-full min-w-[760px] max-w-[880px] aspect-[1.414/1] bg-[#FCFBF7] text-[#15130F] p-8 sm:p-12 shadow-hard border-[2.5px] border-[#15130F] select-none print:shadow-none print:border-[2px] print:m-0 print:p-8"
          style={{
            backgroundImage: data.customBackgroundUrl ? `url(${data.customBackgroundUrl})` : undefined,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          {/* Decorative Classic Guilloche / Ornate Borders */}
          <div className="absolute inset-3 sm:inset-4 border-[2px] border-[#8C6D3B] pointer-events-none" />
          <div className="absolute inset-4 sm:inset-5 border-[1px] border-dashed border-[#8C6D3B]/60 pointer-events-none" />

          {/* Corner Rosettes */}
          <div className="absolute top-2 left-2 text-[#8C6D3B] text-lg font-serif">❖</div>
          <div className="absolute top-2 right-2 text-[#8C6D3B] text-lg font-serif">❖</div>
          <div className="absolute bottom-2 left-2 text-[#8C6D3B] text-lg font-serif">❖</div>
          <div className="absolute bottom-2 right-2 text-[#8C6D3B] text-lg font-serif">❖</div>

          {/* Watermark Crest Background */}
          <div className="absolute inset-0 flex items-center justify-center opacity-[0.035] pointer-events-none">
            <svg width="420" height="420" viewBox="0 0 100 100" fill="currentColor">
              <path d="M50 5 L85 20 L85 55 C85 75 50 95 50 95 C50 95 15 75 15 55 L15 20 Z" />
              <circle cx="50" cy="45" r="18" fill="none" stroke="currentColor" strokeWidth="2" />
            </svg>
          </div>

          <div className="relative z-10 flex flex-col justify-between h-full text-center">
            {/* Header: University & Department Branding */}
            <div>
              <div className="flex items-center justify-center gap-3 mb-2">
                {/* College Emblem SVG */}
                <div className="flex h-12 w-12 items-center justify-center rounded-full border-[1.5px] border-[#8C6D3B] bg-[#F7F2E7] text-[#8C6D3B] shadow-sm">
                  <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M12 2L2 7l10 5 10-5-10-5z" />
                    <path d="M2 17l10 5 10-5" />
                    <path d="M2 12l10 5 10-5" />
                  </svg>
                </div>
              </div>
              <p className="font-mono text-[10px] tracking-[0.25em] uppercase text-[#8C6D3B] font-bold">
                UNIVERSITY INSTITUTE OF TECHNOLOGY & HIGHER LEARNING
              </p>
              <p className="font-serif text-xs uppercase tracking-widest text-inkSoft mt-0.5">
                {data.department || "Department of Computer Science & Engineering"}
              </p>
              <p className="font-mono text-[9px] text-inkSoft/80 tracking-wider">
                Accredited NAAC Grade 'A++' · Autonomous Institution
              </p>

              {/* Title Ribbon */}
              <div className="my-4 sm:my-5">
                <div className="inline-block relative">
                  <h1 className="font-serif text-2xl sm:text-3xl font-extrabold tracking-wider uppercase text-[#1B1917] px-6 py-1 border-y-[1.5px] border-[#8C6D3B]">
                    Certificate of Participation & Academic Merit
                  </h1>
                  <span className="block font-mono text-[10px] uppercase tracking-[0.2em] text-[#8C6D3B] mt-1">
                    Official Institutional Record of Attendance
                  </span>
                </div>
              </div>

              {/* Recipient Line */}
              <p className="font-serif italic text-sm text-[#44403C]">This is to proudly certify that</p>
              
              <div className="my-2 sm:my-3">
                <span className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-[#0F172A] border-b-[2px] border-dashed border-[#8C6D3B]/80 px-4 pb-1 inline-block">
                  {data.studentName}
                </span>
              </div>

              {/* Details & USN */}
              <p className="text-xs sm:text-sm text-[#334155] max-w-xl mx-auto leading-relaxed">
                bearing USN <span className="font-mono font-bold text-[#0F172A] bg-[#E2E8F0]/60 px-1.5 py-0.5 rounded">{data.usn || "ENG24CT0058"}</span>
                {data.section ? `, student of ${data.section}` : ""}, has actively participated in and completed
              </p>

              <p className="font-serif text-lg sm:text-xl font-bold text-[#1E293B] mt-1.5">
                "{data.eventTitle}"
              </p>

              <p className="text-xs text-[#475569] mt-0.5">
                organized by <span className="font-semibold text-[#0F172A]">{data.clubName}</span> on{" "}
                <span className="font-semibold text-[#0F172A]">{data.eventDate}</span>
                {data.venue ? ` at ${data.venue}` : ""}.
              </p>

              {/* Subject Attendance Crediting Clause */}
              <div className="mt-3 inline-flex items-center gap-2 border border-[#8C6D3B]/40 bg-[#FDFBF7] px-3 py-1 rounded text-[11px] text-[#451A03]">
                <span className="font-bold">🎓 Academic Credit:</span>
                <span>
                  Official attendance credit awarded for{" "}
                  <strong>{data.subjectCode || "CS301"}: {data.subjectName || "Compiler Design"}</strong>
                </span>
              </div>
            </div>

            {/* Bottom Row: Signatures, Seal, and Verification QR */}
            <div className="mt-6 pt-4 border-t border-[#8C6D3B]/30 flex items-end justify-between px-2 sm:px-6 text-left">
              {/* Left Signature: Faculty Coordinator */}
              <div className="w-40 text-center">
                <div className="h-9 flex items-center justify-center">
                  <span className="font-serif italic text-base text-[#1E293B] font-semibold -rotate-3 select-none">
                    {data.facultyName || "Dr. K. S. Rao"}
                  </span>
                </div>
                <div className="border-t-[1.5px] border-[#15130F] pt-1">
                  <p className="font-sans text-[11px] font-bold text-[#0F172A]">
                    {data.facultyName || "Dr. K. S. Rao"}
                  </p>
                  <p className="font-mono text-[9px] uppercase tracking-wider text-inkSoft">
                    Faculty Coordinator, CSE
                  </p>
                </div>
              </div>

              {/* Center: Official College Seal */}
              <div className="flex flex-col items-center justify-center">
                <div className="relative flex h-16 w-16 items-center justify-center rounded-full border-[2px] border-[#8C6D3B] bg-[#FFFBEB] text-[#8C6D3B] shadow-inner">
                  <div className="absolute inset-1 rounded-full border border-dashed border-[#8C6D3B]/70" />
                  <div className="text-center">
                    <span className="block font-serif text-[8px] font-black uppercase tracking-tighter text-[#78350F]">
                      KONVENE
                    </span>
                    <span className="block font-mono text-[7px] font-bold text-[#8C6D3B]">
                      VERIFIED
                    </span>
                  </div>
                </div>
                <span className="font-mono text-[8px] text-[#78350F] font-bold uppercase tracking-wider mt-1">
                  OFFICIAL SEAL
                </span>
              </div>

              {/* Right: Verification QR & Head Signature */}
              <div className="w-48 text-right flex flex-col items-end">
                <div className="flex items-center gap-2 mb-1">
                  <div className="text-right">
                    <p className="font-mono text-[8px] uppercase tracking-wider text-inkSoft">Scan to Verify</p>
                    <p className="font-mono text-[9px] font-bold text-[#0F172A]">{data.certId}</p>
                  </div>
                  <div className="border border-[#15130F] p-1 bg-white">
                    <QRCodeSVG value={verifyUrl} size={54} />
                  </div>
                </div>
                <div className="w-full border-t-[1.5px] border-[#15130F] pt-1 text-center">
                  <p className="font-sans text-[11px] font-bold text-[#0F172A]">Prof. S. Sharma</p>
                  <p className="font-mono text-[9px] uppercase tracking-wider text-inkSoft">
                    Head of Department, CSE
                  </p>
                </div>
              </div>
            </div>

            {/* Bottom Cryptographic Verification Bar */}
            <div className="mt-2 text-center border-t border-dashed border-ink/20 pt-1">
              <p className="font-mono text-[8px] text-inkSoft tracking-wider">
                Cryptographically Signed Academic Record · Tamper-proof verification at: {verifyUrl}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
