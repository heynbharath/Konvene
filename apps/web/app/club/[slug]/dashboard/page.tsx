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
  events: { id: string; title: string; slug: string }[];
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
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<any>(null);

  useEffect(() => {
    api<ClubDetail>(`/clubs/${slug}`).then((c) => {
      setClub(c);
      if (c.events[0]) setEventId(c.events[0].id);
    });
  }, [slug]);

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

  if (!club) return <p className="text-white/50">Loading…</p>;

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold">{club.name} — Dashboard</h1>
      <select
        value={eventId}
        onChange={(e) => setEventId(e.target.value)}
        className="mb-6 rounded-lg border border-white/10 bg-surfaceAlt px-3 py-2"
      >
        {club.events.map((e) => <option key={e.id} value={e.id}>{e.title}</option>)}
      </select>

      {stats && (
        <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard label="Capacity" value={stats.capacity} />
          <StatCard label="Registered" value={stats.registered} />
          <StatCard label="Checked in" value={stats.checkedIn} highlight />
          <StatCard label="No-show (so far)" value={stats.noShow} />
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="rounded-xl border border-white/10 bg-surfaceAlt p-6">
          <h2 className="mb-4 text-lg font-semibold">QR Check-in Scanner</h2>
          {!scanning ? (
            <button onClick={() => setScanning(true)} className="rounded-lg bg-brand px-4 py-2 font-medium hover:bg-brand-dark">
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
            <div className="mt-5 rounded-lg border border-white/10 p-4">
              <StatusBadge status={scanResult.result ?? "INVALID"} />
              {scanResult.name && <p className="mt-2 font-semibold">{scanResult.name}</p>}
              {scanResult.usn && <p className="text-sm text-white/50">{scanResult.usn}</p>}
              {scanResult.routedToFaculty && (
                <p className="mt-1 text-xs text-white/40">Attendance routed to subject faculty for approval.</p>
              )}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-white/10 bg-surfaceAlt p-6">
          <h2 className="mb-4 text-lg font-semibold">Registrations</h2>
          <div className="max-h-96 space-y-2 overflow-y-auto">
            {registrations.map((r) => (
              <div key={r.id} className="flex items-center justify-between border-b border-white/5 py-2 text-sm">
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
    <div className={`rounded-xl border border-white/10 p-4 ${highlight ? "bg-brand/10" : "bg-surfaceAlt"}`}>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs text-white/50">{label}</div>
    </div>
  );
}
