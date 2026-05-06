#!/usr/bin/env node
/**
 * W.A.R H.A.M.S — WW2 Concrete Bunker Mesh Generator
 *
 * Builds a classic WW2 hexagonal concrete pillbox:
 *   • Hex body — squat, slightly battered (top narrower than bottom)
 *   • Overhanging hex roof slab — distinctive concrete-cap silhouette
 *   • Small hex observation cupola on top
 *   • Recessed horizontal embrasure slit running around the body just
 *     under the roof overhang (the iconic WW2 firing slit)
 *
 * Sized to drop into a hex tile on the table — overall footprint about
 * 0.6 TTS units across the flats, total height ~0.32. Coloured at
 * runtime via TTS ColorDiffuse so the same mesh + flat white diffuse
 * works for any concrete tint.
 *
 * Usage:   node generate-bunker-model.js
 * Outputs: tts/cards/bunker.obj
 *          tts/cards/bunker-texture.png
 */

const path = require("path");
const fs = require("fs");
const { Jimp } = require("jimp");

// Published under the versioned soldier path so TTS treats every bump
// as a brand-new URL (TTS strips ?query strings, so path-based busting
// is the only reliable cache-buster). Must match SOLDIER_BASE in
// generate-save.js.
const VERSION = "v59";
const outDir = path.join(__dirname, VERSION);
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

// ─── Geometry ───────────────────────────────────────────────────────
// Hex prism — 6 sides. All radii are CIRCUMRADIUS (corner-to-center).
const SIDES = 6;

// Body — battered concrete walls.
const BODY_R_BOT = 0.32;       // bottom corner radius
const BODY_R_TOP = 0.30;       // slight inward batter
const BODY_Y_BOT = 0.00;
const BODY_Y_SLIT_BOT = 0.16;  // start of embrasure slit
const BODY_Y_SLIT_TOP = 0.20;  // end of embrasure slit
const BODY_Y_TOP = 0.24;       // body top (under roof slab)
const SLIT_R = 0.27;           // slit recess radius (smaller = deeper)

// Roof slab — overhangs the body for the iconic concrete cap.
const ROOF_R_BOT = 0.36;
const ROOF_R_TOP = 0.34;
const ROOF_Y_BOT = BODY_Y_TOP;
const ROOF_Y_TOP = 0.30;

// Observation cupola on top.
const CUP_R_BOT = 0.16;
const CUP_R_TOP = 0.14;
const CUP_Y_BOT = ROOF_Y_TOP;
const CUP_Y_TOP = 0.36;

// ─── OBJ plumbing ───────────────────────────────────────────────────
const verts = [];
const faces = [];

function addV(x, y, z) {
    verts.push([x, y, z]);
    return verts.length;          // OBJ is 1-indexed
}
function addTri(a, b, c)        { faces.push([a, b, c]); }
function addQuad(a, b, c, d)    { addTri(a, b, c); addTri(a, c, d); }

// Build a hex ring at height y, radius r. Returns the 6 vertex indices
// in CCW order viewed from +Y. Rotated by hexRot so a flat side faces
// +Z (front), giving the bunker a clear "front face" look.
const hexRot = Math.PI / 6;
function hexRing(y, r) {
    const ring = [];
    for (let i = 0; i < SIDES; i++) {
        const a = hexRot + (i / SIDES) * Math.PI * 2;
        ring.push(addV(Math.cos(a) * r, y, Math.sin(a) * r));
    }
    return ring;
}

// Connect two same-cardinality rings with quads. lower/upper are vertex
// index arrays in matching CCW-from-above order; this winding produces
// outward-facing normals (verified against generate-soldier-obj.js's
// base-rim quads). The "obvious" lower-lower-upper-upper order is the
// REVERSED one that TTS backface-culls into invisibility.
function bandSides(lower, upper) {
    for (let i = 0; i < lower.length; i++) {
        const ni = (i + 1) % lower.length;
        addQuad(lower[i], upper[i], upper[ni], lower[ni]);
    }
}

// Cap a ring with a fan from a center vertex. winding=true → +Y normal,
// false → -Y normal.
function capRing(ring, y, upward) {
    const c = addV(0, y, 0);
    for (let i = 0; i < ring.length; i++) {
        const ni = (i + 1) % ring.length;
        if (upward) addTri(c, ring[ni], ring[i]);
        else        addTri(c, ring[i], ring[ni]);
    }
}

