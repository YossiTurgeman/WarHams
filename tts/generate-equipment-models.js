#!/usr/bin/env node
/**
 * W.A.R H.A.M.S — Equipment Module Mesh Generator
 *
 * Builds 5 small OBJ meshes — one per H.A.M.S magnet point. Each is
 * a stylised silhouette of the corresponding gear (helmet, chest
 * plate, hands/weapon, leg armour, backpack). They're all sized to
 * sit comfortably on or beside a 0.918-scale soldier standee.
 *
 * Tinted at runtime via TTS ColorDiffuse, so the same OBJ + flat
 * white diffuse texture serves every BAC in that slot — the BAC's
 * abbreviation goes in the Nickname (e.g. "S.A.P Chest") and a
 * category color (Armor / Tech / Weapons / Heavy / Support) provides
 * the visual coding.
 *
 * Usage:   node generate-equipment-models.js
 * Outputs: tts/v<VERSION>/module-<slot>.obj
 *          tts/v<VERSION>/module-texture.png
 */

const path = require("path");
const fs = require("fs");
const { Jimp } = require("jimp");

const VERSION = "v72";
// Bump MODEL_REV any time the mesh content changes — the generated
// file names carry the rev (module-<slot>-rev<N>.obj), which forces
// TTS to fetch a brand-new asset (the ?v=N query-string approach
// has been unreliable). Must match MODULE_MODEL_REV in generate-save.js.
const MODEL_REV = 133;
const outDir = path.join(__dirname, VERSION);
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

// ─── OBJ writer plumbing ────────────────────────────────────────────
function newMesh() {
    return { verts: [], faces: [] };
}
function addVert(m, x, y, z) {
    m.verts.push([x, y, z]);
    return m.verts.length;   // 1-indexed
}
function addQuad(m, a, b, c, d) { m.faces.push([a, b, c, d]); }
function addTri(m, a, b, c)     { m.faces.push([a, b, c]);    }

function writeObj(m, outPath, header) {
    const lines = [];
    lines.push(`# ${header}`);
    for (const [x, y, z] of m.verts) lines.push(`v ${x.toFixed(4)} ${y.toFixed(4)} ${z.toFixed(4)}`);
    for (const f of m.faces) lines.push("f " + f.join(" "));
    fs.writeFileSync(outPath, lines.join("\n") + "\n");
}

// Build a regular n-gon prism between two y-levels at given radii.
function addPrism(m, sides, rBot, yBot, rTop, yTop) {
    const baseBot = m.verts.length;
    const baseTop = baseBot + sides;
    for (let i = 0; i < sides; i++) {
        const a = (i * 2 * Math.PI) / sides;
        addVert(m, rBot * Math.cos(a), yBot, rBot * Math.sin(a));
    }
    for (let i = 0; i < sides; i++) {
        const a = (i * 2 * Math.PI) / sides;
        addVert(m, rTop * Math.cos(a), yTop, rTop * Math.sin(a));
    }
    // Sides
    for (let i = 0; i < sides; i++) {
        const j = (i + 1) % sides;
        addQuad(m, baseBot + i + 1, baseBot + j + 1, baseTop + j + 1, baseTop + i + 1);
    }
    // Cap top (fan)
    if (rTop > 1e-5) {
        const cTop = addVert(m, 0, yTop, 0);
        for (let i = 0; i < sides; i++) {
            const j = (i + 1) % sides;
            addTri(m, cTop, baseTop + i + 1, baseTop + j + 1);
        }
    }
    // Cap bottom (fan, reversed winding)
    if (rBot > 1e-5) {
        const cBot = addVert(m, 0, yBot, 0);
        for (let i = 0; i < sides; i++) {
            const j = (i + 1) % sides;
            addTri(m, cBot, baseBot + j + 1, baseBot + i + 1);
        }
    }
}

// Box helper — axis-aligned. center (cx,cy,cz), half extents (hx,hy,hz).
function addBox(m, cx, cy, cz, hx, hy, hz) {
    const b = m.verts.length;
    const v = [
        [cx - hx, cy - hy, cz - hz], // 0
        [cx + hx, cy - hy, cz - hz], // 1
        [cx + hx, cy - hy, cz + hz], // 2
        [cx - hx, cy - hy, cz + hz], // 3
        [cx - hx, cy + hy, cz - hz], // 4
        [cx + hx, cy + hy, cz - hz], // 5
        [cx + hx, cy + hy, cz + hz], // 6
        [cx - hx, cy + hy, cz + hz], // 7
    ];
    for (const p of v) addVert(m, p[0], p[1], p[2]);
    addQuad(m, b + 1, b + 2, b + 3, b + 4);   // bottom
    addQuad(m, b + 8, b + 7, b + 6, b + 5);   // top
    addQuad(m, b + 1, b + 5, b + 6, b + 2);   // -z
    addQuad(m, b + 2, b + 6, b + 7, b + 3);   // +x
    addQuad(m, b + 3, b + 7, b + 8, b + 4);   // +z
    addQuad(m, b + 4, b + 8, b + 5, b + 1);   // -x
}

// ─── Per-slot meshes ────────────────────────────────────────────────

