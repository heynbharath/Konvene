"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";

interface EventCard {
  id: string;
  title: string;
  slug: string;
  category: string;
  venue: string;
  startAt: string;
  capacity: number;
  club: { name: string; logoUrl?: string };
  ticketTypes: { price: number }[];
  _count: { registrations: number };
}

export default function DiscoverPage() {
  const [events, setEvents] = useState<EventCard[]>([]);
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api<EventCard[]>(`/events${category ? `?category=${category}` : ""}`)
      .then(setEvents)
      .finally(() => setLoading(false));
  }, [category]);

  const categories = [
    "WORKSHOP", "HACKATHON", "CONFERENCE", "TALK", "SEMINAR", "SPORTS", "CULTURAL",
    "TECHNICAL", "MUSIC", "DANCE", "FEST", "BOOTCAMP", "PLACEMENT", "COMPETITION",
  ];

  return (
    <div>
      <section className="mb-10 text-center">
        <h1 className="text-4xl font-extrabold tracking-tight">
          One platform for every event <span className="text-brand">happening on campus</span>
        </h1>
        <p className="mt-3 text-white/60">
          Discover, register, check in, and get verified attendance — all in one place.
        </p>
      </section>

      <div className="mb-6 flex flex-wrap gap-2">
        <button
          onClick={() => setCategory("")}
          className={`rounded-full px-3 py-1 text-sm ${category === "" ? "bg-brand" : "bg-white/10 hover:bg-white/20"}`}
        >
          All
        </button>
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={`rounded-full px-3 py-1 text-sm ${category === c ? "bg-brand" : "bg-white/10 hover:bg-white/20"}`}
          >
            {c}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-white/50">Loading events…</p>
      ) : events.length === 0 ? (
        <p className="text-white/50">No published events yet in this category.</p>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((e) => (
            <Link
              key={e.id}
              href={`/events/${e.slug}`}
              className="group rounded-xl border border-white/10 bg-surfaceAlt p-5 transition hover:border-brand/60"
            >
              <div className="mb-2 text-xs uppercase tracking-wide text-brand">{e.category}</div>
              <h3 className="text-lg font-semibold group-hover:text-brand">{e.title}</h3>
              <p className="mt-1 text-sm text-white/50">{e.club.name}</p>
              <div className="mt-4 flex items-center justify-between text-sm text-white/60">
                <span>{new Date(e.startAt).toLocaleDateString()}</span>
                <span>{e.venue}</span>
              </div>
              <div className="mt-2 text-sm">
                {e._count.registrations}/{e.capacity} registered
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
