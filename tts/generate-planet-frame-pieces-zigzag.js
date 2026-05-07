#!/usr/bin/env node
/**
 * W.A.R H.A.M.S — Planet Frame Pieces (zigzag inner edge)
 *
 * Generates FIVE distinct puzzle-piece meshes for the Planet Frame.
 * The pieces are NOT identical: each one's INNER edge follows a real
 * section of the 61-hex cluster's outer perimeter (a zigzag of
 * straight hex edges), so the frame snaps flush against the hexes.
 *
 *   1. Compute the hex cluster perimeter polygon (54 verts).
 *   2. Split the perimeter into 5 contiguous sections (≈11 verts each).
 *   3. For each section, build a piece outline:
 *        - Inner edge  = section perimeter zigzag
 *        - Outer edge  = smooth arc at R_OUT = 32
 *        - +CCW end    = TAB protruding outward (TAB_OUT = 4 world)
 *        - -CW  end    = matching NOTCH cut inward
 *   4. Triangulate (ear-clipping; falls back to fan for stuck remnants).
 *   5. Build a 3-D mesh: top face + bottom face + side walls.
 *   6. Emit UV coords mapping each vertex into the piece's bbox so a
 *      letter texture (a, b, c, d, e) renders centred on the top face.
 *
 * The .obj is in WORLD-aligned coordinates with the cluster CENTRE at
 * the origin, so all five pieces are spawned at the same TTS position
 * (0, 1, FRAME_PLANET_CZ) with rotY = 0.
 *
 * Outputs in v<VERSION>/:
 *   planet-frame-piece-1.obj … planet-frame-piece-5.obj
 *   planet-frame-piece-1.png … planet-frame-piece-5.png   (letter textures)
 */

const fs = require("fs");
const path = require("path");
const { Jimp, loadFont } = require("jimp");
let earcut;   // loaded asynchronously below (earcut@3 ships ESM only)

const VERSION = "v67";
const OUT = path.join(__dirname, VERSION);
if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

const FONT_DIR = path.join(__dirname, "..", "node_modules", "@jimp", "plugin-print", "dist", "fonts");

// ─── Hex cluster geometry (must match generate-save.js) ─────────
const HEX_R   = 3.5;
const PITCH_X = 1.5 * HEX_R;
const PITCH_Z = Math.sqrt(3) * HEX_R;

// ─── Frame piece geometry ───────────────────────────────────────
const R_OUT           = 32;     // outer-arc radius (world units)
const TAB_OUT         = 4.0;    // tab protrusion / notch depth
const TAB_RADIAL_HALF = 1.5;    // half-thickness of tab/notch base
const THICK           = 0.5;    // total Y thickness
const N_OUT_SUBDIV    = 8;      // outer-arc subdivisions PER inner zigzag segment
const NUM_PIECES      = 5;

// ─── Hex perimeter computation ─────────────────────────────────
function hexCenter(q, r) { return [PITCH_X * q, PITCH_Z * (r + q / 2)]; }
function hexVertex(q, r, k) {
    const [cx, cz] = hexCenter(q, r);
    const a = k * Math.PI / 3;
    return [cx + HEX_R * Math.cos(a), cz + HEX_R * Math.sin(a)];
}
const cluster = new Set();
for (let q = -4; q <= 4; q++)
    for (let r = -4; r <= 4; r++)
        if (Math.abs(q + r) <= 4) cluster.add(`${q},${r}`);

// edge k of a flat-top hex (between vert k and vert k+1) → neighbor offset
const edgeNeighbors = [
    [ 1,  0],   // edge 0 (E→NE,  midpt 30°)
    [ 0,  1],   // edge 1 (NE→NW, midpt 90° N)
    [-1,  1],   // edge 2 (NW→W,  midpt 150°)
    [-1,  0],   // edge 3 (W→SW,  midpt 210°)
    [ 0, -1],   // edge 4 (SW→SE, midpt 270° S)
    [ 1, -1],   // edge 5 (SE→E,  midpt 330°)
];

const perimeterEdges = [];
for (let q = -4; q <= 4; q++) {
    for (let r = -4; r <= 4; r++) {
        if (Math.abs(q + r) > 4) continue;
        for (let k = 0; k < 6; k++) {
            const [dq, dr] = edgeNeighbors[k];
            if (!cluster.has(`${q + dq},${r + dr}`)) {
                perimeterEdges.push({ vA: hexVertex(q, r, k), vB: hexVertex(q, r, (k + 1) % 6) });
            }
        }
    }
}

