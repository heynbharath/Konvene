"use client";

import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
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
    <div className="mx-auto max-w-2xl space-y-10">
      <section>
        <h1 className="mb-4 text-2xl font-bold">My Tickets</h1>
        <div className="space-y-3">
          {regs.map((r) => (
            <div key={r.id} className="rounded-xl border border-white/10 bg-surfaceAlt p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold">{r.event.title}</div>
                  <div className="text-sm text-white/50">
                    {new Date(r.event.startAt).toLocaleString()} · {r.event.venue} · {r.ticketType.name}
                  </div>
                </div>
                <StatusBadge status={r.ticket?.status ?? r.status} />
              </div>
              {r.ticket && (
                <button
                  onClick={() => setOpenTicket(openTicket === r.id ? null : r.id)}
                  className="mt-3 text-sm text-brand hover:underline"
                >
                  {openTicket === r.id ? "Hide QR" : "Show QR ticket"}
                </button>
              )}
              {openTicket === r.id && r.ticket && (
                <div className="mt-4 flex justify-center rounded-lg bg-white p-4">
                  <QRCodeSVG value={r.ticket.qrToken} size={180} />
                </div>
              )}
            </div>
          ))}
          {regs.length === 0 && <p className="text-white/50">No registrations yet — go discover an event.</p>}
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-xl font-bold">Certificates</h2>
        <div className="space-y-3">
          {certs.map((c) => (
            <div key={c.certId} className="flex items-center justify-between rounded-xl border border-white/10 bg-surfaceAlt p-4">
              <div>
                <div className="font-semibold">{c.event.title}</div>
                <div className="text-sm text-white/50">Cert ID: {c.certId}</div>
              </div>
              <a
                href={`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"}${c.pdfUrl}`}
                target="_blank"
                className="rounded-md bg-white/10 px-3 py-1.5 text-sm hover:bg-white/20"
              >
                Download PDF
              </a>
            </div>
          ))}
          {certs.length === 0 && <p className="text-white/50">No certificates issued yet.</p>}
        </div>
      </section>
    </div>
  );
}
