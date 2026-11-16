"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CollegeCertificate, CertificateData } from "./CollegeCertificate";
import { DsuMunCertificate, DsuMunCertData } from "./DsuMunCertificate";
import { Sparkles, Award } from "lucide-react";

interface Props {
  data: CertificateData | null;
  onClose: () => void;
}

export function CertificateModal({ data, onClose }: Props) {
  const [templateMode, setTemplateMode] = useState<"dsu_mun" | "classic">(
    data?.eventTitle?.toLowerCase().includes("mun") || data?.eventTitle?.toLowerCase().includes("cope")
      ? "dsu_mun"
      : "dsu_mun" // Default to the crazy DSU MUN edition requested by the user!
  );

  if (!data) return null;

  const dsuData: DsuMunCertData = {
    certId: data.certId,
    studentName: data.studentName,
    usn: data.usn || "ENG24CT0058",
    committee: "UNCSW",
    role: "Delegate of Germany",
    portfolio: "General Assembly & Status of Women",
    issuedAt: data.issuedAt,
    verifyUrl: typeof window !== "undefined"
      ? `${window.location.origin}/verify/${data.certId}`
      : `https://konvene.college.edu/verify/${data.certId}`,
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-ink/75 backdrop-blur-sm overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-5xl bg-paper p-4 sm:p-6 border-[2px] border-ink shadow-hard max-h-[94vh] overflow-y-auto space-y-4"
        >
          {/* Template Switcher Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b-[1.5px] border-ink pb-3 print:hidden">
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5 text-signal" />
              <span className="font-display text-lg font-bold italic">
                Official Certificate Viewer & Generator
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-inkSoft uppercase font-semibold">Edition:</span>
              <div className="inline-flex rounded-full border-[1.5px] border-ink bg-paperAlt p-0.5 text-xs">
                <button
                  onClick={() => setTemplateMode("dsu_mun")}
                  className={`flex items-center gap-1.5 rounded-full px-3 py-1 font-bold transition-all ${
                    templateMode === "dsu_mun"
                      ? "bg-ink text-paper shadow-sm"
                      : "text-inkSoft hover:text-ink"
                  }`}
                >
                  <Sparkles className="h-3 w-3 text-acid" /> DSU MUN COPE 3 Edition
                </button>
                <button
                  onClick={() => setTemplateMode("classic")}
                  className={`flex items-center gap-1.5 rounded-full px-3 py-1 font-bold transition-all ${
                    templateMode === "classic"
                      ? "bg-ink text-paper shadow-sm"
                      : "text-inkSoft hover:text-ink"
                  }`}
                >
                  🏛️ Classic University Seal
                </button>
              </div>

              <button
                onClick={onClose}
                className="ml-3 text-xs font-mono font-bold uppercase text-inkSoft hover:text-ink"
              >
                Close ✕
              </button>
            </div>
          </div>

          {templateMode === "dsu_mun" ? (
            <DsuMunCertificate data={dsuData} onClose={onClose} allowCustomize={true} />
          ) : (
            <CollegeCertificate data={data} onClose={onClose} />
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
