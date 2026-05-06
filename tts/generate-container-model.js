#!/usr/bin/env node
/**
 * W.A.R H.A.M.S — Cargo Shipping Container Mesh Generator
 *
 * Builds a recognizable ISO-style intermodal shipping container:
 *   • Long rectangular steel body (length:width:height ≈ 3.2 : 1 : 1)
 *   • Corrugated long sides (ridges along the length, classic look)
 *   • Solid blunt nose (one short end)
 *   • Pair of doors on the rear end (vertical seam + 4 locking bars)
 *   • Corner posts slightly thicker at the top/bottom rails
 *
 * Sized to drop next to a Spaceport tile on the table — overall footprint
 * about 1.6 long × 0.5 wide × 0.5 tall (TTS units). Coloured at runtime
 * via TTS ColorDiffuse so the same mesh + flat white diffuse works for
 * any container colour (cyan, red, green, blue, orange, white).
 *
 * Usage:   node generate-container-model.js
 * Outputs: tts/v<VERSION>/container.obj
 *          tts/v<VERSION>/container-texture.png
 */

const path = require("path");
const fs = require("fs");
const { Jimp } = require("jimp");

// Versioned path for cache-busting (TTS strips ?query strings).
// Must match the version expected by generate-save.js.
const VERSION = "v52";
const outDir = path.join(__dirname, VERSION);
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

// ─── Geometry ───────────────────────────────────────────────────────
// Container axes: X = length, Y = up, Z = width.
// Origin at floor centre so it sits naturally on the table.
const L  = 1.60;  // length (X span = -L/2 .. +L/2)
const W  = 0.50;  // width  (Z span = -W/2 .. +W/2)
const H  = 0.50;  // height (Y span = 0   .. H)

// Corrugation along the long sides: small triangular ridges every CORR_STEP
// along X. Ridge protrudes by CORR_DEPTH outward in Z.
const CORR_STEP  = 0.08;          // X-spacing of ridge peaks
const CORR_DEPTH = 0.012;         // outward bulge on each ridge

// Door inset on the +X end: recessed by DOOR_INSET in X to read as a
// distinct door panel. The opposite end (-X) is flush.
const DOOR_INSET = 0.02;

// Corner posts: thicker frame at the four vertical edges (visual cue
// that this is a steel-framed container, not a generic crate).
const POST_W = 0.04;              // post thickness (Z extrusion)
const POST_L = 0.05;              // post depth     (X extrusion)
const RAIL_H = 0.04;              // top/bottom rail thickness (Y)

// ─── OBJ plumbing ───────────────────────────────────────────────────
const verts = [];
const faces = [];

function addV(x, y, z) {
    verts.push([x, y, z]);
    return verts.length;          // OBJ is 1-indexed
}
function addTri(a, b, c)        { faces.push([a, b, c]); }
function addQuad(a, b, c, d)    { addTri(a, b, c); addTri(a, c, d); }

// Add an axis-aligned box from (x0..x1, y0..y1, z0..z1) with all 6 faces
// wound CCW from outside (TTS backface-culls inward windings).
function addBox(x0, x1, y0, y1, z0, z1) {
    const v000 = addV(x0, y0, z0);
    const v100 = addV(x1, y0, z0);
    const v110 = addV(x1, y1, z0);
    const v010 = addV(x0, y1, z0);
    const v001 = addV(x0, y0, z1);
    const v101 = addV(x1, y0, z1);
    const v111 = addV(x1, y1, z1);
    const v011 = addV(x0, y1, z1);
    // -Z face (front when viewed from -Z)
    addQuad(v000, v010, v110, v100);
    // +Z face
    addQuad(v001, v101, v111, v011);
    // -X face
    addQuad(v000, v001, v011, v010);
    // +X face
    addQuad(v100, v110, v111, v101);
    // -Y face (bottom)
    addQuad(v000, v100, v101, v001);
    // +Y face (top)
    addQuad(v010, v011, v111, v110);
}

