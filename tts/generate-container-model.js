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
 *   • Number 1-6 painted on the TOP face (visible from the typical
 *     top-down TTS camera) and on the DOOR panel (visible from the
 *     side). Each container number has its own diffuse texture.
 *
 * Sized to drop next to a Spaceport tile on the table — overall footprint
 * about 1.6 long × 0.5 wide × 0.5 tall (TTS units). Coloured at runtime
 * via TTS ColorDiffuse so the same mesh works for any container colour
 * (cyan, red, green, blue, orange, white).
 *
 * Usage:   node generate-container-model.js
 * Outputs: tts/v<VERSION>/container.obj
 *          tts/v<VERSION>/container_1.png .. container_6.png
 */

const path = require("path");
const fs = require("fs");
const { Jimp, loadFont } = require("jimp");

// Versioned path for cache-busting (TTS strips ?query strings).
// Must match the version expected by generate-save.js.
const VERSION = "v56";
const outDir = path.join(__dirname, VERSION);
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

// Bundled Jimp font dir (same path that generate-number-tokens.js uses).
const FONT_DIR = path.join(__dirname, "..", "node_modules", "@jimp", "plugin-print", "dist", "fonts");

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
// The mesh has 5 fixed UV coordinates:
//   UV 1 — single white texel (used by 99% of faces; ColorDiffuse
//          tints this to the container's colour at runtime).
//   UV 2..5 — the four corners of the texture, used by the TOP face
//          of the body box and the DOOR PANEL face so the painted
//          digit shows up upright on those faces.
//
// Texture layout (per-number PNG):
//   • Wide rectangle whose aspect roughly matches the top face
//     (~3:1). White background. Big bold black digit centered.
//   • The 1×1 UV area maps onto the full texture.
const verts = [];
const uvs   = [];          // each entry [u, v]
const faces = [];          // each entry { v: [a,b,c], t: [ta,tb,tc] }

function addV(x, y, z) {
    verts.push([x, y, z]);
    return verts.length;          // OBJ is 1-indexed
}
function addUV(u, v) {
    uvs.push([u, v]);
    return uvs.length;
}
// Predeclared UVs.
const UV_WHITE = addUV(0.999, 0.999);  // tiny white-pixel texel
const UV_BL    = addUV(0.001, 0.001);  // texture bottom-left
const UV_BR    = addUV(0.999, 0.001);  // texture bottom-right
const UV_TR    = addUV(0.999, 0.999);  // texture top-right (= UV_WHITE — fine, different visual role)
const UV_TL    = addUV(0.001, 0.999);  // texture top-left

function addTri(a, b, c, ta = UV_WHITE, tb = UV_WHITE, tc = UV_WHITE) {
    faces.push({ v: [a, b, c], t: [ta, tb, tc] });
}
function addQuad(a, b, c, d, ta = UV_WHITE, tb = UV_WHITE, tc = UV_WHITE, td = UV_WHITE) {
    addTri(a, b, c, ta, tb, tc);
    addTri(a, c, d, ta, tc, td);
}

// Add an axis-aligned box from (x0..x1, y0..y1, z0..z1) with all 6 faces
// wound CCW from outside (TTS backface-culls inward windings). All
// faces use the white texel UV.
function addBox(x0, x1, y0, y1, z0, z1) {
    const v000 = addV(x0, y0, z0);
    const v100 = addV(x1, y0, z0);
    const v110 = addV(x1, y1, z0);
    const v010 = addV(x0, y1, z0);
    const v001 = addV(x0, y0, z1);
    const v101 = addV(x1, y0, z1);
    const v111 = addV(x1, y1, z1);
    const v011 = addV(x0, y1, z1);
    addQuad(v000, v010, v110, v100);  // -Z
    addQuad(v001, v101, v111, v011);  // +Z
    addQuad(v000, v001, v011, v010);  // -X
    addQuad(v100, v110, v111, v101);  // +X
    addQuad(v000, v100, v101, v001);  // -Y
    addQuad(v010, v011, v111, v110);  // +Y
}

