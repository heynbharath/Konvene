"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Zap } from "lucide-react";
import Link from "next/link";
import { api } from "@/lib/api";

interface Stats {
  clubs: number;
  publishedEvents: number;
  registrations: number;
  certificates: number;
}

export function Hero() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    api<Stats>("/stats").then(setStats).catch(() => {});
  }, []);

  const statItems = stats
    ? [
        { label: "Clubs live", value: stats.clubs },
        { label: "Events running", value: stats.publishedEvents },
        { label: "Registrations", value: stats.registrations },
        { label: "Certificates issued", value: stats.certificates },
      ]
    : [];

  return (
    <section className="relative isolate mb-16 overflow-hidden">
      {/* Ambient gradient blobs */}
      <div className="pointer-events-none absolute -top-24 left-1/2 h-[420px] w-[720px] -translate-x-1/2 animate-float rounded-full bg-brand/20 blur-[100px]" />
      <div className="pointer-events-none absolute -top-10 right-0 h-[300px] w-[300px] animate-float-delayed rounded-full bg-fuchsia-500/15 blur-[90px]" />

      <div className="relative pt-10 text-center sm:pt-16">
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-1.5 text-xs font-medium text-white/70"
        >
          <Zap className="h-3.5 w-3.5 text-brand-light" fill="currentColor" />
          The operating system for campus communities
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mx-auto max-w-3xl text-4xl font-bold leading-[1.1] tracking-tight sm:text-6xl"
        >
          Every campus event,
          <br />
          <span className="text-gradient">one platform to run it.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mx-auto mt-5 max-w-xl text-balance text-base text-white/55 sm:text-lg"
        >
          Registration, QR check-in, and faculty-verified attendance — replacing WhatsApp, Google Forms,
          and a paper sign-in sheet with something that actually works.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8 flex items-center justify-center gap-3"
        >
          <a href="#events" className="btn-primary flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white">
            Explore events <ArrowRight className="h-4 w-4" />
          </a>
          <Link href="/signup" className="btn-ghost rounded-full px-6 py-3 text-sm font-semibold text-white">
            Create your account
          </Link>
        </motion.div>

        {statItems.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mx-auto mt-14 grid max-w-2xl grid-cols-2 gap-px overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.06] sm:grid-cols-4"
          >
            {statItems.map((s) => (
              <div key={s.label} className="bg-surface/80 px-4 py-5 backdrop-blur">
                <div className="font-display text-2xl font-bold text-white sm:text-3xl">{s.value}</div>
                <div className="mt-1 text-xs text-white/45">{s.label}</div>
              </div>
            ))}
          </motion.div>
        )}
      </div>
    </section>
  );
}
