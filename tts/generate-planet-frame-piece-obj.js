#!/usr/bin/env node
/**
 * W.A.R H.A.M.S — Planet Frame Piece OBJ Generator
 *
 * Generates ONE puzzle-piece mesh for the Planet Frame.  Five
 * identical copies, rotated by 72° each in TTS, form the complete
 * ring around the 61-hex planet cluster.
 *
 * Each piece (centred at piece-local angle θ=0):
 *   - INNER edge: smooth arc at R_IN = 26 world (sits flush against
 *     the hex cluster outer perimeter; cluster radial extent ≈ 24.5–27).
 *   - OUTER edge: smooth arc at R_OUT = 31 world (curved boundary).
 *   - +HALF radial edge (CCW end, +36°): puzzle TAB protruding outward.
 *   - −HALF radial edge (CW  end, −36°): matching NOTCH cut inward
 *     so the tab of the previous piece interlocks here.
 *   - Thickness 0.4 world (top + bottom faces + side walls).
 *
 * Triangulation: the 2-D outline is non-convex (because of the notch),
 * so we use plain ear-clipping (no holes, simple polygon).
 *
 * Output: tts/v66/planet-frame-piece.obj
 */

const fs = require("fs");
const path = require("path");

const VERSION = "v66";
const OUT = path.join(__dirname, VERSION);
if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

// ─── Geometry parameters (world units) ──────────────────────────
const R_IN = 26;
const R_OUT = 31;
const SPAN_DEG = 72;                        // 360° / 5 pieces
const HALF_DEG = SPAN_DEG / 2;              // 36°
const N_ARC = 36;                           // arc subdivisions
const TAB_R = (R_IN + R_OUT) / 2;           // tab/notch placed mid-radius
const TAB_RADIAL_HALF = 1.4;                // radial half-width of tab/notch base
const TAB_OUT = 1.6;                        // protrusion / cut depth
const THICK = 0.4;                          // total Y thickness

// ─── Build outline (CCW order, in XZ plane) ─────────────────────
const outline2D = [];

// 1) Inner arc, from −HALF° to +HALF° (CCW)
for (let i = 0; i <= N_ARC; i++) {
    const a = (-HALF_DEG + SPAN_DEG * i / N_ARC) * Math.PI / 180;
    outline2D.push([R_IN * Math.cos(a), R_IN * Math.sin(a)]);
}

// 2) +HALF° radial edge with TAB (R_IN → R_OUT, tab protrudes outward)
{
    const a = HALF_DEG * Math.PI / 180;
    const cosA = Math.cos(a), sinA = Math.sin(a);
    // Outward perpendicular = 90° CCW from radial direction (away from piece body)
    const perpX = -sinA, perpZ = cosA;
    const r1 = TAB_R - TAB_RADIAL_HALF;
    const r2 = TAB_R + TAB_RADIAL_HALF;
    outline2D.push([r1 * cosA, r1 * sinA]);
    outline2D.push([r1 * cosA + perpX * TAB_OUT, r1 * sinA + perpZ * TAB_OUT]);
    outline2D.push([r2 * cosA + perpX * TAB_OUT, r2 * sinA + perpZ * TAB_OUT]);
    outline2D.push([r2 * cosA, r2 * sinA]);
    outline2D.push([R_OUT * cosA, R_OUT * sinA]);
}

// 3) Outer arc, from +HALF° back to −HALF° (CW)
for (let i = N_ARC - 1; i >= 0; i--) {
    const a = (-HALF_DEG + SPAN_DEG * i / N_ARC) * Math.PI / 180;
    outline2D.push([R_OUT * Math.cos(a), R_OUT * Math.sin(a)]);
}

// 4) −HALF° radial edge with NOTCH (R_OUT → R_IN, notch cuts INTO body)
{
    const a = -HALF_DEG * Math.PI / 180;
    const cosA = Math.cos(a), sinA = Math.sin(a);
    // Inward perpendicular = 90° CCW from radial direction (toward piece body, +angle side)
    const perpX = -sinA, perpZ = cosA;
    const r1 = TAB_R - TAB_RADIAL_HALF;
    const r2 = TAB_R + TAB_RADIAL_HALF;
    outline2D.push([r2 * cosA, r2 * sinA]);
    outline2D.push([r2 * cosA + perpX * TAB_OUT, r2 * sinA + perpZ * TAB_OUT]);
    outline2D.push([r1 * cosA + perpX * TAB_OUT, r1 * sinA + perpZ * TAB_OUT]);
    outline2D.push([r1 * cosA, r1 * sinA]);
}
// The polygon is implicitly closed by the loop (last point → first inner-arc point)

