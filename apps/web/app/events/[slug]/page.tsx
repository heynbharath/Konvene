"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { StatusBadge } from "@/components/StatusBadge";

interface FormField {
  key: string;
  label: string;
  type: "text" | "textarea" | "select" | "checkbox" | "file";
  options?: string[];
  required?: boolean;
}

interface EventDetail {
  id: string;
  title: string;
  description: string;
  category: string;
  venue: string;
  startAt: string;
  endAt: string;
  capacity: number;
  club: { name: string; slug: string };
  ticketTypes: { id: string; name: string; price: number; capacity: number }[];
  form: { schemaJson: string } | null;
  _count: { registrations: number };
}

export default function EventDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { user, token } = useAuth();
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [ticketTypeId, setTicketTypeId] = useState("");
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api<EventDetail>(`/events/${slug}`).then((e) => {
      setEvent(e);
      setTicketTypeId(e.ticketTypes[0]?.id ?? "");
    });
  }, [slug]);

  if (!event) return <p className="text-white/50">Loading…</p>;

  const fields: FormField[] = event.form ? JSON.parse(event.form.schemaJson) : [];
  const spotsLeft = event.capacity - event._count.registrations;

  async function register() {
    if (!token) return setError("Log in first to register.");
    setBusy(true);
    setError(null);
    try {
      const res = await api(`/events/${event!.id}/register`, {
        method: "POST",
        token,
        body: { ticketTypeId, formResponses: formValues },
      });
      setResult(res);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Registration failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-2 text-xs uppercase tracking-wide text-brand">{event.category}</div>
      <h1 className="text-3xl font-bold">{event.title}</h1>
      <p className="mt-1 text-white/50">by {event.club.name}</p>

      <div className="mt-6 grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
        <div><div className="text-white/40">Starts</div>{new Date(event.startAt).toLocaleString()}</div>
        <div><div className="text-white/40">Ends</div>{new Date(event.endAt).toLocaleString()}</div>
        <div><div className="text-white/40">Venue</div>{event.venue}</div>
        <div><div className="text-white/40">Spots left</div>{Math.max(spotsLeft, 0)}</div>
      </div>

      <p className="mt-6 whitespace-pre-wrap text-white/80">{event.description}</p>

      <div className="mt-10 rounded-xl border border-white/10 bg-surfaceAlt p-6">
        {result ? (
          <RegistrationResult result={result} />
        ) : (
          <>
            <h2 className="mb-4 text-xl font-semibold">Register</h2>
            <label className="mb-1 block text-sm text-white/60">Ticket type</label>
            <select
              value={ticketTypeId}
              onChange={(e) => setTicketTypeId(e.target.value)}
              className="mb-4 w-full rounded-lg border border-white/10 bg-surface px-3 py-2"
            >
              {event.ticketTypes.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} — {t.price === 0 ? "Free" : `₹${(t.price / 100).toFixed(2)}`}
                </option>
              ))}
            </select>

            {fields.map((f) => (
              <div key={f.key} className="mb-4">
                <label className="mb-1 block text-sm text-white/60">
                  {f.label}
                  {f.required && " *"}
                </label>
                {f.type === "select" ? (
                  <select
                    required={f.required}
                    onChange={(e) => setFormValues((v) => ({ ...v, [f.key]: e.target.value }))}
                    className="w-full rounded-lg border border-white/10 bg-surface px-3 py-2"
                  >
                    <option value="">Select…</option>
                    {f.options?.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                ) : f.type === "textarea" ? (
                  <textarea
                    required={f.required}
                    onChange={(e) => setFormValues((v) => ({ ...v, [f.key]: e.target.value }))}
                    className="w-full rounded-lg border border-white/10 bg-surface px-3 py-2"
                  />
                ) : (
                  <input
                    required={f.required}
                    onChange={(e) => setFormValues((v) => ({ ...v, [f.key]: e.target.value }))}
                    className="w-full rounded-lg border border-white/10 bg-surface px-3 py-2"
                  />
                )}
              </div>
            ))}

            {error && <p className="mb-3 text-sm text-red-400">{error}</p>}
            <button
              onClick={register}
              disabled={busy || !user}
              className="w-full rounded-lg bg-brand py-2 font-medium hover:bg-brand-dark disabled:opacity-50"
            >
              {!user ? "Log in to register" : busy ? "Registering…" : spotsLeft <= 0 ? "Join waitlist" : "Register"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function RegistrationResult({ result }: { result: any }) {
  if (result.waitlisted) {
    return (
      <div>
        <StatusBadge status="WAITLISTED" />
        <p className="mt-3 text-white/70">
          This event is at capacity — you're on the waitlist and will be promoted automatically if a spot opens up.
        </p>
      </div>
    );
  }
  if (result.requiresPayment) {
    return (
      <div>
        <StatusBadge status="PENDING" />
        <p className="mt-3 text-white/70">
          Payment required to confirm your ticket (Razorpay checkout — Phase 1). Your registration is held pending payment.
        </p>
      </div>
    );
  }
  return (
    <div className="text-center">
      <StatusBadge status="ISSUED" />
      <p className="mt-3 mb-4 text-white/70">You're in! Show this QR code at the door.</p>
      <div className="inline-block rounded-xl bg-white p-4">
        <QRCodeSVG value={result.ticket.qrToken} size={180} />
      </div>
      <p className="mt-3 text-xs text-white/40">Ticket ID: {result.ticket.id}</p>
    </div>
  );
}