// Stitch into a CCW polygon
function vk(v) { return `${v[0].toFixed(3)},${v[1].toFixed(3)}`; }
const startMap = new Map();
for (const e of perimeterEdges) startMap.set(vk(e.vA), e);

let polygon = [];
let cur = perimeterEdges[0];
const startKey = vk(cur.vA);
polygon.push(cur.vA);
let safety = 0;
while (safety++ < 1000) {
    polygon.push(cur.vB);
    const next = startMap.get(vk(cur.vB));
    if (!next || vk(next.vA) === startKey) break;
    cur = next;
}
// Remove possible duplicate-of-start at end
if (vk(polygon[polygon.length - 1]) === startKey) polygon.pop();

// Verify orientation; reverse if CW
let area = 0;
for (let i = 0; i < polygon.length; i++) {
    const [x1, z1] = polygon[i];
    const [x2, z2] = polygon[(i + 1) % polygon.length];
    area += x1 * z2 - x2 * z1;
}
if (area < 0) polygon.reverse();

// Rotate polygon so vertex 0 is the FIRST one with the LARGEST z
// (this gives us a recognisable "north" anchor for piece 0, but the
// pieces themselves can be moved freely in TTS).
{
    let bestIdx = 0;
    for (let i = 1; i < polygon.length; i++) {
        if (polygon[i][1] > polygon[bestIdx][1]) bestIdx = i;
    }
    polygon = polygon.slice(bestIdx).concat(polygon.slice(0, bestIdx));
}
console.log(`Perimeter polygon: ${polygon.length} verts, area=${(area / 2).toFixed(2)} (CCW)`);

// ─── Split perimeter into 5 sections ───────────────────────────
const N = polygon.length;
const sectionStarts = [];
for (let i = 0; i <= NUM_PIECES; i++) sectionStarts.push(Math.round(N * i / NUM_PIECES));
// sectionStarts: [0, 11, 22, 32, 43, 54]; section i covers indices [s_i, s_{i+1}]
console.log("Section boundaries:", sectionStarts);

// ─── Triangulation (earcut, robust for concave simple polygons) ─
function triangulate(poly) {
    // earcut wants a flat [x0, y0, x1, y1, ...] array; treat z as y.
    const flat = [];
    for (const [x, z] of poly) { flat.push(x); flat.push(z); }
    const idxFlat = earcut(flat);
    const tris = [];
    for (let i = 0; i < idxFlat.length; i += 3) {
        tris.push([idxFlat[i], idxFlat[i + 1], idxFlat[i + 2]]);
    }
    return tris;
}

