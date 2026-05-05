#!/usr/bin/env node
/**
 * W.A.R H.A.M.S — Soldier 3D Mesh Generator (v36)
 *
 * Procedurally writes a single shared .obj mesh used by all 112 H.A.M.S
 * miniatures. Per-soldier identity is carried by the diffuse texture
 * (squad letter + soldier number printed on the base top).
 *
 * v36 fixes:
 *   • Legs added (2 boxes between base and torso) — soldier no longer
 *     looks like a torso glued to a disc.
 *   • Damage divots are real 3D well/socket geometry on the base top
 *     (octagonal indents with a red interior) — pegs visibly slot in.
 *   • Base top UV horizontally flipped so the printed ID reads left-
 *     to-right when looking down at the figurine from above.
 *
 * Geometry (Y-up, 1 unit ≈ 1 inch; soldiers spawn at 2.5× scale):
 *   • Base disc — 24-sided cylinder, r=0.65, h=0.10
 *   • 3 divot wells on the base front edge (octagonal, r=0.085, depth 0.025)
 *   • Legs    — two boxes 0.16 × 0.30 × 0.20 (W×H×D) at x=±0.10
 *   • Body    — 0.40 × 0.40 × 0.22 above the legs
 *   • Head    — 0.30 × 0.25 × 0.22 above the body
 *   • Arms    — two thin boxes 0.10 × 0.32 × 0.18 flanking the body
 *
 * Diffuse-texture UV layout (matches generate-soldier-figures.js):
 *   • Top half  (v: 0.5–1.0) — base disc viewed from above
 *     (ID label only — divot graphics removed in v36, divots are 3D now)
 *   • Bottom half (v: 0.0–0.5) — solid player color for body/head/arm/rim
 *   • Tiny red square at bottom-left (image y≈260–290, x≈0–32) — sampled
 *     by the divot well INTERIORS so the sockets read as blood-filled.
 */

const fs = require("fs");
const path = require("path");

// Versioned output dir matches SOLDIER_BASE in generate-save.js.
// TTS asset-caches by URL path (ignoring query strings), so we
// publish each iteration at a brand-new path to force re-download.
const VERSION = "v49";
const OUT = path.join(__dirname, VERSION);
if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

// ── Geometry parameters ─────────────────────────────────────────
const BASE_R = 0.65;
const BASE_H = 0.10;
const BASE_SEGS = 24;

// Legs sit on the base, body sits on the legs
const LEG_W = 0.16, LEG_H = 0.30, LEG_D = 0.20;
const LEG_GAP = 0.04;                                           // gap between legs
const LEG_X = (LEG_W / 2) + (LEG_GAP / 2);                      // ±LEG_X

const BODY_W = 0.40, BODY_H = 0.40, BODY_D = 0.22;
const HEAD_W = 0.30, HEAD_H = 0.25, HEAD_D = 0.22;
const ARM_W = 0.10, ARM_H = 0.32, ARM_D = 0.18;

const LEG_Y0 = BASE_H;
const LEG_Y1 = LEG_Y0 + LEG_H;
const BODY_Y0 = LEG_Y1;
const BODY_Y1 = BODY_Y0 + BODY_H;
const HEAD_Y0 = BODY_Y1;
const HEAD_Y1 = HEAD_Y0 + HEAD_H;
const ARM_Y0 = BODY_Y0 + 0.04;
const ARM_Y1 = ARM_Y0 + ARM_H;

// ── Divot well geometry ─────────────────────────────────────────
const DIVOT_SEGS = 8;
const DIVOT_OUTER_R = 0.085;
const DIVOT_INNER_R = 0.052;
const DIVOT_RIM_H = 0.025;                                      // depth of the well rim above base top
const DIVOT_DIST = 0.42;                                        // distance from base center
// Three divots arranged in an arc on the FRONT edge (+Z half) of the base
const DIVOT_CENTERS = [
    { x: -0.36, z: 0.30 },
    { x:  0.00, z: 0.42 },
    { x:  0.36, z: 0.30 },
];

