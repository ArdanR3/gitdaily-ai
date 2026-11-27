"use client";

import * as React from "react";
import "../../iso/iso.css";
import "./commit-rig.css";
import * as k from "../../iso/iso-kit";
import { Dots, FaceText, IsoFigure, Line, Plate, Solid, Wire } from "../../iso/react/draw";
import { follow, spring, useLoop, useReadout, useStillness, type Spring } from "../../iso/react/live";
import {
  BASE_GEO,
  BLOCK_START_X,
  BLOCK_STEP,
  BLOCK_W,
  CARRIAGE_GEO,
  CARRIAGE_TOP,
  DIAL,
  DIAL_GEO,
  FIXTURE_GEO,
  HEIGHT,
  needleAt,
  P,
  PER_TURN,
  PLUNGER_GEO,
  RAILS_GEO,
  REACH,
  STOPS,
  TIP_R,
  WIDTH,
  buildStageBlocks,
} from "./geometry";
import {
  type CommitRigTelemetry,
  formatStageReadout,
  getDefaultStageIndex,
  getStageHeights,
} from "./rig";

const clamp = (value: number, low: number, high: number) => Math.min(high, Math.max(low, value));

export function CommitRigFigure({ telemetry }: { telemetry: CommitRigTelemetry }) {
  const heights = React.useMemo(
    () => getStageHeights(telemetry),
    [telemetry.repoCount, telemetry.hasActiveMaterial, telemetry.suggestionCount, telemetry.executedToday],
  );
  const blocks = React.useMemo(() => buildStageBlocks(heights), [heights]);
  const defaultIdx = getDefaultStageIndex(telemetry);

  const stageRef = React.useRef<HTMLDivElement>(null);
  const carriageRef = React.useRef<SVGGElement>(null);
  const plungerRef = React.useRef<SVGGElement>(null);
  const needleRef = React.useRef<SVGPathElement>(null);
  const { anchor, say } = useReadout<HTMLDivElement>();
  const calm = useStillness();

  const xRef = React.useRef(STOPS[defaultIdx]);
  const targetRef = React.useRef(STOPS[defaultIdx]);
  const tipRef = React.useRef<Spring>({ at: CARRIAGE_TOP + heights[defaultIdx], rate: 0 });
  const [active, setActive] = React.useState(false);

  const heightUnder = React.useCallback(
    (cx: number) => {
      let top = CARRIAGE_TOP;
      heights.forEach((height, index) => {
        const from = cx + BLOCK_START_X + BLOCK_STEP * index;
        const to = from + BLOCK_W;
        if (to > DIAL[0] - TIP_R && from < DIAL[0] + TIP_R) {
          top = Math.max(top, CARRIAGE_TOP + height);
        }
      });
      return top;
    },
    [heights],
  );

  const nearestStageIndex = React.useCallback((cx: number) => {
    return STOPS.reduce(
      (best, stop, idx) => (Math.abs(stop - cx) < Math.abs(STOPS[best] - cx) ? idx : best),
      0,
    );
  }, []);

  // Re-target carriage whenever real dashboard telemetry changes
  React.useEffect(() => {
    targetRef.current = STOPS[defaultIdx];
    setActive(true);
  }, [defaultIdx, heights]);

  useLoop(
    (dt, isCalm) => {
      const target = targetRef.current;
      const nextX = follow(xRef.current, target, dt, 0.24, isCalm || calm);
      xRef.current = Math.abs(target - nextX) < 0.01 ? target : nextX;

      const want = heightUnder(xRef.current);
      const settledSpring = spring(tipRef.current, want, dt, 420, 26, isCalm || calm);

      if (carriageRef.current) {
        carriageRef.current.setAttribute("transform", k.translateAlong(P, [xRef.current, 0, 0]));
      }
      if (plungerRef.current) {
        plungerRef.current.setAttribute("transform", k.translateAlong(P, [0, 0, tipRef.current.at]));
      }
      if (needleRef.current) {
        needleRef.current.setAttribute("d", needleAt((tipRef.current.at - CARRIAGE_TOP) / PER_TURN));
      }

      const stageIdx = nearestStageIndex(xRef.current);
      say(formatStageReadout(stageIdx, telemetry));

      const done = xRef.current === target && settledSpring;
      if (done) setActive(false);
      return !done;
    },
    active,
  );

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    const svg = stageRef.current?.querySelector("svg");
    if (!svg) return;
    const box = svg.getBoundingClientRect();
    const share = clamp(((e.clientX - box.left) / box.width - 0.24) / 0.52, 0, 1);
    targetRef.current = REACH[0] + share * (REACH[1] - REACH[0]);
    setActive(true);
  }

  function handlePointerLeave() {
    targetRef.current = STOPS[defaultIdx];
    setActive(true);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    const currentIdx = nearestStageIndex(targetRef.current);
    if (e.key === "ArrowRight" || e.key === "ArrowUp") {
      e.preventDefault();
      targetRef.current = STOPS[Math.min(3, currentIdx + 1)];
      setActive(true);
    } else if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
      e.preventDefault();
      targetRef.current = STOPS[Math.max(0, currentIdx - 1)];
      setActive(true);
    }
  }

  const initialHeight = CARRIAGE_TOP + heights[defaultIdx];
  const initialReadout = formatStageReadout(defaultIdx, telemetry);

  return (
    <div
      ref={anchor}
      className="iso commit-rig-plate"
      data-theme="light"
      data-status={telemetry.executedToday ? "done" : "pending"}
    >
      <Plate
        fig="FIG 01"
        title="Commit Telemetry Rig"
        hint="hover or ←/→ keys to inspect stages"
        readout={initialReadout}
        keys={[
          { mark: "raised", label: "Instrument Base" },
          { mark: "lit", label: telemetry.executedToday ? "Quest Done" : "Active Needle" },
          { mark: "edge", label: "Signal Bus" },
        ]}
        caption={
          <span>
            Instrumen isometrik <code>anatomy</code> yang membaca status nyata{" "}
            <strong>@ArdanR3</strong>: 4 blok tahap (Sync → Study → Quests → Commit) menggerakkan
            plunger &amp; jarum gauge secara fisik.
          </span>
        }
      >
        <div
          ref={stageRef}
          tabIndex={0}
          role="slider"
          aria-label="Inspeksi 4 tahap GitDaily AI pada Commit Telemetry Rig"
          aria-valuemin={1}
          aria-valuemax={4}
          aria-valuenow={defaultIdx + 1}
          onPointerMove={handlePointerMove}
          onPointerLeave={handlePointerLeave}
          onKeyDown={handleKeyDown}
          className="cursor-ew-resize outline-none"
        >
          <IsoFigure
            width={WIDTH}
            height={HEIGHT}
            label="Isometric Commit Telemetry Rig with magnetic base, dial streak gauge, and four sliding stage blocks"
          >
            {/* Base Plate & Feet */}
            <g key="plate">
              <path className="iso-halo" d={BASE_GEO.halo} />
              {BASE_GEO.feet.map((foot, idx) => (
                <React.Fragment key={idx}>
                  <Solid paths={foot.outer} tone="lo" />
                  <Solid paths={foot.inner} tone="mid" />
                </React.Fragment>
              ))}
              <Solid paths={BASE_GEO.plate} tone="mid" />
              <Line d={BASE_GEO.groove} tone="lo" />
              <Line d={BASE_GEO.screwRings} tone="lo" />
              <Dots points={BASE_GEO.screwDots} size={0.5} />
              <Solid paths={BASE_GEO.strip} tone="lo" crease="none" />
              <Line d={BASE_GEO.ticksMinor} tone="lo" />
              <Line d={BASE_GEO.ticksMajor} tone="mid" />
              <Dots points={BASE_GEO.stripDots} size={0.45} />
              <FaceText transform={BASE_GEO.labelMatrix} size={3} tone="mid">
                GITDAILY-RIG
              </FaceText>
            </g>

            {/* Guide Rails */}
            <g key="rails">
              {RAILS_GEO.rails.map((rail, idx) => (
                <React.Fragment key={idx}>
                  <Solid paths={rail.bar} tone="mid" />
                  <Dots points={rail.dots} size={0.4} />
                </React.Fragment>
              ))}
              {RAILS_GEO.stops.map((stop, idx) => (
                <React.Fragment key={idx}>
                  <Solid paths={stop.block} tone="mid" />
                  <Dots points={stop.dots} size={0.45} />
                </React.Fragment>
              ))}
            </g>

            {/* Magnetic Fixture, Post, Beacon & Signal Wire */}
            <g key="fixture">
              <Solid paths={FIXTURE_GEO.magLower} tone="mid" />
              <Solid paths={FIXTURE_GEO.magUpper} tone="mid" />
              <Line d={FIXTURE_GEO.magInset} tone="faint" />
              <Dots points={FIXTURE_GEO.magDots} size={0.45} />
              <Solid paths={FIXTURE_GEO.knob} tone="mid" />
              <Line d={FIXTURE_GEO.knobKnurl} tone="lo" />
              <Line d={FIXTURE_GEO.knobPointer} tone="hi" />
              <Dots points={[FIXTURE_GEO.knobDot]} size={0.5} tone="hi" />
              <Solid paths={FIXTURE_GEO.beaconBase} tone="mid" />
              <Solid paths={FIXTURE_GEO.beaconCap} tone="hi" lit={telemetry.executedToday} />
              <Wire
                from={FIXTURE_GEO.wireFrom}
                via={FIXTURE_GEO.wireVia}
                to={FIXTURE_GEO.wireTo}
                tone="mid"
                flow={telemetry.executedToday}
              />
              <Solid paths={FIXTURE_GEO.postCollar} tone="mid" />
              <Solid paths={FIXTURE_GEO.postLower} tone="mid" crease="none" />
              <Line d={FIXTURE_GEO.postRings} tone="faint" />
              <Solid paths={FIXTURE_GEO.clamp} tone="mid" />
              <Solid paths={FIXTURE_GEO.postUpper} tone="mid" crease="none" />
              <Solid paths={FIXTURE_GEO.postCap} tone="mid" />
              <Solid paths={FIXTURE_GEO.arm} tone="mid" />
              <Dots points={FIXTURE_GEO.armDots} size={0.45} />
              <Solid paths={FIXTURE_GEO.thumbNeck} tone="mid" crease="none" />
              <Solid paths={FIXTURE_GEO.thumbKnob} tone="mid" />
              <Line d={FIXTURE_GEO.thumbKnurl} tone="lo" />
            </g>

            {/* Sliding Carriage + 4 Stage Gauge Blocks */}
            <g
              key="carriage"
              ref={carriageRef}
              transform={k.translateAlong(P, [STOPS[defaultIdx], 0, 0])}
            >
              <path className="iso-halo" d={CARRIAGE_GEO.halo} style={{ filter: "blur(4px)" }} />
              <Solid paths={CARRIAGE_GEO.body} tone="mid" />
              <Dots points={CARRIAGE_GEO.dots} size={0.4} tone="lo" />
              <Line d={CARRIAGE_GEO.railGrooveA} tone="faint" />
              <Line d={CARRIAGE_GEO.railGrooveB} tone="faint" />
              {blocks.map((block, idx) => (
                <React.Fragment key={idx}>
                  <Solid
                    paths={block.solid}
                    tone="hi"
                    crease="lo"
                    lit={idx === 3 && telemetry.executedToday}
                  />
                  <Line d={block.inset} tone="faint" />
                </React.Fragment>
              ))}
              <Solid paths={CARRIAGE_GEO.handleNeck} tone="mid" crease="none" />
              <Solid paths={CARRIAGE_GEO.handleKnob} tone="mid" />
              <Line d={CARRIAGE_GEO.handleKnurl} tone="lo" />
            </g>

            {/* Spring-loaded Plunger */}
            <g
              key="plunger"
              ref={plungerRef}
              transform={k.translateAlong(P, [0, 0, initialHeight])}
            >
              <Solid paths={PLUNGER_GEO.tip} tone="hi" lit />
              <Solid paths={PLUNGER_GEO.stem} tone="hi" crease="none" lit />
            </g>

            {/* Dial Gauge */}
            <g key="dial">
              <Solid paths={DIAL_GEO.sleeve} tone="mid" />
              <Line d={DIAL_GEO.sleeveRing} tone="lo" />
              <Solid paths={DIAL_GEO.bracket} tone="mid" />
              <Solid paths={DIAL_GEO.housing} tone="hi" crease="lo" />
              <Line d={DIAL_GEO.bezelKnurl} tone="lo" />
              <Line d={DIAL_GEO.bezelArc} tone="faint" />
              <Line d={DIAL_GEO.faceRing} tone="lo" />
              <Line d={DIAL_GEO.ticksMinor} tone="lo" />
              <Line d={DIAL_GEO.ticksMajor} tone="mid" />
              <Solid paths={DIAL_GEO.lugInner} tone="mid" />
              <Solid paths={DIAL_GEO.lugOuter} tone="mid" />
              <Line d={DIAL_GEO.pivotRing} tone="mid" />
              <FaceText transform={DIAL_GEO.textMatrix} size={2.3} tone="lo" anchor="middle">
                STREAK
              </FaceText>
            </g>

            {/* Live Dial Needle */}
            <path
              key="needle"
              ref={needleRef}
              className="iso-line"
              data-tone="lit"
              data-free="start"
              d={needleAt((initialHeight - CARRIAGE_TOP) / PER_TURN)}
              style={{ strokeWidth: 1.2 }}
            />
          </IsoFigure>
        </div>
      </Plate>
    </div>
  );
}
