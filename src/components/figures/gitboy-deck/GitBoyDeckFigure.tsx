"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Layers, Sparkles, Lock, RefreshCw, BookOpen, CheckCircle2 } from "lucide-react";
import type { StudyMaterialSummary } from "@/components/QuestRoadmapTrack";

export type QuestStageId = "01" | "02" | "03" | "04";

export interface GitBoyTelemetry {
  streak: number;
  executedToday: boolean;
  repoCount: number;
  allowedCount: number;
  protectedCount: number;
  activeMaterial: StudyMaterialSummary | null;
  suggestionCount: number;
}

interface GitBoyDeckFigureProps {
  telemetry: GitBoyTelemetry;
  selectedStage: QuestStageId;
  onSelectStage: (stage: QuestStageId) => void;
}

/* ISOMETRIC 3D -> 2D PROJECTION HELPERS Standard 30-degree isometric axes centered at (260, 215) */
const COS30 = 0.8660254;
const SIN30 = 0.5;
const ORIGIN_X = 258;
const ORIGIN_Y = 224;

function iso(x: number, y: number, z: number): [number, number] {
  const sx = ORIGIN_X + (x - y) * COS30;
  const sy = ORIGIN_Y + (x + y) * SIN30 - z;
  return [Math.round(sx * 10) / 10, Math.round(sy * 10) / 10];
}

function pts(list: Array<[number, number, number]>): string {
  return list.map(([x, y, z]) => iso(x, y, z).join(",")).join(" ");
}

/** Draws an isometric solid box with top, right (+x), and left (+y) visible faces */
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

const STAGE_ORDER: QuestStageId[] = ["01", "02", "03", "04"];