// ── OBJ writer plumbing ─────────────────────────────────────────
const verts = [];
const uvs = [];
const faces = [];

function v(x, y, z) {
    verts.push([x, y, z]);
    return verts.length; // OBJ is 1-indexed
}
function uv(u, t) {
    uvs.push([u, t]);
    return uvs.length;
}
function quad(a, b, c, d, ua, ub, uc, ud) {
    // Two triangles: a-b-c and a-c-d (CCW when viewed from outside)
    faces.push(`f ${a}/${ua} ${b}/${ub} ${c}/${uc}`);
    faces.push(`f ${a}/${ua} ${c}/${uc} ${d}/${ud}`);
}
function tri(a, b, c, ua, ub, uc) {
    faces.push(`f ${a}/${ua} ${b}/${ub} ${c}/${uc}`);
}

// ── UV regions ──────────────────────────────────────────────────
// Top half of texture — base disc seen from above (carries ID label).
// v36: U is flipped (0.5 - x/r * 0.5) so when the player looks down at
// the base from above (camera +Y, +X to the right of screen), the
// printed text reads left-to-right instead of mirrored.
function uvBaseTop(x, z) {
    const u = 0.5 - (x / BASE_R) * 0.5;
    const t = 0.75 + (z / BASE_R) * 0.25;
    return uv(u, t);
}
// Bottom half — solid body color region. Single shared UV.
function uvBody() {
    return uv(0.5, 0.25);
}
// Tiny red zone in the bottom-left of the bottom half (image y∈[260,290],
// x∈[0,32]) painted by generate-soldier-figures.js. Sampled by the well
// interiors so they read as blood-filled sockets.
function uvWellRed() {
    return uv(0.03, 0.45);
}

// Pre-compute reusable UV indices
const uvBodyIdx = uvBody();
const uvWellIdx = uvWellRed();

// ── Build base cylinder (rim + bottom; top is built later with holes) ──
// Bottom ring (y=0), top ring (y=BASE_H), centered on origin
const bottomRing = [];
const topRing = [];
const topRingUVs = [];
for (let i = 0; i < BASE_SEGS; i++) {
    const a = (i / BASE_SEGS) * Math.PI * 2;
    const x = Math.cos(a) * BASE_R;
    const z = Math.sin(a) * BASE_R;
    bottomRing.push(v(x, 0, z));
    topRing.push(v(x, BASE_H, z));
    topRingUVs.push(uvBaseTop(x, z));
}
const bottomCenter = v(0, 0, 0);

// Base BOTTOM fan (rarely seen; uses body UV)
for (let i = 0; i < BASE_SEGS; i++) {
    const a = bottomRing[i];
    const b = bottomRing[(i + 1) % BASE_SEGS];
    tri(bottomCenter, a, b, uvBodyIdx, uvBodyIdx, uvBodyIdx); // -Y normal
}
// Base SIDE rim (band of body color, normals pointing radially outward)
for (let i = 0; i < BASE_SEGS; i++) {
    const i2 = (i + 1) % BASE_SEGS;
    quad(
        bottomRing[i], topRing[i], topRing[i2], bottomRing[i2],
        uvBodyIdx, uvBodyIdx, uvBodyIdx, uvBodyIdx
    );
}

// ── Build base TOP face — fan from center, but 3 circular regions
// around the divot centers are filled by the divot well rims instead.
// The well rim's outer ring sits exactly on the base top plane and
// gets stitched into the fan as if it were the outer edge of a hole.
//
// Strategy: for each fan triangle (topCenter, ringVert[i], ringVert[i+1]),
// check if it overlaps any divot circle. If yes, replace it with a
// "skirt" of triangles routing around the divot's outer ring. This is
// implemented as a per-segment Delaunay-ish stitch that adds a couple
// of triangles fanning from the segment edge to the divot ring.
//
// To keep the geometry simple, we use a coarser approach: put each
// divot strictly between the center and the outer ring, then for the
// 3 fan wedges that contain a divot, replace the simple
// (center → outer) triangle with two triangle strips:
//   center → divot ring (inner side)   — fan from center to divot back
//   divot ring → outer ring (outer side) — strip from divot front to rim
const topCenter = v(0, BASE_H, 0);
const topCenterUV = uvBaseTop(0, 0);

