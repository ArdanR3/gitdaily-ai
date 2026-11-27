"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Layers, BookOpen, ScanLine, Cpu, Sparkles } from "lucide-react";

export type ChunkerStageId = "01" | "02" | "03";

export interface KnowledgeChunkerTelemetry {
  activeMaterialsCount: number;
  totalMaterialsCount: number;
  totalChunks: number;
  totalChars: number;
  extracting: boolean;
  primaryMaterial: {
    title: string;
    sourceType: string;
    currentChunkIndex: number;
    totalChunks: number;
  } | null;
}

interface KnowledgeChunkerFigureProps {
  telemetry: KnowledgeChunkerTelemetry;
}

const COS30 = 0.8660254;
const SIN30 = 0.5;

function isoAt(ox: number, oy: number, x: number, y: number, z: number): [number, number] {
  const sx = ox + (x - y) * COS30;
  const sy = oy + (x + y) * SIN30 - z;
  return [Math.round(sx * 10) / 10, Math.round(sy * 10) / 10];
}

function ptsAt(ox: number, oy: number, list: Array<[number, number, number]>): string {
  return list.map(([x, y, z]) => isoAt(ox, oy, x, y, z).join(",")).join(" ");
}

function IsoBox({
  ox,
  oy,
  x,
  y,
  z,
  w,
  d,
  h,
  topFill,
  rightFill,
  leftFill,
  stroke = "#111111",
  strokeWidth = 1.75,
}: {
  ox: number;
  oy: number;
  x: number;
  y: number;
  z: number;
  w: number;
  d: number;
  h: number;
  topFill: string;
  rightFill: string;
  leftFill: string;
  stroke?: string;
  strokeWidth?: number;
}) {
  const top = ptsAt(ox, oy, [
    [x, y, z + h],
    [x + w, y, z + h],
    [x + w, y + d, z + h],
    [x, y + d, z + h],
  ]);
  const right = ptsAt(ox, oy, [
    [x + w, y, z],
    [x + w, y + d, z],
    [x + w, y + d, z + h],
    [x + w, y, z + h],
  ]);
  const left = ptsAt(ox, oy, [
    [x, y + d, z],
    [x + w, y + d, z],
    [x + w, y + d, z + h],
    [x, y + d, z + h],
  ]);

  return (
    <g stroke={stroke} strokeWidth={strokeWidth} strokeLinejoin="round">
      <polygon points={left} fill={leftFill} />
      <polygon points={right} fill={rightFill} />
      <polygon points={top} fill={topFill} />
    </g>
  );
}

const STAGE_ORDER: ChunkerStageId[] = ["01", "02", "03"];

// Independent local origins for the 3 separated isometric assemblies in viewBox 0 0 820 400
const O1_X = 206;
const O1_Y = 278;
const O2_X = 432;
const O2_Y = 282;
const O3_X = 646;
const O3_Y = 288;