export function GitBoyDeckFigure({
  telemetry,
  selectedStage,
  onSelectStage,
}: GitBoyDeckFigureProps) {
  const [exploded, setExploded] = React.useState(false);
  const [cartHover, setCartHover] = React.useState(false);

  const isDone = telemetry.executedToday;
  const activeMat = telemetry.activeMaterial;
  const chunkLabel = activeMat
    ? `BAB ${(activeMat.currentChunkIndex % Math.max(activeMat.totalChunks, 1)) + 1}/${activeMat.totalChunks}`
    : "NO CODEX";
  const shortMatTitle = activeMat
    ? activeMat.title.length > 12
      ? `${activeMat.title.slice(0, 12).toUpperCase()}…`
      : activeMat.title.toUpperCase()
    : "STUDY CART";

  // Screen text matrix projected onto the front/top face of the tilted console
  const screenOrigin = iso(-28, -42, 33);
  const lcdFill = isDone ? "#86efac" : "#fef08a";
  const cartLiftY = exploded ? -46 : selectedStage === "02" || cartHover ? -20 : 0;
  const cartShiftX = exploded ? 24 : 0;

  // Stage metadata for micro status bar
  const stageMeta: Record<
    QuestStageId,
    { label: string; metric: string; status: string; bg: string }
  > = {
    "01": {
      label: "01 · SYNC PORT",
      metric: `${telemetry.repoCount} REPO (${telemetry.allowedCount} ALLOWED)`,
      status: telemetry.repoCount > 0 ? "LINKED" : "WAIT SYNC",
      bg: "bg-[#60a5fa]",
    },
    "02": {
      label: "02 · STUDY CART",
      metric: activeMat ? `${shortMatTitle} · ${chunkLabel}` : "BELUM ADA MATERI",
      status: activeMat ? "LOADED" : "EMPTY SLOT",
      bg: "bg-[#c4b5fd]",
    },
    "03": {
      label: "03 · AI CORE",
      metric: `${telemetry.suggestionCount} QUEST READY`,
      status: telemetry.suggestionCount > 0 || isDone ? "ONLINE" : "STANDBY",
      bg: "bg-[#facc15]",
    },
    "04": {
      label: "04 · COMMIT & GUARD",
      metric: `STREAK ${telemetry.streak}D · PRIV LOCK ${telemetry.protectedCount}`,
      status: isDone ? "DONE!" : "PENDING",
      bg: isDone ? "bg-[#4ade80]" : "bg-[#fb7185]",
    },
  };

  const currentMeta = stageMeta[selectedStage];

  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    const idx = STAGE_ORDER.indexOf(selectedStage);
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      onSelectStage(STAGE_ORDER[(idx + 1) % STAGE_ORDER.length]);
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      onSelectStage(STAGE_ORDER[(idx - 1 + STAGE_ORDER.length) % STAGE_ORDER.length]);
    } else if (e.key.toLowerCase() === "e") {
      e.preventDefault();
      setExploded((prev) => !prev);
    }
  }

  const springCfg = { type: "spring" as const, stiffness: 270, damping: 24 };

  return (
    <section
      aria-label="FIG 01 GITBOY-01 Commit Deck Anatomy"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      className="nb-card flex flex-col overflow-hidden bg-[#fcfbf7] focus:outline-none"
    >
      {/* Top Neo-Brutalist Panel Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b-3 border-[#111111] bg-white px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="border-2 border-[#111111] bg-[#facc15] px-2 py-0.5 font-mono text-[11px] font-black uppercase text-[#111111] shadow-[2px_2px_0_0_#111111]">
            FIG 01
          </span>
          <h2 className="font-mono text-xs font-black uppercase tracking-wide text-[#111111] sm:text-sm">
            GITBOY-01 · COMMIT DECK
          </h2>
        </div>

        <button
          type="button"
          onClick={() => setExploded((prev) => !prev)}
          aria-pressed={exploded}
          className={`nb-btn-sm inline-flex min-h-[44px] cursor-pointer items-center gap-1.5 px-2.5 py-1 font-mono text-[11px] font-extrabold uppercase sm:min-h-[34px] ${
            exploded
              ? "bg-[#111111] text-[#facc15]"
              : "bg-[#facc15] text-[#111111]"
          }`}
        >
          <Layers className="h-3.5 w-3.5" aria-hidden="true" />
          <span>{exploded ? "ASSEMBLE" : "EXPLODE VIEW"}</span>
        </button>
      </div>

      {/* Technical Dot-Grid Isometric Canvas */}
      <div
        className="relative flex-1 overflow-hidden px-2 py-2"
        style={{
          backgroundColor: "#fcfbf7",
          backgroundImage: "radial-gradient(#d4d4ce 1.25px, transparent 1.25px)",
          backgroundSize: "16px 16px",
        }}
      >
        <svg
          viewBox="0 0 520 355"
          className="h-auto w-full select-none"
          role="img"
          aria-label="Diagram anatomi isometrik konsol retro GITBOY-01 dengan kaset Study Material, papan PCB AI Core, layar LCD, tombol Sync/Commit, dan saklar Private Guard."
        >
          {/* Ground Hard Shadow */}
          <polygon
            points={pts([
              [-52, -74, -18],
              [58, -74, -18],
              [58, 78, -18],
              [-52, 78, -18],
            ])}
            fill="#111111"
            fillOpacity="0.12"
          />

          {/* Layer 1: back casing shell */}
          <motion.g
            animate={exploded ? { x: 46, y: 24 } : { x: 0, y: 0 }}
            transition={springCfg}
          >
            {/* Rear Yellow-Ochre Shell */}
            <IsoBox
              x={-54}
              y={-76}
              z={-12}
              w={108}
              d={152}
              h={14}
              topFill="#eab308"
              rightFill="#ca8a04"
              leftFill="#eab308"
              strokeWidth={2}
            />
            {/* Cartridge Slot Recess on Top Edge */}
            <polygon
              points={pts([
                [-32, -76, 2],
                [32, -76, 2],
                [32, -60, 2],
                [-32, -60, 2],
              ])}
              fill="#18181b"
              stroke="#111111"
              strokeWidth={1.5}
            />
            {/* Back Label Plate */}
            <polygon
              points={pts([
                [-30, 12, 2.3],
                [30, 12, 2.3],
                [30, 48, 2.3],
                [-30, 48, 2.3],
              ])}
              fill="#fef9c3"
              stroke="#111111"
              strokeWidth={1.25}
            />
          </motion.g>

          {/* [02] study cartridge (lilac — slides out on hover/select/explode) */}
          <motion.g
            animate={{ x: cartShiftX, y: cartLiftY }}
            transition={springCfg}
            onMouseEnter={() => {
              setCartHover(true);
              onSelectStage("02");
            }}
            onMouseLeave={() => setCartHover(false)}
            onClick={() => onSelectStage("02")}
            className="cursor-pointer"
          >
            {/* Gold Edge Connector Pins (visible when lifted/exploded) */}
            <IsoBox
              x={-24}
              y={-72}
              z={-10}
              w={48}
              d={10}
              h={10}
              topFill="#15803d"
              rightFill="#166534"
              leftFill="#14532d"
              strokeWidth={1.25}
            />
            {[-18, -10, -2, 6, 14].map((px) => (
              <polygon
                key={px}
                points={pts([
                  [px, -62, -9],
                  [px + 4, -62, -9],
                  [px + 4, -62, -2],
                  [px, -62, -2],
                ])}
                fill="#facc15"
                stroke="#111111"
                strokeWidth={0.8}
              />
            ))}

            {/* Main Lilac Cartridge Shell */}
            <IsoBox
              x={-34}
              y={-114}
              z={-2}
              w={68}
              d={52}
              h={16}
              topFill="#c4b5fd"
              rightFill="#a78bfa"
              leftFill="#b794f4"
              strokeWidth={2}
            />
            {/* Top Grip Grooves */}
            {[-108, -103, -98].map((gy) => (
              <polyline
                key={gy}
                points={pts([
                  [-28, gy, 14.3],
                  [28, gy, 14.3],
                ])}
                fill="none"
                stroke="#111111"
                strokeWidth={1.25}
              />
            ))}
            {/* White Cartridge Sticker Label */}
            <polygon
              points={pts([
                [-26, -93, 14.4],
                [26, -93, 14.4],
                [26, -66, 14.4],
                [-26, -66, 14.4],
              ])}
              fill="#ffffff"
              stroke="#111111"
              strokeWidth={1.5}
            />
            {/* Sticker Color Accent Band */}
            <polygon
              points={pts([
                [-26, -93, 14.5],
                [26, -93, 14.5],
                [26, -86, 14.5],
                [-26, -86, 14.5],
              ])}
              fill={selectedStage === "02" ? "#facc15" : "#c4b5fd"}
              stroke="#111111"
              strokeWidth={1.2}
            />
            {/* Cartridge Sticker Text */}
            <g
              transform={`translate(${iso(-16, -79, 14.8)[0]}, ${iso(-16, -79, 14.8)[1]}) rotate(30) skewX(-30)`}
            >
              <text
                x={0}
                y={0}
                fill="#111111"
                fontSize="6.5"
                fontWeight="900"
                fontFamily="monospace"
              >
                {chunkLabel}
              </text>
            </g>
          </motion.g>

          {/* Layer 2: internal green pcb & gemini ai core chip */}
          <motion.g
            animate={
              exploded
                ? { x: 0, y: 0, opacity: 1 }
                : { x: 0, y: 0, opacity: 0 }
            }
            transition={springCfg}
            style={{ pointerEvents: exploded ? "auto" : "none" }}
            onClick={() => onSelectStage("03")}
            className="cursor-pointer"
          >
            {/* Main Green PCB Slab */}
            <IsoBox
              x={-48}
              y={-68}
              z={6}
              w={96}
              d={136}
              h={6}
              topFill="#15803d"
              rightFill="#166534"
              leftFill="#14532d"
              strokeWidth={1.8}
            />

            {/* Gold Copper Traces */}
            <g fill="none" stroke="#facc15" strokeWidth={1.6} strokeLinecap="square">
              <polyline
                points={pts([
                  [-34, -50, 12.4],
                  [-14, -50, 12.4],
                  [-14, -18, 12.4],
                ])}
              />
              <polyline
                points={pts([
                  [34, -46, 12.4],
                  [18, -46, 12.4],
                  [18, -14, 12.4],
                ])}
              />
              <polyline
                points={pts([
                  [-32, 34, 12.4],
                  [-12, 34, 12.4],
                  [-12, 12, 12.4],
                ])}
              />
              <polyline
                points={pts([
                  [32, 40, 12.4],
                  [14, 40, 12.4],
                  [14, 12, 12.4],
                ])}
              />
            </g>

            {/* Gold Solder Pads */}
            {[
              [-34, -50],
              [34, -46],
              [-32, 34],
              [32, 40],
            ].map(([vx, vy], idx) => {
              const [cx, cy] = iso(vx, vy, 12.5);
              return (
                <circle
                  key={idx}
                  cx={cx}
                  cy={cy}
                  r={2.5}
                  fill="#facc15"
                  stroke="#111111"
                  strokeWidth={1}
                />
              );
            })}

            {/* Central Black GEMINI AI CORE IC Chip */}
            <IsoBox
              x={-20}
              y={-22}
              z={12}
              w={40}
              d={40}
              h={8}
              topFill="#111111"
              rightFill="#27272a"
              leftFill="#18181b"
              strokeWidth={1.6}
            />
            {/* Pulsing AI Core Indicator on Chip — only animates when Explode View is open */}
            <motion.polygon
              animate={exploded ? { opacity: [0.55, 1, 0.55] } : { opacity: 1 }}
              transition={exploded ? { duration: 1.8, repeat: Infinity, ease: "easeInOut" } : { duration: 0.15 }}
              points={pts([
                [-8, -10, 20.4],
                [8, -10, 20.4],
                [8, 6, 20.4],
                [-8, 6, 20.4],
              ])}
              fill={isDone ? "#4ade80" : "#facc15"}
              stroke="#ffffff"
              strokeWidth={0.9}
            />
            <g
              transform={`translate(${iso(-13, 11, 20.6)[0]}, ${iso(-13, 11, 20.6)[1]}) rotate(30) skewX(-30)`}
            >
              <text
                x={0}
                y={0}
                fill="#facc15"
                fontSize="5.2"
                fontWeight="900"
                fontFamily="monospace"
              >
                AI CORE
              </text>
            </g>
          </motion.g>

          {/* Layer 3: front neo-brutalist yellow casing + lcd + controls */}
          <motion.g
            animate={exploded ? { x: -52, y: -26 } : { x: 0, y: 0 }}
            transition={springCfg}
          >
            {/* Main Yellow Front Shell */}
            <IsoBox
              x={-54}
              y={-76}
              z={2}
              w={108}
              d={152}
              h={26}
              topFill="#facc15"
              rightFill="#eab308"
              leftFill="#facc15"
              strokeWidth={2}
            />

            {/* Cream Inner Face Bevel */}
            <polygon
              points={pts([
                [-47, -68, 28.4],
                [47, -68, 28.4],
                [47, 68, 28.4],
                [-47, 68, 28.4],
              ])}
              fill="#fef9c3"
              stroke="#111111"
              strokeWidth={1.35}
            />

            {/* [01] LEFT-SIDE SYNC PORT */}
            <g
              onClick={() => onSelectStage("01")}
              onMouseEnter={() => onSelectStage("01")}
              className="cursor-pointer"
            >
              <IsoBox
                x={-60}
                y={-20}
                z={10}
                w={6}
                d={24}
                h={11}
                topFill="#60a5fa"
                rightFill="#3b82f6"
                leftFill="#2563eb"
                strokeWidth={1.6}
              />
              {/* Port Active LED */}
              <circle
                cx={iso(-57, -8, 22)[0]}
                cy={iso(-57, -8, 22)[1]}
                r={3.2}
                fill={selectedStage === "01" || telemetry.repoCount > 0 ? "#60a5fa" : "#e5e7eb"}
                stroke="#111111"
                strokeWidth={1.2}
              />
            </g>

            {/* [03] BLACK LCD BEZEL & DYNAMIC SCREEN */}
            <g
              onClick={() => onSelectStage("03")}
              onMouseEnter={() => onSelectStage("03")}
              className="cursor-pointer"
            >
              <IsoBox
                x={-41}
                y={-60}
                z={28}
                w={82}
                d={62}
                h={4}
                topFill="#111111"
                rightFill="#18181b"
                leftFill="#27272a"
                strokeWidth={1.8}
              />
              {/* LCD Glass Face */}
              <polygon
                points={pts([
                  [-34, -52, 32.3],
                  [34, -52, 32.3],
                  [34, -6, 32.3],
                  [-34, -6, 32.3],
                ])}
                fill={lcdFill}
                stroke="#111111"
                strokeWidth={1.4}
              />
              {/* Subtle LCD Scanlines */}
              {[-42, -32, -22, -12].map((ly) => (
                <polyline
                  key={ly}
                  points={pts([
                    [-33, ly, 32.4],
                    [33, ly, 32.4],
                  ])}
                  stroke="#111111"
                  strokeOpacity="0.1"
                  strokeWidth={0.9}
                />
              ))}
              {/* Screen Live Telemetry Text in Isometric Plane */}
              <g transform={`translate(${screenOrigin[0]}, ${screenOrigin[1]}) rotate(30) skewX(-30)`}>
                <text
                  x={0}
                  y={0}
                  fill="#111111"
                  fontSize="7"
                  fontWeight="900"
                  fontFamily="monospace"
                >
                  {isDone ? `STREAK:${telemetry.streak}D` : "GITBOY-01"}
                </text>
                <text
                  x={0}
                  y={10}
                  fill="#111111"
                  fontSize="6.5"
                  fontWeight="800"
                  fontFamily="monospace"
                >
                  {isDone ? "DONE! 1/1" : `${telemetry.suggestionCount} QUESTS`}
                </text>
                <text
                  x={0}
                  y={20}
                  fill="#111111"
                  fontSize="5.8"
                  fontWeight="700"
                  fontFamily="monospace"
                >
                  {`REPO:${telemetry.repoCount} OK`}
                </text>
              </g>
              {/* Screen Power LED */}
              <circle
                cx={iso(-37, -30, 32.5)[0]}
                cy={iso(-37, -30, 32.5)[1]}
                r={2.5}
                fill={isDone ? "#4ade80" : "#fb7185"}
                stroke="#111111"
                strokeWidth={1}
              />
            </g>

            {/* D-PAD (BOTTOM LEFT — #18181b) */}
            <g>
              <IsoBox
                x={-34}
                y={22}
                z={28}
                w={26}
                d={10}
                h={5}
                topFill="#18181b"
                rightFill="#09090b"
                leftFill="#27272a"
                strokeWidth={1.4}
              />
              <IsoBox
                x={-26}
                y={14}
                z={28}
                w={10}
                d={26}
                h={5}
                topFill="#18181b"
                rightFill="#09090b"
                leftFill="#27272a"
                strokeWidth={1.4}
              />
            </g>

            {/* [01] B-BUTTON: SYNC (SKY BLUE #60a5fa) */}
            <motion.g
              animate={selectedStage === "01" ? { y: 3 } : { y: 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 18 }}
              onClick={() => onSelectStage("01")}
              onMouseEnter={() => onSelectStage("01")}
              className="cursor-pointer"
            >
              <IsoBox
                x={4}
                y={30}
                z={28}
                w={14}
                d={14}
                h={6}
                topFill="#60a5fa"
                rightFill="#3b82f6"
                leftFill="#2563eb"
                strokeWidth={1.6}
              />
              <text
                x={iso(11, 37, 35)[0]}
                y={iso(11, 37, 35)[1] + 2}
                textAnchor="middle"
                fill="#111111"
                fontSize="7"
                fontWeight="900"
                fontFamily="monospace"
              >
                B
              </text>
            </motion.g>

            {/* [04] A-BUTTON: COMMIT TRIGGER (MINT GREEN #4ade80) */}
            <motion.g
              animate={selectedStage === "04" ? { y: 3 } : { y: 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 18 }}
              onClick={() => onSelectStage("04")}
              onMouseEnter={() => onSelectStage("04")}
              className="cursor-pointer"
            >
              {isDone && (
                <polygon
                  points={pts([
                    [20, 12, 28.8],
                    [42, 12, 28.8],
                    [42, 34, 28.8],
                    [20, 34, 28.8],
                  ])}
                  fill="none"
                  stroke="#16a34a"
                  strokeWidth={2.2}
                />
              )}
              <IsoBox
                x={24}
                y={16}
                z={28}
                w={14}
                d={14}
                h={6}
                topFill="#4ade80"
                rightFill="#22c55e"
                leftFill="#16a34a"
                strokeWidth={1.6}
              />
              <text
                x={iso(31, 23, 35)[0]}
                y={iso(31, 23, 35)[1] + 2}
                textAnchor="middle"
                fill="#111111"
                fontSize="7"
                fontWeight="900"
                fontFamily="monospace"
              >
                A
              </text>
            </motion.g>

            {/* [04] PRIVATE REPO GUARD SWITCH (CORAL RED #fb7185 ON RIGHT SIDE) */}
            <g
              onClick={() => onSelectStage("04")}
              onMouseEnter={() => onSelectStage("04")}
              className="cursor-pointer"
            >
              <IsoBox
                x={54}
                y={-8}
                z={10}
                w={7}
                d={28}
                h={12}
                topFill="#fb7185"
                rightFill="#f43f5e"
                leftFill="#e11d48"
                strokeWidth={1.6}
              />
              {/* Lit Red Guard LED */}
              <circle
                cx={iso(57, 6, 23.5)[0]}
                cy={iso(57, 6, 23.5)[1]}
                r={3.2}
                fill="#ef4444"
                stroke="#111111"
                strokeWidth={1.2}
              />
            </g>

            {/* Bottom Speaker Grille Slots */}
            {[46, 52, 58].map((sy) => (
              <polyline
                key={sy}
                points={pts([
                  [20, sy, 28.6],
                  [38, sy, 28.6],
                ])}
                stroke="#111111"
                strokeWidth={1.5}
              />
            ))}
          </motion.g>

          {/* Orthogonal callout leader lines & badges ([01] - [04]) */}
          {/* [01] SYNC PORT & B-BUTTON (Bottom Left) */}
          <g
            onClick={() => onSelectStage("01")}
            onMouseEnter={() => onSelectStage("01")}
            className="cursor-pointer"
          >
            <polyline
              points="116,258 158,258 188,238"
              fill="none"
              stroke="#111111"
              strokeWidth={1.6}
            />
            <circle cx={188} cy={238} r={3.5} fill="#60a5fa" stroke="#111111" strokeWidth={1.5} />
            <rect
              x={10}
              y={242}
              width={116}
              height={32}
              fill={selectedStage === "01" ? "#60a5fa" : "#ffffff"}
              stroke="#111111"
              strokeWidth={2}
            />
            <text x={18} y={255} fill="#111111" fontSize="8.5" fontWeight="900" fontFamily="monospace">
              [01] SYNC PORT
            </text>
            <text x={18} y={267} fill="#111111" fontSize="7.5" fontWeight="700" fontFamily="monospace">
              {telemetry.repoCount} REPO · B-BTN
            </text>
          </g>

          {/* [02] STUDY CARTRIDGE (Top Left) */}
          <g
            onClick={() => onSelectStage("02")}
            onMouseEnter={() => onSelectStage("02")}
            className="cursor-pointer"
          >
            <polyline
              points="132,54 218,54 256,88"
              fill="none"
              stroke="#111111"
              strokeWidth={1.6}
            />
            <circle cx={256} cy={88} r={3.5} fill="#c4b5fd" stroke="#111111" strokeWidth={1.5} />
            <rect
              x={10}
              y={36}
              width={126}
              height={34}
              fill={selectedStage === "02" ? "#c4b5fd" : "#ffffff"}
              stroke="#111111"
              strokeWidth={2}
            />
            <text x={18} y={50} fill="#111111" fontSize="8.5" fontWeight="900" fontFamily="monospace">
              [02] STUDY CART
            </text>
            <text x={18} y={62} fill="#111111" fontSize="7.5" fontWeight="700" fontFamily="monospace">
              {chunkLabel}
            </text>
          </g>

          {/* [03] AI CORE & LCD DISPLAY (Top Right) */}
          <g
            onClick={() => onSelectStage("03")}
            onMouseEnter={() => onSelectStage("03")}
            className="cursor-pointer"
          >
            <polyline
              points="384,64 332,64 294,142"
              fill="none"
              stroke="#111111"
              strokeWidth={1.6}
            />
            <circle cx={294} cy={142} r={3.5} fill="#facc15" stroke="#111111" strokeWidth={1.5} />
            <rect
              x={384}
              y={46}
              width={126}
              height={34}
              fill={selectedStage === "03" ? "#facc15" : "#ffffff"}
              stroke="#111111"
              strokeWidth={2}
            />
            <text x={392} y={60} fill="#111111" fontSize="8.5" fontWeight="900" fontFamily="monospace">
              [03] AI CORE
            </text>
            <text x={392} y={72} fill="#111111" fontSize="7.5" fontWeight="700" fontFamily="monospace">
              {telemetry.suggestionCount} QUEST · LCD
            </text>
          </g>

          {/* [04] COMMIT TRIGGER & PRIV GUARD (Bottom Right) */}
          <g
            onClick={() => onSelectStage("04")}
            onMouseEnter={() => onSelectStage("04")}
            className="cursor-pointer"
          >
            <polyline
              points="376,262 340,262 316,222"
              fill="none"
              stroke="#111111"
              strokeWidth={1.6}
            />
            <circle cx={316} cy={222} r={3.5} fill="#fb7185" stroke="#111111" strokeWidth={1.5} />
            <rect
              x={376}
              y={244}
              width={134}
              height={36}
              fill={selectedStage === "04" ? (isDone ? "#4ade80" : "#fb7185") : "#ffffff"}
              stroke="#111111"
              strokeWidth={2}
            />
            <text x={384} y={258} fill="#111111" fontSize="8.5" fontWeight="900" fontFamily="monospace">
              [04] COMMIT+LOCK
            </text>
            <text x={384} y={271} fill="#111111" fontSize="7.5" fontWeight="700" fontFamily="monospace">
              PRIV:LOCK ({telemetry.protectedCount})
            </text>
          </g>
        </svg>
      </div>

      {/* Accessible Native Keyboard/Touch Stage Selector */}
      <div
        role="tablist"
        aria-label="Pilih komponen anatomi GITBOY-01"
        className="grid grid-cols-4 divide-x-2 divide-[#111111] border-t-3 border-[#111111] bg-[#F5F0E8] font-mono text-[10px]"
      >
        {(
          [
            { id: "01", short: "01 SYNC", activeBg: "bg-[#60a5fa]" },
            { id: "02", short: "02 CART", activeBg: "bg-[#c4b5fd]" },
            { id: "03", short: "03 AI", activeBg: "bg-[#facc15]" },
            { id: "04", short: "04 PUSH", activeBg: isDone ? "bg-[#4ade80]" : "bg-[#fb7185]" },
          ] as const
        ).map((tab) => {
          const active = selectedStage === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onSelectStage(tab.id)}
              className={`min-h-[44px] cursor-pointer px-2 py-1.5 font-extrabold uppercase text-[#111111] transition-colors duration-150 sm:min-h-[32px] ${
                active ? tab.activeBg : "bg-white hover:bg-[#FFF3C4]"
              }`}
            >
              {tab.short}
            </button>
          );
        })}
      </div>

      {/* Micro Live Telemetry Strip (STAGE · METRIC · STATUS) */}
      <div className="grid grid-cols-3 divide-x-2 divide-[#111111] border-t-2 border-[#111111] bg-white font-mono text-[10px]">
        <div className="px-3 py-2">
          <div className="font-bold uppercase text-black/55">STAGE</div>
          <div className="mt-0.5 truncate font-extrabold text-[#111111]">{currentMeta.label}</div>
        </div>
        <div className="px-3 py-2">
          <div className="font-bold uppercase text-black/55">METRIC</div>
          <div className="mt-0.5 truncate font-extrabold text-[#111111]">{currentMeta.metric}</div>
        </div>
        <div className={`px-3 py-2 ${currentMeta.bg}`}>
          <div className="font-bold uppercase text-black/75">STATUS</div>
          <div className="mt-0.5 truncate font-black text-[#111111]">{currentMeta.status}</div>
        </div>
      </div>

      {/* Compact Color-Keyed Legend Footer */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-t-2 border-[#111111] bg-[#F5F0E8] px-4 py-2 font-mono text-[10px] font-bold text-[#111111]">
        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-1">
            <span className="h-2.5 w-2.5 border border-[#111111] bg-[#c4b5fd]" aria-hidden="true" />
            <BookOpen className="h-3 w-3" aria-hidden="true" />
            Study
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="h-2.5 w-2.5 border border-[#111111] bg-[#4ade80]" aria-hidden="true" />
            <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
            Commit
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="h-2.5 w-2.5 border border-[#111111] bg-[#60a5fa]" aria-hidden="true" />
            <RefreshCw className="h-3 w-3" aria-hidden="true" />
            Sync
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="h-2.5 w-2.5 border border-[#111111] bg-[#fb7185]" aria-hidden="true" />
            <Lock className="h-3 w-3" aria-hidden="true" />
            Guard
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
