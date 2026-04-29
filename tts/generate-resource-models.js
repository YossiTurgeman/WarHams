#!/usr/bin/env node
/**
 * W.A.R H.A.M.S — Resource Token Mesh Generator
 *
 * Builds Wavefront .obj meshes for the four non-Oil resource tokens, all
 * matching the rulebook's prescribed depictions:
 *
 *   Electricity → Lightning Bolt   (extruded zigzag prism on a small base)
 *   Intelligence → Transmitting Wave (vertical mast + 3 horizontal rings)
 *   Industry → Hammer              (cylindrical handle + rectangular head)
 *   Local Favor → Recruit          (stylized soldier figure: legs/torso/head/helmet)
 *
 * Each mesh is built bottom-up so y = 0 is the base of the token. Coloring
 * is done at runtime via TTS ColorDiffuse, so a single shared white texture
 * (`resource-texture.png`) covers any tint.
 *
 * Usage:    node generate-resource-models.js
 * Outputs:  tts/cards/lightning.obj
 *           tts/cards/wave.obj
 *           tts/cards/hammer.obj
 *           tts/cards/recruit.obj
 *           tts/cards/resource-texture.png
 */

const path = require("path");
const fs = require("fs");
const { Jimp } = require("jimp");

const outDir = path.join(__dirname, "cards");
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);

// ─── Per-mesh state (we reset between models) ─────────────────────────
let verts = [];
let faces = [];

function reset() { verts = []; faces = []; }
function addV(x, y, z) { verts.push([x, y, z]); return verts.length; }
function addTri(a, b, c) { faces.push([a, b, c]); }
function addQuad(a, b, c, d) { addTri(a, b, c); addTri(a, c, d); }

function writeObj(filename, label) {
    const lines = [`# W.A.R.H.A.M.S ${label} mesh`, `o ${label}`];
    for (const [x, y, z] of verts) lines.push(`v ${x.toFixed(5)} ${y.toFixed(5)} ${z.toFixed(5)}`);
    for (const [a, b, c] of faces) lines.push(`f ${a} ${b} ${c}`);
    fs.writeFileSync(path.join(outDir, filename), lines.join("\n") + "\n");
    console.log(`${filename}: ${verts.length} verts, ${faces.length} tris`);
}

// ─── Generic primitives ───────────────────────────────────────────────

// Lathe: rotate a [y, radius] profile around the Y axis.
function lathe(centerX, centerZ, profile, segs = 20, capBottom = true, capTop = true) {
    const rings = profile.map(([y, r]) => {
        const ring = [];
        for (let i = 0; i < segs; i++) {
            const a = (i / segs) * Math.PI * 2;
            ring.push(addV(centerX + Math.cos(a) * r, y, centerZ + Math.sin(a) * r));
        }
        return ring;
    });
    for (let k = 0; k < rings.length - 1; k++) {
        const lower = rings[k]; const upper = rings[k + 1];
        for (let i = 0; i < segs; i++) {
            const ni = (i + 1) % segs;
            addQuad(lower[i], lower[ni], upper[ni], upper[i]);
        }
    }
    if (capBottom) {
        const c = addV(centerX, profile[0][0], centerZ);
        const ring = rings[0];
        for (let i = 0; i < segs; i++) addTri(c, ring[(i + 1) % segs], ring[i]);
    }
    if (capTop) {
        const c = addV(centerX, profile[profile.length - 1][0], centerZ);
        const ring = rings[rings.length - 1];
        for (let i = 0; i < segs; i++) addTri(c, ring[i], ring[(i + 1) % segs]);
    }
}

// Axis-aligned box from (x1,y1,z1) to (x2,y2,z2).
function box(x1, y1, z1, x2, y2, z2) {
    const v000 = addV(x1, y1, z1);
    const v100 = addV(x2, y1, z1);
    const v110 = addV(x2, y2, z1);
    const v010 = addV(x1, y2, z1);
    const v001 = addV(x1, y1, z2);
    const v101 = addV(x2, y1, z2);
    const v111 = addV(x2, y2, z2);
    const v011 = addV(x1, y2, z2);
    addQuad(v001, v101, v111, v011); // +Z
    addQuad(v100, v000, v010, v110); // -Z
    addQuad(v101, v100, v110, v111); // +X
    addQuad(v000, v001, v011, v010); // -X
    addQuad(v010, v011, v111, v110); // +Y
    addQuad(v001, v000, v100, v101); // -Y
}

