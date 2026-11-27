import * as k from "../../iso/iso-kit";

export const WIDTH = 640;
export const HEIGHT = 360;

export const PLATE = { x: -136, y: -66, w: 278, d: 132, r: 8 };
export const PLATE_H = 12;
export const FOOT_H = 5;

export const MAG = { x: -118, y: -22, w: 46, d: 44, r: 3 };
export const MAG_H = 24;
export const POST: [number, number] = [-102, 0];
export const POST_TOP = 124;
export const CLAMP_Z = 102;

export const DIAL: [number, number] = [66, 0];
export const DIAL_R = 20;
export const DIAL_Z = 84;
export const DIAL_H = 10;
export const DIAL_TOP = DIAL_Z + DIAL_H;
export const PER_TURN = 28;

export const RAIL_FROM = -2;
export const RAIL_TO = 132;

export const CARRIAGE = { x: -34, y: -24, w: 68, d: 48, r: 3 };
export const CARRIAGE_Z = 3;
export const CARRIAGE_TOP = 8;

export const BLOCK_W = 12;
export const BLOCK_STEP = 15;
export const BLOCK_START_X = -27;
export const TIP_R = 2.5;

export const STOPS = [0, 1, 2, 3].map(
  (idx) => DIAL[0] - (BLOCK_START_X + BLOCK_STEP * idx + BLOCK_W / 2),
);
export const REACH: [number, number] = [STOPS[3] - 6, STOPS[0] + 6];

export const P = k.fitProjection(
  [
    ...k.boxCorners(PLATE, -PLATE_H - FOOT_H, 0),
    [POST[0], POST[1], POST_TOP + 4],
    [DIAL[0] + DIAL_R + 6, 0, DIAL_TOP],
  ],
  WIDTH,
  HEIGHT,
  { pad: 26, azimuth: 42 },
);

export const at = (point: k.Point3) => k.iso(point, P);

const byDepth = (points: Array<[number, number]>) =>
  [...points].sort((a, b) => k.depthOf([a[0], a[1], 0], P) - k.depthOf([b[0], b[1], 0], P));

export interface BaseGeometry {
  halo: string;
  feet: Array<{ outer: k.SolidPaths; inner: k.SolidPaths }>;
  plate: k.SolidPaths;
  groove: string;
  screwRings: string;
  screwDots: k.Flat[];
  strip: k.SolidPaths;
  ticksMinor: string;
  ticksMajor: string;
  stripDots: k.Flat[];
  labelMatrix: string;
}

export function buildBaseGeometry(): BaseGeometry {
  const feet = byDepth(k.corners(PLATE, 22)).map(([x, y]) => ({
    outer: k.cylinder(x, y, 7, -PLATE_H - FOOT_H, 1.6, P, 28),
    inner: k.cylinder(x, y, 5.4, -PLATE_H - FOOT_H + 1.6, FOOT_H - 1.6, P, 28),
  }));

  const screws = k.corners(PLATE, 10);
  const strip = { x: -116, y: PLATE.y + PLATE.d - 15, w: 242, d: 7, r: 1 };
  const ticks = k.topTicks(strip.x + 4, strip.x + strip.w - 4, 4, 5, strip.y + 0.8, 0.6, [2, 3.6], P);

  return {
    halo: k.haloOf(PLATE, -PLATE_H - FOOT_H, PLATE_H, P),
    feet,
    plate: k.slabOf(PLATE, -PLATE_H, PLATE_H, P, 8, 1.6),
    groove: k.planOutline(k.insetPlan(PLATE, 5), 0, P),
    screwRings: screws.map(([x, y]) => k.ring(x, y, 2.2, 0, P, 16)).join(""),
    screwDots: screws.map(([x, y]) => at([x, y, 0])),
    strip: k.slabOf(strip, 0, 0.6, P, 3),
    ticksMinor: ticks.minor,
    ticksMajor: ticks.major,
    stripDots: [
      at([strip.x + 2, strip.y + 3.5, 0.6]),
      at([strip.x + strip.w - 2, strip.y + 3.5, 0.6]),
    ],
    labelMatrix: k.topMatrix([PLATE.x + 26, PLATE.y + 12], 0.2, P, "x"),
  };
}