// ─── Build the bunker ───────────────────────────────────────────────
// Body — bottom → slit-bottom → slit-top (recessed) → body-top
const ringBodyBot     = hexRing(BODY_Y_BOT,      BODY_R_BOT);
const ringSlitBotOut  = hexRing(BODY_Y_SLIT_BOT, lerp(BODY_R_BOT, BODY_R_TOP, BODY_Y_SLIT_BOT / BODY_Y_TOP));
const ringSlitBotIn   = hexRing(BODY_Y_SLIT_BOT, SLIT_R);
const ringSlitTopIn   = hexRing(BODY_Y_SLIT_TOP, SLIT_R);
const ringSlitTopOut  = hexRing(BODY_Y_SLIT_TOP, lerp(BODY_R_BOT, BODY_R_TOP, BODY_Y_SLIT_TOP / BODY_Y_TOP));
const ringBodyTop     = hexRing(BODY_Y_TOP,      BODY_R_TOP);

// Battered outer walls below the slit
bandSides(ringBodyBot, ringSlitBotOut);
// Recess shelf — slit bottom face points UP
bandRingFlat(ringSlitBotOut, ringSlitBotIn, /*upward*/ true);
// Inner slit wall
bandSides(ringSlitBotIn, ringSlitTopIn);
// Recess overhang — slit top face points DOWN
bandRingFlat(ringSlitTopOut, ringSlitTopIn, /*upward*/ false);
// Battered outer walls above the slit
bandSides(ringSlitTopOut, ringBodyTop);

// Roof slab — overhangs the body
const ringRoofBot = hexRing(ROOF_Y_BOT, ROOF_R_BOT);
const ringRoofTop = hexRing(ROOF_Y_TOP, ROOF_R_TOP);
// Underside of the roof overhang (faces -Y around the perimeter)
bandRingFlat(ringRoofBot, ringBodyTop, /*upward*/ false);
// Roof side walls
bandSides(ringRoofBot, ringRoofTop);

// Observation cupola
const ringCupBot = hexRing(CUP_Y_BOT, CUP_R_BOT);
const ringCupTop = hexRing(CUP_Y_TOP, CUP_R_TOP);
// Roof top annulus around the cupola (faces +Y)
bandRingFlat(ringRoofTop, ringCupBot, /*upward*/ true);
// Cupola walls
bandSides(ringCupBot, ringCupTop);
// Cupola lid
capRing(ringCupTop, CUP_Y_TOP, /*upward*/ true);

// Bottom of bunker (sits on the table)
capRing(ringBodyBot, BODY_Y_BOT, /*upward*/ false);

// ─── Helpers ────────────────────────────────────────────────────────
function lerp(a, b, t) { return a + (b - a) * t; }

// Stitch two coplanar hex rings (outer + inner) at the same Y as a flat
// annulus. upward=true → normal +Y, false → -Y.
function bandRingFlat(outer, inner, upward) {
    for (let i = 0; i < outer.length; i++) {
        const ni = (i + 1) % outer.length;
        if (upward) {
            addTri(outer[i], inner[i], inner[ni]);
            addTri(outer[i], inner[ni], outer[ni]);
        } else {
            addTri(outer[i], inner[ni], inner[i]);
            addTri(outer[i], outer[ni], inner[ni]);
        }
    }
}

// ─── Write OBJ ──────────────────────────────────────────────────────
const lines = [
    "# W.A.R.H.A.M.S WW2 concrete bunker (hex pillbox with embrasure + cupola)",
    `# verts: ${verts.length}, tris: ${faces.length}`,
    "o WW2Bunker",
];
for (const [x, y, z] of verts) lines.push(`v ${x.toFixed(5)} ${y.toFixed(5)} ${z.toFixed(5)}`);
for (const [a, b, c] of faces) lines.push(`f ${a} ${b} ${c}`);
fs.writeFileSync(path.join(outDir, "bunker.obj"), lines.join("\n") + "\n");
console.log(`bunker.obj: ${verts.length} verts, ${faces.length} tris`);

// ─── Tiny white diffuse (TTS Custom_Model requires a DiffuseURL) ────
async function writeTexture() {
    const tex = new Jimp({ width: 4, height: 4, color: 0xFFFFFFFF });
    await tex.write(path.join(outDir, "bunker-texture.png"));
    console.log("bunker-texture.png");
}
writeTexture().catch(e => { console.error(e); process.exit(1); });