// Build all 3 divot well rings up-front. Each well has:
//   outerBot[i]  — at base top plane (BASE_H), radius DIVOT_OUTER_R
//   outerTop[i]  — at BASE_H + DIVOT_RIM_H (raised lip)
//   innerTop[i]  — at BASE_H + DIVOT_RIM_H, radius DIVOT_INNER_R
//   innerBot[i]  — at BASE_H, radius DIVOT_INNER_R (well floor edge)
//   floorCenter  — at BASE_H, divot center (well floor middle)
const wells = DIVOT_CENTERS.map(({ x: cx, z: cz }) => {
    const outerBot = [], outerTop = [], innerTop = [], innerBot = [];
    for (let i = 0; i < DIVOT_SEGS; i++) {
        const a = (i / DIVOT_SEGS) * Math.PI * 2;
        const ca = Math.cos(a), sa = Math.sin(a);
        outerBot.push(v(cx + ca * DIVOT_OUTER_R, BASE_H,                  cz + sa * DIVOT_OUTER_R));
        outerTop.push(v(cx + ca * DIVOT_OUTER_R, BASE_H + DIVOT_RIM_H,    cz + sa * DIVOT_OUTER_R));
        innerTop.push(v(cx + ca * DIVOT_INNER_R, BASE_H + DIVOT_RIM_H,    cz + sa * DIVOT_INNER_R));
        innerBot.push(v(cx + ca * DIVOT_INNER_R, BASE_H,                  cz + sa * DIVOT_INNER_R));
    }
    const floorCenter = v(cx, BASE_H, cz);
    return { cx, cz, outerBot, outerTop, innerTop, innerBot, floorCenter };
});

// Base TOP fan (from center to ring) with simple triangulation.
// We stitch each divot's outerBot ring as if it were a "hole" by drawing
// triangles from the topCenter to the back-half of the divot's outer ring,
// and from the front-half of the divot's outer ring to the corresponding
// outer-ring points of the base. This is a coarse approximation but
// keeps each divot visually surrounded by base-top material.
// For simplicity (and because the divots are small relative to the disc),
// we draw the FULL fan from topCenter to the base outer ring, then OVERLAY
// each divot's outer rim and walls. The well's outer-rim (outerBot ring)
// sits exactly on the base top plane and visually punches through.
for (let i = 0; i < BASE_SEGS; i++) {
    const a = topRing[i];
    const b = topRing[(i + 1) % BASE_SEGS];
    const ua = topRingUVs[i];
    const ub = topRingUVs[(i + 1) % BASE_SEGS];
    tri(topCenter, b, a, topCenterUV, ub, ua); // wind so normal points +Y
}

// ── Divot wells: rim sides, top annulus, inner walls, red floor ──
for (const w of wells) {
    for (let i = 0; i < DIVOT_SEGS; i++) {
        const i2 = (i + 1) % DIVOT_SEGS;
        // OUTER WALL of the rim — visible from outside, normal radially out
        quad(
            w.outerBot[i], w.outerTop[i], w.outerTop[i2], w.outerBot[i2],
            uvBodyIdx, uvBodyIdx, uvBodyIdx, uvBodyIdx
        );
        // TOP ANNULUS — outer→inner top, faces +Y
        quad(
            w.outerTop[i], w.innerTop[i], w.innerTop[i2], w.outerTop[i2],
            uvBodyIdx, uvBodyIdx, uvBodyIdx, uvBodyIdx
        );
        // INNER WALL — innerTop down to innerBot, normals point INWARD
        // (toward well axis, so user looking down INTO the well sees red)
        quad(
            w.innerTop[i], w.innerBot[i], w.innerBot[i2], w.innerTop[i2],
            uvWellIdx, uvWellIdx, uvWellIdx, uvWellIdx
        );
        // FLOOR fan — center → ring (CCW from above so normal +Y)
        tri(
            w.floorCenter, w.innerBot[i2], w.innerBot[i],
            uvWellIdx, uvWellIdx, uvWellIdx
        );
    }
}