// ─── Ear-clipping triangulation ─────────────────────────────────
function sign(px, pz, ax, az, bx, bz) {
    return (px - bx) * (az - bz) - (ax - bx) * (pz - bz);
}
function pointInTriangle(px, pz, ax, az, bx, bz, cx, cz) {
    const d1 = sign(px, pz, ax, az, bx, bz);
    const d2 = sign(px, pz, bx, bz, cx, cz);
    const d3 = sign(px, pz, cx, cz, ax, az);
    const hasNeg = d1 < 0 || d2 < 0 || d3 < 0;
    const hasPos = d1 > 0 || d2 > 0 || d3 > 0;
    return !(hasNeg && hasPos);
}
function isEar(poly, a, b, c, indices) {
    const ax = poly[a][0], az = poly[a][1];
    const bx = poly[b][0], bz = poly[b][1];
    const cx = poly[c][0], cz = poly[c][1];
    // CCW polygon → convex angle has positive cross product
    const cross = (bx - ax) * (cz - az) - (bz - az) * (cx - ax);
    if (cross <= 1e-9) return false;
    for (const idx of indices) {
        if (idx === a || idx === b || idx === c) continue;
        const px = poly[idx][0], pz = poly[idx][1];
        if (pointInTriangle(px, pz, ax, az, bx, bz, cx, cz)) return false;
    }
    return true;
}
function triangulate(poly) {
    const result = [];
    let indices = poly.map((_, i) => i);
    let safety = 0;
    while (indices.length > 3) {
        if (safety++ > 50000) {
            console.error("Ear-clipping safety limit reached, falling back to fan");
            for (let k = 1; k < indices.length - 1; k++)
                result.push([indices[0], indices[k], indices[k + 1]]);
            return result;
        }
        let earFound = false;
        for (let i = 0; i < indices.length; i++) {
            const a = indices[i];
            const b = indices[(i + 1) % indices.length];
            const c = indices[(i + 2) % indices.length];
            if (isEar(poly, a, b, c, indices)) {
                result.push([a, b, c]);
                indices.splice((i + 1) % indices.length, 1);
                earFound = true;
                break;
            }
        }
        if (!earFound) {
            console.warn("No ear found, falling back to fan for remaining polygon");
            for (let k = 1; k < indices.length - 1; k++)
                result.push([indices[0], indices[k], indices[k + 1]]);
            return result;
        }
    }
    if (indices.length === 3) {
        result.push([indices[0], indices[1], indices[2]]);
    }
    return result;
}

const triangles2D = triangulate(outline2D);
console.log(`Outline: ${outline2D.length} verts → ${triangles2D.length} triangles`);

// ─── Build 3-D mesh: top face + bottom face + side walls ────────
const verts3D = [];
const tris3D = [];
const halfThick = THICK / 2;
const N = outline2D.length;
const TOP = 0;
const BOT = N;

// Top face vertices  (Y = +halfThick)
for (const [x, z] of outline2D) verts3D.push([x, +halfThick, z]);
// Bottom face vertices (Y = −halfThick)
for (const [x, z] of outline2D) verts3D.push([x, -halfThick, z]);

// Top face — CCW in XZ → normal points +Y (up)
for (const [a, b, c] of triangles2D) {
    tris3D.push([TOP + a, TOP + b, TOP + c]);
}
// Bottom face — reversed winding → normal points −Y (down)
for (const [a, b, c] of triangles2D) {
    tris3D.push([BOT + a, BOT + c, BOT + b]);
}
// Side walls — quad strip around the outline (CCW from outside)
for (let i = 0; i < N; i++) {
    const j = (i + 1) % N;
    const tA = TOP + i, tB = TOP + j;
    const bA = BOT + i, bB = BOT + j;
    tris3D.push([tA, bA, bB]);
    tris3D.push([tA, bB, tB]);
}

// ─── Write OBJ ──────────────────────────────────────────────────
const lines = ["# W.A.R.H.A.M.S Planet Frame Piece (v66)", "o PlanetFramePiece"];
for (const [x, y, z] of verts3D) {
    lines.push(`v ${x.toFixed(4)} ${y.toFixed(4)} ${z.toFixed(4)}`);
}
// Single shared UV — piece is rendered with a uniform color texture
lines.push("vt 0.5 0.5");
for (const [a, b, c] of tris3D) {
    lines.push(`f ${a + 1}/1 ${b + 1}/1 ${c + 1}/1`);
}
fs.writeFileSync(path.join(OUT, "planet-frame-piece.obj"), lines.join("\n") + "\n");
console.log(`✅ Planet Frame piece OBJ written to ${OUT}/planet-frame-piece.obj`);
console.log(`   ${verts3D.length} verts, ${tris3D.length} tris`);
