"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Users, GraduationCap, Calendar, Sparkles, Building, ArrowRight } from "lucide-react";
import { api } from "@/lib/api";

interface Club {
  id: string;
  name: string;
  slug: string;
  department: string;
  facultyAdvisor: string;
  headName: string;
  description: string;
  memberCount: number;
  eventsCount: number;
}

export default function ClubsPage() {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<Club[]>("/clubs")
      .then((data) => {
        if (Array.isArray(data)) setClubs(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-6xl space-y-10">
      {/* College Clubs Banner */}
      <div className="border-[2px] border-ink bg-[#15130F] text-paper p-6 sm:p-8 shadow-hard relative overflow-hidden">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 bg-[#26231C] border border-[#8C6D3B] px-3.5 py-1 rounded-full text-xs font-mono uppercase tracking-widest text-acid font-bold mb-3">
            <Building className="h-4 w-4" /> Campus Student Affairs & Societies
          </div>
          <h1 className="font-display text-3xl sm:text-5xl font-extrabold tracking-tight text-white">
            Clubs & Department Societies
          </h1>
          <p className="mt-2 text-sm sm:text-base text-paper/80 max-w-2xl">
            Official student chapters, technical guilds, and cultural forums of the institution. Each club operates under a designated Faculty Advisor and organizes accredited campus symposia.
          </p>
        </div>
      </div>

      {/* Clubs Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {clubs.map((c) => (
          <div
            key={c.id}
            className="card p-6 bg-paper border-[1.5px] border-ink flex flex-col justify-between hover:shadow-hard transition-all"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-inkSoft bg-paperAlt px-2.5 py-1 rounded border border-ink/20">
                  {c.department}
                </span>
                <span className="flex items-center gap-1 font-mono text-xs text-moss font-semibold">
                  <Users className="h-3 w-3" /> {c.memberCount} members
                </span>
              </div>

              <h2 className="font-display text-xl font-bold text-ink leading-snug">{c.name}</h2>
              <p className="mt-2 text-xs text-inkSoft leading-relaxed line-clamp-3">
                {c.description}
              </p>

              <div className="mt-4 pt-4 border-t border-dashed border-ink/20 space-y-1.5 text-xs font-mono">
                <p className="text-inkSoft">
                  Faculty Advisor: <strong className="text-ink">{c.facultyAdvisor}</strong>
                </p>
                <p className="text-inkSoft">
                  Club Head: <strong className="text-ink">{c.headName}</strong>
                </p>
              </div>
            </div>

            <div className="mt-6 pt-3 border-t border-ink/20 flex items-center justify-between">
              <span className="font-mono text-xs text-inkSoft">
                {c.eventsCount} events running
              </span>
              <Link
                href={`/club/${c.slug}/dashboard`}
                className="btn-outline flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold uppercase tracking-wide hover:bg-paperAlt"
              >
                Dashboard <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