// ─── Per-piece outline + mesh ──────────────────────────────────
function buildPiece(pieceIdx) {
    const sStart = sectionStarts[pieceIdx];
    const sEnd   = sectionStarts[pieceIdx + 1];
    const innerPts = [];
    for (let j = sStart; j <= sEnd; j++) innerPts.push(polygon[j % N]);

    const innerStart = innerPts[0];
    const innerEnd   = innerPts[innerPts.length - 1];
    const startAng   = Math.atan2(innerStart[1], innerStart[0]);
    let   endAng     = Math.atan2(innerEnd[1], innerEnd[0]);
    while (endAng <= startAng) endAng += 2 * Math.PI;
    const outerStart = [R_OUT * Math.cos(startAng), R_OUT * Math.sin(startAng)];
    const outerEnd   = [R_OUT * Math.cos(endAng),   R_OUT * Math.sin(endAng)];

    // Outer arc, sampled CW (from end angle back toward start angle)
    const N_ARC = N_OUT_SUBDIV * (innerPts.length - 1);
    const outerArcPts = [];
    for (let i = 1; i < N_ARC; i++) {
        const t = 1 - i / N_ARC;
        const a = startAng + t * (endAng - startAng);
        outerArcPts.push([R_OUT * Math.cos(a), R_OUT * Math.sin(a)]);
    }

    // Side connectors: for both sides, the +angle direction at angle θ is
    //   p_plus = (-sin θ, cos θ)
    // Tab on CCW end protrudes in +angle direction (outside piece body).
    // Notch on CW start cuts in +angle direction (into piece body of NEXT piece).
    const pPlusEnd   = [-Math.sin(endAng),   Math.cos(endAng)];
    const pPlusStart = [-Math.sin(startAng), Math.cos(startAng)];

    // CCW end side: traversal = innerEnd → outerEnd. Compute base points
    // along this line at half-width offsets from midpoint.
    const sideEndMid  = [(innerEnd[0] + outerEnd[0]) / 2,
                         (innerEnd[1] + outerEnd[1]) / 2];
    const sideEndDir  = [outerEnd[0] - innerEnd[0], outerEnd[1] - innerEnd[1]];
    const sideEndLen  = Math.hypot(sideEndDir[0], sideEndDir[1]);
    const sideEndUnit = [sideEndDir[0] / sideEndLen, sideEndDir[1] / sideEndLen];
    const tabBase1 = [sideEndMid[0] - sideEndUnit[0] * TAB_RADIAL_HALF,
                      sideEndMid[1] - sideEndUnit[1] * TAB_RADIAL_HALF];
    const tabBase2 = [sideEndMid[0] + sideEndUnit[0] * TAB_RADIAL_HALF,
                      sideEndMid[1] + sideEndUnit[1] * TAB_RADIAL_HALF];
    const tabTip1  = [tabBase1[0] + pPlusEnd[0] * TAB_OUT,
                      tabBase1[1] + pPlusEnd[1] * TAB_OUT];
    const tabTip2  = [tabBase2[0] + pPlusEnd[0] * TAB_OUT,
                      tabBase2[1] + pPlusEnd[1] * TAB_OUT];

    // CW start side: traversal = outerStart → innerStart.
    const sideStMid  = [(outerStart[0] + innerStart[0]) / 2,
                        (outerStart[1] + innerStart[1]) / 2];
    const sideStDir  = [innerStart[0] - outerStart[0], innerStart[1] - outerStart[1]];
    const sideStLen  = Math.hypot(sideStDir[0], sideStDir[1]);
    const sideStUnit = [sideStDir[0] / sideStLen, sideStDir[1] / sideStLen];
    const notchBase1 = [sideStMid[0] - sideStUnit[0] * TAB_RADIAL_HALF,
                        sideStMid[1] - sideStUnit[1] * TAB_RADIAL_HALF];
    const notchBase2 = [sideStMid[0] + sideStUnit[0] * TAB_RADIAL_HALF,
                        sideStMid[1] + sideStUnit[1] * TAB_RADIAL_HALF];
    const notchTip1  = [notchBase1[0] + pPlusStart[0] * TAB_OUT,
                        notchBase1[1] + pPlusStart[1] * TAB_OUT];
    const notchTip2  = [notchBase2[0] + pPlusStart[0] * TAB_OUT,
                        notchBase2[1] + pPlusStart[1] * TAB_OUT];

    // Outline CCW:
    //  inner zigzag (innerStart → innerEnd, includes both endpoints)
    //  + tabBase1 → tabTip1 → tabTip2 → tabBase2 → outerEnd
    //  + outer arc (CW from outerEnd toward outerStart, exclusive of both)
    //  + outerStart → notchBase1 → notchTip1 → notchTip2 → notchBase2 (closes back to innerStart)
    const outline = [];
    for (const p of innerPts) outline.push(p);
    outline.push(tabBase1, tabTip1, tabTip2, tabBase2, outerEnd);
    for (const p of outerArcPts) outline.push(p);
    outline.push(outerStart, notchBase1, notchTip1, notchTip2, notchBase2);

    return outline;
}

