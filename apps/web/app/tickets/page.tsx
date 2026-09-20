"use client";

import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { motion, AnimatePresence } from "framer-motion";
import { Ticket, Award, Download } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { StatusBadge } from "@/components/StatusBadge";

interface RegistrationRow {
  id: string;
  status: string;
  event: { title: string; slug: string; startAt: string; venue: string };
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
  const { token } = useAuth();
  const [regs, setRegs] = useState<RegistrationRow[]>([]);
  const [certs, setCerts] = useState<CertRow[]>([]);
  const [openTicket, setOpenTicket] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    api<RegistrationRow[]>("/users/me/tickets", { token }).then(setRegs);
    api<CertRow[]>("/users/me/certificates", { token }).then(setCerts);
  }, [token]);

  if (!token) return <p className="text-white/50">Log in to see your tickets.</p>;

  return (
    <div className="mx-auto max-w-2xl space-y-12">
      <section>
        <h1 className="mb-5 flex items-center gap-2 font-display text-2xl font-bold">
          <Ticket className="h-5 w-5 text-brand-light" /> My Tickets
        </h1>
        <div className="space-y-3">
          {regs.map((r) => (
            <div key={r.id} className="glass rounded-2xl p-5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold">{r.event.title}</div>
                  <div className="mt-0.5 text-sm text-white/45">
                    {new Date(r.event.startAt).toLocaleString()} · {r.event.venue} · {r.ticketType.name}
                  </div>
                </div>
                <StatusBadge status={r.ticket?.status ?? r.status} />
              </div>
              {r.ticket && (
                <button
                  onClick={() => setOpenTicket(openTicket === r.id ? null : r.id)}
                  className="mt-3 text-sm font-medium text-brand-light hover:underline"
                >
                  {openTicket === r.id ? "Hide QR" : "Show QR ticket"}
                </button>
              )}
              <AnimatePresence>
                {openTicket === r.id && r.ticket && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-4 flex justify-center rounded-xl bg-white p-5">
                      <QRCodeSVG value={r.ticket.qrToken} size={180} />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
          {regs.length === 0 && (
            <div className="rounded-2xl border border-dashed border-white/10 py-14 text-center text-white/40">
              No registrations yet — go discover an event.
            </div>
          )}
        </div>
      </section>

      <section>
        <h2 className="mb-5 flex items-center gap-2 font-display text-xl font-bold">
          <Award className="h-5 w-5 text-brand-light" /> Certificates
        </h2>
        <div className="space-y-3">
          {certs.map((c) => (
            <div key={c.certId} className="glass flex items-center justify-between rounded-2xl p-5">
              <div>
                <div className="font-semibold">{c.event.title}</div>
                <div className="text-sm text-white/45">Cert ID: {c.certId}</div>
              </div>
              <a
                href={c.pdfUrl.startsWith("http") ? c.pdfUrl : `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"}${c.pdfUrl}`}
                target="_blank"
                className="btn-ghost flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium"
              >
                <Download className="h-3.5 w-3.5" /> PDF
              </a>
            </div>
          ))}
          {certs.length === 0 && (
            <div className="rounded-2xl border border-dashed border-white/10 py-14 text-center text-white/40">
              No certificates issued yet.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
