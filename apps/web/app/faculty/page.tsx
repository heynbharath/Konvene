"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";

interface PendingEventRow {
  id: string;
  title: string;
  slug: string;
  venue: string;
  startAt: string;
  club: { name: string };
}

interface PendingRow {
  id: string;
  status: string;
  attendanceCandidate: {
    checkIn: {
      ticket: {
        registration: {
          user: { name: string; usn: string | null; studentProfile?: { section: { name: string; year: number } } };
          event: { title: string };
        };
      };
    };
  };
}

export default function FacultyPage() {
  const { token, user, hasRole } = useAuth();
  const [rows, setRows] = useState<PendingRow[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [pendingEvents, setPendingEvents] = useState<PendingEventRow[]>([]);

  function refresh() {
    if (!token) return;
    api<PendingRow[]>("/faculty/pending-attendance", { token }).then(setRows);
    if (hasRole("FACULTY_COORDINATOR")) {
      api<PendingEventRow[]>("/events/pending-approval/mine", { token }).then(setPendingEvents);
    }
  }

  useEffect(refresh, [token]);

  async function decideEvent(id: string, decision: "approve" | "reject") {
    if (!token) return;
    if (decision === "reject") {
      const reason = prompt("Reason for rejecting this event?") ?? "Not specified";
      await api(`/events/${id}/reject`, { method: "POST", token, body: { reason } });
    } else {
      await api(`/events/${id}/approve`, { method: "POST", token });
    }
    refresh();
  }

  function toggle(id: string) {
    setSelected((s) => {
      const next = new Set(s);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function approveSelected() {
    if (!token || selected.size === 0) return;
    await api("/faculty/pending-attendance/approve", { method: "POST", token, body: { ids: Array.from(selected) } });
    setSelected(new Set());
    refresh();
  }

  async function reject(id: string) {
    if (!token) return;
    const reason = prompt("Reason for rejecting this attendance?") ?? "Not specified";
    await api("/faculty/pending-attendance/reject", { method: "POST", token, body: { id, reason } });
    refresh();
  }

  if (!token) return <p className="text-white/50">Log in as faculty to review attendance.</p>;

  return (
    <div className="mx-auto max-w-3xl">
      {hasRole("FACULTY_COORDINATOR") && (
        <section className="mb-12">
          <h1 className="mb-2 font-display text-2xl font-bold">Events Awaiting Your Approval</h1>
          <p className="mb-6 text-sm text-white/50">
            As Faculty Coordinator, your approval publishes an event for your club.
          </p>
          {pendingEvents.length === 0 ? (
            <p className="text-white/40">No events pending approval.</p>
          ) : (
            <div className="space-y-2">
              {pendingEvents.map((e) => (
                <div key={e.id} className="glass flex items-center justify-between rounded-2xl p-4">
                  <div>
                    <div className="font-medium">{e.title}</div>
                    <div className="text-sm text-white/50">
                      {e.club.name} · {new Date(e.startAt).toLocaleString()} · {e.venue}
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => decideEvent(e.id, "approve")} className="btn-primary rounded-full px-4 py-1.5 text-sm font-medium text-white">
                      Approve
                    </button>
                    <button onClick={() => decideEvent(e.id, "reject")} className="text-sm text-red-400 hover:underline">
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      <h1 className="mb-2 font-display text-2xl font-bold">Pending Attendance</h1>
      <p className="mb-6 text-sm text-white/50">
        Students who checked in to an event linked to your subject. Approving here credits their official attendance.
      </p>

      {rows.length === 0 ? (
        <p className="text-white/40">Nothing pending — you're all caught up, {user?.name}.</p>
      ) : (
        <>
          <button
            onClick={approveSelected}
            disabled={selected.size === 0}
            className="btn-primary mb-4 rounded-full px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-40"
          >
            Approve selected ({selected.size})
          </button>
          <div className="space-y-2">
            {rows.map((r) => {
              const { user: student, event } = r.attendanceCandidate.checkIn.ticket.registration;
              return (
                <div key={r.id} className="glass flex items-center justify-between rounded-2xl p-4">
                  <label className="flex items-center gap-3">
                    <input type="checkbox" checked={selected.has(r.id)} onChange={() => toggle(r.id)} />
                    <div>
                      <div className="font-medium">{student.name}</div>
                      <div className="text-sm text-white/50">{student.usn} · {event.title}</div>
                    </div>
                  </label>
                  <button onClick={() => reject(r.id)} className="text-sm text-red-400 hover:underline">
                    Reject
                  </button>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