export interface RailsGeometry {
  rails: Array<{ bar: k.SolidPaths; dots: k.Flat[] }>;
  stops: Array<{ block: k.SolidPaths; dots: k.Flat[] }>;
}

export function buildRailsGeometry(): RailsGeometry {
  const rails = [-20, 15].map((y) => ({
    bar: k.slabOf({ x: RAIL_FROM, y, w: RAIL_TO - RAIL_FROM, d: 5, r: 1 }, 0, 3, P, 3, 0.4),
    dots: [RAIL_FROM + 6, RAIL_TO - 6].map((x) => at([x, y + 2.5, 3])),
  }));

  const stops = [RAIL_FROM - 5, RAIL_TO].map((x) => ({
    block: k.slabOf({ x, y: -23, w: 5, d: 46, r: 1.2 }, 0, 7, P, 3, 0.5),
    dots: [at([x + 2.5, -18, 7]), at([x + 2.5, 18, 7])],
  }));

  return { rails, stops };
}

export interface FixtureGeometry {
  magLower: k.SolidPaths;
  magUpper: k.SolidPaths;
  magInset: string;
  magDots: k.Flat[];
  knob: k.SolidPaths;
  knobKnurl: string;
  knobPointer: string;
  knobDot: k.Flat;
  beaconBase: k.SolidPaths;
  beaconCap: k.SolidPaths;
  wireFrom: k.Flat;
  wireTo: k.Flat;
  wireVia: k.Flat[];
  postCollar: k.SolidPaths;
  postLower: k.SolidPaths;
  postRings: string;
  clamp: k.SolidPaths;
  postUpper: k.SolidPaths;
  postCap: k.SolidPaths;
  arm: k.SolidPaths;
  armDots: k.Flat[];
  thumbNeck: k.SolidPaths;
  thumbKnob: k.SolidPaths;
  thumbKnurl: string;
}

