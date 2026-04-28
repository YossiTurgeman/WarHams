#!/usr/bin/env node
/**
 * W.A.R H.A.M.S — 3D Flag Mesh Generator
 * Outputs a Wavefront .obj of a true 3D flag:
 *   - cylindrical base (disc)
 *   - cylindrical pole
 *   - thin double-sided rectangular flag panel
 * The mesh is colored at runtime via TTS ColorDiffuse, so a single shared
 * mesh + a 1px white diffuse texture covers all four player colors.
 *
 * Usage: node generate-flag-model.js
 * Outputs: tts/cards/flag.obj, tts/cards/flag-texture.png
 */

const path = require("path");
const fs = require("fs");
const { Jimp } = require("jimp");

const outDir = path.join(__dirname, "cards");
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);

// ─── Geometry parameters (TTS units, ~1 unit ≈ 1 inch) ──────────────
const SEG = 16;            // cylinder segments

const BASE_R = 0.45;
const BASE_H = 0.08;

const POLE_R = 0.05;
const POLE_BOTTOM = BASE_H;
const POLE_TOP = 1.55;

const FLAG_W = 0.85;       // X extent (away from pole)
const FLAG_H = 0.45;       // Y extent
const FLAG_T = 0.025;      // Z thickness (so it's volumetric, not paper-thin)
const FLAG_TOP = POLE_TOP - 0.05;
const FLAG_BOTTOM = FLAG_TOP - FLAG_H;
const FLAG_LEFT = POLE_R;          // touches pole
const FLAG_RIGHT = FLAG_LEFT + FLAG_W;
const FLAG_Z_FRONT = FLAG_T / 2;
const FLAG_Z_BACK = -FLAG_T / 2;

// V-notch tail: right edge tapers to a point at vertical middle
const FLAG_TAIL_DEPTH = 0.12;
const FLAG_TAIL_X = FLAG_RIGHT - FLAG_TAIL_DEPTH;
const FLAG_MID_Y = (FLAG_TOP + FLAG_BOTTOM) / 2;

// ─── OBJ builders ───────────────────────────────────────────────────
const verts = [];     // each: [x,y,z]
const faces = [];     // each: [i, j, k] (1-indexed)

function addV(x, y, z) {
    verts.push([x, y, z]);
    return verts.length; // 1-indexed
}
function addTri(a, b, c) { faces.push([a, b, c]); }
function addQuad(a, b, c, d) { addTri(a, b, c); addTri(a, c, d); }

function addCylinder(cx, cz, radius, yBottom, yTop) {
    const bottomRing = [];
    const topRing = [];
    for (let i = 0; i < SEG; i++) {
        const a = (i / SEG) * Math.PI * 2;
        const x = cx + Math.cos(a) * radius;
        const z = cz + Math.sin(a) * radius;
        bottomRing.push(addV(x, yBottom, z));
        topRing.push(addV(x, yTop, z));
    }
    const bottomCenter = addV(cx, yBottom, cz);
    const topCenter = addV(cx, yTop, cz);

    // Sides
    for (let i = 0; i < SEG; i++) {
        const ni = (i + 1) % SEG;
        addQuad(bottomRing[i], bottomRing[ni], topRing[ni], topRing[i]);
    }
    // Bottom cap (CW so normal points down)
    for (let i = 0; i < SEG; i++) {
        const ni = (i + 1) % SEG;
        addTri(bottomCenter, bottomRing[ni], bottomRing[i]);
    }
    // Top cap
    for (let i = 0; i < SEG; i++) {
        const ni = (i + 1) % SEG;
        addTri(topCenter, topRing[i], topRing[ni]);
    }
}