// HELMET — domed top + small visor brim. ~0.20 across, 0.10 tall.
function buildHelmet() {
    const m = newMesh();
    // Dome built as 4-segment prism with shrinking radius
    const R = 0.10;
    addPrism(m, 12, R,        0.000, R * 0.95, 0.025);
    addPrism(m, 12, R * 0.95, 0.025, R * 0.80, 0.055);
    addPrism(m, 12, R * 0.80, 0.055, R * 0.55, 0.085);
    addPrism(m, 12, R * 0.55, 0.085, R * 0.20, 0.105);
    // Visor brim — short box across the front
    addBox(m, 0, 0.020, R * 0.85, R * 0.85, 0.010, 0.020);
    return m;
}

// CHEST — flat curved torso plate. ~0.22 wide, 0.18 tall, 0.06 thick.
function buildChest() {
    const m = newMesh();
    // Approximated by a box with a smaller box on top (collar)
    addBox(m, 0,   0.06, 0,    0.11, 0.06, 0.03);
    addBox(m, 0,   0.13, 0,    0.07, 0.02, 0.025);   // collar
    // Two shoulder pads
    addBox(m,  0.10, 0.10, 0,  0.025, 0.025, 0.025);
    addBox(m, -0.10, 0.10, 0,  0.025, 0.025, 0.025);
    return m;
}

// HANDS — stylised rifle silhouette laid flat.
// Length ~0.30 (along +x), thin.
function buildHands() {
    const m = newMesh();
    // Receiver / body
    addBox(m, 0.00, 0.020, 0,  0.06, 0.020, 0.015);
    // Barrel forward
    addBox(m, 0.13, 0.020, 0,  0.07, 0.010, 0.010);
    // Stock back
    addBox(m, -0.10, 0.020, 0, 0.04, 0.020, 0.012);
    // Magazine drop
    addBox(m, -0.01, -0.010, 0, 0.020, 0.020, 0.010);
    // Scope on top
    addBox(m, 0.00, 0.050, 0,  0.030, 0.010, 0.008);
    return m;
}

// LEGS — pair of greaves / boots. ~0.18 wide, 0.10 tall.
function buildLegs() {
    const m = newMesh();
    // Two cylindrical greaves
    const R = 0.035;
    const L = 0.10;
    // Left greave centred at x=-0.06
    addPrism(m, 10, R, 0.00, R * 0.9, L * 0.6);
    // shift the just-added prism manually by patching the last (12+12+1) verts...
    // Easier: build offset cylinders directly.
    // Discard above — use boxes to keep code simple.
    m.verts.length = 0; m.faces.length = 0;
    // Left leg
    addBox(m, -0.05, 0.05, 0,  0.030, 0.05, 0.025);
    addBox(m, -0.05, 0.005, 0.015, 0.040, 0.010, 0.025);   // left boot toe
    // Right leg
    addBox(m,  0.05, 0.05, 0,  0.030, 0.05, 0.025);
    addBox(m,  0.05, 0.005, 0.015, 0.040, 0.010, 0.025);   // right boot toe
    return m;
}

// BACKPACK — boxy ruck with small antenna.
function buildBackpack() {
    const m = newMesh();
    addBox(m, 0,     0.08, 0,  0.08, 0.08, 0.05);          // main pack
    addBox(m, 0,     0.035, 0.04,  0.06, 0.020, 0.012);    // bottom strap pouch
    addBox(m, 0.06,  0.18, -0.02, 0.005, 0.060, 0.005);    // antenna
    return m;
}

// ─── Texture (shared) ───────────────────────────────────────────────
// Flat off-white texture so ColorDiffuse tints cleanly. Some slight
// noise prevents pure-flat shading from looking like a billboard.
async function writeTexture(outPath) {
    const SIZE = 64;
    const img = new Jimp({ width: SIZE, height: SIZE, color: 0xFFFFFFFF });
    for (let y = 0; y < SIZE; y++) {
        for (let x = 0; x < SIZE; x++) {
            // Subtle grey noise for some surface variation
            const n = 240 + Math.floor(Math.sin((x * 31 + y * 17)) * 4 + 6);
            const v = Math.max(220, Math.min(255, n));
            const c = ((v << 24) | (v << 16) | (v << 8) | 0xFF) >>> 0;
            img.setPixelColor(c, x, y);
        }
    }
    await img.write(outPath);
    return outPath;
}

(async () => {
    const meshes = {
        head:     { build: buildHelmet,   note: "stylised helmet with visor brim" },
        chest:    { build: buildChest,    note: "torso plate + collar + shoulder pads" },
        hands:    { build: buildHands,    note: "rifle silhouette laid flat" },
        legs:     { build: buildLegs,     note: "pair of greaves / boots" },
        backpack: { build: buildBackpack, note: "rucksack with antenna" },
    };
    for (const [slot, def] of Object.entries(meshes)) {
        const m = def.build();
        const out = path.join(outDir, `module-${slot}-rev${MODEL_REV}.obj`);
        writeObj(m, out, `W.A.R H.A.M.S equipment module — ${slot} (${def.note})`);
        console.log(`wrote ${out}  (${m.verts.length} verts, ${m.faces.length} faces)`);
    }
    const tex = await writeTexture(path.join(outDir, `module-texture-rev${MODEL_REV}.png`));
    console.log(`wrote ${tex}`);
})().catch(e => { console.error(e); process.exit(1); });
