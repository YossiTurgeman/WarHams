#!/usr/bin/env node
/**
 * W.A.R H.A.M.S — Oil Barrel Mesh Generator
 * Outputs a Wavefront .obj of a 3D oil drum:
 *   - cylindrical body with subtle middle bulge
 *   - two raised ring ridges (top + bottom rims)
 *   - solid top and bottom caps
 * The mesh is colored at runtime via TTS ColorDiffuse, so a single shared
 * mesh + a 1px white diffuse texture covers any tint.
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
const SEG = 24;            // radial segments

// Profile of revolution — list of [y, radius] sample points along the side.
// Defines the silhouette of the barrel from bottom to top.
const profile = [
    [0.00, 0.38],   // bottom edge
    [0.04, 0.42],   // bottom rim peak
    [0.08, 0.40],   // rim taper back in
    [0.30, 0.46],   // body bulge starts
    [0.50, 0.48],   // mid bulge peak
    [0.70, 0.46],   // body bulge ends
    [0.92, 0.40],   // taper toward top rim
    [0.96, 0.42],   // top rim peak
    [1.00, 0.38],   // top edge
];

// ─── OBJ builders ───────────────────────────────────────────────────
const verts = [];     // each: [x,y,z]
const faces = [];     // each: [i, j, k] (1-indexed)

function addV(x, y, z) {
    verts.push([x, y, z]);
    return verts.length; // 1-indexed
}
function addTri(a, b, c) { faces.push([a, b, c]); }
function addQuad(a, b, c, d) { addTri(a, b, c); addTri(a, c, d); }

// Build rings of vertices around Y axis at each profile height.
const rings = profile.map(([y, r]) => {
    const ring = [];
    for (let i = 0; i < SEG; i++) {
        const a = (i / SEG) * Math.PI * 2;
        ring.push(addV(Math.cos(a) * r, y, Math.sin(a) * r));
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

// Bottom cap (CW so normal points down).
const bottomCenter = addV(0, profile[0][0], 0);
const bottomRing = rings[0];
for (let i = 0; i < SEG; i++) {
    const ni = (i + 1) % SEG;
    addTri(bottomCenter, bottomRing[ni], bottomRing[i]);
}

// Top cap.
const topCenter = addV(0, profile[profile.length - 1][0], 0);
const topRing = rings[rings.length - 1];
for (let i = 0; i < SEG; i++) {
    const ni = (i + 1) % SEG;
    addTri(topCenter, topRing[i], topRing[ni]);
}

// ─── Write OBJ ──────────────────────────────────────────────────────
const lines = ["# W.A.R.H.A.M.S 3D oil barrel mesh", "o Barrel"];
for (const [x, y, z] of verts) lines.push(`v ${x.toFixed(5)} ${y.toFixed(5)} ${z.toFixed(5)}`);
for (const [a, b, c] of faces) lines.push(`f ${a} ${b} ${c}`);
fs.writeFileSync(path.join(outDir, "barrel.obj"), lines.join("\n") + "\n");
console.log(`barrel.obj: ${verts.length} verts, ${faces.length} tris`);

// ─── Write 1×1 white diffuse texture (TTS Custom_Model requires a diffuse URL) ─
async function writeTexture() {
    const tex = new Jimp({ width: 4, height: 4, color: 0xFFFFFFFF });
    await tex.write(path.join(outDir, "barrel-texture.png"));
    console.log("barrel-texture.png");
}
writeTexture().catch(e => { console.error(e); process.exit(1); });
