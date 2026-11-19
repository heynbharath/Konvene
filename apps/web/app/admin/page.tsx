"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  ShieldCheck, 
  Building, 
  Users, 
  Calendar, 
  FileSpreadsheet, 
  Plus, 
  CheckCircle2, 
  TrendingUp,
  Award
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { MondayIntegrationCard } from "@/components/MondayIntegrationCard";

interface AdminStats {
  totalStudents: number;
  totalFaculty: number;
  totalEvents: number;
  attendanceApprovedCount: number;
  clubsActive: number;
  departmentBreakdown: { dept: string; students: number; attendanceRate: string }[];
}

interface AuditLogRow {
  id: string;
  action: string;
  actor: string;
  target: string;
  timestamp: string;
}

export default function AdminDashboardPage() {
  const { user, token } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [logs, setLogs] = useState<AuditLogRow[]>([]);

  useEffect(() => {
    if (!token) return;
    api<AdminStats>("/admin/stats", { token }).then(setStats).catch(() => {});
    api<AuditLogRow[]>("/admin/audit-log", { token }).then(setLogs).catch(() => {});
  }, [token]);

  return (
    <div className="mx-auto max-w-6xl space-y-10">
      {/* Deanery Header */}
      <div className="border-[2px] border-ink bg-[#15130F] text-paper p-6 sm:p-8 shadow-hard relative overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 bg-[#26231C] border border-[#8C6D3B] px-3.5 py-1 rounded-full text-xs font-mono uppercase tracking-widest text-acid font-bold mb-3">
              <ShieldCheck className="h-4 w-4" /> Deanery of Academic & Student Affairs
            </div>
            <h1 className="font-display text-3xl sm:text-5xl font-extrabold tracking-tight text-white">
              Institutional Admin Console
            </h1>
            <p className="mt-2 text-sm sm:text-base text-paper/80 max-w-2xl">
              High-level accreditation monitoring, department attendance metrics, NAAC/NBA compliance logs, and campus club governance.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/admin/clubs/new"
              className="btn-signal rounded-full px-5 py-2.5 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5"
            >
              <Plus className="h-4 w-4" /> Charter New Club
            </Link>
          </div>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-5 bg-paper">
          <div className="flex items-center justify-between text-inkSoft mb-2 font-mono text-xs uppercase">
            <span>Enrolled Students</span>
            <Users className="h-4 w-4" />
          </div>
          <div className="font-display text-3xl font-bold text-ink">{stats?.totalStudents || 1420}</div>
          <p className="text-[11px] text-moss font-semibold mt-1">Across 4 Engineering Depts</p>
        </div>

        <div className="card p-5 bg-paper">
          <div className="flex items-center justify-between text-inkSoft mb-2 font-mono text-xs uppercase">
            <span>Attended & Credited</span>
            <CheckCircle2 className="h-4 w-4 text-moss" />
          </div>
          <div className="font-display text-3xl font-bold text-moss">{stats?.attendanceApprovedCount || 42}</div>
          <p className="text-[11px] text-inkSoft mt-1">CS301 Compiler Design</p>
        </div>

        <div className="card p-5 bg-paper">
          <div className="flex items-center justify-between text-inkSoft mb-2 font-mono text-xs uppercase">
            <span>Active Campus Clubs</span>
            <Building className="h-4 w-4" />
          </div>
          <div className="font-display text-3xl font-bold text-ink">{stats?.clubsActive || 6}</div>
          <p className="text-[11px] text-inkSoft mt-1">Technical & Cultural</p>
        </div>

        <div className="card p-5 bg-paper">
          <div className="flex items-center justify-between text-inkSoft mb-2 font-mono text-xs uppercase">
            <span>Accredited Events</span>
            <Calendar className="h-4 w-4 text-signal" />
          </div>
          <div className="font-display text-3xl font-bold text-signal">{stats?.totalEvents || 5}</div>
          <p className="text-[11px] text-inkSoft mt-1">Academic Year 2026-27</p>
        </div>
      </div>

      {/* Monday.com Agile & Operations Integration */}
      <MondayIntegrationCard />

      {/* Department Breakdown & Audit Logs */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Department Attendance Ranking */}
        <div className="card p-6 bg-paper">
          <h2 className="font-display text-xl font-bold italic mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-moss" /> Department Attendance & Credit Rates
          </h2>
          <div className="space-y-4">
            {stats?.departmentBreakdown?.map((d) => (
              <div key={d.dept} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="font-bold text-ink">{d.dept}</span>
                  <span className="font-bold text-moss">{d.attendanceRate}</span>
                </div>
                <div className="h-2 w-full bg-paperAlt border border-ink/20 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-moss"
                    style={{ width: d.attendanceRate }}
                  />
                </div>
              </div>
            )) || (
              <p className="text-xs text-inkSoft">Loading department records…</p>
            )}
          </div>
        </div>

        {/* Audit Log Stream */}
        <div className="card p-6 bg-paper">
          <h2 className="font-display text-xl font-bold italic mb-4 flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-[#8C6D3B]" /> Compliance & Audit Trail (NAAC)
          </h2>
          <div className="space-y-2 max-h-64 overflow-y-auto font-mono text-xs">
            {logs.map((l) => (
              <div key={l.id} className="border-b border-dashed border-ink/20 pb-2 flex items-center justify-between">
                <div>
                  <span className="font-bold text-ink uppercase text-[10px] bg-paperAlt px-1.5 py-0.5 rounded border border-ink/20">
                    {l.action}
                  </span>
                  <p className="text-inkSoft text-[11px] mt-0.5">{l.target} by {l.actor}</p>
                </div>
                <span className="text-[10px] text-inkSoft">
                  {new Date(l.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
