"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Calendar, MapPin, Users } from "lucide-react";
import { categoryGradient } from "@/lib/utils";

interface EventCardProps {
  slug: string;
  title: string;
  category: string;
  clubName: string;
  startAt: string;
  venue: string;
  registered: number;
  capacity: number;
  index?: number;
}

export function EventCard({ slug, title, category, clubName, startAt, venue, registered, capacity, index = 0 }: EventCardProps) {
  const full = registered >= capacity;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.06, ease: "easeOut" }}
    >
      <Link
        href={`/events/${slug}`}
        className="glass glass-hover group block overflow-hidden rounded-2xl"
      >
        <div className={`relative h-32 w-full bg-gradient-to-br ${categoryGradient(category)} overflow-hidden`}>
          <div className="absolute inset-0 bg-black/10" />
          <div className="absolute inset-0 opacity-40 mix-blend-overlay bg-grid-pattern bg-grid" />
          <span className="absolute left-4 top-4 rounded-full bg-black/30 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white backdrop-blur-sm">
            {category}
          </span>
          {full && (
            <span className="absolute right-4 top-4 rounded-full bg-black/40 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
              Waitlist
            </span>
          )}
        </div>
        <div className="p-5">
          <h3 className="text-lg font-semibold leading-snug text-white group-hover:text-brand-light transition-colors">
            {title}
          </h3>
          <p className="mt-1 text-sm text-white/45">{clubName}</p>

          <div className="mt-4 space-y-1.5 text-sm text-white/55">
            <div className="flex items-center gap-2">
              <Calendar className="h-3.5 w-3.5 shrink-0" />
              <span>{new Date(startAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{venue}</span>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-white/[0.06] pt-3">
            <div className="flex items-center gap-1.5 text-xs text-white/45">
              <Users className="h-3.5 w-3.5" />
              {registered}/{capacity}
            </div>
            <div className="h-1.5 w-24 overflow-hidden rounded-full bg-white/[0.06]">
              <div
                className={`h-full rounded-full bg-gradient-to-r ${categoryGradient(category)}`}
                style={{ width: `${Math.min((registered / capacity) * 100, 100)}%` }}
              />
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