export function KnowledgeChunkerFigure({ telemetry }: KnowledgeChunkerFigureProps) {
  const [selectedStage, setSelectedStage] = React.useState<ChunkerStageId>("01");
  const [hoverStage, setHoverStage] = React.useState<ChunkerStageId | null>(null);
  const [exploded, setExploded] = React.useState(false);

  const activeStage = hoverStage ?? selectedStage;
  const isStage01 = activeStage === "01";
  const isStage02 = activeStage === "02";
  const isStage03 = activeStage === "03";

  const primary = telemetry.primaryMaterial;
  const activeBab = primary
    ? `BAB ${(primary.currentChunkIndex % Math.max(primary.totalChunks, 1)) + 1}/${primary.totalChunks}`
    : "EMPTY";
  const charsK =
    telemetry.totalChars >= 1000
      ? `${(telemetry.totalChars / 1000).toFixed(1)}K CHARS`
      : `${telemetry.totalChars} CHARS`;

  const stageMeta: Record<
    ChunkerStageId,
    { label: string; metric: string; status: string; bg: string }
  > = {
    "01": {
      label: "01 · CODEX SHELF",
      metric: `${telemetry.totalMaterialsCount} DOKUMEN · ${charsK}`,
      status: telemetry.extracting
        ? "SCANNING..."
        : telemetry.totalMaterialsCount > 0
          ? "ARCHIVED"
          : "EMPTY RACK",
      bg: "bg-[#86efac]",
    },
    "02": {
      label: "02 · ~3K OPEN BOOK",
      metric: `${telemetry.totalChunks} CHUNK (~3.000 CHAR)`,
      status: telemetry.totalChunks > 0 ? "INDEXED" : "STANDBY",
      bg: "bg-[#facc15]",
    },
    "03": {
      label: "03 · LILAC CARTRIDGE",
      metric: `${telemetry.activeMaterialsCount} AKTIF · ${activeBab}`,
      status: telemetry.activeMaterialsCount > 0 ? "GITBOY READY" : "NO CART",
      bg: "bg-[#c4b5fd]",
    },
  };

  const currentMeta = stageMeta[selectedStage];
  const springExplode = { type: "spring" as const, stiffness: 250, damping: 24 };
  const springPart = { type: "spring" as const, stiffness: 320, damping: 22 };

  function handleContainerKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    const idx = STAGE_ORDER.indexOf(selectedStage);
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedStage(STAGE_ORDER[(idx + 1) % STAGE_ORDER.length]);
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedStage(STAGE_ORDER[(idx - 1 + STAGE_ORDER.length) % STAGE_ORDER.length]);
    } else if (e.key.toLowerCase() === "e") {
      e.preventDefault();
      setExploded((prev) => !prev);
    }
  }

  function handleSvgStageKeyDown(stage: ChunkerStageId) {
    return (e: React.KeyboardEvent<SVGGElement>) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        setSelectedStage(stage);
      }
    };
  }

  // Helper to build curved arched open-book page path on Object 2
  const p = (x: number, y: number, z: number) => isoAt(O2_X, O2_Y, x, y, z);

  const leftPageTopPath = (() => {
    const [a1, a2] = p(0, -34, 24);
    const [c1x, c1y] = p(-18, -34, 34);
    const [c2x, c2y] = p(-36, -34, 30);
    const [b1, b2] = p(-46, -34, 22);
    const [d1, d2] = p(-46, 34, 22);
    const [c3x, c3y] = p(-36, 34, 30);
    const [c4x, c4y] = p(-18, 34, 34);
    const [e1, e2] = p(0, 34, 24);
    return `M ${a1},${a2} C ${c1x},${c1y} ${c2x},${c2y} ${b1},${b2} L ${d1},${d2} C ${c3x},${c3y} ${c4x},${c4y} ${e1},${e2} Z`;
  })();

  const leftPageFrontEdge = (() => {
    const [d1, d2] = p(-46, 34, 22);
    const [c3x, c3y] = p(-36, 34, 30);
    const [c4x, c4y] = p(-18, 34, 34);
    const [e1, e2] = p(0, 34, 24);
    const [e1b, e2b] = p(0, 34, 17);
    const [d1b, d2b] = p(-46, 34, 16);
    return `M ${d1},${d2} C ${c3x},${c3y} ${c4x},${c4y} ${e1},${e2} L ${e1b},${e2b} L ${d1b},${d2b} Z`;
  })();

  const rightPageTopPath = (() => {
    const [a1, a2] = p(0, -34, 24);
    const [c1x, c1y] = p(18, -34, 34);
    const [c2x, c2y] = p(36, -34, 30);
    const [b1, b2] = p(46, -34, 22);
    const [d1, d2] = p(46, 34, 22);
    const [c3x, c3y] = p(36, 34, 30);
    const [c4x, c4y] = p(18, 34, 34);
    const [e1, e2] = p(0, 34, 24);
    return `M ${a1},${a2} C ${c1x},${c1y} ${c2x},${c2y} ${b1},${b2} L ${d1},${d2} C ${c3x},${c3y} ${c4x},${c4y} ${e1},${e2} Z`;
  })();

  const rightPageFrontEdge = (() => {
    const [e1, e2] = p(0, 34, 24);
    const [c4x, c4y] = p(18, 34, 34);
    const [c3x, c3y] = p(36, 34, 30);
    const [d1, d2] = p(46, 34, 22);
    const [d1b, d2b] = p(46, 34, 16);
    const [e1b, e2b] = p(0, 34, 17);
    return `M ${e1},${e2} C ${c4x},${c4y} ${c3x},${c3y} ${d1},${d2} L ${d1b},${d2b} L ${e1b},${e2b} Z`;
  })();

  const rightPageSideEdge = (() => {
    const [b1, b2] = p(46, -34, 22);
    const [d1, d2] = p(46, 34, 22);
    const [d1b, d2b] = p(46, 34, 16);
    const [b1b, b2b] = p(46, -34, 16);
    return `M ${b1},${b2} L ${d1},${d2} L ${d1b},${d2b} L ${b1b},${b2b} Z`;
  })();

  return (
    <section
      aria-label="FIG 02 Knowledge Chunker Anatomy"
      tabIndex={0}
      onKeyDown={handleContainerKeyDown}
      className="nb-card flex flex-col overflow-hidden bg-[#fcfbf7] focus:outline-none"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b-3 border-[#111111] bg-white px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="border-2 border-[#111111] bg-[#c4b5fd] px-2 py-0.5 font-mono text-[11px] font-black uppercase text-[#111111] shadow-[2px_2px_0_0_#111111]">
            FIG 02
          </span>
          <h2 className="font-mono text-xs font-black uppercase tracking-wide text-[#111111] sm:text-sm">
            CODEX ARCHIVE RACK · KNOWLEDGE CHUNKER
          </h2>
        </div>

        <button
          type="button"
          onClick={() => setExploded((prev) => !prev)}
          aria-pressed={exploded}
          className={`nb-btn-sm inline-flex min-h-[44px] cursor-pointer items-center gap-1.5 px-3 py-1 font-mono text-[11px] font-extrabold uppercase sm:min-h-[34px] ${
            exploded ? "bg-[#111111] text-[#facc15]" : "bg-[#facc15] text-[#111111]"
          }`}
        >
          <Layers className="h-3.5 w-3.5" aria-hidden="true" />
          <span>{exploded ? "ASSEMBLE" : "EXPLODE VIEW"}</span>
        </button>
      </div>

      <div
        className="relative overflow-hidden px-2 py-2"
        style={{
          backgroundColor: "#fcfbf7",
          backgroundImage: "radial-gradient(#d4d4ce 1.25px, transparent 1.25px)",
          backgroundSize: "16px 16px",
        }}
      >
        <svg
          viewBox="0 0 820 400"
          className="mx-auto h-auto w-full max-w-[860px] select-none"
          role="group"
          aria-label="Diagram anatomi isometrik tiga objek terpisah: Rak Buku Perpustakaan dengan buku yang ditarik keluar, Meja Baca Buku Terbuka 3.000 karakter, dan Dok Kaset Ungu GITBOY-01."
        >
          {/* FLOOR DATA SIGNAL CABLES CONNECTING THE 3 STANDALONE STATIONS */}
          <g fill="none" strokeLinecap="round" strokeLinejoin="round">
            {/* Shelf -> Open Book floor bus */}
            <polyline
              points="252,298 308,330 356,304"
              stroke="#111111"
              strokeWidth={3.6}
              strokeOpacity="0.22"
            />
            <polyline
              points="252,296 308,328 356,302"
              stroke={isStage01 || isStage02 ? "#16a34a" : "#111111"}
              strokeWidth={2}
              strokeDasharray="4 4"
            />

            {/* Open Book -> Lilac Cartridge Dock floor bus */}
            <polyline
              points="496,304 544,330 584,308"
              stroke="#111111"
              strokeWidth={3.6}
              strokeOpacity="0.22"
            />
            <polyline
              points="496,302 544,328 584,306"
              stroke={isStage02 || isStage03 ? "#8b5cf6" : "#111111"}
              strokeWidth={2}
              strokeDasharray="4 4"
            />
          </g>

          {/* ========================================================================
              OBJECT 1: [01] CODEX SHELF — 3-Tier Library Bookshelf (Left, x ~ 140..275)
              Open front faces +x (down-right toward the Reading Desk)
             ======================================================================== */}
          <motion.g
            animate={exploded ? { x: -24, y: -10 } : { x: 0, y: 0 }}
            transition={springExplode}
            role="button"
            tabIndex={0}
            aria-label="Tahap 01 Codex Shelf: rak buku perpustakaan dengan buku hijau mint yang ditarik keluar"
            aria-pressed={selectedStage === "01"}
            onClick={() => setSelectedStage("01")}
            onMouseEnter={() => setHoverStage("01")}
            onMouseLeave={() => setHoverStage(null)}
            onKeyDown={handleSvgStageKeyDown("01")}
            className="cursor-pointer focus:outline-none"
          >
            {/* Ground shadow under bookshelf */}
            <polygon
              points={ptsAt(O1_X, O1_Y, [
                [-26, -46, -8],
                [28, -46, -8],
                [28, 46, -8],
                [-26, 46, -8],
              ])}
              fill="#111111"
              fillOpacity="0.12"
            />

            {/* Four cabinet feet */}
            <IsoBox ox={O1_X} oy={O1_Y} x={-22} y={-42} z={-6} w={8} d={8} h={6} topFill="#27272a" rightFill="#111111" leftFill="#18181b" strokeWidth={1.3} />
            <IsoBox ox={O1_X} oy={O1_Y} x={14} y={-42} z={-6} w={8} d={8} h={6} topFill="#27272a" rightFill="#111111" leftFill="#18181b" strokeWidth={1.3} />
            <IsoBox ox={O1_X} oy={O1_Y} x={-22} y={34} z={-6} w={8} d={8} h={6} topFill="#27272a" rightFill="#111111" leftFill="#18181b" strokeWidth={1.3} />
            <IsoBox ox={O1_X} oy={O1_Y} x={14} y={34} z={-6} w={8} d={8} h={6} topFill="#27272a" rightFill="#111111" leftFill="#18181b" strokeWidth={1.3} />

            {/* Back Cabinet Wall (-x) */}
            <IsoBox ox={O1_X} oy={O1_Y} x={-24} y={-44} z={0} w={6} d={88} h={132} topFill="#fef9c3" rightFill="#d6cfc2" leftFill="#eab308" strokeWidth={2} />

            {/* Far Side Wall (-y, rear-right) */}
            <IsoBox ox={O1_X} oy={O1_Y} x={-18} y={-44} z={0} w={42} d={6} h={132} topFill="#fef9c3" rightFill="#eab308" leftFill="#f5f0dc" strokeWidth={2} />

            {/* Bottom Plinth Shelf */}
            <IsoBox ox={O1_X} oy={O1_Y} x={-18} y={-38} z={0} w={42} d={76} h={7} topFill="#fef9c3" rightFill="#eab308" leftFill="#f5f0dc" strokeWidth={2} />

            {/* --- BOTTOM TIER BOOKS (z = 7..39) --- */}
            <IsoBox ox={O1_X} oy={O1_Y} x={-16} y={-35} z={7} w={34} d={11} h={31} topFill="#ddd6fe" rightFill="#c4b5fd" leftFill="#8b5cf6" strokeWidth={1.5} />
            <IsoBox ox={O1_X} oy={O1_Y} x={-16} y={-23} z={7} w={34} d={10} h={28} topFill="#fef08a" rightFill="#facc15" leftFill="#ca8a04" strokeWidth={1.5} />
            <IsoBox ox={O1_X} oy={O1_Y} x={-16} y={-12} z={7} w={34} d={12} h={32} topFill="#93c5fd" rightFill="#60a5fa" leftFill="#2563eb" strokeWidth={1.5} />
            <IsoBox ox={O1_X} oy={O1_Y} x={-16} y={1} z={7} w={34} d={11} h={29} topFill="#bbf7d0" rightFill="#86efac" leftFill="#16a34a" strokeWidth={1.5} />
            <IsoBox ox={O1_X} oy={O1_Y} x={-16} y={13} z={7} w={34} d={11} h={31} topFill="#fecdd3" rightFill="#fb7185" leftFill="#e11d48" strokeWidth={1.5} />
            <IsoBox ox={O1_X} oy={O1_Y} x={-16} y={25} z={7} w={34} d={10} h={26} topFill="#fef08a" rightFill="#facc15" leftFill="#ca8a04" strokeWidth={1.5} />

            {/* Middle Shelf Divider */}
            <IsoBox ox={O1_X} oy={O1_Y} x={-18} y={-38} z={44} w={42} d={76} h={6} topFill="#fef9c3" rightFill="#eab308" leftFill="#f5f0dc" strokeWidth={1.8} />

            {/* --- MIDDLE TIER BOOKS (z = 50..84) + HERO MINT BOOK PULL-OUT --- */}
            {/* Back-right books before the Hero Book */}
            <IsoBox ox={O1_X} oy={O1_Y} x={-16} y={-35} z={50} w={34} d={11} h={32} topFill="#93c5fd" rightFill="#60a5fa" leftFill="#2563eb" strokeWidth={1.5} />
            <IsoBox ox={O1_X} oy={O1_Y} x={-16} y={-23} z={50} w={34} d={11} h={30} topFill="#fef08a" rightFill="#facc15" leftFill="#ca8a04" strokeWidth={1.5} />

            {/* Dark Empty Cavity revealed when Hero Mint Book slides out! */}
            <polygon
              points={ptsAt(O1_X, O1_Y, [
                [18, -11, 50],
                [18, 3, 50],
                [18, 3, 84],
                [18, -11, 84],
              ])}
              fill="#18181b"
              stroke="#111111"
              strokeWidth={1.3}
            />
            <polygon
              points={ptsAt(O1_X, O1_Y, [
                [-16, -11, 50],
                [18, -11, 50],
                [18, 3, 50],
                [-16, 3, 50],
              ])}
              fill="#27272a"
            />

            {/* HERO BOOK (Mint Green #86efac cover + white page edges) — pulls out front-right (+16, +9)! */}
            <motion.g
              animate={isStage01 || exploded ? { x: 16, y: 9 } : { x: 0, y: 0 }}
              transition={springPart}
            >
              {/* Mint hardcover outer shell */}
              <IsoBox
                ox={O1_X}
                oy={O1_Y}
                x={-16}
                y={-11}
                z={50}
                w={36}
                d={13}
                h={34}
                topFill="#ffffff"
                rightFill="#86efac"
                leftFill="#4ade80"
                strokeWidth={2}
              />
              {/* Mint top cover edges flanking white paper top */}
              <polygon
                points={ptsAt(O1_X, O1_Y, [
                  [-16, -11, 84.1],
                  [20, -11, 84.1],
                  [20, -8.5, 84.1],
                  [-16, -8.5, 84.1],
                ])}
                fill="#22c55e"
                stroke="#111111"
                strokeWidth={1.1}
              />
              <polygon
                points={ptsAt(O1_X, O1_Y, [
                  [-16, -0.5, 84.1],
                  [20, -0.5, 84.1],
                  [20, 2, 84.1],
                  [-16, 2, 84.1],
                ])}
                fill="#86efac"
                stroke="#111111"
                strokeWidth={1.1}
              />
              {/* Spine label bands on front-right spine (+x face) */}
              <polygon
                points={ptsAt(O1_X, O1_Y, [
                  [20.2, -9, 72],
                  [20.2, 0, 72],
                  [20.2, 0, 78],
                  [20.2, -9, 78],
                ])}
                fill="#ffffff"
                stroke="#111111"
                strokeWidth={1.2}
              />
              <polygon
                points={ptsAt(O1_X, O1_Y, [
                  [20.2, -9, 55],
                  [20.2, 0, 55],
                  [20.2, 0, 58],
                  [20.2, -9, 58],
                ])}
                fill="#facc15"
                stroke="#111111"
                strokeWidth={1}
              />
            </motion.g>

            {/* Front-left books on middle shelf (painted in front of Hero Book cavity) */}
            <IsoBox ox={O1_X} oy={O1_Y} x={-16} y={4} z={50} w={34} d={11} h={31} topFill="#ddd6fe" rightFill="#c4b5fd" leftFill="#8b5cf6" strokeWidth={1.5} />
            <IsoBox ox={O1_X} oy={O1_Y} x={-16} y={16} z={50} w={34} d={10} h={28} topFill="#fecdd3" rightFill="#fb7185" leftFill="#e11d48" strokeWidth={1.5} />
            <IsoBox ox={O1_X} oy={O1_Y} x={-16} y={27} z={50} w={34} d={9} h={32} topFill="#93c5fd" rightFill="#60a5fa" leftFill="#2563eb" strokeWidth={1.5} />

            {/* Upper Shelf Divider */}
            <IsoBox ox={O1_X} oy={O1_Y} x={-18} y={-38} z={88} w={42} d={76} h={6} topFill="#fef9c3" rightFill="#eab308" leftFill="#f5f0dc" strokeWidth={1.8} />

            {/* --- TOP TIER BOOKS (z = 94..124) + METAL BOOKEND --- */}
            <IsoBox ox={O1_X} oy={O1_Y} x={-16} y={-35} z={94} w={34} d={12} h={30} topFill="#bbf7d0" rightFill="#86efac" leftFill="#16a34a" strokeWidth={1.5} />
            <IsoBox ox={O1_X} oy={O1_Y} x={-16} y={-22} z={94} w={34} d={10} h={28} topFill="#fecdd3" rightFill="#fb7185" leftFill="#e11d48" strokeWidth={1.5} />
            <IsoBox ox={O1_X} oy={O1_Y} x={-16} y={-11} z={94} w={34} d={12} h={32} topFill="#fef08a" rightFill="#facc15" leftFill="#ca8a04" strokeWidth={1.5} />
            <IsoBox ox={O1_X} oy={O1_Y} x={-16} y={2} z={94} w={34} d={11} h={29} topFill="#93c5fd" rightFill="#60a5fa" leftFill="#2563eb" strokeWidth={1.5} />
            <IsoBox ox={O1_X} oy={O1_Y} x={-16} y={14} z={94} w={34} d={10} h={26} topFill="#ddd6fe" rightFill="#c4b5fd" leftFill="#8b5cf6" strokeWidth={1.5} />
            {/* Steel L-Shaped Bookend */}
            <IsoBox ox={O1_X} oy={O1_Y} x={-10} y={25} z={94} w={24} d={3} h={20} topFill="#e4e4e7" rightFill="#a1a1aa" leftFill="#71717a" strokeWidth={1.3} />
            <IsoBox ox={O1_X} oy={O1_Y} x={-10} y={28} z={94} w={24} d={8} h={3} topFill="#e4e4e7" rightFill="#a1a1aa" leftFill="#71717a" strokeWidth={1.3} />

            {/* Spine detail ticks on top & bottom books */}
            {[-30, -18, -6, 7, 19].map((by) => {
              const [s1x, s1y] = isoAt(O1_X, O1_Y, 18.2, by, 114);
              const [s2x, s2y] = isoAt(O1_X, O1_Y, 18.2, by + 5, 114);
              const [b1x, b1y] = isoAt(O1_X, O1_Y, 18.2, by, 28);
              const [b2x, b2y] = isoAt(O1_X, O1_Y, 18.2, by + 5, 28);
              return (
                <g key={by} stroke="#111111" strokeWidth={1.2}>
                  <line x1={s1x} y1={s1y} x2={s2x} y2={s2y} />
                  <line x1={b1x} y1={b1y} x2={b2x} y2={b2y} />
                </g>
              );
            })}

            {/* Near Side Wall (+y, front-left face) */}
            <IsoBox ox={O1_X} oy={O1_Y} x={-18} y={38} z={0} w={42} d={6} h={132} topFill="#fef9c3" rightFill="#eab308" leftFill="#f5f0dc" strokeWidth={2} />

            {/* Dewey Plaque + Status LED on near-left cabinet wall */}
            <polygon
              points={ptsAt(O1_X, O1_Y, [
                [-8, 44.3, 102],
                [14, 44.3, 102],
                [14, 44.3, 118],
                [-8, 44.3, 118],
              ])}
              fill="#ffffff"
              stroke="#111111"
              strokeWidth={1.4}
            />
            <polygon
              points={ptsAt(O1_X, O1_Y, [
                [-8, 44.4, 113],
                [14, 44.4, 113],
                [14, 44.4, 118],
                [-8, 44.4, 118],
              ])}
              fill="#86efac"
              stroke="#111111"
              strokeWidth={1.1}
            />
            {(() => {
              const [lx, ly] = isoAt(O1_X, O1_Y, 18, 44.5, 66);
              return (
                <circle
                  cx={lx}
                  cy={ly}
                  r={3.5}
                  fill={isStage01 ? "#86efac" : "#e4e4e7"}
                  stroke="#111111"
                  strokeWidth={1.3}
                />
              );
            })()}

            {/* Top Cornice Cap */}
            <IsoBox ox={O1_X} oy={O1_Y} x={-26} y={-46} z={132} w={52} d={92} h={7} topFill="#fef9c3" rightFill="#eab308" leftFill="#f5f0dc" strokeWidth={2} />
          </motion.g>

          {/* ========================================================================
              OBJECT 2: [02] ~3K OPEN BOOK — Reading Lectern + Wide-Open Physical Book
              Standalone in center-front (x ~ 350..515), >= 50px gap from Shelf & Dock
             ======================================================================== */}
          <motion.g
            animate={exploded ? { x: 0, y: 18 } : { x: 0, y: 0 }}
            transition={springExplode}
            role="button"
            tabIndex={0}
            aria-label="Tahap 02 3K Open Book: buku fisik terbuka lebar di atas meja baca dengan pemindai baris teks 3.000 karakter"
            aria-pressed={selectedStage === "02"}
            onClick={() => setSelectedStage("02")}
            onMouseEnter={() => setHoverStage("02")}
            onMouseLeave={() => setHoverStage(null)}
            onKeyDown={handleSvgStageKeyDown("02")}
            className="cursor-pointer focus:outline-none"
          >
            {/* Ground shadow under reading lectern */}
            <polygon
              points={ptsAt(O2_X, O2_Y, [
                [-54, -42, -8],
                [54, -42, -8],
                [54, 42, -8],
                [-54, 42, -8],
              ])}
              fill="#111111"
              fillOpacity="0.12"
            />

            {/* Four low rubber lectern feet */}
            <IsoBox ox={O2_X} oy={O2_Y} x={-50} y={-38} z={-6} w={9} d={9} h={6} topFill="#27272a" rightFill="#111111" leftFill="#18181b" strokeWidth={1.3} />
            <IsoBox ox={O2_X} oy={O2_Y} x={41} y={-38} z={-6} w={9} d={9} h={6} topFill="#27272a" rightFill="#111111" leftFill="#18181b" strokeWidth={1.3} />
            <IsoBox ox={O2_X} oy={O2_Y} x={-50} y={29} z={-6} w={9} d={9} h={6} topFill="#27272a" rightFill="#111111" leftFill="#18181b" strokeWidth={1.3} />
            <IsoBox ox={O2_X} oy={O2_Y} x={41} y={29} z={-6} w={9} d={9} h={6} topFill="#27272a" rightFill="#111111" leftFill="#18181b" strokeWidth={1.3} />

            {/* Low Reading Lectern Base Deck */}
            <IsoBox
              ox={O2_X}
              oy={O2_Y}
              x={-52}
              y={-40}
              z={0}
              w={104}
              d={80}
              h={12}
              topFill="#f5f0dc"
              rightFill="#d6cfc2"
              leftFill="#e5e5df"
              strokeWidth={2}
            />

            {/* Lectern status LED on front lip */}
            {(() => {
              const [lx, ly] = isoAt(O2_X, O2_Y, -38, 40.3, 6);
              return (
                <circle
                  cx={lx}
                  cy={ly}
                  r={3.2}
                  fill={isStage02 ? "#facc15" : "#e4e4e7"}
                  stroke="#111111"
                  strokeWidth={1.25}
                />
              );
            })()}

            {/* OPEN BOOK ASSEMBLY (lifts lightly when Stage 02 active) */}
            <motion.g animate={isStage02 ? { y: -6 } : { y: 0 }} transition={springPart}>
              {/* Layer A: Yellow Splayed Outer Hardcover Boards (#facc15) */}
              <IsoBox
                ox={O2_X}
                oy={O2_Y}
                x={-50}
                y={-37}
                z={12}
                w={49}
                d={74}
                h={4}
                topFill="#facc15"
                rightFill="#ca8a04"
                leftFill="#eab308"
                strokeWidth={1.8}
              />
              <IsoBox
                ox={O2_X}
                oy={O2_Y}
                x={1}
                y={-37}
                z={12}
                w={49}
                d={74}
                h={4}
                topFill="#facc15"
                rightFill="#ca8a04"
                leftFill="#eab308"
                strokeWidth={1.8}
              />
              {/* Dark Book Spine Hinge between covers */}
              <IsoBox
                ox={O2_X}
                oy={O2_Y}
                x={-2}
                y={-37}
                z={11}
                w={4}
                d={74}
                h={5}
                topFill="#27272a"
                rightFill="#111111"
                leftFill="#18181b"
                strokeWidth={1.4}
              />

              {/* Layer B: Curved White Open Book Pages (lifts off covers in Explode View!) */}
              <motion.g animate={exploded ? { y: -16 } : { y: 0 }} transition={springExplode}>
                {/* Layered Page Block Thickness Edges */}
                <path d={leftPageFrontEdge} fill="#e4e4e7" stroke="#111111" strokeWidth={1.6} strokeLinejoin="round" />
                <path d={rightPageFrontEdge} fill="#f4f4f5" stroke="#111111" strokeWidth={1.6} strokeLinejoin="round" />
                <path d={rightPageSideEdge} fill="#d4d4d8" stroke="#111111" strokeWidth={1.6} strokeLinejoin="round" />

                {/* Left & Right Arched Open White Pages */}
                <path d={leftPageTopPath} fill="#ffffff" stroke="#111111" strokeWidth={2} strokeLinejoin="round" />
                <path d={rightPageTopPath} fill="#ffffff" stroke="#111111" strokeWidth={2} strokeLinejoin="round" />

                {/* Printed Text Rule Lines on Left Page */}
                {[-24, -15, -6, 3, 12, 21].map((ty, idx) => {
                  const [x1, y1] = p(-38, ty, 27.5);
                  const [x2, y2] = p(idx === 5 ? -18 : -8, ty, 29.5);
                  return <line key={`L-${ty}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#111111" strokeWidth={1.3} strokeLinecap="round" />;
                })}

                {/* Highlighted ~3K Chunk Band + Printed Text Lines on Right Page */}
                <polygon
                  points={ptsAt(O2_X, O2_Y, [
                    [8, -10, 29.5],
                    [39, -10, 27.5],
                    [39, 10, 27.5],
                    [8, 10, 29.5],
                  ])}
                  fill={isStage02 ? "#bbf7d0" : "#fef08a"}
                  fillOpacity="0.8"
                />
                {[-24, -15, -6, 3, 12, 21].map((ty, idx) => {
                  const [x1, y1] = p(9, ty, 29.5);
                  const [x2, y2] = p(idx === 0 ? 28 : 38, ty, 27.5);
                  return <line key={`R-${ty}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#111111" strokeWidth={1.3} strokeLinecap="round" />;
                })}

                {/* Coral/Lilac Bookmark Ribbon peeking from bottom gutter */}
                <polygon
                  points={ptsAt(O2_X, O2_Y, [
                    [-2, 34, 24],
                    [3, 34, 24],
                    [3, 44, 11],
                    [-2, 44, 11],
                  ])}
                  fill="#c4b5fd"
                  stroke="#111111"
                  strokeWidth={1.4}
                />
              </motion.g>

              {/* Layer C: Bright Yellow/Mint Optical Scanner Bar sliding smoothly over right page */}
              <motion.g
                animate={
                  exploded
                    ? { x: 0, y: -32 }
                    : isStage02
                      ? { x: -12, y: 12 }
                      : { x: 0, y: 0 }
                }
                transition={springPart}
              >
                <IsoBox
                  ox={O2_X}
                  oy={O2_Y}
                  x={6}
                  y={-20}
                  z={32}
                  w={36}
                  d={9}
                  h={6}
                  topFill={isStage02 ? "#86efac" : "#facc15"}
                  rightFill={isStage02 ? "#16a34a" : "#ca8a04"}
                  leftFill={isStage02 ? "#4ade80" : "#eab308"}
                  strokeWidth={1.75}
                />
              </motion.g>
            </motion.g>
          </motion.g>

          {/* ========================================================================
              OBJECT 3: [03] LILAC CARTRIDGE — Standalone Cartridge Dock (Right, x ~ 580..710)
             ======================================================================== */}
          <motion.g
            animate={exploded ? { x: 24, y: 14 } : { x: 0, y: 0 }}
            transition={springExplode}
            role="button"
            tabIndex={0}
            aria-label="Tahap 03 Lilac Cartridge: dok pengisian kaset ungu GITBOY-01 yang berdiri mandiri"
            aria-pressed={selectedStage === "03"}
            onClick={() => setSelectedStage("03")}
            onMouseEnter={() => setHoverStage("03")}
            onMouseLeave={() => setHoverStage(null)}
            onKeyDown={handleSvgStageKeyDown("03")}
            className="cursor-pointer focus:outline-none"
          >
            {/* Ground shadow under dock */}
            <polygon
              points={ptsAt(O3_X, O3_Y, [
                [-34, -30, -8],
                [36, -30, -8],
                [36, 32, -8],
                [-34, 32, -8],
              ])}
              fill="#111111"
              fillOpacity="0.12"
            />

            {/* Dock rubber feet */}
            <IsoBox ox={O3_X} oy={O3_Y} x={-30} y={-26} z={-6} w={8} d={8} h={6} topFill="#27272a" rightFill="#111111" leftFill="#18181b" strokeWidth={1.3} />
            <IsoBox ox={O3_X} oy={O3_Y} x={22} y={-26} z={-6} w={8} d={8} h={6} topFill="#27272a" rightFill="#111111" leftFill="#18181b" strokeWidth={1.3} />
            <IsoBox ox={O3_X} oy={O3_Y} x={-30} y={18} z={-6} w={8} d={8} h={6} topFill="#27272a" rightFill="#111111" leftFill="#18181b" strokeWidth={1.3} />
            <IsoBox ox={O3_X} oy={O3_Y} x={22} y={18} z={-6} w={8} d={8} h={6} topFill="#27272a" rightFill="#111111" leftFill="#18181b" strokeWidth={1.3} />

            {/* Dark Matte Dock Housing */}
            <IsoBox
              ox={O3_X}
              oy={O3_Y}
              x={-32}
              y={-28}
              z={0}
              w={64}
              d={56}
              h={28}
              topFill="#27272a"
              rightFill="#111111"
              leftFill="#18181b"
              strokeWidth={2}
            />

            {/* Recessed Slot Channel on top of dock */}
            <polygon
              points={ptsAt(O3_X, O3_Y, [
                [-24, -16, 28.2],
                [24, -16, 28.2],
                [24, 16, 28.2],
                [-24, 16, 28.2],
              ])}
              fill="#09090b"
              stroke="#111111"
              strokeWidth={1.4}
            />

            {/* 5 Gold Edge Connector Fingers inside dock slot */}
            {[-16, -8, 0, 8, 16].map((gx) => (
              <IsoBox
                key={gx}
                ox={O3_X}
                oy={O3_Y}
                x={gx - 2}
                y={-10}
                z={28}
                w={4}
                d={20}
                h={4}
                topFill="#facc15"
                rightFill="#ca8a04"
                leftFill="#eab308"
                strokeWidth={1}
              />
            ))}

            {/* Glowing LED Indicator on Dock Top-Front */}
            {(() => {
              const [lx, ly] = isoAt(O3_X, O3_Y, 22, 20, 28.4);
              return (
                <circle
                  cx={lx}
                  cy={ly}
                  r={4}
                  fill={isStage03 ? "#86efac" : telemetry.activeMaterialsCount > 0 ? "#c4b5fd" : "#52525b"}
                  stroke="#111111"
                  strokeWidth={1.3}
                />
              );
            })()}

            {/* Coral Eject Switch on Front of Dock */}
            <IsoBox ox={O3_X} oy={O3_Y} x={-8} y={28} z={7} w={16} d={6} h={10} topFill="#fb7185" rightFill="#e11d48" leftFill="#f43f5e" strokeWidth={1.4} />

            {/* Sliding Lilac GITBOY-01 Cartridge (lifts -14 on Stage 03, -26 on Explode) */}
            <motion.g
              animate={exploded ? { y: -26 } : isStage03 ? { y: -14 } : { y: 0 }}
              transition={springPart}
            >
              <IsoBox
                ox={O3_X}
                oy={O3_Y}
                x={-22}
                y={-15}
                z={28}
                w={44}
                d={30}
                h={42}
                topFill="#c4b5fd"
                rightFill="#8b5cf6"
                leftFill="#a78bfa"
                strokeWidth={2}
              />

              {/* Top grip ribs on cartridge */}
              {[-9, -3, 3].map((dy) => {
                const [x1, y1] = isoAt(O3_X, O3_Y, -17, dy, 70.2);
                const [x2, y2] = isoAt(O3_X, O3_Y, 17, dy, 70.2);
                return <line key={dy} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#111111" strokeWidth={1.4} />;
              })}

              {/* Front-left sticker decal on cartridge */}
              <polygon
                points={ptsAt(O3_X, O3_Y, [
                  [-16, 15.2, 35],
                  [16, 15.2, 35],
                  [16, 15.2, 62],
                  [-16, 15.2, 62],
                ])}
                fill="#ffffff"
                stroke="#111111"
                strokeWidth={1.5}
              />
              <polygon
                points={ptsAt(O3_X, O3_Y, [
                  [-16, 15.3, 55],
                  [16, 15.3, 55],
                  [16, 15.3, 62],
                  [-16, 15.3, 62],
                ])}
                fill="#facc15"
                stroke="#111111"
                strokeWidth={1.2}
              />
              {[42, 48].map((lz) => {
                const [x1, y1] = isoAt(O3_X, O3_Y, -11, 15.4, lz);
                const [x2, y2] = isoAt(O3_X, O3_Y, 11, 15.4, lz);
                return <line key={lz} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#111111" strokeWidth={1.3} />;
              })}
            </motion.g>
          </motion.g>

          {/* ========================================================================
              ANTI-COLLISION CALLOUT BADGES & LEADER LINES (Zero object crossings!)
             ======================================================================== */}
          {/* [01] CODEX SHELF (Top-Left x=36, y=34 -> clean corridor straight to Hero Mint Book) */}
          <g
            role="button"
            tabIndex={0}
            aria-pressed={selectedStage === "01"}
            onClick={() => setSelectedStage("01")}
            onMouseEnter={() => setHoverStage("01")}
            onMouseLeave={() => setHoverStage(null)}
            onKeyDown={handleSvgStageKeyDown("01")}
            className="cursor-pointer focus:outline-none"
          >
            <polyline points="208,54 282,54 282,212 246,212" fill="none" stroke="#111111" strokeWidth={1.8} />
            <circle cx={246} cy={212} r={4.2} fill="#86efac" stroke="#111111" strokeWidth={1.7} />
            <rect
              x={36}
              y={34}
              width={172}
              height={40}
              fill={selectedStage === "01" ? "#86efac" : "#ffffff"}
              stroke="#111111"
              strokeWidth={2}
            />
            <text x={46} y={50} fill="#111111" fontSize="10.5" fontWeight="900" fontFamily="monospace">
              [01] CODEX SHELF
            </text>
            <text x={46} y={65} fill="#111111" fontSize="9" fontWeight="700" fontFamily="monospace">
              {telemetry.totalMaterialsCount} FILE · {charsK}
            </text>
          </g>

          {/* [02] ~3K OPEN BOOK (Top-Center x=325, y=24 -> straight vertical drop onto open pages) */}
          <g
            role="button"
            tabIndex={0}
            aria-pressed={selectedStage === "02"}
            onClick={() => setSelectedStage("02")}
            onMouseEnter={() => setHoverStage("02")}
            onMouseLeave={() => setHoverStage(null)}
            onKeyDown={handleSvgStageKeyDown("02")}
            className="cursor-pointer focus:outline-none"
          >
            <polyline points="432,64 432,232" fill="none" stroke="#111111" strokeWidth={1.8} />
            <circle cx={432} cy={232} r={4.2} fill="#facc15" stroke="#111111" strokeWidth={1.7} />
            <rect
              x={338}
              y={24}
              width={188}
              height={40}
              fill={selectedStage === "02" ? "#facc15" : "#ffffff"}
              stroke="#111111"
              strokeWidth={2}
            />
            <text x={348} y={40} fill="#111111" fontSize="10.5" fontWeight="900" fontFamily="monospace">
              [02] ~3K OPEN BOOK
            </text>
            <text x={348} y={55} fill="#111111" fontSize="9" fontWeight="700" fontFamily="monospace">
              {telemetry.totalChunks} CHUNKS · SLICER
            </text>
          </g>

          {/* [03] LILAC CARTRIDGE (Top-Right x=585, y=44 -> straight vertical drop onto Lilac Cartridge) */}
          <g
            role="button"
            tabIndex={0}
            aria-pressed={selectedStage === "03"}
            onClick={() => setSelectedStage("03")}
            onMouseEnter={() => setHoverStage("03")}
            onMouseLeave={() => setHoverStage(null)}
            onKeyDown={handleSvgStageKeyDown("03")}
            className="cursor-pointer focus:outline-none"
          >
            <polyline points="646,84 646,204" fill="none" stroke="#111111" strokeWidth={1.8} />
            <circle cx={646} cy={204} r={4.2} fill="#c4b5fd" stroke="#111111" strokeWidth={1.7} />
            <rect
              x={585}
              y={44}
              width={198}
              height={40}
              fill={selectedStage === "03" ? "#c4b5fd" : "#ffffff"}
              stroke="#111111"
              strokeWidth={2}
            />
            <text x={595} y={60} fill="#111111" fontSize="10.5" fontWeight="900" fontFamily="monospace">
              [03] LILAC CARTRIDGE
            </text>
            <text x={595} y={75} fill="#111111" fontSize="9" fontWeight="700" fontFamily="monospace">
              GITBOY-01 · {activeBab}
            </text>
          </g>
        </svg>
      </div>

      {/* Accessible Native Keyboard/Touch Stage Selector */}
      <div
        role="tablist"
        aria-label="Pilih tahap anatomi Codex Archive Rack"
        className="grid grid-cols-3 divide-x-2 divide-[#111111] border-t-3 border-[#111111] bg-[#F5F0E8] font-mono text-[10px]"
      >
        {(
          [
            { id: "01", short: "01 SHELF", activeBg: "bg-[#86efac]" },
            { id: "02", short: "02 OPEN BOOK", activeBg: "bg-[#facc15]" },
            { id: "03", short: "03 CARTRIDGE", activeBg: "bg-[#c4b5fd]" },
          ] as const
        ).map((tab) => {
          const active = selectedStage === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setSelectedStage(tab.id)}
              className={`min-h-[44px] cursor-pointer px-2 py-1.5 font-extrabold uppercase text-[#111111] transition-colors duration-150 sm:min-h-[34px] ${
                active ? tab.activeBg : "bg-white hover:bg-[#FFF3C4]"
              }`}
            >
              {tab.short}
            </button>
          );
        })}
      </div>

      {/* Live Telemetry Bar */}
      <div className="grid grid-cols-3 divide-x-2 divide-[#111111] border-t-2 border-[#111111] bg-white font-mono text-[10px]">
        <div className="min-w-0 px-3 py-2">
          <div className="font-bold uppercase text-black/55">STAGE</div>
          <div className="mt-0.5 truncate font-extrabold text-[#111111]">{currentMeta.label}</div>
        </div>
        <div className="min-w-0 px-3 py-2">
          <div className="font-bold uppercase text-black/55">METRIC</div>
          <div className="mt-0.5 truncate font-extrabold text-[#111111]">{currentMeta.metric}</div>
        </div>
        <div className={`min-w-0 px-3 py-2 ${currentMeta.bg}`}>
          <div className="font-bold uppercase text-black/75">STATUS</div>
          <div className="mt-0.5 truncate font-black text-[#111111]">{currentMeta.status}</div>
        </div>
      </div>

      {/* Compact Legend Footer */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-t-2 border-[#111111] bg-[#F5F0E8] px-4 py-2 font-mono text-[10px] font-bold text-[#111111]">
        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-1">
            <span className="h-2.5 w-2.5 border border-[#111111] bg-[#86efac]" aria-hidden="true" />
            <BookOpen className="h-3 w-3" aria-hidden="true" />
            Codex Shelf
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="h-2.5 w-2.5 border border-[#111111] bg-[#facc15]" aria-hidden="true" />
            <ScanLine className="h-3 w-3" aria-hidden="true" />
            ~3K Open Book
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="h-2.5 w-2.5 border border-[#111111] bg-[#c4b5fd]" aria-hidden="true" />
            <Cpu className="h-3 w-3" aria-hidden="true" />
            Lilac Cartridge
          </span>
        </div>

        <span className="inline-flex items-center gap-1 text-black/65">
          <Sparkles className="h-3 w-3" aria-hidden="true" />
          ←/→ atau E (Explode)
        </span>
      </div>
    </section>
  );
}
