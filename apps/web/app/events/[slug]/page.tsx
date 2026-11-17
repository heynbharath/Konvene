"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import confetti from "canvas-confetti";
import { Calendar, Clock, MapPin, Users, CheckCircle2, Award, ExternalLink, Phone, Mail, Sparkles } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { StatusBadge } from "@/components/StatusBadge";
import { categoryStyle } from "@/lib/utils";
import { CertificateModal } from "@/components/CertificateModal";
import { CertificateData } from "@/components/CollegeCertificate";

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
  slug?: string;
  description: string;
  category: string;
  venue: string;
  startAt: string;
  endAt: string;
  capacity: number;
  club: { name: string; slug: string };
  ticketTypes: { id: string; name: string; capacity: number }[];
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
  const [certPreview, setCertPreview] = useState<CertificateData | null>(null);

  useEffect(() => {
    api<EventDetail>(`/events/${slug}`).then((e) => {
      setEvent(e);
      setTicketTypeId(e.ticketTypes[0]?.id ?? "");
    });
  }, [slug]);

  if (!event) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <div className="h-48 animate-pulse border-[1.5px] border-ink bg-paperAlt" />
        <div className="h-8 w-2/3 animate-pulse bg-paperAlt" />
      </div>
    );
  }

  const fields: FormField[] = event.form ? JSON.parse(event.form.schemaJson) : [];
  const spotsLeft = event.capacity - event._count.registrations;
  const { bg } = categoryStyle(event.category);

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
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative mb-8 overflow-hidden border-[1.5px] border-ink p-8"
        style={{ backgroundColor: bg }}
      >
        <div className="absolute inset-0 bg-dot-grid bg-dots opacity-20 mix-blend-overlay" />
        <div className="relative">
          <span className="rounded-full border-[1.5px] border-ink bg-paper px-3 py-1 font-mono text-xs font-bold uppercase tracking-wider text-ink">
            {event.category}
          </span>
          <h1 className="mt-4 font-display text-3xl font-semibold text-paper sm:text-4xl">{event.title}</h1>
          <p className="mt-1 italic text-paper/80">by {event.club.name}</p>
        </div>
      </motion.div>

      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { icon: Calendar, label: "Starts", value: new Date(event.startAt).toLocaleDateString(undefined, { month: "short", day: "numeric" }) },
          { icon: Clock, label: "Time", value: new Date(event.startAt).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" }) },
          { icon: MapPin, label: "Venue", value: event.venue },
          { icon: Users, label: "Spots left", value: Math.max(spotsLeft, 0).toString() },
        ].map((item) => (
          <div key={item.label} className="card-alt border-[1.5px] p-4">
            <item.icon className="mb-2 h-4 w-4 text-signal" />
            <div className="font-mono text-[10px] uppercase tracking-wide text-inkSoft">{item.label}</div>
            <div className="truncate text-sm font-semibold">{item.value}</div>
          </div>
        ))}
      </div>

      {event.slug === "dsu-mun-cope-3" && (
        <div className="mb-8 border-[2px] border-ink bg-[#15130F] text-paper p-6 shadow-hard space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-paper/20 pb-3.5">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] text-acid uppercase font-bold tracking-widest">
                  DSU COPE MUN III · "A Pass at the Infinite"
                </span>
                <span className="text-paper/40">·</span>
                <span className="font-mono text-[10px] text-paper/70">DSU Intra MUN 2026</span>
              </div>
              <h3 className="font-display text-2xl font-bold text-white mt-0.5">
                Flagship Model United Nations Committees
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="bg-acid text-ink font-mono text-xs font-bold px-3 py-1 rounded-full uppercase shadow-sm">
                Prize Pool: ₹18,000+
              </span>
              <button
                type="button"
                onClick={() => {
                  const isStaffOrDean = Boolean(
                    user?.roles?.some((r: any) => r.role === 'ADMIN' || r.role === 'FACULTY') ||
                    user?.name?.includes('Dean') ||
                    user?.name?.includes('Dr.')
                  );
                  const studentRecipient = !user || isStaffOrDean ? "Sunaina Mohapatra" : user.name;
                  const studentUsn = !user || isStaffOrDean ? "ENG24CT0058" : (user.usn || "ENG24CT0058");
                  setCertPreview({
                    certId: "CERT-COPE3-DSU01",
                    studentName: studentRecipient,
                    usn: studentUsn,
                    department: "School of Engineering, Dayananda Sagar University",
                    section: "UNCSW · Delegate of Germany",
                    eventTitle: "Dayananda Sagar University Model United Nations COPE 3",
                    clubName: "DSU MUNSoc",
                    eventDate: "October 23 – 24, 2026",
                    venue: "Dayananda Sagar University (DSU Campus), Bengaluru",
                    subjectCode: "HU301",
                    subjectName: "Professional Communication & Governance",
                    facultyName: "Dr. Seema Tharannum & Dr. Sai Prasad",
                  });
                }}
                className="btn-signal rounded-full px-3.5 py-1 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5"
              >
                <Sparkles className="h-3 w-3" /> Preview Certificate
              </button>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 text-xs font-mono">
            <div className="bg-[#24211A] border border-paper/20 p-3.5 rounded hover:border-acid/60 transition-colors">
              <div className="flex items-center justify-between mb-1">
                <span className="text-acid font-bold">1. AIPPM</span>
                <span className="text-[10px] bg-paper/10 text-paper px-2 py-0.5 rounded">Single Delegate</span>
              </div>
              <p className="text-paper font-semibold text-xs">All India Political Parties Meet</p>
              <p className="text-paper/70 text-[11px] mt-1 font-sans leading-relaxed">
                Agenda: One Nation, One Election: Ensuring Timely & Inclusive Elections, with Special Emphasis on Electoral-Roll Management and Administrative Reforms.
              </p>
            </div>

            <div className="bg-[#24211A] border border-paper/20 p-3.5 rounded hover:border-acid/60 transition-colors">
              <div className="flex items-center justify-between mb-1">
                <span className="text-acid font-bold">2. UNCSW</span>
                <span className="text-[10px] bg-paper/10 text-paper px-2 py-0.5 rounded">Single Delegate</span>
              </div>
              <p className="text-paper font-semibold text-xs">Commission on the Status of Women</p>
              <p className="text-paper/70 text-[11px] mt-1 font-sans leading-relaxed">
                Agenda: Empowerment of Women through Improvements in Gender Equality and Economic Independence.
              </p>
            </div>

            <div className="bg-[#24211A] border border-paper/20 p-3.5 rounded hover:border-acid/60 transition-colors">
              <div className="flex items-center justify-between mb-1">
                <span className="text-acid font-bold">3. UNODC</span>
                <span className="text-[10px] bg-acid text-ink font-bold px-2 py-0.5 rounded">Double Delegate</span>
              </div>
              <p className="text-paper font-semibold text-xs">Office on Drugs and Crime</p>
              <p className="text-paper/70 text-[11px] mt-1 font-sans leading-relaxed">
                Agenda: Preventing human and drug trafficking through international cross-border cooperation.
              </p>
            </div>

            <div className="bg-[#24211A] border border-paper/20 p-3.5 rounded hover:border-acid/60 transition-colors">
              <div className="flex items-center justify-between mb-1">
                <span className="text-acid font-bold">4. IPC</span>
                <span className="text-[10px] bg-paper/10 text-paper px-2 py-0.5 rounded">Press Corps</span>
              </div>
              <p className="text-paper font-semibold text-xs">International Press Corps</p>
              <p className="text-paper/70 text-[11px] mt-1 font-sans leading-relaxed">
                Mandate: Report, conduct live press conferences, and question delegates across all committees.
              </p>
            </div>
          </div>

          {/* Quick External Links */}
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <a
              href="https://docs.google.com/spreadsheets/d/1s6RuSa6RZkvZpHEFHXY0pAVZaMvS3TR23hRsWK1NEAY/edit?usp=drivesdk"
              target="_blank"
              rel="noreferrer"
              className="btn-outline border-paper/40 text-paper hover:bg-paper/10 text-xs font-mono uppercase px-3 py-1.5 rounded flex items-center gap-1.5"
            >
              <ExternalLink className="h-3.5 w-3.5 text-acid" /> View Live Country Portfolio Matrix
            </a>
            <a
              href="https://docs.google.com/forms/d/e/1FAIpQLSeLck_D2M8_dn_pv1fMxjKPZ4hm-fCqzOpyMCIhU5qAticMpw/viewform"
              target="_blank"
              rel="noreferrer"
              className="btn-outline border-paper/40 text-paper hover:bg-paper/10 text-xs font-mono uppercase px-3 py-1.5 rounded flex items-center gap-1.5"
            >
              <ExternalLink className="h-3.5 w-3.5 text-acid" /> Official DSU MUN Form Portal
            </a>
          </div>

          {/* Secretariat Contact Helpline */}
          <div className="pt-3 border-t border-paper/10 text-xs font-mono text-paper/70">
            <p className="text-acid font-bold uppercase text-[10px] mb-1.5">DSU COPE MUN III Secretariat Helpline:</p>
            <div className="flex flex-wrap gap-4 text-[11px]">
              <span className="flex items-center gap-1">
                <Phone className="h-3 w-3 text-acid" /> Aditiya Bidappa (SG): <strong className="text-white">+91 86182 20160</strong>
              </span>
              <span className="flex items-center gap-1">
                <Phone className="h-3 w-3 text-acid" /> Lakshmi Shree (Chief Advisor): <strong className="text-white">+91 74063 32416</strong>
              </span>
              <span className="flex items-center gap-1">
                <Phone className="h-3 w-3 text-acid" /> K Suchith (Delegate Affairs): <strong className="text-white">+91 73493 95902</strong>
              </span>
              <span className="flex items-center gap-1">
                <Mail className="h-3 w-3 text-acid" /> <strong className="text-white">dsumunsoc@gmail.com</strong>
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="mb-8 border-[1.5px] border-[#8C6D3B] bg-[#FFFBEB] p-4 rounded text-xs text-[#78350F]">
        <p className="font-bold font-mono uppercase tracking-wider flex items-center gap-1.5 text-sm mb-1">
          🎓 Department Academic Attendance Notice
        </p>
        <p className="leading-relaxed">
          Gate check-in at this event is officially accredited for <strong>{event.slug === "dsu-mun-cope-3" ? "HU301: Professional Communication & Governance" : "CS301: Compiler Design (Dr. Rao)"}</strong>. Upon scanning your HMAC pass at the door, lecture attendance credit is automatically updated on your live attendance register.
        </p>
      </div>

      <p className="mb-10 whitespace-pre-wrap text-base leading-relaxed text-inkSoft">{event.description}</p>

      <div className="card p-6 sm:p-8">
        {result ? (
          <RegistrationResult result={result} />
        ) : (
          <>
            <h2 className="mb-5 font-display text-2xl font-semibold italic">Register for this event</h2>
            <label className="mb-1.5 block font-mono text-[11px] font-semibold uppercase tracking-wide text-inkSoft">Ticket type</label>
            <select
              value={ticketTypeId}
              onChange={(e) => setTicketTypeId(e.target.value)}
              className="mb-5 w-full border-[1.5px] border-ink bg-paper px-3.5 py-2.5 text-sm outline-none focus:bg-paperAlt"
            >
              {event.ticketTypes.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>

            {fields.map((f) => (
              <div key={f.key} className="mb-5">
                <label className="mb-1.5 block font-mono text-[11px] font-semibold uppercase tracking-wide text-inkSoft">
                  {f.label}{f.required && " *"}
                </label>
                {f.type === "select" ? (
                  <select
                    required={f.required}
                    onChange={(e) => setFormValues((v) => ({ ...v, [f.key]: e.target.value }))}
                    className="w-full border-[1.5px] border-ink bg-paper px-3.5 py-2.5 text-sm outline-none focus:bg-paperAlt"
                  >
                    <option value="">Select…</option>
                    {f.options?.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                ) : f.type === "textarea" ? (
                  <textarea
                    required={f.required}
                    onChange={(e) => setFormValues((v) => ({ ...v, [f.key]: e.target.value }))}
                    className="w-full border-[1.5px] border-ink bg-paper px-3.5 py-2.5 text-sm outline-none focus:bg-paperAlt"
                  />
                ) : (
                  <input
                    required={f.required}
                    onChange={(e) => setFormValues((v) => ({ ...v, [f.key]: e.target.value }))}
                    className="w-full border-[1.5px] border-ink bg-paper px-3.5 py-2.5 text-sm outline-none focus:bg-paperAlt"
                  />
                )}
              </div>
            ))}

            {error && <p className="mb-3 text-sm font-medium text-berry">{error}</p>}
            <button
              onClick={register}
              disabled={busy || !user}
              className="btn-signal w-full py-3.5 text-sm font-bold uppercase tracking-wide disabled:opacity-50"
            >
              {!user ? "Log in to register" : busy ? "Registering…" : spotsLeft <= 0 ? "Join waitlist" : "Register now"}
            </button>
          </>
        )}
      </div>

      <CertificateModal data={certPreview} onClose={() => setCertPreview(null)} />
    </div>
  );
}

function RegistrationResult({ result }: { result: any }) {
  useEffect(() => {
    if (result.waitlisted) return;
    confetti({
      particleCount: 90,
      spread: 70,
      origin: { y: 0.6 },
      colors: ["#FF4A1F", "#1F32E0", "#D6FF3F", "#15130F"],
      shapes: ["square"],
      scalar: 0.9,
    });
  }, [result]);

  if (result.waitlisted) {
    return (
      <div>
        <StatusBadge status="WAITLISTED" />
        <p className="mt-3 text-inkSoft">
          This event is at capacity — you're on the waitlist and will be promoted automatically if a spot opens up.
        </p>
      </div>
    );
  }
  return (
    <div className="text-center">
      <div className="mb-3 flex justify-center">
        <CheckCircle2 className="h-10 w-10 text-moss" />
      </div>
      <p className="mb-5 font-display text-lg font-semibold italic">You're in! Show this QR code at the door.</p>
      <div className="mx-auto inline-block border-[1.5px] border-ink bg-paper p-5">
        <QRCodeSVG value={result.ticket.qrToken} size={180} />
      </div>
      <p className="mt-3 font-mono text-xs text-inkSoft">Ticket ID: {result.ticket.id}</p>
    </div>
  );
}