// Add a corrugated long-side panel.
// side = +1 (front, +Z) or -1 (back, -Z).
// Builds a sawtooth ribbon along X at the wall plane (z = side*W/2),
// alternating between baseZ and baseZ + side*CORR_DEPTH.
function addCorrugatedSide(side) {
    const baseZ = side * (W / 2);
    const tipZ  = baseZ + side * CORR_DEPTH;
    // Wall spans X from -L/2+POST_L .. +L/2-POST_L (corner posts cap it),
    // and Y from RAIL_H .. H-RAIL_H (rails cap top/bottom).
    const x0 = -L / 2 + POST_L;
    const x1 =  L / 2 - POST_L;
    const y0 = RAIL_H;
    const y1 = H - RAIL_H;

    // Build a polyline of (x, z) points along the corrugation profile.
    const profile = []; // array of {x, z}
    let toggle = false;
    for (let x = x0; x <= x1 + 1e-6; x += CORR_STEP / 2) {
        profile.push({ x: Math.min(x, x1), z: toggle ? tipZ : baseZ });
        toggle = !toggle;
    }
    if (profile[profile.length - 1].x < x1 - 1e-6) {
        profile.push({ x: x1, z: baseZ });
    }

    // Extrude profile from y0 to y1 to form the wall.
    // Winding so the outward-facing normal points along +side*Z
    // (verified by cross-product of adjacent edges).
    const lower = profile.map(p => addV(p.x, y0, p.z));
    const upper = profile.map(p => addV(p.x, y1, p.z));
    for (let i = 0; i < profile.length - 1; i++) {
        if (side > 0) {
            // +Z side: outward normal = +Z. CCW from +Z viewpoint:
            // (lower[i] -> lower[i+1] -> upper[i+1] -> upper[i])
            addQuad(lower[i], lower[i + 1], upper[i + 1], upper[i]);
        } else {
            // -Z side: outward normal = -Z. CCW from -Z viewpoint
            // (i.e. CW when viewed from +Z) — reverse the winding.
            addQuad(lower[i], upper[i], upper[i + 1], lower[i + 1]);
        }
    }
}

// ─── Build the container ────────────────────────────────────────────

// 1. Main body box (between the corner posts; corrugated sides will be
//    drawn on top of this). Slightly inset so the corner posts and
//    rails stand proud as a frame.
//    We DON'T draw the long side faces here — those come from
//    addCorrugatedSide(). Instead we draw the body as two end walls,
//    a floor, and a ceiling.
{
    const x0 = -L / 2 + POST_L;
    const x1 =  L / 2 - POST_L;
    const y0 = 0;
    const y1 = H;
    const z0 = -W / 2;
    const z1 =  W / 2;
    const v000 = addV(x0, y0, z0);
    const v100 = addV(x1, y0, z0);
    const v110 = addV(x1, y1, z0);
    const v010 = addV(x0, y1, z0);
    const v001 = addV(x0, y0, z1);
    const v101 = addV(x1, y0, z1);
    const v111 = addV(x1, y1, z1);
    const v011 = addV(x0, y1, z1);
    // Floor (-Y), Ceiling (+Y)
    addQuad(v000, v100, v101, v001);
    addQuad(v010, v011, v111, v110);
    // Nose end (-X), flush
    addQuad(v000, v001, v011, v010);
    // Door end (+X) — recessed slightly to read as a panel.
    // Replace flush face with an inset panel + a thin frame around it.
    // Inset panel:
    const dx = x1 - DOOR_INSET;
    const d000 = addV(dx, y0, z0);
    const d100 = addV(dx, y0, z1);
    const d110 = addV(dx, y1, z1);
    const d010 = addV(dx, y1, z0);
    addQuad(d000, d010, d110, d100);            // door panel face (+X normal)
    // Frame ring around the door (top, bottom, left, right strips that
    // connect the recessed panel to the outer +X plane). Each is a thin
    // quad whose outward normal is +Y/-Y/-Z/+Z respectively.
    addQuad(v100, d000, d100, v101);            // bottom strip (-Y normal)
    addQuad(v110, v111, d110, d010);            // top strip (+Y normal)
    addQuad(v100, v110, d010, d000);            // -Z strip (-Z normal)
    addQuad(v101, d100, d110, v111);            // +Z strip (+Z normal)
}

