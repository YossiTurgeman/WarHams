#!/usr/bin/env node
/**
 * W.A.R H.A.M.S — Damage Peg 3D Mesh Generator (v47)
 *
 * A small "blood drop peg" that drops into the divot wells on the
 * soldier-base mesh (hams-soldier.obj). Geometry is sized in OBJ units
 * so that, when scaled uniformly to ~0.10 in the TTS save, the peg's
 * world diameter is well under the divot well opening (~0.26 world
 * units) and the peg stands tall enough to read as inserted.
 *
 * Geometry:
 *   • 12-sided cylinder shaft, radius 1.0, height 1.4
 *   • Hemispherical dome on top (3 latitude rings)
 *   • Flat bottom disc
 *
 * Output: tts/<VERSION>/peg.obj (versioned so TTS path-cache busts).
 */

const fs = require("fs");
const path = require("path");

// Versioned output dir matches DAMAGE_PEG_BASE in generate-save.js.
const VERSION = "v58";
const OUT = path.join(__dirname, VERSION);
if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

const R = 1.0;
const SHAFT_H = 1.4;
const SEGS = 12;            // longitude segments
const DOME_RINGS = 3;       // latitude rings on the dome (excluding pole)

const verts = [];
const uvs = [];
const faces = [];

function v(x, y, z) { verts.push([x, y, z]); return verts.length; }
function uv(u, t)   { uvs.push([u, t]); return uvs.length; }
function tri(a, b, c, ua, ub, uc) {
    faces.push(`f ${a}/${ua} ${b}/${ub} ${c}/${uc}`);
}
function quad(a, b, c, d, ua, ub, uc, ud) {
    faces.push(`f ${a}/${ua} ${b}/${ub} ${c}/${uc}`);
    faces.push(`f ${a}/${ua} ${c}/${uc} ${d}/${ud}`);
}

// Single shared UV — peg is a solid color so any pixel of the texture
// works.
const uvSolid = uv(0.5, 0.5);

// ── Shaft cylinder ──────────────────────────────────────────────
const bottomRing = [];
const topRing = [];
for (let i = 0; i < SEGS; i++) {
    const a = (i / SEGS) * Math.PI * 2;
    const x = Math.cos(a) * R;
    const z = Math.sin(a) * R;
    bottomRing.push(v(x, 0,        z));
    topRing.push(   v(x, SHAFT_H,  z));
}
const bottomCenter = v(0, 0, 0);

// Bottom disc (faces -Y so it sits flat on the table)
for (let i = 0; i < SEGS; i++) {
    const a = bottomRing[i];
    const b = bottomRing[(i + 1) % SEGS];
    tri(bottomCenter, a, b, uvSolid, uvSolid, uvSolid); // -Y normal
}

// Side wall (CCW from outside → outward normal)
for (let i = 0; i < SEGS; i++) {
    const i2 = (i + 1) % SEGS;
    quad(
        bottomRing[i], topRing[i], topRing[i2], bottomRing[i2],
        uvSolid, uvSolid, uvSolid, uvSolid
    );
}

// ── Dome on top ─────────────────────────────────────────────────
// Build latitude rings from equator (at SHAFT_H) up to the pole.
const rings = [topRing];
for (let r = 1; r <= DOME_RINGS; r++) {
    const lat = (r / (DOME_RINGS + 1)) * (Math.PI / 2);
    const ringR = R * Math.cos(lat);
    const ringY = SHAFT_H + R * Math.sin(lat);
    const ring = [];
    for (let i = 0; i < SEGS; i++) {
        const a = (i / SEGS) * Math.PI * 2;
        ring.push(v(Math.cos(a) * ringR, ringY, Math.sin(a) * ringR));
    }
    rings.push(ring);
}
const pole = v(0, SHAFT_H + R, 0);

// Connect rings with quads (CCW from outside)
for (let r = 0; r < rings.length - 1; r++) {
    const lo = rings[r];
    const hi = rings[r + 1];
    for (let i = 0; i < SEGS; i++) {
        const i2 = (i + 1) % SEGS;
        quad(
            lo[i], hi[i], hi[i2], lo[i2],
            uvSolid, uvSolid, uvSolid, uvSolid
        );
    }
}
// Cap with a fan from the topmost ring to the pole
const top = rings[rings.length - 1];
for (let i = 0; i < SEGS; i++) {
    const i2 = (i + 1) % SEGS;
    tri(top[i], pole, top[i2], uvSolid, uvSolid, uvSolid); // +Y normal
}

// ── Emit OBJ ────────────────────────────────────────────────────
const lines = [];
lines.push("# W.A.R H.A.M.S — Blood-drop Damage Peg (procedural, v47)");
lines.push("o blood_peg");
for (const [x, y, z] of verts) lines.push(`v ${x.toFixed(5)} ${y.toFixed(5)} ${z.toFixed(5)}`);
for (const [u, t] of uvs) lines.push(`vt ${u.toFixed(5)} ${t.toFixed(5)}`);
lines.push(...faces);
lines.push("");

const outPath = path.join(OUT, "peg.obj");
fs.writeFileSync(outPath, lines.join("\n"), "utf8");
console.log(`Wrote ${outPath}`);
console.log(`  vertices: ${verts.length}`);
console.log(`  uvs:      ${uvs.length}`);
console.log(`  faces:    ${faces.length}`);
