#!/usr/bin/env node
/**
 * W.A.R H.A.M.S — Soldier 3D Mesh Generator (v33)
 *
 * Procedurally writes a single shared .obj mesh used by all 112 H.A.M.S
 * miniatures. The mesh is intentionally simple but reads as a real 3D
 * miniature (with thickness, depth, and a true horizontal base disc)
 * rather than a flat standee.
 *
 * Geometry (in TTS units, ~1 unit ≈ 1 inch for figurines):
 *   • Base disc: 24-sided cylinder, radius 0.50, height 0.05
 *     (40mm physical = 1.57", scaled here for table presence)
 *   • Body box:  0.40 × 0.70 × 0.22 (W×H×D) sitting on the base
 *   • Head box:  0.30 × 0.25 × 0.22 above the body
 *   • Arms:      two thin boxes flanking the body
 *
 * UV layout (matches generate-soldier-figures.js):
 *   • Top half of texture (v: 0.5-1.0)  — the base disc viewed from above
 *     (ID label + 3 blood-drop divots are baked here)
 *   • Bottom half (v: 0.0-0.5)           — body fill in player color
 *
 * Output: tts/models/hams-soldier.obj (shared by every soldier; the
 * per-soldier identity is carried entirely by the diffuse texture).
 */

const fs = require("fs");
const path = require("path");

const OUT = path.join(__dirname, "models");
if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

// ── Geometry parameters ─────────────────────────────────────────
// v34: wider, heavier base for tipping stability — soldiers
// must remain upright in TTS physics. Base radius now exceeds
// half the figure's height so the center of mass stays inside
// the support polygon even with arms extended.
const BASE_R = 0.65;
const BASE_H = 0.10;
const BASE_SEGS = 24;

const BODY_W = 0.40, BODY_H = 0.70, BODY_D = 0.22;
const HEAD_W = 0.30, HEAD_H = 0.25, HEAD_D = 0.22;
const ARM_W = 0.10, ARM_H = 0.55, ARM_D = 0.18;

// Base sits on y=0..BASE_H, body above it, head above body
const BODY_Y0 = BASE_H;
const BODY_Y1 = BODY_Y0 + BODY_H;
const HEAD_Y0 = BODY_Y1;
const HEAD_Y1 = HEAD_Y0 + HEAD_H;
const ARM_Y0 = BODY_Y0 + 0.05;
const ARM_Y1 = ARM_Y0 + ARM_H;

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
// Top half of texture — base disc seen from above (carries the ID label)
function uvBaseTop(x, z) {
    // vertex base (x,z) ∈ [-BASE_R, BASE_R]² → UV (0..1, 0.5..1)
    const u = 0.5 + (x / BASE_R) * 0.5;
    const t = 0.75 + (z / BASE_R) * 0.25;
    return uv(u, t);
}
// Bottom half of texture — solid body color region. Pick a stable
// midpoint so there's no aliasing between adjacent faces.
function uvBody() {
    return uv(0.5, 0.25);
}

// ── Pre-compute reusable UV indices ─────────────────────────────
const uvBodyIdx = uvBody(); // single shared UV for all body/arm/head/base-side faces

// ── Build base cylinder ─────────────────────────────────────────
// Bottom ring (y=0), top ring (y=BASE_H), centered on origin
const bottomRing = [];
const topRing = [];
const bottomRingUVs = []; // UVs for fan from bottom center (use body UV — invisible from gameplay)
const topRingUVs = [];    // UVs for fan from top center (the ID-bearing top face)
for (let i = 0; i < BASE_SEGS; i++) {
    const a = (i / BASE_SEGS) * Math.PI * 2;
    const x = Math.cos(a) * BASE_R;
    const z = Math.sin(a) * BASE_R;
    bottomRing.push(v(x, 0, z));
    topRing.push(v(x, BASE_H, z));
    bottomRingUVs.push(uvBodyIdx);
    topRingUVs.push(uvBaseTop(x, z));
}
const bottomCenter = v(0, 0, 0);
const topCenter = v(0, BASE_H, 0);
const topCenterUV = uvBaseTop(0, 0);

// Base TOP fan (fully visible from gameplay angles — uses the ID texture)
for (let i = 0; i < BASE_SEGS; i++) {
    const a = topRing[i];
    const b = topRing[(i + 1) % BASE_SEGS];
    const ua = topRingUVs[i];
    const ub = topRingUVs[(i + 1) % BASE_SEGS];
    tri(topCenter, b, a, topCenterUV, ub, ua); // wind so normal points +Y
}
// Base BOTTOM fan (rarely seen — body UV)
for (let i = 0; i < BASE_SEGS; i++) {
    const a = bottomRing[i];
    const b = bottomRing[(i + 1) % BASE_SEGS];
    tri(bottomCenter, a, b, uvBodyIdx, uvBodyIdx, uvBodyIdx); // -Y normal
}
// Base SIDE rim (band of body color)
for (let i = 0; i < BASE_SEGS; i++) {
    const i2 = (i + 1) % BASE_SEGS;
    quad(
        bottomRing[i], topRing[i], topRing[i2], bottomRing[i2],
        uvBodyIdx, uvBodyIdx, uvBodyIdx, uvBodyIdx
    );
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
    // Faces — wind CCW when viewed from OUTSIDE so that face normals
    // point outward. TTS backface-culls, so inverted winding renders
    // boxes as hollow "U-bracket" shells (visible interior only).
    quad(c[0], c[4], c[5], c[1], uA, uA, uA, uA); // -Z front
    quad(c[1], c[5], c[6], c[2], uA, uA, uA, uA); // +X right
    quad(c[2], c[6], c[7], c[3], uA, uA, uA, uA); // +Z back
    quad(c[3], c[7], c[4], c[0], uA, uA, uA, uA); // -X left
    quad(c[4], c[7], c[6], c[5], uA, uA, uA, uA); // +Y top
    quad(c[3], c[0], c[1], c[2], uA, uA, uA, uA); // -Y bottom
}

// ── Body, head, arms ────────────────────────────────────────────
box(0, 0, BODY_Y0, BODY_Y1, BODY_W, BODY_D);                       // torso
box(0, 0, HEAD_Y0, HEAD_Y1, HEAD_W, HEAD_D);                       // head
box(-(BODY_W / 2 + ARM_W / 2 + 0.01), 0, ARM_Y0, ARM_Y1, ARM_W, ARM_D); // left arm
box(+(BODY_W / 2 + ARM_W / 2 + 0.01), 0, ARM_Y0, ARM_Y1, ARM_W, ARM_D); // right arm

// ── Emit OBJ ────────────────────────────────────────────────────
const lines = [];
lines.push("# W.A.R H.A.M.S — H.A.M.S Soldier (procedural, v33)");
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