// Add a corrugated long-side panel.
// side = +1 (front, +Z) or -1 (back, -Z).
function addCorrugatedSide(side) {
    const baseZ = side * (W / 2);
    const tipZ  = baseZ + side * CORR_DEPTH;
    const x0 = -L / 2 + POST_L;
    const x1 =  L / 2 - POST_L;
    const y0 = RAIL_H;
    const y1 = H - RAIL_H;

    const profile = [];
    let toggle = false;
    for (let x = x0; x <= x1 + 1e-6; x += CORR_STEP / 2) {
        profile.push({ x: Math.min(x, x1), z: toggle ? tipZ : baseZ });
        toggle = !toggle;
    }
    if (profile[profile.length - 1].x < x1 - 1e-6) {
        profile.push({ x: x1, z: baseZ });
    }

    const lower = profile.map(p => addV(p.x, y0, p.z));
    const upper = profile.map(p => addV(p.x, y1, p.z));
    for (let i = 0; i < profile.length - 1; i++) {
        if (side > 0) {
            addQuad(lower[i], lower[i + 1], upper[i + 1], upper[i]);
        } else {
            addQuad(lower[i], upper[i], upper[i + 1], lower[i + 1]);
        }
    }
}

// ─── Build the container ────────────────────────────────────────────

// 1. Main body box (between the corner posts; corrugated sides will be
//    drawn on top of this). The TOP face and the DOOR PANEL face use
//    the painted-digit UVs so the container number reads from above
//    and from the rear.
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
    // Floor (-Y), white.
    addQuad(v000, v100, v101, v001);
    // CEILING (+Y) — paint the digit. Vertices in addQuad order:
    //   v010 = (x0, y1, z0)  → top-down view: bottom-left  → UV (1,0)
    //   v011 = (x0, y1, z1)  → top-down view: top-left     → UV (1,1)
    //   v111 = (x1, y1, z1)  → top-down view: top-right    → UV (0,1)
    //   v110 = (x1, y1, z0)  → top-down view: bottom-right → UV (0,0)
    // U axis is INVERTED relative to world +X so the digit reads
    // right-way-round when viewed from above (Unity flips V on PNG
    // import; without this U-flip the digit appears as its mirror
    // image, e.g. a '3' rendered as 'Ɛ').
    addQuad(v010, v011, v111, v110, UV_BR, UV_TR, UV_TL, UV_BL);
    // Nose end (-X), flush, white.
    addQuad(v000, v001, v011, v010);
    // DOOR PANEL face (+X, recessed by DOOR_INSET) — paint the digit.
    // Surrounding frame strips stay white.
    const dx = x1 - DOOR_INSET;
    const d000 = addV(dx, y0, z0);
    const d100 = addV(dx, y0, z1);
    const d110 = addV(dx, y1, z1);
    const d010 = addV(dx, y1, z0);
    // addQuad(d000, d010, d110, d100) — viewed from +X with Y up:
    //   d000 = (dx, y0, z0)  → +X view: bottom-right (Z grows leftward)
    //   d010 = (dx, y1, z0)  → +X view: top-right
    //   d110 = (dx, y1, z1)  → +X view: top-left
    //   d100 = (dx, y0, z1)  → +X view: bottom-left
    addQuad(d000, d010, d110, d100, UV_BR, UV_TR, UV_TL, UV_BL);
    // Door frame strips around the inset panel — white.
    addQuad(v100, d000, d100, v101);            // bottom strip (-Y normal)
    addQuad(v110, v111, d110, d010);            // top strip (+Y normal)
    addQuad(v100, v110, d010, d000);            // -Z strip
    addQuad(v101, d100, d110, v111);            // +Z strip
}

// 2. Corrugated long sides (front and back).
addCorrugatedSide(+1);
addCorrugatedSide(-1);

