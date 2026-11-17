"use client";

import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { motion, AnimatePresence } from "framer-motion";
import { Ticket, Award, Download, Eye, CheckCircle2, ShieldCheck, Calendar, MapPin } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { StatusBadge } from "@/components/StatusBadge";
import { CertificateModal } from "@/components/CertificateModal";
import { CertificateData } from "@/components/CollegeCertificate";

interface RegistrationRow {
  id: string;
  status: string;
  event: { title: string; slug: string; startAt: string; venue: string; club?: { name: string } };
  ticketType: { name: string };
  ticket: { id: string; qrToken: string; status: string } | null;
}

interface CertRow {
  certId: string;
  pdfUrl: string;
  issuedAt: string;
  event: { title: string };
}

export default function TicketsPage() {
  const { token, user } = useAuth();
  const [regs, setRegs] = useState<RegistrationRow[]>([]);
  const [certs, setCerts] = useState<CertRow[]>([]);
  const [openTicket, setOpenTicket] = useState<string | null>(null);
  const [activeCert, setActiveCert] = useState<CertificateData | null>(null);

  useEffect(() => {
    if (!token) return;
    api<RegistrationRow[]>("/users/me/tickets", { token })
      .then((data) => {
        if (Array.isArray(data)) setRegs(data);
      })
      .catch(() => {});

    api<CertRow[]>("/users/me/certificates", { token })
      .then((data) => {
        if (Array.isArray(data)) setCerts(data);
      })
      .catch(() => {});
  }, [token]);

  function handleOpenCert(c: CertRow) {
    const isMun = c.event.title.includes("Model United Nations") || c.event.title.includes("COPE");
    const isStaffOrDean = Boolean(
      user?.roles?.some((r: any) => r.role === 'ADMIN' || r.role === 'FACULTY') ||
      user?.name?.includes('Dean') ||
      user?.name?.includes('Dr.')
    );
    const studentRecipient = !user || isStaffOrDean ? "Sunaina Mohapatra" : user.name;
    const studentUsn = !user || isStaffOrDean ? "ENG24CT0058" : (user.usn || "ENG24CT0058");
    setActiveCert({
      certId: c.certId,
      studentName: studentRecipient,
      usn: studentUsn,
      department: isMun ? "School of Engineering, Dayananda Sagar University" : "Department of Computer Science & Engineering",
      section: "5th Sem · Section A",
      eventTitle: c.event.title,
      clubName: isMun ? "DSU MUNSoc" : "Google Developer Student Club (GDSC)",
      eventDate: new Date(c.issuedAt).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      }),
      venue: isMun ? "Dr. Premachandra Sagar Auditorium, DSU" : "Main Auditorium & Turing Hall",
      subjectCode: isMun ? "HU301" : "CS301",
      subjectName: isMun ? "Professional Communication & Governance" : "Compiler Design",
      facultyName: isMun ? "Dr. Seema Tharannum & Dr. Sai Prasad" : "Dr. Rao",
    });
  }

  if (!token) {
    return (
      <div className="card p-12 text-center max-w-md mx-auto">
        <Ticket className="h-12 w-12 text-signal mx-auto mb-4" />
        <h2 className="font-display text-2xl font-bold italic">Student Tickets & Passes</h2>
        <p className="mt-2 text-sm text-inkSoft">Please log in to access your registered event passes and academic certificates.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-12">
      {/* Student Passport Header */}
      <div className="border-[2px] border-ink bg-[#15130F] text-paper p-6 shadow-hard flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 bg-[#26231C] border border-[#8C6D3B] px-3 py-1 rounded-full text-[10px] font-mono uppercase tracking-widest text-acid font-bold mb-2">
            <ShieldCheck className="h-3.5 w-3.5" /> Verified Student ID Pass
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
            <Ticket className="h-7 w-7 text-signal" /> My Passes & Certificates
          </h1>
          <p className="text-xs sm:text-sm text-paper/70 mt-1">
            Registered passes for <strong>{user?.name}</strong> · USN: <span className="font-mono text-acid font-bold">{user?.usn || "ENG24CT0058"}</span>
          </p>
        </div>

        <div className="text-right font-mono text-xs text-paper/70">
          <p>Active Passes: <strong className="text-white">{regs.length}</strong></p>
          <p>Certificates Earned: <strong className="text-acid">{certs.length}</strong></p>
        </div>
      </div>

      {/* Tickets Section */}
      <section className="space-y-4">
        <div className="border-b-[1.5px] border-ink pb-3 flex items-center justify-between">
          <h2 className="font-display text-2xl font-bold italic flex items-center gap-2">
            <Ticket className="h-5 w-5 text-signal" /> Active Event Passes
          </h2>
          <span className="font-mono text-xs text-inkSoft uppercase font-semibold">
            HMAC-SHA256 Signed
          </span>
        </div>

        <div className="space-y-4">
          {regs.map((r) => (
            <div key={r.id} className="card p-6 bg-paper border-[1.5px] border-ink">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h3 className="font-display text-xl font-bold text-ink">{r.event.title}</h3>
                  <div className="mt-2 space-y-1 text-xs text-inkSoft font-mono">
                    <p className="flex items-center gap-2">
                      <Calendar className="h-3.5 w-3.5 text-signal" />
                      <span>{new Date(r.event.startAt).toLocaleString()}</span>
                    </p>
                    <p className="flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5 text-signal" />
                      <span>{r.event.venue}</span>
                    </p>
                    <p className="text-[11px] text-[#451A03] font-sans font-semibold mt-1">
                      🎓 Attendance accredited for <strong>CS301 Compiler Design (Dr. Rao)</strong>
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <StatusBadge status={r.ticket?.status ?? r.status} />
                  <p className="font-mono text-[10px] text-inkSoft mt-1 uppercase font-bold">
                    {r.ticketType.name}
                  </p>
                </div>
              </div>

              {r.ticket && (
                <div className="mt-4 pt-3 border-t border-dashed border-ink/30 flex items-center justify-between">
                  <button
                    onClick={() => setOpenTicket(openTicket === r.id ? null : r.id)}
                    className="btn-signal rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wide flex items-center gap-1.5"
                  >
                    {openTicket === r.id ? "Hide QR Pass" : "Show Gate QR Pass"}
                  </button>

                  <span className="font-mono text-[10px] text-inkSoft">
                    Ticket ID: {r.ticket.id}
                  </span>
                </div>
              )}

              <AnimatePresence>
                {openTicket === r.id && r.ticket && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-4 border-[2px] border-ink bg-paperAlt p-6 text-center rounded-xl">
                      <p className="font-mono text-xs uppercase font-bold text-[#8C6D3B] mb-2 tracking-widest">
                        Official Gate Admission Pass
                      </p>
                      <div className="inline-block p-4 bg-white border-[2px] border-ink rounded-lg shadow-sm">
                        <QRCodeSVG value={r.ticket.qrToken} size={190} />
                      </div>
                      <p className="mt-3 font-mono text-xs font-bold text-ink">
                        Pass Code: {r.ticket.id.toUpperCase()}
                      </p>
                      <p className="text-xs text-inkSoft max-w-sm mx-auto mt-1">
                        Present this dynamic QR code at the Turing Hall / Auditorium entrance for instant atomic gate check-in.
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}

          {regs.length === 0 && (
            <div className="border-[1.5px] border-dashed border-ink py-14 text-center italic text-inkSoft">
              No registered passes found. Browse the campus discovery catalog to RSVP for events!
            </div>
          )}
        </div>
      </section>

      {/* Certificates Section */}
      <section className="space-y-4">
        <div className="border-b-[1.5px] border-ink pb-3 flex items-center justify-between">
          <h2 className="font-display text-2xl font-bold italic flex items-center gap-2">
            <Award className="h-5 w-5 text-signal" /> Issued Academic Certificates
          </h2>
          <span className="font-mono text-xs text-moss uppercase font-semibold flex items-center gap-1">
            <CheckCircle2 className="h-3.5 w-3.5" /> Department Verified
          </span>
        </div>

        <div className="space-y-3">
          {certs.map((c) => (
            <div key={c.certId} className="card flex flex-wrap items-center justify-between gap-4 p-5 bg-paper">
              <div>
                <span className="font-mono text-[10px] font-bold uppercase bg-moss/20 text-moss px-2 py-0.5 rounded border border-moss/30">
                  Accredited Participation
                </span>
                <h3 className="font-display text-lg font-bold text-ink mt-1">{c.event.title}</h3>
                <p className="font-mono text-xs text-inkSoft mt-0.5">
                  Certificate ID: <strong className="text-ink">{c.certId}</strong> · Issued: {new Date(c.issuedAt).toLocaleDateString()}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleOpenCert(c)}
                  className="btn-signal flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wide"
                >
                  <Eye className="h-3.5 w-3.5" /> View & Download Certificate
                </button>
              </div>
            </div>
          ))}

          {certs.length === 0 && (
            <div className="border-[1.5px] border-dashed border-ink py-14 text-center italic text-inkSoft">
              No certificates issued yet. Certificates auto-issue once Dr. Rao verifies your event attendance!
            </div>
          )}
        </div>
      </section>

      {/* Interactive Certificate Modal */}
      <CertificateModal
        data={activeCert}
        onClose={() => setActiveCert(null)}
      />
    </div>
  );
}