export function buildFixtureGeometry(): FixtureGeometry {
  const knobPos: [number, number] = [MAG.x + 34, MAG.y + 30];
  const beaconPos: [number, number] = [MAG.x + 34, MAG.y + 11];
  const clamp = { x: POST[0] - 7, y: POST[1] - 7, w: 14, d: 14, r: 2.5 };
  const arm = { x: POST[0] + 7, y: -3, w: DIAL[0] - DIAL_R - POST[0] - 7 + 2, d: 6, r: 2 };
  const thumb = [clamp.x + 7, clamp.y + clamp.d + 3];

  return {
    magLower: k.slabOf(MAG, 0, 11, P, 6, 0.8),
    magUpper: k.slabOf(k.insetPlan(MAG, 0.8), 11, MAG_H - 11, P, 6, 0.8),
    magInset: k.planOutline(k.insetPlan(MAG, 3), MAG_H, P),
    magDots: [
      at([MAG.x + 5, MAG.y + 5, MAG_H]),
      at([MAG.x + 5, MAG.y + MAG.d - 5, MAG_H]),
    ],
    knob: k.cylinder(knobPos[0], knobPos[1], 6, MAG_H, 4, P, 32),
    knobKnurl: k.knurl(knobPos[0], knobPos[1], 6, MAG_H, MAG_H + 4, 36, P),
    knobPointer: k.lineOnTop(knobPos, [knobPos[0] + 6, knobPos[1]], MAG_H + 4, P),
    knobDot: at([knobPos[0], knobPos[1], MAG_H + 4]),
    beaconBase: k.cylinder(beaconPos[0], beaconPos[1], 4.2, MAG_H, 3, P, 24),
    beaconCap: k.cylinder(beaconPos[0], beaconPos[1], 2.8, MAG_H + 3, 4.5, P, 24),
    wireFrom: at([beaconPos[0] + 3, beaconPos[1], MAG_H + 1.5]),
    wireTo: at([DIAL[0] - DIAL_R - 4, 0, DIAL_Z + 4]),
    wireVia: [
      at([POST[0] + 8, beaconPos[1], MAG_H + 1.5]),
      at([POST[0] + 8, 0, CLAMP_Z + 2]),
    ],
    postCollar: k.cylinder(POST[0], POST[1], 5, MAG_H, 4, P, 28),
    postLower: k.cylinder(POST[0], POST[1], 3.2, MAG_H + 4, CLAMP_Z - 4 - MAG_H - 4, P, 28),
    postRings: [60, 80].map((z) => k.sideArc(POST[0], POST[1], 3.2, z, P, 16)).join(""),
    clamp: k.slabOf(clamp, CLAMP_Z - 4, 12, P, 4, 0.6),
    postUpper: k.cylinder(POST[0], POST[1], 3.2, CLAMP_Z + 8, POST_TOP - CLAMP_Z - 8, P, 28),
    postCap: k.cylinder(POST[0], POST[1], 3.8, POST_TOP, 2, P, 28),
    arm: k.slabOf(arm, CLAMP_Z, 4, P, 4, 0.5),
    armDots: [at([arm.x + 4, 0, CLAMP_Z + 4]), at([arm.x + arm.w - 5, 0, CLAMP_Z + 4])],
    thumbNeck: k.slabOf(
      { x: thumb[0] - 1.4, y: clamp.y + clamp.d, w: 2.8, d: 3, r: 0.8 },
      CLAMP_Z + 1,
      4,
      P,
      2,
    ),
    thumbKnob: k.cylinder(thumb[0], thumb[1] + 1.4, 2.6, CLAMP_Z, 6, P, 20),
    thumbKnurl: k.knurl(thumb[0], thumb[1] + 1.4, 2.6, CLAMP_Z, CLAMP_Z + 6, 18, P),
  };
}

export interface CarriageGeometry {
  halo: string;
  body: k.SolidPaths;
  dots: k.Flat[];
  railGrooveA: string;
  railGrooveB: string;
  handleNeck: k.SolidPaths;
  handleKnob: k.SolidPaths;
  handleKnurl: string;
}

export function buildCarriageGeometry(): CarriageGeometry {
  const handle = [CARRIAGE.x + CARRIAGE.w - 8, CARRIAGE.y + CARRIAGE.d + 3];
  return {
    halo: k.haloOf(k.insetPlan(CARRIAGE, 3), CARRIAGE_Z, 0.1, P),
    body: k.slabOf(CARRIAGE, CARRIAGE_Z, CARRIAGE_TOP - CARRIAGE_Z, P, 5, 0.6),
    dots: [-24, -8, 8, 24].map((x) => at([x, CARRIAGE.y + CARRIAGE.d - 2.6, CARRIAGE_TOP])),
    railGrooveA: k.lineOnTop([CARRIAGE.x, -15.5], [CARRIAGE.x + CARRIAGE.w, -15.5], CARRIAGE_TOP, P),
    railGrooveB: k.lineOnTop([CARRIAGE.x, 15.5], [CARRIAGE.x + CARRIAGE.w, 15.5], CARRIAGE_TOP, P),
    handleNeck: k.slabOf(
      { x: handle[0] - 2, y: CARRIAGE.y + CARRIAGE.d - 1, w: 4, d: 4, r: 1 },
      CARRIAGE_Z + 1,
      3,
      P,
      2,
    ),
    handleKnob: k.cylinder(handle[0], handle[1] + 1, 3, CARRIAGE_Z, 5, P, 20),
    handleKnurl: k.knurl(handle[0], handle[1] + 1, 3, CARRIAGE_Z, CARRIAGE_Z + 5, 18, P),
  };
}