// Sphere centered at (cx, cy, cz).
function sphere(cx, cy, cz, r, latSeg = 8, lonSeg = 12) {
    const rings = [];
    for (let i = 0; i <= latSeg; i++) {
        const phi = (i / latSeg) * Math.PI;
        const y = cy + Math.cos(phi) * r;
        const ringR = Math.sin(phi) * r;
        const ring = [];
        for (let j = 0; j < lonSeg; j++) {
            const t = (j / lonSeg) * Math.PI * 2;
            ring.push(addV(cx + Math.cos(t) * ringR, y, cz + Math.sin(t) * ringR));
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

// Extrude a closed 2D polygon (in the X-Y plane) along Z by ±halfThickness.
// Pass points in counter-clockwise order when viewed from +Z.
function extrudePolygon(points2D, halfThickness) {
    const front = points2D.map(([x, y]) => addV(x, y, +halfThickness));
    const back = points2D.map(([x, y]) => addV(x, y, -halfThickness));
    // Front face — fan from points2D[0]
    for (let i = 1; i < points2D.length - 1; i++) {
        addTri(front[0], front[i], front[i + 1]);
    }
    // Back face — reverse winding
    for (let i = 1; i < points2D.length - 1; i++) {
        addTri(back[0], back[i + 1], back[i]);
    }
    // Side quads
    for (let i = 0; i < points2D.length; i++) {
        const ni = (i + 1) % points2D.length;
        addQuad(front[i], front[ni], back[ni], back[i]);
    }
}

// ─── 1. LIGHTNING BOLT (Electricity) ──────────────────────────────────
// Classic bolt silhouette extruded a bit in Z, sitting on a small disc base
// so it stands upright.
function buildLightning() {
    reset();
    // Small base disc so the bolt has somewhere to rest on.
    lathe(0, 0, [[0, 0.16], [0.04, 0.18], [0.06, 0.16]], 16, true, true);

    // Bolt silhouette — points listed CCW (from +Z view).
    // Total height ~0.7, sits on top of the disc (y=0.06 .. 0.76).
    const yBase = 0.06;
    const pts = [
        // Start at bottom-tip and go CCW around the silhouette
        [ 0.00, yBase + 0.00],   // bottom tip
        [ 0.18, yBase + 0.30],   // up-right along lower stroke
        [ 0.02, yBase + 0.30],   // notch back toward center
        [ 0.20, yBase + 0.70],   // up to top edge
        [-0.02, yBase + 0.70],   // top-left corner
        [-0.18, yBase + 0.42],   // down along upper stroke
        [-0.02, yBase + 0.42],   // notch back toward center
        [-0.20, yBase + 0.10],   // down to bottom-left
    ];
    extrudePolygon(pts, 0.04);
    writeObj("lightning.obj", "Lightning");
}

// ─── 2. TRANSMITTING WAVE (Intelligence) ──────────────────────────────
// Vertical broadcast mast with 3 horizontal disc rings of growing radius
// stacked above it — like the classic radio-wave icon viewed in 3D.
function buildWave() {
    reset();
    // Base disc
    lathe(0, 0, [[0, 0.22], [0.04, 0.24], [0.06, 0.22]], 20, true, true);
    // Mast / antenna pole
    lathe(0, 0, [[0.06, 0.04], [0.62, 0.04]], 10, false, true);
    // Ball cap on antenna
    sphere(0, 0.65, 0, 0.05, 6, 10);

    // 3 wave "ripple" rings — flat thin tori (top half visible) at staged heights.
    // Approximate a torus with two stacked rings creating a thin annulus.
    function ring(y, innerR, outerR, thickness) {
        const segs = 24;
        const top = []; const bot = []; const inTop = []; const inBot = [];
        for (let i = 0; i < segs; i++) {
            const a = (i / segs) * Math.PI * 2;
            const cx = Math.cos(a); const sz = Math.sin(a);
            top.push(addV(cx * outerR, y + thickness / 2, sz * outerR));
            bot.push(addV(cx * outerR, y - thickness / 2, sz * outerR));
            inTop.push(addV(cx * innerR, y + thickness / 2, sz * innerR));
            inBot.push(addV(cx * innerR, y - thickness / 2, sz * innerR));
        }
        for (let i = 0; i < segs; i++) {
            const ni = (i + 1) % segs;
            addQuad(top[i],   top[ni],   bot[ni],   bot[i]);   // outer side
            addQuad(inBot[i], inBot[ni], inTop[ni], inTop[i]); // inner side
            addQuad(inTop[i], inTop[ni], top[ni],   top[i]);   // top annulus
            addQuad(bot[i],   bot[ni],   inBot[ni], inBot[i]); // bottom annulus
        }
    }
    ring(0.22, 0.10, 0.13, 0.025);
    ring(0.36, 0.18, 0.21, 0.025);
    ring(0.50, 0.26, 0.29, 0.025);
    writeObj("wave.obj", "Wave");
}

// ─── 3. HAMMER (Industry) ─────────────────────────────────────────────
// Vertical handle with a rectangular head crossing it at the top. Stands
// upright on a base disc that is hidden inside the handle bottom.
function buildHammer() {
    reset();
    // Small base disc so the hammer doesn't roll
    lathe(0, 0, [[0, 0.16], [0.05, 0.18], [0.07, 0.16]], 16, true, true);
    // Handle
    lathe(0, 0, [[0.05, 0.05], [0.70, 0.05]], 12, false, true);
    // Head — rectangular block straddling the top of the handle
    box(-0.22, 0.62, -0.10,  0.22, 0.78,  0.10);
    writeObj("hammer.obj", "Hammer");
}

// ─── 4. RECRUIT (Local Favor) ─────────────────────────────────────────
// Stylized stick-soldier: two cylindrical legs, torso block, head sphere,
// helmet cap. Sized to be the same approximate footprint as the other
// resource tokens.
function buildRecruit() {
    reset();
    // Base disc (hidden under the legs)
    lathe(0, 0, [[0, 0.22], [0.025, 0.24], [0.04, 0.22]], 16, true, true);
    // Two legs (thin cylinders), centered ±0.07 on X
    lathe(-0.07, 0, [[0.04, 0.05], [0.32, 0.05]], 10, false, true);
    lathe( 0.07, 0, [[0.04, 0.05], [0.32, 0.05]], 10, false, true);
    // Torso — boxy
    box(-0.14, 0.32, -0.08,  0.14, 0.62, 0.08);
    // Two arms hanging at sides (thin rounded rectangles)
    box(-0.20, 0.34, -0.06, -0.14, 0.60, 0.06);
    box( 0.14, 0.34, -0.06,  0.20, 0.60, 0.06);
    // Neck (short column) and head (sphere)
    lathe(0, 0, [[0.62, 0.05], [0.66, 0.05]], 10, false, true);
    sphere(0, 0.74, 0, 0.09, 8, 12);
    // Helmet — flattened sphere on top of the head (slightly bigger)
    function ellipsoid(cx, cy, cz, rx, ry, rz, latSeg = 6, lonSeg = 12) {
        const rings = [];
        for (let i = 0; i <= latSeg; i++) {
            const phi = (i / latSeg) * (Math.PI / 2); // half-sphere (top dome only)
            const y = cy + Math.cos(phi) * ry;
            const cosp = Math.cos(phi); const sinp = Math.sin(phi);
            const ring = [];
            for (let j = 0; j < lonSeg; j++) {
                const t = (j / lonSeg) * Math.PI * 2;
                ring.push(addV(cx + Math.cos(t) * rx * sinp, y, cz + Math.sin(t) * rz * sinp));
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
    ellipsoid(0, 0.78, 0, 0.115, 0.07, 0.115);
    writeObj("recruit.obj", "Recruit");
}

// ─── Build all + shared white diffuse texture ─────────────────────────
buildLightning();
buildWave();
buildHammer();
buildRecruit();

async function writeTexture() {
    const tex = new Jimp({ width: 4, height: 4, color: 0xFFFFFFFF });
    await tex.write(path.join(outDir, "resource-texture.png"));
    console.log("resource-texture.png");
}
writeTexture().catch(e => { console.error(e); process.exit(1); });
