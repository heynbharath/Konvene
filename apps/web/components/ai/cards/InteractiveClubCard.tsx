"use client";

import Link from "next/link";
import { Users, ArrowRight } from "lucide-react";

interface ClubItem {
  name: string;
  slug: string;
  facultyAdvisor?: string;
  description?: string;
}

export function InteractiveClubCard({ clubs }: { clubs: ClubItem[] }) {
  return (
    <div className="my-2.5 space-y-2">
      <div className="font-mono text-xs font-bold uppercase tracking-wider text-inkSoft">
        Active Campus Clubs
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {clubs.map((club, idx) => (
          <div
            key={idx}
            className="flex flex-col justify-between rounded-md border-2 border-ink bg-paperAlt p-3 shadow-hard-sm"
          >
            <div>
              <div className="flex items-center gap-1.5 font-display text-sm font-bold text-ink">
                <Users className="h-3.5 w-3.5 text-signal" />
                <span>{club.name}</span>
              </div>
              {club.facultyAdvisor && (
                <div className="mt-1 font-mono text-[10px] text-inkSoft">
                  Advisor: {club.facultyAdvisor}
                </div>
              )}
              {club.description && (
                <p className="mt-1 font-sans text-xs text-inkSoft line-clamp-2">
                  {club.description}
                </p>
              )}
            </div>
            <Link
              href={`/events?club=${club.slug}`}
              className="mt-2.5 inline-flex items-center gap-1 font-mono text-xs font-bold text-signal hover:underline"
            >
              <span>View Club Events</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}

