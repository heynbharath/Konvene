import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const CATEGORY_GRADIENTS: Record<string, string> = {
  WORKSHOP: "from-violet-500 via-fuchsia-500 to-pink-500",
  HACKATHON: "from-indigo-500 via-purple-500 to-pink-500",
  CONFERENCE: "from-blue-500 via-cyan-500 to-teal-400",
  TALK: "from-emerald-500 via-teal-500 to-cyan-400",
  SEMINAR: "from-sky-500 via-blue-500 to-indigo-500",
  SPORTS: "from-orange-500 via-amber-500 to-yellow-400",
  CULTURAL: "from-pink-500 via-rose-500 to-orange-400",
  TECHNICAL: "from-indigo-500 via-blue-500 to-cyan-400",
  MUSIC: "from-purple-500 via-violet-500 to-indigo-400",
  DANCE: "from-fuchsia-500 via-pink-500 to-rose-400",
  FEST: "from-amber-500 via-orange-500 to-red-500",
  BOOTCAMP: "from-teal-500 via-emerald-500 to-lime-400",
  PLACEMENT: "from-slate-500 via-gray-500 to-zinc-400",
  COMPETITION: "from-red-500 via-orange-500 to-amber-400",
};

export function categoryGradient(category: string): string {
  return CATEGORY_GRADIENTS[category] ?? "from-brand via-purple-500 to-fuchsia-500";
}