// ── Helper to build an axis-aligned box ─────────────────────────
function box(cx, cz, y0, y1, w, d) {
    const hx = w / 2, hz = d / 2;
    // 8 corners: 0..3 bottom (y0), 4..7 top (y1)
    const c = [
        v(cx - hx, y0, cz - hz), // 0
        v(cx + hx, y0, cz - hz), // 1
        v(cx + hx, y0, cz + hz), // 2
        v(cx - hx, y0, cz + hz), // 3
        v(cx - hx, y1, cz - hz), // 4
        v(cx + hx, y1, cz - hz), // 5
        v(cx + hx, y1, cz + hz), // 6
        v(cx - hx, y1, cz + hz), // 7
    ];
    const uA = uvBodyIdx;
    // Faces — wind CCW when viewed from OUTSIDE so face normals point
    // outward. TTS backface-culls; reversed winding renders boxes hollow.
    quad(c[0], c[4], c[5], c[1], uA, uA, uA, uA); // -Z front
    quad(c[1], c[5], c[6], c[2], uA, uA, uA, uA); // +X right
    quad(c[2], c[6], c[7], c[3], uA, uA, uA, uA); // +Z back
    quad(c[3], c[7], c[4], c[0], uA, uA, uA, uA); // -X left
    quad(c[4], c[7], c[6], c[5], uA, uA, uA, uA); // +Y top
    quad(c[3], c[0], c[1], c[2], uA, uA, uA, uA); // -Y bottom
}

// ── Legs, body, head, arms ──────────────────────────────────────
box(-LEG_X, 0, LEG_Y0, LEG_Y1, LEG_W, LEG_D);                          // left leg
box(+LEG_X, 0, LEG_Y0, LEG_Y1, LEG_W, LEG_D);                          // right leg
box(0,      0, BODY_Y0, BODY_Y1, BODY_W, BODY_D);                      // torso
box(0,      0, HEAD_Y0, HEAD_Y1, HEAD_W, HEAD_D);                      // head
box(-(BODY_W / 2 + ARM_W / 2 + 0.01), 0, ARM_Y0, ARM_Y1, ARM_W, ARM_D); // left arm
box(+(BODY_W / 2 + ARM_W / 2 + 0.01), 0, ARM_Y0, ARM_Y1, ARM_W, ARM_D); // right arm

// ── Emit OBJ ────────────────────────────────────────────────────
const lines = [];
lines.push("# W.A.R H.A.M.S — H.A.M.S Soldier (procedural, v36)");
lines.push("# Shared mesh; per-soldier identity carried by the diffuse texture.");
lines.push("o hams_soldier");
for (const [x, y, z] of verts) lines.push(`v ${x.toFixed(5)} ${y.toFixed(5)} ${z.toFixed(5)}`);
for (const [u, t] of uvs) lines.push(`vt ${u.toFixed(5)} ${t.toFixed(5)}`);
lines.push(...faces);
lines.push("");

const outPath = path.join(OUT, "hams-soldier.obj");
fs.writeFileSync(outPath, lines.join("\n"), "utf8");
console.log(`Wrote ${outPath}`);
console.log(`  vertices: ${verts.length}`);
console.log(`  uvs:      ${uvs.length}`);
console.log(`  faces:    ${faces.length}`);
