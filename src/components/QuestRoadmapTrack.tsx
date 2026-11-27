"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import {
  FolderGit2,
  BookOpen,
  Sparkles,
  Trophy,
  CheckCircle2,
  ArrowRight,
  PartyPopper,
  RefreshCw,
} from "lucide-react";

export interface StudyMaterialSummary {
  id: number;
  title: string;
  sourceType: string;
  totalChunks: number;
  currentChunkIndex: number;
  charCount: number;
  isActive: boolean;
}

interface QuestRoadmapTrackProps {
  repoCount: number;
  allowedCount: number;
  protectedCount: number;
  activeMaterial: StudyMaterialSummary | null;
  activeMaterialsCount: number;
  suggestionCount: number;
  executedToday: boolean;
  todayKey: string;
  streak: number;
  selectedStage?: NodeId;
  onSelectStage?: (stage: NodeId) => void;
  onQuickSync: () => void;
  onQuickGenerate: () => void;
}

type NodeId = "01" | "02" | "03" | "04";

export function QuestRoadmapTrack({
  repoCount,
  allowedCount,
  protectedCount,
  activeMaterial,
  activeMaterialsCount,
  suggestionCount,
  executedToday,
  todayKey,
  streak,
  selectedStage,
  onSelectStage,
  onQuickSync,
  onQuickGenerate,
}: QuestRoadmapTrackProps) {
  const [internalNode, setInternalNode] = useState<NodeId>(executedToday ? "04" : "03");
  const selectedNode = selectedStage ?? internalNode;
  const setSelectedNode = useCallback(
    (next: NodeId) => {
      setInternalNode(next);
      onSelectStage?.(next);
    },
    [onSelectStage],
  );
  const hasCelebratedRef = useRef(false);

  const fireConfetti = useCallback(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const colors = ["#FFD23F", "#FF6B6B", "#74B9FF", "#88D498", "#B8A9FA", "#000000"];
    void confetti({
      particleCount: 55,
      spread: 70,
      origin: { y: 0.55 },
      colors,
    });
  }, []);

  useEffect(() => {
    if (executedToday && !hasCelebratedRef.current) {
      hasCelebratedRef.current = true;
      setSelectedNode("04");
      fireConfetti();
    }
  }, [executedToday, fireConfetti]);

  const materialChunkLabel = activeMaterial
    ? `Bab ${(activeMaterial.currentChunkIndex % Math.max(activeMaterial.totalChunks, 1)) + 1}/${activeMaterial.totalChunks}`
    : "Belum aktif";

  const nodes: Array<{
    id: NodeId;
    title: string;
    shortMetric: string;
    detailTitle: string;
    detailBody: string;
    completed: boolean;
    neon?: boolean;
    icon: typeof FolderGit2;
    bg: string;
  }> = [
    {
      id: "01",
      title: "Sync Repo",
      shortMetric: `${repoCount} repo`,
      detailTitle: `${repoCount} Repository @ArdanR3 Tersinkronisasi`,
      detailBody: `${allowedCount} repository siap diberi kontribusi AI dan ${protectedCount} repository dilindungi Guard (termasuk repo Private permanen).`,
      completed: repoCount > 0,
      icon: FolderGit2,
      bg: "bg-[#74B9FF]",
    },
    {
      id: "02",
      title: "Study Material",
      shortMetric: activeMaterial ? materialChunkLabel : "0 aktif",
      detailTitle: activeMaterial
        ? `${activeMaterial.title} (${materialChunkLabel})`
        : "Belum Ada Materi Belajar Aktif",
      detailBody: activeMaterial
        ? `${activeMaterialsCount} materi aktif di Knowledge Base (${activeMaterial.sourceType}). Setiap Generate Suggestions otomatis memajukan 1 chunk.`
        : "Tambahkan PDF, Markdown, atau kode ke halaman Materials agar AI merancang quest dari bahan belajarmu.",
      completed: Boolean(activeMaterial),
      icon: BookOpen,
      bg: "bg-[#B8A9FA]",
    },
    {
      id: "03",
      title: "Daily Quests",
      shortMetric: `${suggestionCount} opsi`,
      detailTitle: `${suggestionCount} Saran Misi AI Hari Ini`,
      detailBody:
        suggestionCount > 0
          ? "Review diff kode di kartu bawah, edit bila perlu, lalu tekan Approve & Push pada 1 misi terbaik."
          : "Klik Generate Suggestions untuk memunculkan pilihan misi harian dari AI.",
      completed: suggestionCount > 0 || executedToday,
      icon: Sparkles,
      bg: "bg-[#FFD23F]",
    },
    {
      id: "04",
      title: "Daily Commit",
      shortMetric: executedToday ? "DONE!" : "0/1 push",
      detailTitle: executedToday
        ? `Quest ${todayKey} Selesai · Streak ${streak} Hari!`
        : "Menunggu 1x Commit Harian",
      detailBody: executedToday
        ? "Kontribusi harian ke @ArdanR3 sudah tercatat sukses! Klik node ini kapan saja untuk merayakan dengan confetti."
        : "Pilih 1 Featured Quest di bawah dan klik Approve & Push untuk menyelesaikan target hari ini.",
      completed: executedToday,
      neon: executedToday,
      icon: Trophy,
      bg: executedToday ? "bg-[#88D498]" : "bg-[#FFA552]",
    },
  ];

  const activeDetail = nodes.find((n) => n.id === selectedNode) || nodes[0];

  return (
    <section
      aria-label="Quest Roadmap Track harian"
      className="nb-card p-5 sm:p-6"
    >
      {/* Header Row */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-2 border-b-3 border-black pb-3.5">
        <div>
          <span className="inline-block border-2 border-black bg-[#FFD23F] px-2.5 py-0.5 font-mono text-[11px] font-extrabold uppercase tracking-wider text-black">
            QUEST BOARD · 4 STAGES
          </span>
          <h2 className="font-display mt-1.5 text-xl font-extrabold uppercase tracking-tight text-black">
            Daily GitHub Quest Track
          </h2>
        </div>

        {executedToday && (
          <button
            type="button"
            onClick={fireConfetti}
            className="nb-btn-sm inline-flex min-h-[44px] cursor-pointer items-center gap-1.5 bg-[#88D498] px-3 py-1.5 font-mono text-xs font-extrabold uppercase text-black sm:min-h-[34px]"
          >
            <PartyPopper className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Celebrate!</span>
          </button>
        )}
      </div>

      {/* Desktop Winding Neo-Brutalist Board Track */}
      <div className="relative hidden md:block">
        <div className="relative mx-auto h-[230px] w-full max-w-5xl bg-[#F5F0E8] border-2 border-black">
          <svg
            viewBox="0 0 1000 220"
            fill="none"
            preserveAspectRatio="none"
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 h-full w-full"
          >
            {/* Hard Black Offset Shadow under Track */}
            <path
              d="M 95 148 C 190 148, 210 58, 365 58 C 520 58, 495 162, 635 162 C 775 162, 795 72, 905 72"
              stroke="#000000"
              strokeWidth="44"
              strokeLinecap="square"
              transform="translate(5, 5)"
            />
            {/* Black Outline */}
            <path
              d="M 95 148 C 190 148, 210 58, 365 58 C 520 58, 495 162, 635 162 C 775 162, 795 72, 905 72"
              stroke="#000000"
              strokeWidth="42"
              strokeLinecap="square"
            />
            {/* Cream/White Paper Board Lane */}
            <path
              d="M 95 148 C 190 148, 210 58, 365 58 C 520 58, 495 162, 635 162 C 775 162, 795 72, 905 72"
              stroke="#FFFDF5"
              strokeWidth="34"
              strokeLinecap="square"
            />
            {/* Board-game tile ticks */}
            <path
              d="M 95 148 C 190 148, 210 58, 365 58 C 520 58, 495 162, 635 162 C 775 162, 795 72, 905 72"
              stroke="#000000"
              strokeOpacity="0.22"
              strokeWidth="30"
              strokeDasharray="2 36"
            />
            {/* Center Guide Line */}
            <path
              d="M 95 148 C 190 148, 210 58, 365 58 C 520 58, 495 162, 635 162 C 775 162, 795 72, 905 72"
              stroke={executedToday ? "#16A34A" : "#000000"}
              strokeWidth="4"
              strokeDasharray="10 10"
            />
            {/* START Stamp */}
            <g transform="translate(18, 134)">
              <rect width="56" height="26" fill="#FFD23F" stroke="#000000" strokeWidth="3" />
              <text
                x="28"
                y="17"
                textAnchor="middle"
                fill="#000000"
                fontSize="10"
                fontWeight="900"
                fontFamily="monospace"
              >
                START
              </text>
            </g>
            {/* GOAL Stamp */}
            <g transform="translate(920, 58)">
              <rect
                width="62"
                height="26"
                fill={executedToday ? "#88D498" : "#FF6B6B"}
                stroke="#000000"
                strokeWidth="3"
              />
              <text
                x="31"
                y="17"
                textAnchor="middle"
                fill="#000000"
                fontSize="10"
                fontWeight="900"
                fontFamily="monospace"
              >
                {executedToday ? "DONE!" : "GOAL"}
              </text>
            </g>
          </svg>

          {(
            [
              { node: nodes[0], left: "12%", top: "67%" },
              { node: nodes[1], left: "37%", top: "27%" },
              { node: nodes[2], left: "63%", top: "73%" },
              { node: nodes[3], left: "88%", top: "33%" },
            ] as const
          ).map(({ node, left, top }) => {
            const Icon = node.icon;
            const isSelected = selectedNode === node.id;

            return (
              <motion.button
                key={node.id}
                type="button"
                style={{ left, top }}
                onMouseEnter={() => setSelectedNode(node.id)}
                onClick={() => {
                  setSelectedNode(node.id);
                  if (node.id === "04" && executedToday) fireConfetti();
                }}
                whileHover={{ y: -4 }}
                whileTap={{ y: 2 }}
                aria-pressed={isSelected}
                className="group absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer focus:outline-none"
              >
                <div className="relative flex flex-col items-center">
                  {/* Sharp Square/Block Token */}
                  <div
                    className={`relative flex h-14 w-14 flex-col items-center justify-center border-3 border-black text-black ${
                      isSelected
                        ? `${node.bg} shadow-[5px_5px_0_0_#000]`
                        : "bg-white shadow-[4px_4px_0_0_#000] group-hover:bg-[#FFF3C4]"
                    }`}
                  >
                    <span className="font-mono text-[10px] font-black leading-none">{node.id}</span>
                    <Icon className="mt-0.5 h-5 w-5" aria-hidden="true" />
                    {node.completed && (
                      <span
                        aria-hidden="true"
                        className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center border-2 border-black bg-[#88D498] text-black"
                      >
                        <CheckCircle2 className="h-3 w-3" />
                      </span>
                    )}
                  </div>

                  {/* Crisp Label Tag */}
                  <div
                    className={`mt-2 whitespace-nowrap border-2 border-black px-2 py-0.5 text-center shadow-[3px_3px_0_0_#000] ${
                      isSelected ? "bg-black text-[#FFD23F]" : "bg-white text-black"
                    }`}
                  >
                    <div className="text-[11px] font-extrabold uppercase leading-tight">{node.title}</div>
                    <div className="font-mono text-[10px] font-bold">{node.shortMetric}</div>
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Mobile Responsive Brutalist Stack */}
      <div className="space-y-3 md:hidden">
        {nodes.map((node) => {
          const Icon = node.icon;
          const isSelected = selectedNode === node.id;

          return (
            <button
              key={node.id}
              type="button"
              onClick={() => {
                setSelectedNode(node.id);
                if (node.id === "04" && executedToday) fireConfetti();
              }}
              className={`flex w-full cursor-pointer items-center gap-3.5 border-3 border-black p-3 text-left shadow-[4px_4px_0_0_#000] ${
                isSelected ? node.bg : "bg-white"
              }`}
            >
              <div className="flex h-11 w-11 shrink-0 flex-col items-center justify-center border-2 border-black bg-white font-mono font-black text-black">
                <span className="text-[9px] leading-none">{node.id}</span>
                <Icon className="h-4 w-4" aria-hidden="true" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-extrabold uppercase text-black">{node.title}</span>
                  <span className="border-2 border-black bg-black px-2 py-0.5 font-mono text-[10px] font-bold text-[#FFD23F]">
                    {node.shortMetric}
                  </span>
                </div>
                <p className="mt-0.5 truncate text-xs font-medium text-black/80">{node.detailTitle}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Interactive Stage Detail Box */}
      <div className="mt-5 border-3 border-black bg-[#FFF3C4] p-4 shadow-[4px_4px_0_0_#000]">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={activeDetail.id}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.16, ease: [0.23, 1, 0.32, 1] }}
            className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="border-2 border-black bg-black px-2 py-0.5 font-mono text-[11px] font-extrabold text-[#FFD23F]">
                  STAGE {activeDetail.id}
                </span>
                <h3 className="text-sm font-extrabold uppercase text-black">{activeDetail.detailTitle}</h3>
              </div>
              <p className="mt-1.5 text-xs font-medium leading-relaxed text-black/85">
                {activeDetail.detailBody}
              </p>
            </div>

            <div className="shrink-0">
              {activeDetail.id === "01" && (
                <button
                  type="button"
                  onClick={onQuickSync}
                  className="nb-btn-sm inline-flex min-h-[44px] cursor-pointer items-center gap-1.5 bg-[#74B9FF] px-3.5 py-2 text-xs font-extrabold uppercase text-black sm:min-h-[36px]"
                >
                  <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                  Sync Sekarang
                </button>
              )}
              {activeDetail.id === "02" && (
                <Link
                  href="/materials"
                  className="nb-btn-sm inline-flex min-h-[44px] cursor-pointer items-center gap-1.5 bg-[#B8A9FA] px-3.5 py-2 text-xs font-extrabold uppercase text-black sm:min-h-[36px]"
                >
                  Kelola Materials
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </Link>
              )}
              {activeDetail.id === "03" && !executedToday && (
                <button
                  type="button"
                  onClick={onQuickGenerate}
                  className="nb-btn-sm inline-flex min-h-[44px] cursor-pointer items-center gap-1.5 bg-[#FFD23F] px-3.5 py-2 text-xs font-extrabold uppercase text-black sm:min-h-[36px]"
                >
                  <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                  Generate Quest
                </button>
              )}
              {activeDetail.id === "04" && executedToday && (
                <button
                  type="button"
                  onClick={fireConfetti}
                  className="nb-btn-sm inline-flex min-h-[44px] cursor-pointer items-center gap-1.5 bg-[#88D498] px-3.5 py-2 text-xs font-extrabold uppercase text-black sm:min-h-[36px]"
                >
                  <PartyPopper className="h-3.5 w-3.5" aria-hidden="true" />
                  Pop Confetti
                </button>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
