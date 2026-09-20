"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Hero } from "@/components/Hero";
import { EventCard } from "@/components/EventCard";
import { Search } from "lucide-react";

interface EventCardData {
  id: string;
  title: string;
  slug: string;
  category: string;
  venue: string;
  startAt: string;
  capacity: number;
  club: { name: string; logoUrl?: string };
  _count: { registrations: number };
}

const CATEGORIES = [
  "WORKSHOP", "HACKATHON", "CONFERENCE", "TALK", "SEMINAR", "SPORTS", "CULTURAL",
  "TECHNICAL", "MUSIC", "DANCE", "FEST", "BOOTCAMP", "PLACEMENT", "COMPETITION",
];

export default function DiscoverPage() {
  const [events, setEvents] = useState<EventCardData[]>([]);
  const [category, setCategory] = useState("");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    if (query) params.set("q", query);
    api<EventCardData[]>(`/events${params.toString() ? `?${params}` : ""}`)
      .then(setEvents)
      .finally(() => setLoading(false));
  }, [category, query]);

  return (
    <div>
      <Hero />

      <section id="events" className="scroll-mt-24">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="font-display text-2xl font-bold">Happening now</h2>
          <div className="relative w-full sm:w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search events…"
              className="w-full rounded-full border border-white/10 bg-white/[0.03] py-2 pl-9 pr-4 text-sm outline-none transition-colors focus:border-brand/50"
            />
          </div>
        </div>

        <div className="mb-8 flex flex-wrap gap-2">
          <button
            onClick={() => setCategory("")}
            className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
              category === "" ? "bg-white text-black" : "border border-white/10 bg-white/[0.03] text-white/60 hover:text-white"
            }`}
          >
            All
          </button>
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
                category === c ? "bg-white text-black" : "border border-white/10 bg-white/[0.03] text-white/60 hover:text-white"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-72 animate-pulse rounded-2xl border border-white/[0.06] bg-white/[0.02]" />
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 py-20 text-center text-white/40">
            No published events match yet — check back soon.
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((e, i) => (
              <EventCard
                key={e.id}
                slug={e.slug}
                title={e.title}
                category={e.category}
                clubName={e.club.name}
                startAt={e.startAt}
                venue={e.venue}
                registered={e._count.registrations}
                capacity={e.capacity}
                index={i}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