// ─── Build OBJ + UV ─────────────────────────────────────────────
function writePieceObj(pieceIdx, outline) {
    let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
    for (const [x, z] of outline) {
        if (x < minX) minX = x; if (x > maxX) maxX = x;
        if (z < minZ) minZ = z; if (z > maxZ) maxZ = z;
    }
    const bboxW = maxX - minX, bboxH = maxZ - minZ;

    const triangles = triangulate(outline);
    console.log(`  Piece ${pieceIdx + 1}: ${outline.length} outline verts → ${triangles.length} tris`);

    const halfThick = THICK / 2;
    const N_O = outline.length;

    const lines = [`# W.A.R.H.A.M.S Planet Frame Piece ${pieceIdx + 1} (${VERSION})`,
                   `o PlanetFramePiece${pieceIdx + 1}`];

    // Vertices (1..2N): top first, then bottom
    for (const [x, z] of outline) lines.push(`v ${x.toFixed(4)} ${(+halfThick).toFixed(4)} ${z.toFixed(4)}`);
    for (const [x, z] of outline) lines.push(`v ${x.toFixed(4)} ${(-halfThick).toFixed(4)} ${z.toFixed(4)}`);

    // UVs (1..2N): top get the bbox-mapped UV; bottom share the same UV
    for (const [x, z] of outline) {
        const u = (x - minX) / bboxW;
        const v = (z - minZ) / bboxH;
        lines.push(`vt ${u.toFixed(4)} ${v.toFixed(4)}`);
    }
    for (const [x, z] of outline) {
        const u = (x - minX) / bboxW;
        const v = (z - minZ) / bboxH;
        lines.push(`vt ${u.toFixed(4)} ${v.toFixed(4)}`);
    }

    const TOP = 1, BOT = N_O + 1;       // 1-indexed offsets
    function vt(idx) { return `${idx}/${idx}`; }

    // Top face: CCW from above → normal +Y
    for (const [a, b, c] of triangles) {
        lines.push(`f ${vt(TOP + a)} ${vt(TOP + b)} ${vt(TOP + c)}`);
    }
    // Bottom face: reversed winding → normal -Y
    for (const [a, b, c] of triangles) {
        lines.push(`f ${vt(BOT + a)} ${vt(BOT + c)} ${vt(BOT + b)}`);
    }
    // Side walls (quad strip)
    for (let i = 0; i < N_O; i++) {
        const j = (i + 1) % N_O;
        const tA = TOP + i, tB = TOP + j;
        const bA = BOT + i, bB = BOT + j;
        lines.push(`f ${vt(tA)} ${vt(bA)} ${vt(bB)}`);
        lines.push(`f ${vt(tA)} ${vt(bB)} ${vt(tB)}`);
    }

    fs.writeFileSync(path.join(OUT, `planet-frame-piece-${pieceIdx + 1}.obj`),
                     lines.join("\n") + "\n");
}

// ─── Letter textures ────────────────────────────────────────────
function rgba(r, g, b, a = 255) {
    return (((r & 0xff) << 24) | ((g & 0xff) << 16) | ((b & 0xff) << 8) | (a & 0xff)) >>> 0;
}
async function writeTextures() {
    const TEX = 512;
    const ATMO      = rgba( 70, 130, 200);
    const ATMO_DARK = rgba( 25,  55, 100);
    const WHITE     = rgba(245, 248, 252);

    const titleFont = await loadFont(path.join(FONT_DIR, "open-sans/open-sans-128-black/open-sans-128-black.fnt"));
    const letters = ["a", "b", "c", "d", "e"];

    for (let i = 0; i < NUM_PIECES; i++) {
        const img = new Jimp({ width: TEX, height: TEX, color: ATMO });
        // Subtle border
        for (let y = 0; y < TEX; y++) {
            for (let x = 0; x < TEX; x++) {
                if (x < 8 || x >= TEX - 8 || y < 8 || y >= TEX - 8) img.setPixelColor(ATMO_DARK, x, y);
            }
        }
        // White circle badge
        const cx = TEX / 2, cy = TEX / 2, r = 140;
        for (let y = -r; y <= r; y++) {
            for (let x = -r; x <= r; x++) {
                if (x*x + y*y <= r*r) img.setPixelColor(WHITE, cx + x, cy + y);
                if (x*x + y*y > (r-6)*(r-6) && x*x + y*y <= r*r) img.setPixelColor(ATMO_DARK, cx + x, cy + y);
            }
        }
        img.print({ font: titleFont, x: cx - 38, y: cy - 80, text: letters[i] });
        await img.write(path.join(OUT, `planet-frame-piece-${i + 1}.png`));
    }
    console.log(`✅ ${NUM_PIECES} letter textures written`);
}

// ─── Run ────────────────────────────────────────────────────────
(async () => {
    earcut = (await import("earcut")).default;
    for (let i = 0; i < NUM_PIECES; i++) {
        const outline = buildPiece(i);
        writePieceObj(i, outline);
    }
    await writeTextures();
    console.log(`✅ ${NUM_PIECES} planet-frame piece OBJs + textures written to ${OUT}/`);
})();