// 3. Four corner posts.
const cornerPosts = [
    [ -L / 2,            -L / 2 + POST_L,  -W / 2,            -W / 2 + POST_W ],
    [ -L / 2,            -L / 2 + POST_L,   W / 2 - POST_W,    W / 2          ],
    [  L / 2 - POST_L,    L / 2,           -W / 2,            -W / 2 + POST_W ],
    [  L / 2 - POST_L,    L / 2,            W / 2 - POST_W,    W / 2          ],
];
for (const [x0, x1, z0, z1] of cornerPosts) {
    addBox(x0, x1, 0, H, z0, z1);
}

// 4. Top + bottom rails along the long edges.
const rails = [
    [ -L / 2 + POST_L,  L / 2 - POST_L,  0,           RAIL_H,      W / 2 - POST_W,  W / 2          ],
    [ -L / 2 + POST_L,  L / 2 - POST_L,  0,           RAIL_H,     -W / 2,          -W / 2 + POST_W ],
    [ -L / 2 + POST_L,  L / 2 - POST_L,  H - RAIL_H,  H,           W / 2 - POST_W,  W / 2          ],
    [ -L / 2 + POST_L,  L / 2 - POST_L,  H - RAIL_H,  H,          -W / 2,          -W / 2 + POST_W ],
];
for (const [x0, x1, y0, y1, z0, z1] of rails) {
    addBox(x0, x1, y0, y1, z0, z1);
}

// 5. Door hardware: vertical centre seam + 4 locking-bar rods on the
//    +X face, protruding 12mm from the recessed door panel.
const doorX0 = L / 2 - DOOR_INSET;
const doorX1 = L / 2 - DOOR_INSET + 0.012;
addBox(doorX0, doorX1, RAIL_H, H - RAIL_H, -0.010, 0.010);
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
    `# verts: ${verts.length}, uvs: ${uvs.length}, tris: ${faces.length}`,
    "o CargoContainer",
];
for (const [x, y, z] of verts) lines.push(`v ${x.toFixed(5)} ${y.toFixed(5)} ${z.toFixed(5)}`);
for (const [u, v] of uvs)     lines.push(`vt ${u.toFixed(5)} ${v.toFixed(5)}`);
for (const f of faces) {
    lines.push(`f ${f.v[0]}/${f.t[0]} ${f.v[1]}/${f.t[1]} ${f.v[2]}/${f.t[2]}`);
}
fs.writeFileSync(path.join(outDir, "container.obj"), lines.join("\n") + "\n");
console.log(`container.obj: ${verts.length} verts, ${uvs.length} uvs, ${faces.length} tris`);

// ─── Generate per-number diffuse textures ───────────────────────────
// Texture dimensions roughly match the body's top-face aspect (~3:1)
// so the digit isn't badly stretched. White background → tinted to
// container colour by ColorDiffuse at runtime; black digit stays
// black so the number reads against any tint.
const TEX_W = 384;
const TEX_H = 128;

async function writeTextures() {
    // Use the largest bundled bold font; we'll print and crop-fit to
    // the centre square of each texture.
    const font = await loadFont(path.join(FONT_DIR, "open-sans/open-sans-128-black/open-sans-128-black.fnt"));

    for (let n = 1; n <= 6; n++) {
        const img = new Jimp({ width: TEX_W, height: TEX_H, color: 0xFFFFFFFF });

        // Print the digit centered horizontally; vertical centering is
        // approximate (open-sans-128 glyphs sit a few px below the
        // bbox top, hence the small y offset).
        img.print({
            font,
            x: 0,
            y: 4,
            text: { text: String(n), alignmentX: 2 /* CENTER */ },
            maxWidth: TEX_W,
        });

        const out = path.join(outDir, `container_${n}.png`);
        await img.write(out);
        console.log(`container_${n}.png`);
    }
}
writeTextures().catch(e => { console.error(e); process.exit(1); });
