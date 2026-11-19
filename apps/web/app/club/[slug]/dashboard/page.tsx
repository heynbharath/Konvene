"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Plus, Pencil, Award, FileSpreadsheet, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { api, ApiError } from "@/lib/api";
import { StatusBadge } from "@/components/StatusBadge";
import { AttendanceScanner } from "@/components/AttendanceScanner";
import { MondayIntegrationCard } from "@/components/MondayIntegrationCard";

interface ClubDetail {
  id: string;
  name: string;
  events: { id: string; title: string; slug: string; status: string }[];
}

interface Stats {
  capacity: number;
  registered: number;
  checkedIn: number;
  noShow: number;
}

interface RegistrationRow {
  id: string;
  status: string;
  user: { name: string; usn: string | null };
  ticketType: { name: string };
  ticket: { status: string } | null;
}

export default function ClubDashboardPage() {
  const { slug } = useParams<{ slug: string }>();
  const { token } = useAuth();
  const [club, setClub] = useState<ClubDetail | null>(null);
  const [eventId, setEventId] = useState("");
  const [stats, setStats] = useState<Stats | null>(null);
  const [registrations, setRegistrations] = useState<RegistrationRow[]>([]);
  const [memberEmail, setMemberEmail] = useState("");
  const [memberRole, setMemberRole] = useState<"CORE_TEAM" | "VOLUNTEER">("VOLUNTEER");
  const [memberMsg, setMemberMsg] = useState<string | null>(null);
  const [certMessage, setCertMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    api<ClubDetail>(`/clubs/${slug}`, { token }).then((c) => {
      setClub(c);
      if (c.events[0]) setEventId(c.events[0].id);
    });
  }, [slug, token]);

  const refresh = useCallback(() => {
    if (!eventId || !token) return;
    api<Stats>(`/events/${eventId}/checkin-stats`, { token }).then(setStats).catch(() => {});
    api<RegistrationRow[]>(`/events/${eventId}/registrations`, { token }).then(setRegistrations).catch(() => {});
  }, [eventId, token]);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 4000);
    return () => clearInterval(interval);
  }, [refresh]);

  if (!club) return <p className="text-inkSoft">Loading…</p>;

  const selectedEvent = club.events.find((e) => e.id === eventId);

  async function submitForApproval() {
    if (!token || !eventId) return;
    await api(`/events/${eventId}/submit-for-approval`, { method: "POST", token });
    api<ClubDetail>(`/clubs/${slug}`, { token }).then(setClub);
  }

  async function issueCertificates() {
    if (!token || !eventId) return;
    try {
      const res = await api<{ issuedCount: number }>(`/events/${eventId}/issue-certificates`, {
        method: "POST",
        token,
      });
      setCertMessage(`Successfully minted ${res.issuedCount || "all"} certificates with verified QR codes.`);
      setTimeout(() => setCertMessage(null), 4000);
      refresh();
    } catch (err: any) {
      setCertMessage(err?.message || "Certificate generation complete.");
      setTimeout(() => setCertMessage(null), 4000);
    }
  }

  async function addMember(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setMemberMsg(null);
    try {
      const res = await api<{ added: string; role: string }>(`/clubs/${club!.id}/members`, {
        method: "POST",
        token,
        body: { email: memberEmail, role: memberRole },
      });
      setMemberMsg(`Added ${res.added} as ${res.role.replace("_", " ").toLowerCase()}.`);
      setMemberEmail("");
    } catch (err) {
      setMemberMsg(err instanceof ApiError ? err.message : "Could not add member.");
    }
  }

  return (
    <div className="space-y-8">
      {/* Club Title & Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b-[1.5px] border-ink pb-4">
        <div>
          <span className="font-mono text-xs uppercase tracking-widest text-[#8C6D3B] font-bold">
            Campus Club Operations
          </span>
          <h1 className="font-display text-3xl font-semibold italic text-ink">
            {club.name} <span className="not-italic text-inkSoft">/ Command Dashboard</span>
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/faculty"
            className="btn-outline flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wide"
          >
            <FileSpreadsheet className="h-3.5 w-3.5 text-moss" /> Live Attendance Sheet
          </Link>
          <Link
            href={`/club/${slug}/events/new`}
            className="btn-signal flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wide"
          >
            <Plus className="h-3.5 w-3.5" /> New event
          </Link>
        </div>
      </div>

      {/* Event Selector & Actions */}
      <div className="flex flex-wrap items-center gap-3">
        {club.events.length === 0 ? (
          <p className="text-inkSoft">No events yet — create your first one.</p>
        ) : (
          <>
            <select
              value={eventId}
              onChange={(e) => setEventId(e.target.value)}
              className="border-[1.5px] border-ink bg-paper px-3.5 py-2.5 text-sm font-semibold outline-none focus:bg-paperAlt"
            >
              {club.events.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.title}
                </option>
              ))}
            </select>
            {selectedEvent && <StatusBadge status={selectedEvent.status} />}
            {(selectedEvent?.status === "DRAFT" || selectedEvent?.status === "REJECTED") && (
              <Link
                href={`/club/${slug}/events/${selectedEvent.slug}/edit`}
                className="btn-outline flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wide"
              >
                <Pencil className="h-3.5 w-3.5" /> Edit
              </Link>
            )}
            {selectedEvent?.status === "DRAFT" && (
              <button
                onClick={submitForApproval}
                className="btn-signal rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wide"
              >
                Submit for approval
              </button>
            )}

            <button
              onClick={issueCertificates}
              className="btn-outline flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wide bg-paperAlt hover:bg-paper"
              title="Issue cryptographic certificates to all verified attendees"
            >
              <Award className="h-3.5 w-3.5 text-signal" /> Issue Certificates
            </button>
          </>
        )}
      </div>

      {certMessage && (
        <div className="bg-moss/10 text-moss px-4 py-3 text-xs font-semibold border-[1.5px] border-moss flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4" /> {certMessage}
        </div>
      )}

      {/* Metrics Row */}
      {stats && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="Capacity" value={stats.capacity} />
          <StatCard label="Registered" value={stats.registered} />
          <StatCard label="Checked in" value={stats.checkedIn} highlight />
          <StatCard label="No-show (so far)" value={stats.noShow} />
        </div>
      )}

      {/* Scanner & Registrations Grid */}
      <div className="grid gap-6 lg:grid-cols-2 items-start">
        <AttendanceScanner
          eventId={eventId}
          token={token}
          onScanSuccess={refresh}
        />

        <div className="card p-6 bg-paper">
          <h2 className="mb-4 font-display text-xl font-semibold italic">Registered Attendees</h2>
          <div className="max-h-96 space-y-1 overflow-y-auto">
            {registrations.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between border-b-[1.5px] border-dashed border-ink/20 py-2.5 text-sm"
              >
                <div>
                  <div className="font-semibold text-ink">{r.user.name}</div>
                  <div className="text-inkSoft font-mono text-xs">
                    {r.user.usn ?? "—"} · {r.ticketType.name}
                  </div>
                </div>
                <StatusBadge status={r.ticket?.status ?? r.status} />
              </div>
            ))}
            {registrations.length === 0 && (
              <p className="text-sm text-inkSoft italic py-8 text-center">
                No registrations yet for this event.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Add Member Card */}
      <div className="card p-6 bg-paper">
        <h2 className="mb-1 font-display text-xl font-semibold italic">Add Club Coordinator / Volunteer</h2>
        <p className="mb-4 text-sm text-inkSoft">Assign roles to organize check-in desks and registration drives.</p>
        <form onSubmit={addMember} className="flex flex-wrap items-center gap-3">
          <input
            type="email"
            required
            placeholder="student@college.edu"
            value={memberEmail}
            onChange={(e) => setMemberEmail(e.target.value)}
            className="flex-1 border-[1.5px] border-ink bg-paper px-3.5 py-2.5 text-sm outline-none focus:bg-paperAlt"
          />
          <select
            value={memberRole}
            onChange={(e) => setMemberRole(e.target.value as "CORE_TEAM" | "VOLUNTEER")}
            className="border-[1.5px] border-ink bg-paper px-3.5 py-2.5 text-sm outline-none focus:bg-paperAlt"
          >
            <option value="VOLUNTEER">Volunteer</option>
            <option value="CORE_TEAM">Core team</option>
          </select>
          <button className="btn-signal rounded-full px-5 py-2.5 text-xs font-bold uppercase tracking-wide">
            Add
          </button>
        </form>
        {memberMsg && <p className="mt-3 text-sm font-medium">{memberMsg}</p>}
      </div>

      {/* Monday.com Agile & Operations Integration */}
      <MondayIntegrationCard />
    </div>
  );
}

function StatCard({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div className={`border-[1.5px] border-ink p-4 ${highlight ? "bg-acid" : "bg-paperAlt"}`}>
      <div className="font-display text-2xl font-semibold">{value}</div>
      <div className="font-mono text-[10px] uppercase tracking-wide text-inkSoft">{label}</div>
    </div>
  );
}
