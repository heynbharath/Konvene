"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";

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
  const { token, user } = useAuth();
  const [rows, setRows] = useState<PendingRow[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  function refresh() {
    if (!token) return;
    api<PendingRow[]>("/faculty/pending-attendance", { token }).then(setRows);
  }

  useEffect(refresh, [token]);

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
      <h1 className="mb-2 text-2xl font-bold">Pending Attendance</h1>
      <p className="mb-6 text-sm text-white/50">
        Students who checked in to an event linked to your subject. Approving here credits their official attendance.
      </p>

      {rows.length === 0 ? (
        <p className="text-white/50">Nothing pending — you're all caught up, {user?.name}.</p>
      ) : (
        <>
          <button
            onClick={approveSelected}
            disabled={selected.size === 0}
            className="mb-4 rounded-lg bg-brand px-4 py-2 font-medium hover:bg-brand-dark disabled:opacity-40"
          >
            Approve selected ({selected.size})
          </button>
          <div className="space-y-2">
            {rows.map((r) => {
              const { user: student, event } = r.attendanceCandidate.checkIn.ticket.registration;
              return (
                <div key={r.id} className="flex items-center justify-between rounded-lg border border-white/10 bg-surfaceAlt p-4">
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
