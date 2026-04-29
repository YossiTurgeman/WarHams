#!/usr/bin/env node
/**
 * W.A.R H.A.M.S — WW2 Steel Oil Drum Mesh Generator
 *
 * Builds a Wavefront .obj that looks like a classic 55-gallon military
 * oil drum:
 *   - cylindrical body with two raised rolling hoops at ~1/3 and 2/3 height
 *   - top + bottom chime rings (the rolled rim that holds the head on)
 *   - solid top and bottom caps
 *   - small bung (filling plug) on the top head
 *
 * The mesh is built bottom-up: the base of the barrel sits at y = 0, so the
 * model rests firmly on the table with its local origin at the bottom
 * center. Height ≈ 0.62 TTS units, diameter ≈ 0.40 — roughly the 35"×23"
 * proportions of a real 55-gal drum (≈1.5:1).
 *
 * Colored at runtime via TTS ColorDiffuse, so a single shared mesh + a
 * solid white diffuse covers any tint.
 *
 * Usage: node generate-barrel-model.js
 * Outputs: tts/cards/barrel.obj, tts/cards/barrel-texture.png
 */

const path = require("path");
const fs = require("fs");
const { Jimp } = require("jimp");

const outDir = path.join(__dirname, "cards");
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);

// ─── Geometry parameters (TTS units) ────────────────────────────────
const SEG = 24;             // radial segments

const BODY_R = 0.20;        // straight side radius
const HOOP_R = 0.225;       // rolling hoop / chime peak radius
const TOTAL_H = 0.62;       // overall barrel height (sit-on-table)

// Vertical landmarks expressed as fractions of TOTAL_H, then scaled.
const profileFrac = [
    [0.00, BODY_R],   // bottom rim outer edge (touches the table)
    [0.03, HOOP_R],   // bottom chime peak
    [0.06, HOOP_R],   // chime top
    [0.09, BODY_R],   // taper back to body
    [0.30, BODY_R],   // body straight
    [0.32, HOOP_R],   // lower rolling hoop start
    [0.36, HOOP_R],   // lower rolling hoop end
    [0.38, BODY_R],
    [0.62, BODY_R],   // body straight
    [0.64, HOOP_R],   // upper rolling hoop start
    [0.68, HOOP_R],   // upper rolling hoop end
    [0.70, BODY_R],
    [0.91, BODY_R],
    [0.94, HOOP_R],   // top chime peak
    [0.97, HOOP_R],   // chime top
    [1.00, BODY_R],   // top rim
];
const profile = profileFrac.map(([f, r]) => [f * TOTAL_H, r]);

// (No bung — an off-center protrusion would skew the convex collider and
//  the barrel would rest tilted and oscillate.)

// ─── OBJ builders ───────────────────────────────────────────────────
const verts = [];     // each: [x,y,z]
const faces = [];     // each: [i, j, k] (1-indexed)

function addV(x, y, z) {
    verts.push([x, y, z]);
    return verts.length; // 1-indexed
}
function addTri(a, b, c) { faces.push([a, b, c]); }
function addQuad(a, b, c, d) { addTri(a, b, c); addTri(a, c, d); }

// Build rings of vertices around the Y axis at each profile height.
function buildLathe(centerX, centerZ, profilePts, capBottom = true, capTop = true) {
    const rings = profilePts.map(([y, r]) => {
        const ring = [];
        for (let i = 0; i < SEG; i++) {
            const a = (i / SEG) * Math.PI * 2;
            ring.push(addV(centerX + Math.cos(a) * r, y, centerZ + Math.sin(a) * r));
        }
        return ring;
    });
    // Side surfaces between successive rings.
    for (let k = 0; k < rings.length - 1; k++) {
        const lower = rings[k];
        const upper = rings[k + 1];
        for (let i = 0; i < SEG; i++) {
            const ni = (i + 1) % SEG;
            addQuad(lower[i], lower[ni], upper[ni], upper[i]);
        }
    }
    if (capBottom) {
        // Two-sided bottom cap so the underside is opaque from any angle
        // (rendering convention can vary; safest to emit both windings).
        const c = addV(centerX, profilePts[0][0], centerZ);
        const ring = rings[0];
        for (let i = 0; i < SEG; i++) {
            const ni = (i + 1) % SEG;
            addTri(c, ring[i], ring[ni]); // outward-facing (normal -Y)
            addTri(c, ring[ni], ring[i]); // duplicate, opposite winding
        }
    }
    if (capTop) {
        // Top cap: normal must point +Y. Triangle (c, ring[ni], ring[i])
        // gives the correct outward (upward) normal.
        const c = addV(centerX, profilePts[profilePts.length - 1][0], centerZ);
        const ring = rings[rings.length - 1];
        for (let i = 0; i < SEG; i++) {
            const ni = (i + 1) % SEG;
            addTri(c, ring[ni], ring[i]);
        }
    }
}

// Main barrel body — perfectly symmetric solid of revolution so the
// convex collider rests flat on the table.
// Bottom cap re-enabled now that the cap winding produces the correct
// outward (downward) normal — it's back-facing from above and hidden by
// the table from below, so no z-fighting.
buildLathe(0, 0, profile, /*capBottom*/ true, /*capTop*/ true);

// ─── Write OBJ ──────────────────────────────────────────────────────
const lines = [
    "# W.A.R.H.A.M.S WW2 oil drum mesh",
    `# verts: ${verts.length}, tris-and-faces written below`,
    "o OilBarrel",
];
for (const [x, y, z] of verts) lines.push(`v ${x.toFixed(5)} ${y.toFixed(5)} ${z.toFixed(5)}`);
for (const [a, b, c] of faces) lines.push(`f ${a} ${b} ${c}`);
fs.writeFileSync(path.join(outDir, "barrel.obj"), lines.join("\n") + "\n");
console.log(`barrel.obj: ${verts.length} verts, ${faces.length} tris`);

// ─── Write a small white diffuse texture (TTS Custom_Model requires one) ─
async function writeTexture() {
    const tex = new Jimp({ width: 4, height: 4, color: 0xFFFFFFFF });
    await tex.write(path.join(outDir, "barrel-texture.png"));
    console.log("barrel-texture.png");
}
writeTexture().catch(e => { console.error(e); process.exit(1); });
