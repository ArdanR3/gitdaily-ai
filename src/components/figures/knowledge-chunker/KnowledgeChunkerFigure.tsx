"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Layers, FileText, Scissors, Cpu, Sparkles } from "lucide-react";

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
const ORIGIN_X = 278;
const ORIGIN_Y = 212;

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
  strokeWidth = 2,
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
  const [selectedStage, setSelectedStage] = React.useState<ChunkerStageId>("02");
  const [exploded, setExploded] = React.useState(false);

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
      label: "01 · CLIENT PDF INTAKE",
      metric: `${telemetry.totalMaterialsCount} DOKUMEN · ${charsK}`,
      status: telemetry.extracting ? "READING..." : telemetry.totalMaterialsCount > 0 ? "PDFJS READY" : "IDLE",
      bg: "bg-[#86efac]",
    },
    "02": {
      label: "02 · ~3K CHUNK SLICER",
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
  const springCfg = { type: "spring" as const, stiffness: 260, damping: 24 };

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
            KNOWLEDGE CHUNKER · CODEX PIPELINE
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
          viewBox="0 0 560 320"
          className="mx-auto h-auto w-full max-w-[780px] select-none"
          role="img"
          aria-label="Diagram anatomi isometrik mesin Knowledge Chunker: intake PDF browser (hijau mint), pemotong chunk 3.000 karakter (kuning), dan output kaset lilac untuk konsol GITBOY-01."
        >
          {/* Base shadow */}
          <polygon
            points={pts([
              [-128, -42, -16],
              [122, -42, -16],
              [122, 46, -16],
              [-128, 46, -16],
            ])}
            fill="#111111"
            fillOpacity="0.12"
          />

          {/* Heavy benchtop steel baseplate + guide rails */}
          <g>
            {/* Four corner rubber feet */}
            <IsoBox x={-124} y={-38} z={-14} w={12} d={12} h={4} topFill="#27272a" rightFill="#18181b" leftFill="#18181b" strokeWidth={1.6} />
            <IsoBox x={106} y={-38} z={-14} w={12} d={12} h={4} topFill="#27272a" rightFill="#18181b" leftFill="#18181b" strokeWidth={1.6} />
            <IsoBox x={-124} y={30} z={-14} w={12} d={12} h={4} topFill="#27272a" rightFill="#18181b" leftFill="#18181b" strokeWidth={1.6} />
            <IsoBox x={106} y={30} z={-14} w={12} d={12} h={4} topFill="#27272a" rightFill="#18181b" leftFill="#18181b" strokeWidth={1.6} />

            {/* Machined bed plate */}
            <IsoBox
              x={-126}
              y={-40}
              z={-10}
              w={246}
              d={84}
              h={10}
              topFill="#f4f3ee"
              rightFill="#d4d4ce"
              leftFill="#e5e5df"
              strokeWidth={2}
            />

            {/* Twin stainless conveyor rails spanning Intake -> Slicer -> Cartridge */}
            <IsoBox x={-114} y={-20} z={0} w={224} d={6} h={4} topFill="#e4e4e7" rightFill="#a1a1aa" leftFill="#d4d4d8" strokeWidth={1.5} />
            <IsoBox x={-114} y={14} z={0} w={224} d={6} h={4} topFill="#e4e4e7" rightFill="#a1a1aa" leftFill="#d4d4d8" strokeWidth={1.5} />

            {/* Recessed dark feed channel between rails */}
            <polygon
              points={pts([
                [-114, -14, 0.5],
                [110, -14, 0.5],
                [110, 14, 0.5],
                [-114, 14, 0.5],
              ])}
              fill="#27272a"
              stroke="#111111"
              strokeWidth={1.4}
            />

            {/* Calibrated ruler ticks along front edge of bed plate */}
            {Array.from({ length: 17 }).map((_, i) => {
              const rx = -108 + i * 13;
              const major = i % 4 === 0;
              const [x1, y1] = iso(rx, 44, 0);
              const [x2, y2] = iso(rx, major ? 35 : 39, 0);
              return (
                <line
                  key={rx}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke="#111111"
                  strokeWidth={major ? 1.8 : 1.1}
                />
              );
            })}

            {/* Corner hex screws on bed plate */}
            {[
              [-118, -32],
              [112, -32],
              [-118, 36],
              [112, 36],
            ].map(([sx, sy]) => {
              const [cx, cy] = iso(sx, sy, 0);
              return (
                <circle
                  key={`${sx}-${sy}`}
                  cx={cx}
                  cy={cy}
                  r={2.5}
                  fill="#a1a1aa"
                  stroke="#111111"
                  strokeWidth={1.3}
                />
              );
            })}
          </g>

          {/* STAGE 01: CLIENT PDF INTAKE (Mint Green #86efac) */}
          <motion.g
            animate={exploded ? { x: -34, y: -20 } : { x: 0, y: 0 }}
            transition={springCfg}
            role="button"
            tabIndex={0}
            aria-label="Tahap 01 Client PDF Intake: ekstraksi dokumen PDF dan kode di browser dengan pdfjs-dist"
            aria-pressed={selectedStage === "01"}
            onClick={() => setSelectedStage("01")}
            onKeyDown={handleSvgStageKeyDown("01")}
            className="cursor-pointer focus:outline-none"
          >
            {/* Mint Intake Housing Base */}
            <IsoBox
              x={-112}
              y={-30}
              z={4}
              w={64}
              d={60}
              h={26}
              topFill="#86efac"
              rightFill="#22c55e"
              leftFill="#4ade80"
              strokeWidth={2}
            />

            {/* Optical Scanner Slot Window */}
            <IsoBox
              x={-104}
              y={-22}
              z={30}
              w={48}
              d={44}
              h={8}
              topFill="#bbf7d0"
              rightFill="#4ade80"
              leftFill="#86efac"
              strokeWidth={1.8}
            />

            {/* Dark Feed Mouth + Rubber Roller */}
            <polygon
              points={pts([
                [-98, -18, 38],
                [-62, -18, 38],
                [-62, 18, 38],
                [-98, 18, 38],
              ])}
              fill="#18181b"
              stroke="#111111"
              strokeWidth={1.6}
            />

            {/* Stacked PDF / Code Document Sheets entering the intake */}
            <IsoBox
              x={-94}
              y={-14}
              z={40}
              w={28}
              d={28}
              h={6}
              topFill="#ffffff"
              rightFill="#e4e4e7"
              leftFill="#f4f4f5"
              strokeWidth={1.6}
            />
            <IsoBox
              x={-91}
              y={-11}
              z={48}
              w={28}
              d={28}
              h={5}
              topFill="#ffffff"
              rightFill="#e4e4e7"
              leftFill="#f4f4f5"
              strokeWidth={1.6}
            />
            {/* Printed document lines on top sheet */}
            {[0, 6, 12, 18].map((dy) => {
              const [lx1, ly1] = iso(-87, -7 + dy, 53.2);
              const [lx2, ly2] = iso(-68, -7 + dy, 53.2);
              return (
                <line
                  key={dy}
                  x1={lx1}
                  y1={ly1}
                  x2={lx2}
                  y2={ly2}
                  stroke="#111111"
                  strokeWidth={1.3}
                />
              );
            })}
            {/* Corner PDF badge tab on sheet */}
            <IsoBox
              x={-90}
              y={-10}
              z={53}
              w={11}
              d={9}
              h={2}
              topFill="#fb7185"
              rightFill="#e11d48"
              leftFill="#f43f5e"
              strokeWidth={1.3}
            />

            {/* Side knurled feed wheel */}
            <IsoBox
              x={-84}
              y={30}
              z={12}
              w={14}
              d={6}
              h={12}
              topFill="#f4f4f5"
              rightFill="#a1a1aa"
              leftFill="#d4d4d8"
              strokeWidth={1.6}
            />
          </motion.g>

          {/* Sliced text packet traveling from Intake to Slicer */}
          <IsoBox
            x={-44}
            y={-10}
            z={2}
            w={16}
            d={20}
            h={7}
            topFill="#ffffff"
            rightFill="#d4d4d8"
            leftFill="#e4e4e7"
            strokeWidth={1.6}
          />

          {/* STAGE 02: ~3K CHUNK SLICER (Yellow #facc15) */}
          <g
            role="button"
            tabIndex={0}
            aria-label="Tahap 02 3K Chunk Slicer: memotong teks materi menjadi potongan sekitar 3.000 karakter"
            aria-pressed={selectedStage === "02"}
            onClick={() => setSelectedStage("02")}
            onKeyDown={handleSvgStageKeyDown("02")}
            className="cursor-pointer focus:outline-none"
          >
            {/* Rear Steel Guide Post */}
            <IsoBox x={-24} y={-32} z={4} w={10} d={10} h={46} topFill="#e4e4e7" rightFill="#a1a1aa" leftFill="#d4d4d8" strokeWidth={1.7} />
            <IsoBox x={16} y={-32} z={4} w={10} d={10} h={46} topFill="#e4e4e7" rightFill="#a1a1aa" leftFill="#d4d4d8" strokeWidth={1.7} />

            {/* Lower Slicer Anvil Block */}
            <IsoBox
              x={-26}
              y={-28}
              z={4}
              w={56}
              d={56}
              h={16}
              topFill="#fef08a"
              rightFill="#ca8a04"
              leftFill="#eab308"
              strokeWidth={2}
            />

            {/* Three freshly sliced ~3K chunk blocks inside slicer bay */}
            <IsoBox x={-18} y={-12} z={20} w={12} d={24} h={10} topFill="#ffffff" rightFill="#d4d4d8" leftFill="#e4e4e7" strokeWidth={1.6} />
            <IsoBox x={-3} y={-12} z={20} w={12} d={24} h={10} topFill="#fef08a" rightFill="#eab308" leftFill="#facc15" strokeWidth={1.6} />
            <IsoBox x={12} y={-12} z={20} w={12} d={24} h={10} topFill="#e9d5ff" rightFill="#a78bfa" leftFill="#c4b5fd" strokeWidth={1.6} />

            {/* Upper Guillotine Blade Carriage (lifts up in Explode View!) */}
            <motion.g
              animate={exploded ? { y: -32 } : { y: 0 }}
              transition={springCfg}
            >
              {/* Steel cutter blade edge */}
              <IsoBox
                x={-6}
                y={-20}
                z={31}
                w={16}
                d={40}
                h={6}
                topFill="#f4f4f5"
                rightFill="#71717a"
                leftFill="#a1a1aa"
                strokeWidth={1.6}
              />

              {/* Yellow Heavy Press Hood */}
              <IsoBox
                x={-26}
                y={-30}
                z={37}
                w={56}
                d={60}
                h={22}
                topFill="#facc15"
                rightFill="#ca8a04"
                leftFill="#eab308"
                strokeWidth={2}
              />

              {/* Calibrated Scale Strip + Three Status LEDs on top of Slicer */}
              <IsoBox x={-18} y={-20} z={59} w={40} d={16} h={4} topFill="#18181b" rightFill="#111111" leftFill="#27272a" strokeWidth={1.5} />
              {[
                { lx: -10, fill: "#86efac" },
                { lx: 2, fill: "#facc15" },
                { lx: 14, fill: "#c4b5fd" },
              ].map((led) => {
                const [cx, cy] = iso(led.lx, -12, 63.5);
                return (
                  <circle
                    key={led.lx}
                    cx={cx}
                    cy={cy}
                    r={3.2}
                    fill={led.fill}
                    stroke="#111111"
                    strokeWidth={1.3}
                  />
                );
              })}

              {/* Top Brass Knurled Calibration Knob */}
              <IsoBox
                x={-8}
                y={6}
                z={59}
                w={18}
                d={18}
                h={9}
                topFill="#fef08a"
                rightFill="#a16207"
                leftFill="#ca8a04"
                strokeWidth={1.7}
              />
            </motion.g>

            {/* Front Steel Guide Posts (painted in front of carriage) */}
            <IsoBox x={-24} y={22} z={4} w={10} d={10} h={46} topFill="#e4e4e7" rightFill="#a1a1aa" leftFill="#d4d4d8" strokeWidth={1.7} />
            <IsoBox x={16} y={22} z={4} w={10} d={10} h={46} topFill="#e4e4e7" rightFill="#a1a1aa" leftFill="#d4d4d8" strokeWidth={1.7} />
          </g>

          {/* STAGE 03: LILAC CARTRIDGE OUTPUT (Lilac #c4b5fd) */}
          <motion.g
            animate={exploded ? { x: 26, y: -16 } : { x: 0, y: 0 }}
            transition={springCfg}
            role="button"
            tabIndex={0}
            aria-label="Tahap 03 Lilac Cartridge Output: kaset memori terindeks yang siap masuk ke slot GITBOY-01"
            aria-pressed={selectedStage === "03"}
            onClick={() => setSelectedStage("03")}
            onKeyDown={handleSvgStageKeyDown("03")}
            className="cursor-pointer focus:outline-none"
          >
            {/* Dark Docking Cradle on Right Rail */}
            <IsoBox
              x={44}
              y={-28}
              z={4}
              w={64}
              d={56}
              h={14}
              topFill="#27272a"
              rightFill="#111111"
              leftFill="#18181b"
              strokeWidth={2}
            />

            {/* Gold 6-pin Edge Connector Fingers */}
            {Array.from({ length: 6 }).map((_, idx) => (
              <IsoBox
                key={idx}
                x={46}
                y={-18 + idx * 7}
                z={18}
                w={10}
                d={4}
                h={4}
                topFill="#facc15"
                rightFill="#ca8a04"
                leftFill="#eab308"
                strokeWidth={1.2}
              />
            ))}

            {/* Lilac GITBOY-01 Cartridge Shell */}
            <IsoBox
              x={54}
              y={-24}
              z={18}
              w={52}
              d={48}
              h={28}
              topFill="#c4b5fd"
              rightFill="#8b5cf6"
              leftFill="#a78bfa"
              strokeWidth={2}
            />

            {/* Recessed Grip Ribs on Cartridge */}
            {[0, 6, 12].map((dx) => {
              const [gx1, gy1] = iso(90 + dx, -20, 46.2);
              const [gx2, gy2] = iso(90 + dx, 20, 46.2);
              return (
                <line
                  key={dx}
                  x1={gx1}
                  y1={gy1}
                  x2={gx2}
                  y2={gy2}
                  stroke="#111111"
                  strokeWidth={1.6}
                />
              );
            })}

            {/* Printed Cartridge Sticker Label */}
            <polygon
              points={pts([
                [58, -18, 46.3],
                [85, -18, 46.3],
                [85, 18, 46.3],
                [58, 18, 46.3],
              ])}
              fill="#ffffff"
              stroke="#111111"
              strokeWidth={1.6}
            />
            <polygon
              points={pts([
                [58, -18, 46.4],
                [65, -18, 46.4],
                [65, 18, 46.4],
                [58, 18, 46.4],
              ])}
              fill="#facc15"
              stroke="#111111"
              strokeWidth={1.3}
            />

            {/* Eject Lever Switch */}
            <IsoBox
              x={74}
              y={28}
              z={8}
              w={14}
              d={8}
              h={10}
              topFill="#fb7185"
              rightFill="#e11d48"
              leftFill="#f43f5e"
              strokeWidth={1.6}
            />
          </motion.g>

          {/* TECHNICAL LEADER LINES & CALLOUT BADGES */}
          {/* [01] CLIENT PDF INTAKE */}
          <g
            role="button"
            tabIndex={0}
            aria-label="Pilih detail Tahap 01 Client PDF Intake"
            aria-pressed={selectedStage === "01"}
            onClick={() => setSelectedStage("01")}
            onKeyDown={handleSvgStageKeyDown("01")}
            className="cursor-pointer focus:outline-none"
          >
            <polyline points="154,54 188,54 206,118" fill="none" stroke="#111111" strokeWidth={1.7} />
            <circle cx={206} cy={118} r={3.8} fill="#86efac" stroke="#111111" strokeWidth={1.6} />
            <rect
              x={12}
              y={34}
              width={142}
              height={38}
              fill={selectedStage === "01" ? "#86efac" : "#ffffff"}
              stroke="#111111"
              strokeWidth={2}
            />
            <text x={20} y={49} fill="#111111" fontSize="8.5" fontWeight="900" fontFamily="monospace">
              [01] CLIENT PDF INTAKE
            </text>
            <text x={20} y={63} fill="#111111" fontSize="7.5" fontWeight="700" fontFamily="monospace">
              pdfjs-dist · {telemetry.totalMaterialsCount} FILE
            </text>
          </g>

          {/* [02] ~3K CHUNK SLICER */}
          <g
            role="button"
            tabIndex={0}
            aria-label="Pilih detail Tahap 02 3K Chunk Slicer"
            aria-pressed={selectedStage === "02"}
            onClick={() => setSelectedStage("02")}
            onKeyDown={handleSvgStageKeyDown("02")}
            className="cursor-pointer focus:outline-none"
          >
            <polyline points="402,52 332,52 288,128" fill="none" stroke="#111111" strokeWidth={1.7} />
            <circle cx={288} cy={128} r={3.8} fill="#facc15" stroke="#111111" strokeWidth={1.6} />
            <rect
              x={402}
              y={32}
              width={146}
              height={38}
              fill={selectedStage === "02" ? "#facc15" : "#ffffff"}
              stroke="#111111"
              strokeWidth={2}
            />
            <text x={410} y={47} fill="#111111" fontSize="8.5" fontWeight="900" fontFamily="monospace">
              [02] ~3K CHUNK SLICER
            </text>
            <text x={410} y={61} fill="#111111" fontSize="7.5" fontWeight="700" fontFamily="monospace">
              {telemetry.totalChunks} CHUNKS · 3K CHAR
            </text>
          </g>

          {/* [03] LILAC CARTRIDGE OUTPUT */}
          <g
            role="button"
            tabIndex={0}
            aria-label="Pilih detail Tahap 03 Lilac Cartridge Output"
            aria-pressed={selectedStage === "03"}
            onClick={() => setSelectedStage("03")}
            onKeyDown={handleSvgStageKeyDown("03")}
            className="cursor-pointer focus:outline-none"
          >
            <polyline points="402,272 372,272 350,222" fill="none" stroke="#111111" strokeWidth={1.7} />
            <circle cx={350} cy={222} r={3.8} fill="#c4b5fd" stroke="#111111" strokeWidth={1.6} />
            <rect
              x={402}
              y={254}
              width={146}
              height={38}
              fill={selectedStage === "03" ? "#c4b5fd" : "#ffffff"}
              stroke="#111111"
              strokeWidth={2}
            />
            <text x={410} y={269} fill="#111111" fontSize="8.5" fontWeight="900" fontFamily="monospace">
              [03] LILAC CARTRIDGE
            </text>
            <text x={410} y={283} fill="#111111" fontSize="7.5" fontWeight="700" fontFamily="monospace">
              GITBOY-01 · {activeBab}
            </text>
          </g>
        </svg>
      </div>

      {/* Accessible Native Keyboard/Touch Stage Selector */}
      <div
        role="tablist"
        aria-label="Pilih tahap anatomi Knowledge Chunker"
        className="grid grid-cols-3 divide-x-2 divide-[#111111] border-t-3 border-[#111111] bg-[#F5F0E8] font-mono text-[10px]"
      >
        {(
          [
            { id: "01", short: "01 INTAKE", activeBg: "bg-[#86efac]" },
            { id: "02", short: "02 SLICER", activeBg: "bg-[#facc15]" },
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
            <FileText className="h-3 w-3" aria-hidden="true" />
            PDF Intake
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="h-2.5 w-2.5 border border-[#111111] bg-[#facc15]" aria-hidden="true" />
            <Scissors className="h-3 w-3" aria-hidden="true" />
            ~3K Slicer
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="h-2.5 w-2.5 border border-[#111111] bg-[#c4b5fd]" aria-hidden="true" />
            <Cpu className="h-3 w-3" aria-hidden="true" />
            GITBOY Cart
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