export function buildStageBlocks(heights: [number, number, number, number]) {
  return heights.map((height, index) => {
    const plan = { x: BLOCK_START_X + BLOCK_STEP * index, y: -12, w: BLOCK_W, d: 24, r: 1 };
    return {
      solid: k.slabOf(plan, CARRIAGE_TOP, height, P, 3, 0.5),
      inset: k.planOutline(k.insetPlan(plan, 2), CARRIAGE_TOP + height, P, 3),
    };
  });
}

export function buildPlungerGeometry() {
  return {
    tip: k.cylinder(DIAL[0], DIAL[1], TIP_R, 0, 2.4, P, 20),
    stem: k.cylinder(DIAL[0], DIAL[1], 1.4, 2.4, 52, P, 16),
  };
}

export interface DialGeometry {
  sleeve: k.SolidPaths;
  sleeveRing: string;
  bracket: k.SolidPaths;
  housing: k.SolidPaths;
  bezelKnurl: string;
  bezelArc: string;
  faceRing: string;
  ticksMinor: string;
  ticksMajor: string;
  lugInner: k.SolidPaths;
  lugOuter: k.SolidPaths;
  pivotRing: string;
  textMatrix: string;
}

export function buildDialGeometry(): DialGeometry {
  const [x, y] = DIAL;
  const ticks = k.radialTicks(x, y, DIAL_R - 3, 50, 5, DIAL_TOP, [1.3, 2.8], P);
  return {
    sleeve: k.cylinder(x, y, 2.9, 54, DIAL_Z - 54, P, 20),
    sleeveRing: k.sideArc(x, y, 2.9, 60, P, 12),
    bracket: k.slabOf({ x: x - DIAL_R - 6, y: -4, w: 8, d: 8, r: 1.5 }, DIAL_Z + 2, CLAMP_Z - DIAL_Z - 2, P, 3, 0.4),
    housing: k.cylinder(x, y, DIAL_R, DIAL_Z, DIAL_H, P, 64, 0.8),
    bezelKnurl: k.knurl(x, y, DIAL_R, DIAL_TOP - 3.4, DIAL_TOP, 84, P, 0.3),
    bezelArc: k.sideArc(x, y, DIAL_R, DIAL_TOP - 3.4, P, 40),
    faceRing: k.ring(x, y, DIAL_R - 2.2, DIAL_TOP, P, 64),
    ticksMinor: ticks.minor,
    ticksMajor: ticks.major,
    lugInner: k.slabOf({ x: x + DIAL_R - 1, y: -2.4, w: 5, d: 4.8, r: 1.2 }, DIAL_Z + 2, 5, P, 3),
    lugOuter: k.slabOf({ x: x + DIAL_R + 3.6, y: -3.2, w: 2.6, d: 6.4, r: 1.2 }, DIAL_Z + 1.2, 6.6, P, 3),
    pivotRing: k.ring(x, y, 1.6, DIAL_TOP, P, 16),
    textMatrix: k.topMatrix([x, y + 9], DIAL_TOP, P, "x"),
  };
}

export function needleAt(turn: number): string {
  const angle = turn * Math.PI * 2;
  const [x, y] = DIAL;
  return k.lineOnTop(
    [x - Math.sin(angle) * 3.4, y + Math.cos(angle) * 3.4],
    [x + Math.sin(angle) * (DIAL_R - 4), y - Math.cos(angle) * (DIAL_R - 4)],
    DIAL_TOP + 0.2,
    P,
  );
}

export const BASE_GEO = buildBaseGeometry();
export const RAILS_GEO = buildRailsGeometry();
export const FIXTURE_GEO = buildFixtureGeometry();
export const CARRIAGE_GEO = buildCarriageGeometry();
export const PLUNGER_GEO = buildPlungerGeometry();
export const DIAL_GEO = buildDialGeometry();
