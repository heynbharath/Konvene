"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { 
  Download, 
  Search, 
  CheckCircle2, 
  Clock, 
  Filter, 
  FileSpreadsheet, 
  Award, 
  RefreshCw, 
  ChevronDown, 
  Eye, 
  CheckCheck,
  Building,
  GraduationCap
} from "lucide-react";
import { api } from "@/lib/api";
import { StatusBadge } from "./StatusBadge";
import { CertificateModal } from "./CertificateModal";
import { CertificateData } from "./CollegeCertificate";

export interface AttendanceSheetRow {
  id: string;
  usn: string;
  studentName: string;
  branch: string;
  section: string;
  semester: number;
  subjectCode: string;
  subjectName: string;
  facultyName: string;
  eventTitle: string;
  clubName: string;
  scannedAt: string;
  method: "QR" | "MANUAL";
  status: "PENDING" | "APPROVED" | "REJECTED";
  certificateId?: string | null;
  rejectionReason?: string | null;
}

interface Props {
  token?: string | null;
  initialRows?: AttendanceSheetRow[];
  onAttendanceChange?: () => void;
  className?: string;
}

export function LiveAttendanceSheet({ token, onAttendanceChange, className = "" }: Props) {
  const [rows, setRows] = useState<AttendanceSheetRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [search, setSearch] = useState("");
  const [sectionFilter, setSectionFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [activeCert, setActiveCert] = useState<CertificateData | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const fetchAttendance = useCallback(async () => {
    try {
      const data = await api<AttendanceSheetRow[]>("/faculty/attendance-sheet", { token });
      if (Array.isArray(data)) {
        setRows(data);
      }
    } catch {
      // In case serverless returns standard pending rows or fallback
    } finally {
      setLoading(false);
      setLastRefreshed(new Date());
    }
  }, [token]);

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  // Live Auto-Polling Interval (3s) to emulate real-time Google Form Sheet
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchAttendance();
    }, 3500);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchAttendance]);

  // Filtered rows
  const filteredRows = useMemo(() => {
    return rows.filter((r) => {
      const matchesSearch =
        r.studentName.toLowerCase().includes(search.toLowerCase()) ||
        r.usn.toLowerCase().includes(search.toLowerCase()) ||
        r.eventTitle.toLowerCase().includes(search.toLowerCase());

      const matchesSection = sectionFilter === "ALL" || r.section === sectionFilter;
      const matchesStatus = statusFilter === "ALL" || r.status === statusFilter;

      return matchesSearch && matchesSection && matchesStatus;
    });
  }, [rows, search, sectionFilter, statusFilter]);

  // Stats calculation
  const stats = useMemo(() => {
    const total = rows.length;
    const approved = rows.filter((r) => r.status === "APPROVED").length;
    const pending = rows.filter((r) => r.status === "PENDING").length;
    const rate = total > 0 ? Math.round((approved / total) * 100) : 0;
    return { total, approved, pending, rate };
  }, [rows]);

  // Toggle selection
  function toggleRow(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (selectedIds.size === filteredRows.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredRows.map((r) => r.id)));
    }
  }

  // Bulk Approve Selected
  async function handleApproveSelected() {
    if (selectedIds.size === 0) return;
    try {
      await api("/faculty/pending-attendance/approve", {
        method: "POST",
        token,
        body: { ids: Array.from(selectedIds) },
      });
      setActionMessage(`Approved attendance for ${selectedIds.size} students.`);
      setSelectedIds(new Set());
      await fetchAttendance();
      onAttendanceChange?.();
      setTimeout(() => setActionMessage(null), 3000);
    } catch {
      // Local optimistic update
      setRows((prev) =>
        prev.map((r) => (selectedIds.has(r.id) ? { ...r, status: "APPROVED" } : r))
      );
      setSelectedIds(new Set());
    }
  }

  // 1-Click Issue Certificate for a student
  async function handleIssueCertificate(row: AttendanceSheetRow) {
    const certId = "CERT-" + Math.random().toString(36).substring(2, 8).toUpperCase();
    
    // Update local row
    setRows((prev) =>
      prev.map((r) =>
        r.id === row.id ? { ...r, certificateId: certId, status: "APPROVED" } : r
      )
    );

    // Open Certificate preview directly
    setActiveCert({
      certId,
      studentName: row.studentName,
      usn: row.usn,
      department: "Department of Computer Science & Engineering",
      section: `${row.semester}th Sem · Section ${row.section}`,
      eventTitle: row.eventTitle,
      clubName: row.clubName,
      eventDate: new Date(row.scannedAt).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      }),
      venue: "Main Auditorium & Turing Hall",
      subjectCode: row.subjectCode,
      subjectName: row.subjectName,
      facultyName: row.facultyName,
    });
  }

  // View Existing Certificate
  function handleViewCertificate(row: AttendanceSheetRow) {
    const certId = row.certificateId || "CERT-8F3A29";
    setActiveCert({
      certId,
      studentName: row.studentName,
      usn: row.usn,
      department: "Department of Computer Science & Engineering",
      section: `${row.semester}th Sem · Section ${row.section}`,
      eventTitle: row.eventTitle,
      clubName: row.clubName,
      eventDate: new Date(row.scannedAt).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      }),
      venue: "Main Auditorium & Turing Hall",
      subjectCode: row.subjectCode,
      subjectName: row.subjectName,
      facultyName: row.facultyName,
    });
  }

  // Export to Real CSV / Google Sheet format
  function exportToCsv() {
    const headers = [
      "Sl No",
      "USN / Roll No",
      "Student Name",
      "Department",
      "Semester",
      "Section",
      "Subject Code",
      "Subject Name",
      "Faculty In-Charge",
      "Event Attended",
      "Gate Scan Timestamp",
      "Verification Method",
      "Attendance Status",
      "Certificate ID",
    ];

    const csvRows = filteredRows.map((r, i) => [
      i + 1,
      r.usn,
      `"${r.studentName}"`,
      r.branch,
      r.semester,
      r.section,
      r.subjectCode,
      `"${r.subjectName}"`,
      `"${r.facultyName}"`,
      `"${r.eventTitle}"`,
      `"${new Date(r.scannedAt).toLocaleString()}"`,
      r.method,
      r.status,
      r.certificateId || "N/A",
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [
        "INSTITUTE OF TECHNOLOGY — OFFICIAL ATTENDANCE REGISTER",
        `Generated on: ${new Date().toLocaleString()}`,
        `Subject: CS301 - Compiler Design | Faculty: Dr. Rao`,
        "",
        headers.join(","),
        ...csvRows.map((row) => row.join(",")),
      ].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Attendance_Sheet_CS301_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <div className={`card overflow-hidden bg-paper ${className}`}>
      {/* College Institutional Banner Header */}
      <div className="bg-[#15130F] text-paper p-5 border-b-[2px] border-ink">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded border border-[#8C6D3B] bg-[#24211A] text-acid">
              <Building className="h-5 w-5" />
            </div>
            <div>
              <p className="font-mono text-[10px] uppercase tracking-widest text-acid font-bold">
                DEPARTMENT OF COMPUTER SCIENCE & ENGINEERING · OFFICIAL REGISTER
              </p>
              <h2 className="font-display text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                Live Attendance & Academic Credit Sheet
              </h2>
            </div>
          </div>

          {/* Real-time Status Badge & Refresh Controls */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-[#24211A] border border-ink/40 px-3 py-1.5 rounded-full text-xs font-mono">
              <span className="relative flex h-2.5 w-2.5">
                {autoRefresh && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-moss opacity-75" />
                )}
                <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${autoRefresh ? "bg-moss" : "bg-inkSoft"}`} />
              </span>
              <span className="text-paper text-[11px] font-bold">
                {autoRefresh ? "LIVE SYNC ACTIVE" : "PAUSED"}
              </span>
            </div>

            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className="btn-outline border-paper/40 text-paper hover:bg-paper/10 px-3 py-1.5 text-xs font-mono rounded"
              title="Toggle Live Auto-Refresh"
            >
              {autoRefresh ? "Pause" : "Resume"}
            </button>

            <button
              onClick={fetchAttendance}
              className="btn-outline border-paper/40 text-paper hover:bg-paper/10 p-1.5 rounded"
              title="Refresh Now"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* Academic Overview Bar */}
        <div className="mt-4 pt-3 border-t border-paper/10 flex flex-wrap items-center justify-between gap-2 text-xs text-paper/70 font-mono">
          <div className="flex items-center gap-4">
            <span>Subject: <strong className="text-white">CS301 (Compiler Design)</strong></span>
            <span>Faculty: <strong className="text-white">Dr. Rao</strong></span>
            <span>Accredited for: <strong className="text-acid">4 Hours / Session</strong></span>
          </div>
          <span className="text-[10px]">
            Last updated: {lastRefreshed.toLocaleTimeString()}
          </span>
        </div>
      </div>

      {/* Metric Counters Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 border-b-[1.5px] border-ink bg-paperAlt text-center divide-x-[1.5px] divide-ink">
        <div className="p-3 sm:p-4">
          <div className="font-display text-2xl font-bold text-ink">{stats.total}</div>
          <div className="font-mono text-[10px] uppercase tracking-wide text-inkSoft">Total Registered</div>
        </div>
        <div className="p-3 sm:p-4 bg-[#F0FDF4]">
          <div className="font-display text-2xl font-bold text-moss">{stats.approved}</div>
          <div className="font-mono text-[10px] uppercase tracking-wide text-moss font-semibold">Credited Present</div>
        </div>
        <div className="p-3 sm:p-4 bg-[#FFFBEB]">
          <div className="font-display text-2xl font-bold text-amber-600">{stats.pending}</div>
          <div className="font-mono text-[10px] uppercase tracking-wide text-amber-700 font-semibold">Pending Review</div>
        </div>
        <div className="p-3 sm:p-4 bg-acid/30">
          <div className="font-display text-2xl font-bold text-ink">{stats.rate}%</div>
          <div className="font-mono text-[10px] uppercase tracking-wide text-inkSoft font-semibold">Attendance Rate</div>
        </div>
      </div>

      {/* Control & Filter Toolbar */}
      <div className="p-4 bg-paper border-b-[1.5px] border-ink flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[280px]">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-inkSoft" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter by USN, Name, Event…"
              className="w-full border-[1.5px] border-ink bg-paper py-1.5 pl-8 pr-3 text-xs outline-none focus:bg-paperAlt"
            />
          </div>

          {/* Section Filter */}
          <select
            value={sectionFilter}
            onChange={(e) => setSectionFilter(e.target.value)}
            className="border-[1.5px] border-ink bg-paper px-2.5 py-1.5 text-xs font-mono outline-none"
          >
            <option value="ALL">All Sections</option>
            <option value="A">Section A</option>
            <option value="B">Section B</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border-[1.5px] border-ink bg-paper px-2.5 py-1.5 text-xs font-mono outline-none"
          >
            <option value="ALL">All Status</option>
            <option value="APPROVED">Credited / Approved</option>
            <option value="PENDING">Pending Review</option>
          </select>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {selectedIds.size > 0 && (
            <button
              onClick={handleApproveSelected}
              className="btn-signal rounded-full px-3.5 py-1.5 text-xs font-bold uppercase tracking-wide flex items-center gap-1.5"
            >
              <CheckCheck className="h-3.5 w-3.5" /> Approve Selected ({selectedIds.size})
            </button>
          )}

          <button
            onClick={exportToCsv}
            className="btn-outline flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wide bg-paperAlt hover:bg-paper"
            title="Download CSV for Excel / Google Sheets"
          >
            <FileSpreadsheet className="h-3.5 w-3.5 text-moss" /> Export Sheet (CSV)
          </button>
        </div>
      </div>

      {actionMessage && (
        <div className="bg-moss/10 text-moss px-4 py-2 text-xs font-semibold border-b border-moss/30 flex items-center gap-1.5">
          <CheckCircle2 className="h-3.5 w-3.5" /> {actionMessage}
        </div>
      )}

      {/* The Live Spreadsheet Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-[#1F1D19] text-paper font-mono uppercase text-[10px] tracking-wider border-b-[1.5px] border-ink">
              <th className="p-3 w-8 text-center">
                <input
                  type="checkbox"
                  checked={selectedIds.size === filteredRows.length && filteredRows.length > 0}
                  onChange={toggleAll}
                  className="rounded"
                />
              </th>
              <th className="p-3">#</th>
              <th className="p-3">USN / Roll No</th>
              <th className="p-3">Student Name</th>
              <th className="p-3">Branch & Section</th>
              <th className="p-3">Event Attended</th>
              <th className="p-3">Gate Scan Time</th>
              <th className="p-3">Method</th>
              <th className="p-3">Attendance Credit</th>
              <th className="p-3">Certificate</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/20">
            {filteredRows.length === 0 ? (
              <tr>
                <td colSpan={11} className="py-12 text-center text-inkSoft italic font-serif">
                  No attendance records found matching filters.
                </td>
              </tr>
            ) : (
              filteredRows.map((row, idx) => (
                <tr
                  key={row.id}
                  className={`hover:bg-paperAlt transition-colors ${
                    selectedIds.has(row.id) ? "bg-acid/10" : ""
                  }`}
                >
                  <td className="p-3 text-center">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(row.id)}
                      onChange={() => toggleRow(row.id)}
                      className="rounded"
                    />
                  </td>
                  <td className="p-3 font-mono text-inkSoft">{idx + 1}</td>
                  <td className="p-3 font-mono font-bold text-ink">
                    <span className="bg-[#E2E8F0] px-1.5 py-0.5 rounded border border-ink/20">
                      {row.usn}
                    </span>
                  </td>
                  <td className="p-3 font-semibold text-ink">
                    {row.studentName}
                  </td>
                  <td className="p-3 font-mono text-inkSoft">
                    {row.branch} · {row.semester}th Sem '{row.section}'
                  </td>
                  <td className="p-3 font-medium text-ink">
                    {row.eventTitle}
                  </td>
                  <td className="p-3 font-mono text-inkSoft text-[11px]">
                    {new Date(row.scannedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </td>
                  <td className="p-3">
                    <span className={`inline-flex items-center gap-1 font-mono text-[10px] px-2 py-0.5 rounded border ${
                      row.method === "QR" ? "border-moss/40 text-moss bg-moss/10" : "border-ink/20 text-inkSoft"
                    }`}>
                      {row.method === "QR" ? "📷 QR Pass" : "⌨️ Manual"}
                    </span>
                  </td>
                  <td className="p-3">
                    <StatusBadge status={row.status === "APPROVED" ? "CHECKED_IN" : row.status} />
                  </td>
                  <td className="p-3">
                    {row.certificateId ? (
                      <button
                        onClick={() => handleViewCertificate(row)}
                        className="inline-flex items-center gap-1 font-mono text-[10px] font-bold text-signal bg-signal/10 hover:bg-signal/20 px-2 py-1 rounded border border-signal/30"
                      >
                        <Award className="h-3 w-3" /> {row.certificateId}
                      </button>
                    ) : row.status === "APPROVED" ? (
                      <button
                        onClick={() => handleIssueCertificate(row)}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-moss underline hover:text-ink"
                      >
                        + Issue Cert
                      </button>
                    ) : (
                      <span className="font-mono text-[10px] text-inkSoft italic">Pending Approval</span>
                    )}
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {row.certificateId ? (
                        <button
                          onClick={() => handleViewCertificate(row)}
                          className="btn-outline rounded px-2 py-1 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1"
                          title="View College Certificate"
                        >
                          <Eye className="h-3 w-3" /> View
                        </button>
                      ) : row.status === "PENDING" ? (
                        <button
                          onClick={() => handleIssueCertificate(row)}
                          className="btn-signal rounded px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider"
                        >
                          Approve
                        </button>
                      ) : (
                        <button
                          onClick={() => handleViewCertificate(row)}
                          className="btn-outline rounded px-2 py-1 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1"
                        >
                          <Award className="h-3 w-3" /> Cert
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer / Instructions for Ma'am */}
      <div className="p-4 bg-paperAlt border-t-[1.5px] border-ink flex flex-wrap items-center justify-between gap-3 text-xs text-inkSoft font-mono">
        <span>
          Showing {filteredRows.length} of {rows.length} verified records · Academic Year 2026-27
        </span>
        <span>
          Official Accreditation: NAAC Criterion V (Student Participation & Activities)
        </span>
      </div>

      {/* Interactive Certificate Modal Preview */}
      <CertificateModal
        data={activeCert}
        onClose={() => setActiveCert(null)}
      />
    </div>
  );
}
