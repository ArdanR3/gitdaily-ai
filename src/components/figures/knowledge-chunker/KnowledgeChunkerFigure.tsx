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
const ORIGIN_X = 258;
const ORIGIN_Y = 248;

function iso(x: number, y: number, z: number): [number, number] {
  const sx = ORIGIN_X + (x - y) * COS30;
  const sy = ORIGIN_Y + (x + y) * SIN30 - z;
  return [Math.round(sx * 10) / 10, Math.round(sy * 10) / 10];
}

function pts(list: Array<[number, number, number]>): string {
  return list.map(([x, y, z]) => iso(x, y, z).join(",")).join(" ");
}

function IsoBox({
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
  const top = pts([
    [x, y, z + h],
    [x + w, y, z + h],
    [x + w, y + d, z + h],
    [x, y + d, z + h],
  ]);
  const right = pts([
    [x + w, y, z],
    [x + w, y + d, z],
    [x + w, y + d, z + h],
    [x + w, y, z + h],
  ]);
  const left = pts([
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
      label: "02 · ~3K PAGE INDEXER",
      metric: `${telemetry.totalChunks} CHUNK (~3.000 CHAR)`,
      status: telemetry.totalChunks > 0 ? "INDEXED" : "STANDBY",
      bg: "bg-[#facc15]",
    },
    "03": {
      label: "03 · LILAC CARTRIDGE BAY",
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

  // Signal path from middle indexer through PCB backplane into right-side Cartridge Bay
  const busPathPts = pts([
    [40, -18, 66],
    [54, -18, 66],
    [54, -18, 22],
    [72, -18, 22],
  ]);

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
          viewBox="0 0 560 355"
          className="mx-auto h-auto w-full max-w-[780px] select-none"
          role="img"
          aria-label="Diagram anatomi isometrik rak buku perpustakaan Codex Archive Rack dengan rak buku atas, pemindai halaman 3.000 karakter di rak tengah, panel PCB belakang, dan dok kaset lilac GITBOY-01."
        >
          {/* Hard ground shadow under bookshelf and side dock */}
          <polygon
            points={pts([
              [-62, -28, -10],
              [104, -28, -10],
              [104, 30, -10],
              [-62, 30, -10],
            ])}
            fill="#111111"
            fillOpacity="0.12"
          />

          {/* LAYER 1 (BACK): GREEN PCB BACKPLANE + GOLD BUS + LILAC CARTRIDGE BAY */}
          <motion.g
            animate={exploded ? { x: 46, y: -16 } : { x: 0, y: 0 }}
            transition={springExplode}
          >
            {/* PCB Backplane board behind the rack */}
            <IsoBox
              x={-54}
              y={-28}
              z={6}
              w={100}
              d={6}
              h={130}
              topFill="#16a34a"
              rightFill="#14532d"
              leftFill="#15803d"
              strokeWidth={2}
            />

            {/* Gold PCB bus traces along backplane face */}
            <g fill="none" stroke="#facc15" strokeWidth={1.6} strokeLinecap="square">
              <polyline points={pts([[-40, -22, 118], [32, -22, 118], [32, -22, 72]])} />
              <polyline points={pts([[-32, -22, 82], [20, -22, 82], [20, -22, 24], [46, -22, 24]])} />
              <polyline points={pts([[-42, -22, 42], [12, -22, 42], [12, -22, 18]])} />
            </g>

            {/* Solder pads & IC chip on PCB backplane */}
            <IsoBox x={-16} y={-22} z={56} w={22} d={4} h={18} topFill="#27272a" rightFill="#111111" leftFill="#18181b" strokeWidth={1.25} />
            {[
              [-40, 118],
              [-32, 82],
              [-42, 42],
              [32, 72],
            ].map(([px, pz]) => {
              const [cx, cy] = iso(px, -21.5, pz);
              return <circle key={`${px}-${pz}`} cx={cx} cy={cy} r={2.4} fill="#facc15" stroke="#111111" strokeWidth={1} />;
            })}

            {/* Black-gold data bus cable routing from rack into side Cartridge Bay */}
            <polyline points={busPathPts} fill="none" stroke="#111111" strokeWidth={5.2} strokeLinejoin="round" />
            <polyline
              points={busPathPts}
              fill="none"
              stroke={isStage03 ? "#c4b5fd" : "#facc15"}
              strokeWidth={2.2}
              strokeDasharray="5 3"
              strokeLinejoin="round"
            />

            {/* [03] LILAC CARTRIDGE BAY (Side Dock + Sliding Lilac Cartridge) */}
            <g
              role="button"
              tabIndex={0}
              aria-label="Tahap 03 Lilac Cartridge Bay: dok pengisian kaset ungu GITBOY-01"
              aria-pressed={selectedStage === "03"}
              onClick={() => setSelectedStage("03")}
              onMouseEnter={() => setHoverStage("03")}
              onMouseLeave={() => setHoverStage(null)}
              onKeyDown={handleSvgStageKeyDown("03")}
              className="cursor-pointer focus:outline-none"
            >
              {/* Dock plinth feet */}
              <IsoBox x={54} y={-22} z={-8} w={8} d={8} h={8} topFill="#27272a" rightFill="#111111" leftFill="#18181b" strokeWidth={1.25} />
              <IsoBox x={92} y={14} z={-8} w={8} d={8} h={8} topFill="#27272a" rightFill="#111111" leftFill="#18181b" strokeWidth={1.25} />

              {/* Dark Dock Housing */}
              <IsoBox
                x={52}
                y={-22}
                z={0}
                w={50}
                d={46}
                h={24}
                topFill="#27272a"
                rightFill="#111111"
                leftFill="#18181b"
                strokeWidth={2}
              />

              {/* Gold 5-pin edge connector inside dock */}
              {[0, 1, 2, 3, 4].map((idx) => (
                <IsoBox
                  key={idx}
                  x={60 + idx * 7}
                  y={-12}
                  z={24}
                  w={4}
                  d={18}
                  h={4}
                  topFill="#facc15"
                  rightFill="#ca8a04"
                  leftFill="#eab308"
                  strokeWidth={1}
                />
              ))}

              {/* Dock status LED */}
              {(() => {
                const [lx, ly] = iso(95, 16, 24.5);
                return (
                  <circle
                    cx={lx}
                    cy={ly}
                    r={3.5}
                    fill={isStage03 ? "#86efac" : telemetry.activeMaterialsCount > 0 ? "#c4b5fd" : "#52525b"}
                    stroke="#111111"
                    strokeWidth={1.25}
                  />
                );
              })()}

              {/* Sliding Lilac GITBOY-01 Cartridge */}
              <motion.g
                animate={exploded ? { y: -22 } : isStage03 ? { y: -14 } : { y: 0 }}
                transition={springPart}
              >
                <IsoBox
                  x={58}
                  y={-14}
                  z={24}
                  w={38}
                  d={30}
                  h={34}
                  topFill="#c4b5fd"
                  rightFill="#8b5cf6"
                  leftFill="#a78bfa"
                  strokeWidth={2}
                />

                {/* Cartridge grip ribs on top */}
                {[0, 5, 10].map((dy) => {
                  const [x1, y1] = iso(62, -10 + dy, 58.2);
                  const [x2, y2] = iso(92, -10 + dy, 58.2);
                  return <line key={dy} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#111111" strokeWidth={1.3} />;
                })}

                {/* Cartridge front sticker decal */}
                <polygon
                  points={pts([
                    [62, 16.2, 30],
                    [92, 16.2, 30],
                    [92, 16.2, 52],
                    [62, 16.2, 52],
                  ])}
                  fill="#ffffff"
                  stroke="#111111"
                  strokeWidth={1.4}
                />
                <polygon
                  points={pts([
                    [62, 16.3, 46],
                    [92, 16.3, 46],
                    [92, 16.3, 52],
                    [62, 16.3, 52],
                  ])}
                  fill="#facc15"
                  stroke="#111111"
                  strokeWidth={1.2}
                />
                {/* Tiny printed text lines on cartridge label */}
                {[35, 40].map((lz) => {
                  const [x1, y1] = iso(66, 16.4, lz);
                  const [x2, y2] = iso(86, 16.4, lz);
                  return <line key={lz} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#111111" strokeWidth={1.2} />;
                })}
              </motion.g>

              {/* Red eject lever on front of dock */}
              <IsoBox x={70} y={24} z={6} w={14} d={6} h={9} topFill="#fb7185" rightFill="#e11d48" leftFill="#f43f5e" strokeWidth={1.4} />
            </g>
          </motion.g>

          {/* LAYER 2 (MIDDLE): 3-TIER BOOKSHELF CARCASS + CODEX SHELF + ~3K PAGE INDEXER */}
          <g>
            {/* Four heavy dark cabinet feet */}
            <IsoBox x={-56} y={-22} z={-8} w={10} d={10} h={8} topFill="#27272a" rightFill="#111111" leftFill="#18181b" strokeWidth={1.4} />
            <IsoBox x={36} y={-22} z={-8} w={10} d={10} h={8} topFill="#27272a" rightFill="#111111" leftFill="#18181b" strokeWidth={1.4} />
            <IsoBox x={-56} y={14} z={-8} w={10} d={10} h={8} topFill="#27272a" rightFill="#111111" leftFill="#18181b" strokeWidth={1.4} />
            <IsoBox x={36} y={14} z={-8} w={10} d={10} h={8} topFill="#27272a" rightFill="#111111" leftFill="#18181b" strokeWidth={1.4} />

            {/* Bottom Plinth Shelf */}
            <IsoBox x={-58} y={-24} z={0} w={106} d={50} h={8} topFill="#fef9c3" rightFill="#d6cfc2" leftFill="#f5f0dc" strokeWidth={2} />

            {/* Left Cabinet Side Wall (rear-left, painted before shelf interiors) */}
            <IsoBox x={-58} y={-24} z={8} w={8} d={50} h={132} topFill="#fef9c3" rightFill="#d6cfc2" leftFill="#f5f0dc" strokeWidth={2} />

            {/* Lower Tier Interior: Archival Codex Boxes + Data Conduit */}
            <IsoBox x={-46} y={-14} z={8} w={26} d={32} h={28} topFill="#e5e5df" rightFill="#a1a1aa" leftFill="#d4d4d8" strokeWidth={1.4} />
            <IsoBox x={-16} y={-14} z={8} w={26} d={32} h={28} topFill="#fef08a" rightFill="#ca8a04" leftFill="#eab308" strokeWidth={1.4} />
            <IsoBox x={14} y={-12} z={8} w={22} d={28} h={22} topFill="#c4b5fd" rightFill="#8b5cf6" leftFill="#a78bfa" strokeWidth={1.4} />
            {/* Label plates on archival boxes */}
            <polygon points={pts([[-42, 18.2, 20], [-24, 18.2, 20], [-24, 18.2, 28], [-42, 18.2, 28]])} fill="#ffffff" stroke="#111111" strokeWidth={1.1} />
            <polygon points={pts([[-12, 18.2, 20], [6, 18.2, 20], [6, 18.2, 28], [-12, 18.2, 28]])} fill="#ffffff" stroke="#111111" strokeWidth={1.1} />

            {/* Middle Shelf Divider Plank */}
            <IsoBox x={-50} y={-24} z={46} w={90} d={50} h={6} topFill="#fef9c3" rightFill="#d6cfc2" leftFill="#f5f0dc" strokeWidth={1.8} />

            {/* [02] ~3K PAGE INDEXER (Middle Tier: Open Book on Lectern + Sliding Yellow Scanner Bar) */}
            <g
              role="button"
              tabIndex={0}
              aria-label="Tahap 02 3K Page Indexer: buku terbuka di rak tengah dengan pemindai pemotong teks 3.000 karakter"
              aria-pressed={selectedStage === "02"}
              onClick={() => setSelectedStage("02")}
              onMouseEnter={() => setHoverStage("02")}
              onMouseLeave={() => setHoverStage(null)}
              onKeyDown={handleSvgStageKeyDown("02")}
              className="cursor-pointer focus:outline-none"
            >
              {/* Lectern reading cradle */}
              <IsoBox x={-42} y={-16} z={52} w={74} d={34} h={6} topFill="#e4e4e7" rightFill="#a1a1aa" leftFill="#d4d4d8" strokeWidth={1.4} />

              {/* Open Book (gently bounces up when Stage 02 is active) */}
              <motion.g animate={isStage02 ? { y: -4 } : { y: 0 }} transition={springPart}>
                {/* Left open page stack */}
                <IsoBox x={-38} y={-12} z={58} w={31} d={26} h={7} topFill="#ffffff" rightFill="#e4e4e7" leftFill="#f4f4f5" strokeWidth={1.5} />
                {/* Right open page stack */}
                <IsoBox x={-5} y={-12} z={58} w={31} d={26} h={7} topFill="#ffffff" rightFill="#e4e4e7" leftFill="#f4f4f5" strokeWidth={1.5} />
                {/* Center gutter spine */}
                <IsoBox x={-7} y={-12} z={58} w={2} d={26} h={6} topFill="#18181b" rightFill="#111111" leftFill="#111111" strokeWidth={1} />
                {/* Printed text lines on both open pages */}
                {[-8, -2, 4, 10].map((dy) => {
                  const [l1x, l1y] = iso(-34, dy, 65.3);
                  const [l2x, l2y] = iso(-11, dy, 65.3);
                  const [r1x, r1y] = iso(-1, dy, 65.3);
                  const [r2x, r2y] = iso(22, dy, 65.3);
                  return (
                    <g key={dy} stroke="#111111" strokeWidth={1.1}>
                      <line x1={l1x} y1={l1y} x2={l2x} y2={l2y} />
                      <line x1={r1x} y1={r1y} x2={r2x} y2={r2y} />
                    </g>
                  );
                })}
                {/* Lilac bookmark ribbon */}
                <polygon
                  points={pts([
                    [-6, 14, 65.2],
                    [-2, 14, 65.2],
                    [-2, 22, 56],
                    [-6, 22, 56],
                  ])}
                  fill="#c4b5fd"
                  stroke="#111111"
                  strokeWidth={1.1}
                />
              </motion.g>

              {/* Twin horizontal scanner guide rods */}
              <IsoBox x={-44} y={-14} z={76} w={78} d={3} h={3} topFill="#d4d4d8" rightFill="#71717a" leftFill="#a1a1aa" strokeWidth={1.1} />
              <IsoBox x={-44} y={12} z={76} w={78} d={3} h={3} topFill="#d4d4d8" rightFill="#71717a" leftFill="#a1a1aa" strokeWidth={1.1} />

              {/* Sliding Yellow ~3K Scanner Bar */}
              <motion.g animate={isStage02 ? { x: 16, y: 9 } : { x: 0, y: 0 }} transition={springPart}>
                <IsoBox
                  x={-26}
                  y={-15}
                  z={73}
                  w={14}
                  d={32}
                  h={10}
                  topFill="#facc15"
                  rightFill="#ca8a04"
                  leftFill="#eab308"
                  strokeWidth={1.75}
                />
                {/* Optical scan line highlight under bar */}
                <polygon
                  points={pts([
                    [-21, -12, 66],
                    [-17, -12, 66],
                    [-17, 14, 66],
                    [-21, 14, 66],
                  ])}
                  fill={isStage02 ? "#facc15" : "#fef08a"}
                  fillOpacity={isStage02 ? "0.75" : "0.35"}
                />
              </motion.g>

              {/* Middle Tier Status LED */}
              {(() => {
                const [lx, ly] = iso(-46, 22, 50);
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
            </g>

            {/* Upper Shelf Divider Plank */}
            <IsoBox x={-50} y={-24} z={92} w={90} d={50} h={6} topFill="#fef9c3" rightFill="#d6cfc2" leftFill="#f5f0dc" strokeWidth={1.8} />

            {/* [01] CODEX SHELF (Top Tier: Upright Books + Interactive Pull-Out Hero Book + Tilted Book + Metal Bookend) */}
            <g
              role="button"
              tabIndex={0}
              aria-label="Tahap 01 Codex Shelf: deretan buku dokumen sumber di rak atas"
              aria-pressed={selectedStage === "01"}
              onClick={() => setSelectedStage("01")}
              onMouseEnter={() => setHoverStage("01")}
              onMouseLeave={() => setHoverStage(null)}
              onKeyDown={handleSvgStageKeyDown("01")}
              className="cursor-pointer focus:outline-none"
            >
              {/* Book 1: Blue Technical Manual */}
              <IsoBox x={-46} y={-14} z={98} w={11} d={32} h={34} topFill="#93c5fd" rightFill="#2563eb" leftFill="#60a5fa" strokeWidth={1.6} />
              {/* Book 2: Hero Mint Green Codex (pulls out & lifts slightly on Stage 01 hover/select!) */}
              <motion.g
                animate={isStage01 ? { x: -10, y: 6 } : { x: 0, y: 0 }}
                transition={springPart}
              >
                <IsoBox
                  x={-34}
                  y={-14}
                  z={98}
                  w={13}
                  d={34}
                  h={38}
                  topFill="#bbf7d0"
                  rightFill="#16a34a"
                  leftFill="#86efac"
                  strokeWidth={2}
                />
                {/* Spine classification band on hero mint book */}
                <polygon
                  points={pts([
                    [-34, 20.2, 124],
                    [-21, 20.2, 124],
                    [-21, 20.2, 130],
                    [-34, 20.2, 130],
                  ])}
                  fill="#ffffff"
                  stroke="#111111"
                  strokeWidth={1.2}
                />
              </motion.g>

              {/* Book 3: Yellow Spec Book */}
              <IsoBox x={-20} y={-14} z={98} w={11} d={32} h={32} topFill="#fef08a" rightFill="#ca8a04" leftFill="#facc15" strokeWidth={1.6} />
              {/* Book 4: Lilac Algorithm Volume */}
              <IsoBox x={-8} y={-14} z={98} w={12} d={32} h={36} topFill="#ddd6fe" rightFill="#7c3aed" leftFill="#c4b5fd" strokeWidth={1.6} />
              {/* Book 5: Coral Reference */}
              <IsoBox x={5} y={-14} z={98} w={9} d={30} h={30} topFill="#fecdd3" rightFill="#e11d48" leftFill="#fb7185" strokeWidth={1.6} />

              {/* Tilted Leaning Book propped against metal bookend */}
              <g stroke="#111111" strokeWidth={1.6} strokeLinejoin="round">
                <polygon
                  points={pts([
                    [15, 16, 98],
                    [23, 16, 98],
                    [29, 16, 126],
                    [21, 16, 126],
                  ])}
                  fill="#60a5fa"
                />
                <polygon
                  points={pts([
                    [23, 16, 98],
                    [23, -12, 98],
                    [29, -12, 126],
                    [29, 16, 126],
                  ])}
                  fill="#2563eb"
                />
                <polygon
                  points={pts([
                    [21, 16, 126],
                    [29, 16, 126],
                    [29, -12, 126],
                    [21, -12, 126],
                  ])}
                  fill="#93c5fd"
                />
              </g>

              {/* Heavy Steel L-Shaped Bookend */}
              <IsoBox x={28} y={-10} z={98} w={9} d={26} h={3} topFill="#d4d4d8" rightFill="#71717a" leftFill="#a1a1aa" strokeWidth={1.3} />
              <IsoBox x={34} y={-10} z={101} w={3} d={26} h={24} topFill="#e4e4e7" rightFill="#52525b" leftFill="#a1a1aa" strokeWidth={1.3} />

              {/* Top Tier Status LED */}
              {(() => {
                const [lx, ly] = iso(-46, 22, 96);
                return (
                  <circle
                    cx={lx}
                    cy={ly}
                    r={3.2}
                    fill={isStage01 ? "#86efac" : "#e4e4e7"}
                    stroke="#111111"
                    strokeWidth={1.25}
                  />
                );
              })()}
            </g>

            {/* Right Cabinet Side Wall (painted in front of shelf interiors) */}
            <IsoBox x={40} y={-24} z={8} w={8} d={50} h={132} topFill="#fef9c3" rightFill="#d6cfc2" leftFill="#f5f0dc" strokeWidth={2} />

            {/* Dewey Decimal Library Classification Plaque on right side of cabinet */}
            <polygon
              points={pts([
                [48.3, -10, 108],
                [48.3, 16, 108],
                [48.3, 16, 124],
                [48.3, -10, 124],
              ])}
              fill="#ffffff"
              stroke="#111111"
              strokeWidth={1.4}
            />
            <polygon
              points={pts([
                [48.4, -10, 119],
                [48.4, 16, 119],
                [48.4, 16, 124],
                [48.4, -10, 124],
              ])}
              fill="#facc15"
              stroke="#111111"
              strokeWidth={1.1}
            />
            {[112, 115.5].map((dz) => {
              const [x1, y1] = iso(48.5, -6, dz);
              const [x2, y2] = iso(48.5, 12, dz);
              return <line key={dz} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#111111" strokeWidth={1.1} />;
            })}

            {/* Top Cornice Crown */}
            <IsoBox x={-60} y={-26} z={140} w={110} d={54} h={8} topFill="#fef9c3" rightFill="#eab308" leftFill="#f5f0dc" strokeWidth={2} />
          </g>

          {/* LAYER 3 (FRONT): PROTECTIVE GLASS DOOR FRAME & FRONT RETAINING RAIL */}
          <motion.g
            animate={exploded ? { x: -50, y: 20 } : { x: 0, y: 0 }}
            transition={springExplode}
            className="pointer-events-none"
          >
            {/* Translucent protective glass pane */}
            <polygon
              points={pts([
                [-52, 26.5, 10],
                [42, 26.5, 10],
                [42, 26.5, 138],
                [-52, 26.5, 138],
              ])}
              fill="#e0f2fe"
              fillOpacity={exploded ? "0.34" : "0.14"}
              stroke="#111111"
              strokeWidth={1.6}
            />
            {/* Crisp diagonal glass reflections */}
            <line
              x1={iso(-42, 26.8, 128)[0]}
              y1={iso(-42, 26.8, 128)[1]}
              x2={iso(-14, 26.8, 104)[0]}
              y2={iso(-14, 26.8, 104)[1]}
              stroke="#ffffff"
              strokeWidth={2.2}
              strokeOpacity="0.85"
            />
            <line
              x1={iso(-36, 26.8, 114)[0]}
              y1={iso(-36, 26.8, 114)[1]}
              x2={iso(-22, 26.8, 102)[0]}
              y2={iso(-22, 26.8, 102)[1]}
              stroke="#ffffff"
              strokeWidth={1.4}
              strokeOpacity="0.7"
            />
            {/* Brass corner latches & front lower guard rail */}
            <IsoBox x={-54} y={26} z={6} w={98} d={4} h={5} topFill="#facc15" rightFill="#ca8a04" leftFill="#eab308" strokeWidth={1.4} />
            <IsoBox x={36} y={26} z={68} w={6} d={5} h={14} topFill="#e4e4e7" rightFill="#71717a" leftFill="#a1a1aa" strokeWidth={1.3} />
          </motion.g>

          {/* TECHNICAL LEADER LINES & CALLOUT BADGES */}
          {/* [01] CODEX SHELF (Top Left) */}
          <g
            role="button"
            tabIndex={0}
            aria-label="Pilih detail Tahap 01 Codex Shelf"
            aria-pressed={selectedStage === "01"}
            onClick={() => setSelectedStage("01")}
            onMouseEnter={() => setHoverStage("01")}
            onMouseLeave={() => setHoverStage(null)}
            onKeyDown={handleSvgStageKeyDown("01")}
            className="cursor-pointer focus:outline-none"
          >
            <polyline points="154,50 198,50 222,102" fill="none" stroke="#111111" strokeWidth={1.7} />
            <circle cx={222} cy={102} r={3.8} fill="#86efac" stroke="#111111" strokeWidth={1.6} />
            <rect
              x={10}
              y={30}
              width={144}
              height={38}
              fill={selectedStage === "01" ? "#86efac" : "#ffffff"}
              stroke="#111111"
              strokeWidth={2}
            />
            <text x={18} y={45} fill="#111111" fontSize="8.5" fontWeight="900" fontFamily="monospace">
              [01] CODEX SHELF
            </text>
            <text x={18} y={59} fill="#111111" fontSize="7.5" fontWeight="700" fontFamily="monospace">
              {telemetry.totalMaterialsCount} FILE · {charsK}
            </text>
          </g>

          {/* [02] ~3K PAGE INDEXER (Top Right) */}
          <g
            role="button"
            tabIndex={0}
            aria-label="Pilih detail Tahap 02 3K Page Indexer"
            aria-pressed={selectedStage === "02"}
            onClick={() => setSelectedStage("02")}
            onMouseEnter={() => setHoverStage("02")}
            onMouseLeave={() => setHoverStage(null)}
            onKeyDown={handleSvgStageKeyDown("02")}
            className="cursor-pointer focus:outline-none"
          >
            <polyline points="396,50 344,50 272,162" fill="none" stroke="#111111" strokeWidth={1.7} />
            <circle cx={272} cy={162} r={3.8} fill="#facc15" stroke="#111111" strokeWidth={1.6} />
            <rect
              x={396}
              y={30}
              width={154}
              height={38}
              fill={selectedStage === "02" ? "#facc15" : "#ffffff"}
              stroke="#111111"
              strokeWidth={2}
            />
            <text x={404} y={45} fill="#111111" fontSize="8.5" fontWeight="900" fontFamily="monospace">
              [02] ~3K PAGE INDEXER
            </text>
            <text x={404} y={59} fill="#111111" fontSize="7.5" fontWeight="700" fontFamily="monospace">
              {telemetry.totalChunks} CHUNKS · SLICER
            </text>
          </g>

          {/* [03] LILAC CARTRIDGE BAY (Bottom Right) */}
          <g
            role="button"
            tabIndex={0}
            aria-label="Pilih detail Tahap 03 Lilac Cartridge Bay"
            aria-pressed={selectedStage === "03"}
            onClick={() => setSelectedStage("03")}
            onMouseEnter={() => setHoverStage("03")}
            onMouseLeave={() => setHoverStage(null)}
            onKeyDown={handleSvgStageKeyDown("03")}
            className="cursor-pointer focus:outline-none"
          >
            <polyline points="392,314 366,314 336,266" fill="none" stroke="#111111" strokeWidth={1.7} />
            <circle cx={336} cy={266} r={3.8} fill="#c4b5fd" stroke="#111111" strokeWidth={1.6} />
            <rect
              x={392}
              y={294}
              width={158}
              height={38}
              fill={selectedStage === "03" ? "#c4b5fd" : "#ffffff"}
              stroke="#111111"
              strokeWidth={2}
            />
            <text x={400} y={309} fill="#111111" fontSize="8.5" fontWeight="900" fontFamily="monospace">
              [03] LILAC CARTRIDGE
            </text>
            <text x={400} y={323} fill="#111111" fontSize="7.5" fontWeight="700" fontFamily="monospace">
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
            { id: "02", short: "02 INDEXER", activeBg: "bg-[#facc15]" },
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
            ~3K Indexer
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="h-2.5 w-2.5 border border-[#111111] bg-[#c4b5fd]" aria-hidden="true" />
            <Cpu className="h-3 w-3" aria-hidden="true" />
            Cartridge Bay
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
