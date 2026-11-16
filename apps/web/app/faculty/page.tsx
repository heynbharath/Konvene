"use client";

import { useEffect, useState, useCallback } from "react";
import { 
  GraduationCap, 
  Building, 
  CheckCircle2, 
  Camera, 
  FileSpreadsheet, 
  Award, 
  Clock, 
  Sparkles,
  ShieldCheck,
  ChevronRight
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { LiveAttendanceSheet } from "@/components/LiveAttendanceSheet";
import { AttendanceScanner } from "@/components/AttendanceScanner";

interface PendingEventRow {
  id: string;
  title: string;
  slug: string;
  venue: string;
  startAt: string;
  club: { name: string };
  category?: string;
  capacity?: number;
}

export default function FacultyPage() {
  const { token, user, hasRole } = useAuth();
  const [activeTab, setActiveTab] = useState<"sheet" | "scanner" | "events">("sheet");
  const [pendingEvents, setPendingEvents] = useState<PendingEventRow[]>([]);
  const [sheetKey, setSheetKey] = useState(0);
  const [eventMessage, setEventMessage] = useState<string | null>(null);

  const isFacultyOrAdmin = hasRole("FACULTY") || hasRole("FACULTY_COORDINATOR") || hasRole("ADMIN");

  const refreshEvents = useCallback(() => {
    if (!token) return;
    api<PendingEventRow[]>("/events/pending-approval/mine", { token })
      .then((data) => {
        if (Array.isArray(data)) setPendingEvents(data);
      })
      .catch(() => {});
  }, [token]);

  useEffect(() => {
    refreshEvents();
  }, [refreshEvents]);

  async function decideEvent(id: string, decision: "approve" | "reject") {
    if (!token) return;
    if (decision === "reject") {
      const reason = prompt("Enter official reason for rejecting this event proposal:") ?? "Does not meet departmental academic guidelines";
      await api(`/events/${id}/reject`, { method: "POST", token, body: { reason } });
      setEventMessage("Event proposal rejected.");
    } else {
      await api(`/events/${id}/approve`, { method: "POST", token });
      setEventMessage("Event approved & published on campus catalog!");
    }
    refreshEvents();
    setTimeout(() => setEventMessage(null), 3000);
  }

  function handleScanSuccess() {
    // Re-render / trigger fetch on sheet
    setSheetKey((k) => k + 1);
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      {/* College Institutional Portal Banner */}
      <div className="border-[2px] border-ink bg-[#15130F] text-paper p-6 shadow-hard relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-dot-grid bg-dots opacity-10 pointer-events-none" />
        
        <div className="flex flex-wrap items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 bg-[#26231C] border border-[#8C6D3B] px-3 py-1 rounded-full text-[10px] font-mono uppercase tracking-widest text-acid font-bold mb-3">
              <ShieldCheck className="h-3.5 w-3.5" /> Department of Computer Science & Engineering
            </div>
            <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-white flex items-center gap-3">
              <GraduationCap className="h-9 w-9 text-acid" />
              Faculty Attendance & Accreditation Portal
            </h1>
            <p className="mt-2 text-sm text-paper/80 font-sans max-w-2xl">
              Official collegiate console for <strong>Dr. Rao (Assoc. Professor, CSE)</strong>. Verify student gate check-ins, oversee live attendance registers for <strong>CS301 Compiler Design</strong>, and issue academic certificates.
            </p>
          </div>

          <div className="bg-[#24211A] border-[1.5px] border-paper/20 p-4 rounded text-left font-mono text-xs">
            <p className="text-acid font-bold uppercase tracking-wider text-[10px]">Academic In-Charge</p>
            <p className="font-sans font-bold text-base text-white mt-0.5">{user?.name || "Dr. K. S. Rao"}</p>
            <p className="text-paper/70 text-[11px]">Assigned Subject: CS301 (Compiler Design)</p>
            <p className="text-paper/70 text-[11px]">Designation: Faculty Coordinator & Head</p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="mt-8 pt-4 border-t border-paper/20 flex flex-wrap gap-2">
          <button
            onClick={() => setActiveTab("sheet")}
            className={`flex items-center gap-2 px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider rounded transition-all ${
              activeTab === "sheet"
                ? "bg-acid text-ink shadow-sm"
                : "bg-paper/10 text-paper hover:bg-paper/20"
            }`}
          >
            <FileSpreadsheet className="h-4 w-4" /> Live Attendance Sheet (Google Sheet)
          </button>
          <button
            onClick={() => setActiveTab("scanner")}
            className={`flex items-center gap-2 px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider rounded transition-all ${
              activeTab === "scanner"
                ? "bg-acid text-ink shadow-sm"
                : "bg-paper/10 text-paper hover:bg-paper/20"
            }`}
          >
            <Camera className="h-4 w-4" /> QR Gate Scanner
          </button>
          <button
            onClick={() => setActiveTab("events")}
            className={`flex items-center gap-2 px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider rounded transition-all ${
              activeTab === "events"
                ? "bg-acid text-ink shadow-sm"
                : "bg-paper/10 text-paper hover:bg-paper/20"
            }`}
          >
            <Clock className="h-4 w-4" /> Club Events for Approval ({pendingEvents.length})
          </button>
        </div>
      </div>

      {eventMessage && (
        <div className="bg-moss/10 text-moss px-4 py-3 text-sm font-semibold border-[1.5px] border-moss flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4" /> {eventMessage}
        </div>
      )}

      {/* TAB 1: Live Attendance Sheet (The centerpiece to show Ma'am) */}
      {activeTab === "sheet" && (
        <div className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <LiveAttendanceSheet
                key={sheetKey}
                token={token}
                onAttendanceChange={() => setSheetKey((k) => k + 1)}
              />
            </div>
            
            {/* Quick Gate Scanner Sidebar */}
            <div className="space-y-4">
              <div className="border-[1.5px] border-[#8C6D3B] bg-[#FFFBEB] p-4 text-xs text-[#78350F]">
                <p className="font-bold font-mono uppercase tracking-wide flex items-center gap-1.5 mb-1 text-sm">
                  <Sparkles className="h-4 w-4 text-[#8C6D3B]" /> Live Testing with Ma'am
                </p>
                <p className="leading-relaxed">
                  You can use the <strong>Gate Attendance Scanner</strong> below to test real-time attendance. Pick any student or scan a QR code — the table on the left updates instantly!
                </p>
              </div>

              <AttendanceScanner
                token={token}
                onScanSuccess={handleScanSuccess}
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Full Dedicated Scanner */}
      {activeTab === "scanner" && (
        <div className="grid gap-6 lg:grid-cols-2 items-start">
          <AttendanceScanner
            token={token}
            onScanSuccess={handleScanSuccess}
          />
          <div className="space-y-4">
            <div className="card p-6 bg-paper">
              <h3 className="font-display text-xl font-bold italic mb-2">Gate Scanning Instructions</h3>
              <ul className="space-y-2 text-xs sm:text-sm text-inkSoft list-disc pl-4 leading-relaxed">
                <li>
                  Attendees must present their cryptographically-signed <strong>HMAC-SHA256 QR Pass</strong> from their Konvene Tickets wallet.
                </li>
                <li>
                  Upon scan, physical entry is confirmed and an <strong>Attendance Candidate</strong> is recorded.
                </li>
                <li>
                  For CS301 Compiler Design, attendance is mapped directly to <strong>Dr. Rao's</strong> subject registry.
                </li>
                <li>
                  Once verified, attendees become eligible to view and download their verified <strong>College Certificate of Participation</strong>.
                </li>
              </ul>
            </div>

            <div className="card p-6 bg-paperAlt border-dashed">
              <p className="font-mono text-xs uppercase tracking-wide text-inkSoft font-bold mb-2">
                Need to view full attendance sheet?
              </p>
              <button
                onClick={() => setActiveTab("sheet")}
                className="btn-signal rounded-full px-5 py-2 text-xs font-bold uppercase tracking-wide flex items-center gap-1.5"
              >
                Open Live Sheet <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Club Events Awaiting Coordinator Approval */}
      {activeTab === "events" && (
        <section className="space-y-4">
          <div className="border-b-[1.5px] border-ink pb-4">
            <h2 className="font-display text-2xl font-bold italic">Club Event Proposals Awaiting Department Approval</h2>
            <p className="text-sm text-inkSoft mt-1">
              As Faculty Coordinator for CSE & technical clubs, your formal sign-off approves budget, venue reservation, and campus-wide publication.
            </p>
          </div>

          {pendingEvents.length === 0 ? (
            <div className="card p-12 text-center text-inkSoft border-dashed">
              <p className="font-serif italic text-base">No pending event proposals. All club submissions have been reviewed!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingEvents.map((e) => (
                <div key={e.id} className="card flex flex-wrap items-center justify-between gap-4 p-5">
                  <div>
                    <span className="font-mono text-[10px] font-bold uppercase bg-acid px-2 py-0.5 rounded border border-ink/20">
                      {e.category || "TECHNICAL"}
                    </span>
                    <h3 className="font-display text-xl font-bold mt-1 text-ink">{e.title}</h3>
                    <p className="text-xs text-inkSoft font-mono mt-0.5">
                      Organized by {e.club.name} · Venue: {e.venue} · Scheduled: {new Date(e.startAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => decideEvent(e.id, "approve")}
                      className="btn-signal rounded-full px-5 py-2 text-xs font-bold uppercase tracking-wider"
                    >
                      Approve & Publish
                    </button>
                    <button
                      onClick={() => decideEvent(e.id, "reject")}
                      className="btn-outline rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wider text-berry border-berry hover:bg-berry/10"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
