"use client";

import { GraduationCap, CheckCircle2, UserCheck, BookOpen } from "lucide-react";

interface AttendanceData {
  subjectCode: string;
  subjectName: string;
  facultyName: string;
  department: string;
  section: string;
  policy: string;
  status: string;
  eligibleEvents?: string[];
}

export function InteractiveAttendanceCard({ data }: { data: AttendanceData }) {
  return (
    <div className="my-3 overflow-hidden rounded-md border-2 border-ink bg-paperAlt shadow-hard">
      {/* Top Banner */}
      <div className="flex items-center justify-between border-b-2 border-ink bg-moss px-3 py-2 text-paper">
        <div className="flex items-center gap-1.5 font-mono text-xs font-bold uppercase tracking-wide">
          <GraduationCap className="h-4 w-4" />
          <span>Academic Attendance Resolver</span>
        </div>
        <span className="rounded bg-paper px-2 py-0.5 font-mono text-[10px] font-bold text-moss">
          {data.status}
        </span>
      </div>

      <div className="p-3.5 space-y-3">
        {/* Subject & Faculty Info */}
        <div className="grid grid-cols-2 gap-2 rounded border border-ink/20 bg-paper p-2.5">
          <div className="space-y-0.5">
            <span className="font-mono text-[10px] uppercase text-inkSoft">Subject</span>
            <div className="font-display text-sm font-bold text-ink">
              {data.subjectCode} • {data.subjectName}
            </div>
          </div>
          <div className="space-y-0.5">
            <span className="font-mono text-[10px] uppercase text-inkSoft">Faculty In-Charge</span>
            <div className="flex items-center gap-1 font-mono text-xs font-bold text-ink">
              <UserCheck className="h-3.5 w-3.5 text-moss" />
              <span>{data.facultyName}</span>
            </div>
          </div>
        </div>

        {/* Policy Description */}
        <p className="font-sans text-xs text-inkSoft leading-relaxed border-l-2 border-signal pl-2.5">
          {data.policy}
        </p>

        {/* Eligible Events List */}
        {data.eligibleEvents && data.eligibleEvents.length > 0 && (
          <div className="space-y-1.5 pt-1">
            <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-ink">
              Accredited Events for Credit:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {data.eligibleEvents.map((evt, idx) => (
                <span
                  key={idx}
                  className="rounded border border-ink/30 bg-paper px-2 py-0.5 font-mono text-[11px] text-ink"
                >
                  ✓ {evt}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