// 2. Corrugated long sides (front and back).
addCorrugatedSide(+1);
addCorrugatedSide(-1);

// 3. Four corner posts (vertical bars at the four edges).
const cornerPosts = [
    [ -L / 2,            -L / 2 + POST_L,  -W / 2,            -W / 2 + POST_W ],
    [ -L / 2,            -L / 2 + POST_L,   W / 2 - POST_W,    W / 2          ],
    [  L / 2 - POST_L,    L / 2,           -W / 2,            -W / 2 + POST_W ],
    [  L / 2 - POST_L,    L / 2,            W / 2 - POST_W,    W / 2          ],
];
for (const [x0, x1, z0, z1] of cornerPosts) {
    addBox(x0, x1, 0, H, z0, z1);
}

// 4. Top + bottom rails along the long edges (steel I-beam look).
const rails = [
    // Bottom front rail
    [ -L / 2 + POST_L,  L / 2 - POST_L,  0,           RAIL_H,      W / 2 - POST_W,  W / 2          ],
    // Bottom back rail
    [ -L / 2 + POST_L,  L / 2 - POST_L,  0,           RAIL_H,     -W / 2,          -W / 2 + POST_W ],
    // Top front rail
    [ -L / 2 + POST_L,  L / 2 - POST_L,  H - RAIL_H,  H,           W / 2 - POST_W,  W / 2          ],
    // Top back rail
    [ -L / 2 + POST_L,  L / 2 - POST_L,  H - RAIL_H,  H,          -W / 2,          -W / 2 + POST_W ],
];
for (const [x0, x1, y0, y1, z0, z1] of rails) {
    addBox(x0, x1, y0, y1, z0, z1);
}

// 5. Door detail on the +X end: vertical seam (centre split) + four
//    horizontal locking-bar studs. We model these as tiny boxes
//    protruding +X from the recessed door panel so they read as 3D
//    hardware in any view.
const doorX0 = L / 2 - DOOR_INSET;
const doorX1 = L / 2 - DOOR_INSET + 0.012;     // protrudes 12mm
// Centre seam — a thin tall box across the door's full height.
addBox(doorX0, doorX1, RAIL_H, H - RAIL_H, -0.010, 0.010);
// Locking bars — four vertical rods (two per door leaf).
const barXZ = [
    [ -W / 4 - 0.04, -W / 4 - 0.02 ],
    [ -W / 4 + 0.06, -W / 4 + 0.08 ],
    [  W / 4 - 0.08,  W / 4 - 0.06 ],
    [  W / 4 + 0.02,  W / 4 + 0.04 ],
];
for (const [z0, z1] of barXZ) {
    addBox(doorX0, doorX1, RAIL_H + 0.02, H - RAIL_H - 0.02, z0, z1);
}

// ─── Write OBJ ──────────────────────────────────────────────────────
const lines = [
    "# W.A.R.H.A.M.S ISO cargo shipping container",
    `# verts: ${verts.length}, tris: ${faces.length}`,
    "o CargoContainer",
];
for (const [x, y, z] of verts) lines.push(`v ${x.toFixed(5)} ${y.toFixed(5)} ${z.toFixed(5)}`);
for (const [a, b, c] of faces) lines.push(`f ${a} ${b} ${c}`);
fs.writeFileSync(path.join(outDir, "container.obj"), lines.join("\n") + "\n");
console.log(`container.obj: ${verts.length} verts, ${faces.length} tris`);

// ─── Tiny white diffuse (TTS Custom_Model requires a DiffuseURL) ────
async function writeTexture() {
    const tex = new Jimp({ width: 4, height: 4, color: 0xFFFFFFFF });
    await tex.write(path.join(outDir, "container-texture.png"));
    console.log("container-texture.png");
}
writeTexture().catch(e => { console.error(e); process.exit(1); });
