"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { api, ApiError } from "@/lib/api";
import { StatusBadge } from "@/components/StatusBadge";
import { QrScanner } from "@/components/QrScanner";

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

interface SearchResultRow {
  id: string;
  user: { name: string; usn: string | null };
  ticket: { status: string } | null;
}

export default function ClubDashboardPage() {
  const { slug } = useParams<{ slug: string }>();
  const { token } = useAuth();
  const [club, setClub] = useState<ClubDetail | null>(null);
  const [eventId, setEventId] = useState("");
  const [stats, setStats] = useState<Stats | null>(null);
  const [registrations, setRegistrations] = useState<RegistrationRow[]>([]);
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResultRow[]>([]);

  useEffect(() => {
    if (!token) return;
    api<ClubDetail>(`/clubs/${slug}`, { token }).then((c) => {
      setClub(c);
      if (c.events[0]) setEventId(c.events[0].id);
    });
  }, [slug, token]);

  const refresh = useCallback(() => {
    if (!eventId || !token) return;
    api<Stats>(`/events/${eventId}/checkin-stats`, { token }).then(setStats);
    api<RegistrationRow[]>(`/events/${eventId}/registrations`, { token }).then(setRegistrations);
  }, [eventId, token]);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 4000);
    return () => clearInterval(interval);
  }, [refresh]);

  async function handleScan(qrToken: string) {
    if (!token) return;
    try {
      const res = await api("/checkin/verify", { method: "POST", token, body: { token: qrToken } });
      setScanResult(res);
    } catch (err) {
      setScanResult(err instanceof ApiError ? err.data ?? { result: "INVALID" } : { result: "INVALID" });
    }
    refresh();
  }

  async function runSearch(q: string) {
    setSearchQuery(q);
    if (!token || !eventId || q.trim().length < 2) return setSearchResults([]);
    const results = await api<SearchResultRow[]>(
      `/checkin/search?eventId=${eventId}&q=${encodeURIComponent(q)}`,
      { token }
    );
    setSearchResults(results);
  }

  async function manualCheckIn(registrationId: string) {
    if (!token) return;
    try {
      const res = await api("/checkin/manual", { method: "POST", token, body: { registrationId } });
      setScanResult(res);
    } catch (err) {
      setScanResult(err instanceof ApiError ? err.data ?? { result: "INVALID" } : { result: "INVALID" });
    }
    setSearchResults([]);
    setSearchQuery("");
    refresh();
  }

  if (!club) return <p className="text-white/50">Loading…</p>;

  const selectedEvent = club.events.find((e) => e.id === eventId);

  async function submitForApproval() {
    if (!token || !eventId) return;
    await api(`/events/${eventId}/submit-for-approval`, { method: "POST", token });
    api<ClubDetail>(`/clubs/${slug}`, { token }).then(setClub);
  }

  return (
    <div>
      <h1 className="mb-1 font-display text-2xl font-bold">{club.name} <span className="text-white/30">/ Dashboard</span></h1>
      <div className="mb-8 mt-4 flex flex-wrap items-center gap-3">
        <select
          value={eventId}
          onChange={(e) => setEventId(e.target.value)}
          className="rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2.5 text-sm outline-none focus:border-brand/50"
        >
          {club.events.map((e) => <option key={e.id} value={e.id}>{e.title}</option>)}
        </select>
        {selectedEvent && <StatusBadge status={selectedEvent.status} />}
        {selectedEvent?.status === "DRAFT" && (
          <button onClick={submitForApproval} className="btn-primary rounded-full px-4 py-2 text-sm font-medium text-white">
            Submit for approval
          </button>
        )}
      </div>

      {stats && (
        <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard label="Capacity" value={stats.capacity} />
          <StatCard label="Registered" value={stats.registered} />
          <StatCard label="Checked in" value={stats.checkedIn} highlight />
          <StatCard label="No-show (so far)" value={stats.noShow} />
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="glass rounded-2xl p-6">
          <h2 className="mb-4 font-display text-lg font-bold">QR Check-in Scanner</h2>
          {!scanning ? (
            <button onClick={() => setScanning(true)} className="btn-primary rounded-full px-5 py-2.5 text-sm font-semibold text-white">
              Start scanning
            </button>
          ) : (
            <>
              <QrScanner active={scanning} onScan={handleScan} />
              <button onClick={() => setScanning(false)} className="mt-3 text-sm text-white/50 hover:underline">
                Stop
              </button>
            </>
          )}
          {scanResult && (
            <div className="mt-5 rounded-xl border border-white/10 bg-white/[0.02] p-4">
              <StatusBadge status={scanResult.result ?? "INVALID"} />
              {scanResult.name && <p className="mt-2 font-semibold">{scanResult.name}</p>}
              {scanResult.usn && <p className="text-sm text-white/50">{scanResult.usn}</p>}
              {scanResult.routedToFaculty && (
                <p className="mt-1 text-xs text-white/40">Attendance routed to subject faculty for approval.</p>
              )}
            </div>
          )}

          <div className="mt-6 border-t border-white/[0.06] pt-5">
            <h3 className="mb-2 text-sm font-semibold text-white/70">Manual check-in (lost/unreadable QR)</h3>
            <input
              value={searchQuery}
              onChange={(e) => runSearch(e.target.value)}
              placeholder="Search by name or USN…"
              className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2.5 text-sm outline-none focus:border-brand/50"
            />
            {searchResults.length > 0 && (
              <div className="mt-2 space-y-1">
                {searchResults.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => manualCheckIn(r.id)}
                    disabled={r.ticket?.status === "CHECKED_IN"}
                    className="flex w-full items-center justify-between rounded-lg bg-white/[0.03] px-3.5 py-2.5 text-left text-sm hover:bg-white/[0.07] disabled:opacity-40"
                  >
                    <span>{r.user.name} <span className="text-white/40">· {r.user.usn ?? "—"}</span></span>
                    <StatusBadge status={r.ticket?.status ?? "ISSUED"} />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="glass rounded-2xl p-6">
          <h2 className="mb-4 font-display text-lg font-bold">Registrations</h2>
          <div className="max-h-96 space-y-1 overflow-y-auto">
            {registrations.map((r) => (
              <div key={r.id} className="flex items-center justify-between border-b border-white/[0.04] py-2.5 text-sm">
                <div>
                  <div>{r.user.name}</div>
                  <div className="text-white/40">{r.user.usn ?? "—"} · {r.ticketType.name}</div>
                </div>
                <StatusBadge status={r.ticket?.status ?? r.status} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div className={`rounded-2xl border p-4 ${highlight ? "border-brand/30 bg-brand/10" : "glass"}`}>
      <div className="font-display text-2xl font-bold">{value}</div>
      <div className="text-xs text-white/50">{label}</div>
    </div>
  );
}