// Flag panel as a thin volumetric box with a swallowtail (V-notch) right edge.
// Vertices: 5 on each face (TL, TR-tip-top, MID-cut, TR-tip-bot, BL effectively).
// Simpler: build a solid by extruding a 2D pentagon shape (TL, TR-top, MID, TR-bot, BL)
// for both Z=front and Z=back, then connect side faces.
function addFlagPanel() {
    // Pentagon vertices (clockwise when viewed from +Z front):
    //   TL = (FLAG_LEFT, FLAG_TOP)
    //   TR_TOP = (FLAG_RIGHT, FLAG_TOP)
    //   MID = (FLAG_TAIL_X, FLAG_MID_Y)
    //   TR_BOT = (FLAG_RIGHT, FLAG_BOTTOM)
    //   BL = (FLAG_LEFT, FLAG_BOTTOM)
    const pts2D = [
        [FLAG_LEFT,  FLAG_TOP],
        [FLAG_RIGHT, FLAG_TOP],
        [FLAG_TAIL_X, FLAG_MID_Y],
        [FLAG_RIGHT, FLAG_BOTTOM],
        [FLAG_LEFT,  FLAG_BOTTOM],
    ];
    const front = pts2D.map(([x, y]) => addV(x, y, FLAG_Z_FRONT));
    const back  = pts2D.map(([x, y]) => addV(x, y, FLAG_Z_BACK));

    // Front face (fan from TL) — CCW from +Z looks correct: TL -> TR_TOP -> MID -> TR_BOT -> BL
    addTri(front[0], front[1], front[2]);
    addTri(front[0], front[2], front[3]);
    addTri(front[0], front[3], front[4]);

    // Back face — reverse winding
    addTri(back[0], back[2], back[1]);
    addTri(back[0], back[3], back[2]);
    addTri(back[0], back[4], back[3]);

    // Side faces between front and back (quads)
    for (let i = 0; i < pts2D.length; i++) {
        const ni = (i + 1) % pts2D.length;
        addQuad(front[i], back[i], back[ni], front[ni]);
    }
}

// Build geometry
addCylinder(0, 0, BASE_R, 0, BASE_H);                 // base disc
addCylinder(0, 0, POLE_R, POLE_BOTTOM, POLE_TOP);     // pole
addFlagPanel();                                        // flag

// Decorative ball on top of pole
function addSphere(cx, cy, cz, r, latSeg = 8, lonSeg = 12) {
    const rings = [];
    for (let i = 0; i <= latSeg; i++) {
        const phi = (i / latSeg) * Math.PI; // 0..π
        const y = cy + Math.cos(phi) * r;
        const ringR = Math.sin(phi) * r;
        const ring = [];
        for (let j = 0; j < lonSeg; j++) {
            const theta = (j / lonSeg) * Math.PI * 2;
            ring.push(addV(cx + Math.cos(theta) * ringR, y, cz + Math.sin(theta) * ringR));
        }
        rings.push(ring);
    }
    for (let i = 0; i < latSeg; i++) {
        for (let j = 0; j < lonSeg; j++) {
            const nj = (j + 1) % lonSeg;
            addQuad(rings[i][j], rings[i + 1][j], rings[i + 1][nj], rings[i][nj]);
        }
    }
}
addSphere(0, POLE_TOP + 0.04, 0, 0.06);

// ─── Write OBJ ──────────────────────────────────────────────────────
const lines = ["# W.A.R.H.A.M.S 3D flag mesh", "o Flag"];
for (const [x, y, z] of verts) lines.push(`v ${x.toFixed(5)} ${y.toFixed(5)} ${z.toFixed(5)}`);
for (const [a, b, c] of faces) lines.push(`f ${a} ${b} ${c}`);
fs.writeFileSync(path.join(outDir, "flag.obj"), lines.join("\n") + "\n");
console.log(`flag.obj: ${verts.length} verts, ${faces.length} tris`);

// ─── Write 1×1 white diffuse texture (TTS Custom_Model requires a diffuse URL) ─
async function writeTexture() {
    const tex = new Jimp({ width: 4, height: 4, color: 0xFFFFFFFF });
    await tex.write(path.join(outDir, "flag-texture.png"));
    console.log("flag-texture.png");
}
writeTexture().catch(e => { console.error(e); process.exit(1); });
