#!/usr/bin/env node
/**
 * W.A.R H.A.M.S — TTS Save File Generator (v2 rebuild)
 * Generates WARHAMS_TTS.json from game-data.json and setup.lua
 *
 * Key fixes from v1:
 *   - Full TTS object field set (AltLookAngle, GMNotes, Value, etc.)
 *   - PlayArea=0.5 (not 500)
 *   - Correct HandTrigger Y position (4.84, not 3)
 *   - Only uses confirmed-working built-in object types
 *   - Proper layout within table bounds (±28 units)
 *   - Proportional notecard scales (squad boards removed in v33)
 *
 * Usage: node generate-save.js
 */

const fs = require('fs');
const path = require('path');

const gameData = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'design', 'game-data.json'), 'utf8'));

// Card images — hosted on GitHub, unique face per card type
// Cache-bust param forces TTS to re-download after image updates
const CARD_VERSION = "v72";
const CARD_BASE = "https://raw.githubusercontent.com/YossiTurgeman/WarHams/main/tts/cards";
// Soldier assets live in a VERSIONED path so TTS treats them as
// brand-new URLs every bump — bypasses TTS's asset cache, which
// strips ?query strings and would otherwise serve the stale file.
const SOLDIER_BASE = `https://raw.githubusercontent.com/YossiTurgeman/WarHams/main/tts/${CARD_VERSION}`;
const BAC_BACK = `${CARD_BASE}/bac_back.png?${CARD_VERSION}`;
const CONSPIRE_BACK = `${CARD_BASE}/conspire_back.png?${CARD_VERSION}`;

function bacFaceURL(abbr) {
    const slug = abbr.replace(/[^a-zA-Z0-9]/g, "_").toLowerCase();
    return `${CARD_BASE}/bac_${slug}.png?${CARD_VERSION}`;
}
function conspireFaceURL(name) {
    const slug = name.replace(/[^a-zA-Z0-9]/g, "_").toLowerCase();
    return `${CARD_BASE}/conspire_${slug}.png?${CARD_VERSION}`;
}
// Squad boards removed in v33 — soldier ID and damage now live on the mini's
// 40mm magnetized base (printed squad letter + number, 3 blood-drop divots
// for damage pegs). See design/WARHAMS-Rulebook.md.
function flagURL(colorName) {
    return `${CARD_BASE}/flag_${colorName}.png?${CARD_VERSION}`;
}
const FLAG_MESH_URL = `${CARD_BASE}/flag.obj?${CARD_VERSION}`;
const FLAG_DIFFUSE_URL = `${CARD_BASE}/flag-texture.png?${CARD_VERSION}`;
const BARREL_MESH_URL = `${CARD_BASE}/barrel.obj?${CARD_VERSION}`;
const BARREL_DIFFUSE_URL = `${CARD_BASE}/barrel-texture.png?${CARD_VERSION}`;
// Bunker mesh published under the versioned soldier path so each
// CARD_VERSION bump bypasses the TTS path-cache (query-string busting
// doesn't actually work — TTS strips the ?query before caching).
const BUNKER_MESH_URL = `${SOLDIER_BASE}/bunker.obj`;
const BUNKER_DIFFUSE_URL = `${SOLDIER_BASE}/bunker-texture.png`;
const CONTAINER_MESH_URL = `${SOLDIER_BASE}/container.obj`;
function containerDiffuseURL(num) { return `${SOLDIER_BASE}/container_${num}.png`; }
const RESOURCE_DIFFUSE_URL = `${CARD_BASE}/resource-texture.png?${CARD_VERSION}`;
const LIGHTNING_MESH_URL = `${CARD_BASE}/lightning.obj?${CARD_VERSION}`;
const WAVE_MESH_URL = `${CARD_BASE}/wave.obj?${CARD_VERSION}`;
const HAMMER_MESH_URL = `${CARD_BASE}/hammer.obj?${CARD_VERSION}`;
const RECRUIT_MESH_URL = `${CARD_BASE}/recruit.obj?${CARD_VERSION}`;
const TABLE_SURFACE_URL = `${CARD_BASE}/table_surface.png?${CARD_VERSION}-tbl2`;

// GUID generator — 6 hex chars
let guidCounter = 0x100000;
function nextGUID() { return (guidCounter++).toString(16); }

// ─── Base TTS Object (all required fields from working saves) ─────
function baseObj(name, nickname, desc, px, py, pz, opts = {}) {
    const {
        rotX = 0, rotY = 0, rotZ = 0,
        scaleX = 1, scaleY = 1, scaleZ = 1,
        color = { r: 1, g: 1, b: 1 },
        locked = false,
        grid = true,
    } = opts;
    return {
        GUID: nextGUID(),
        Name: name,
        Transform: { posX: px, posY: py, posZ: pz, rotX, rotY, rotZ, scaleX, scaleY, scaleZ },
        Nickname: nickname,
        Description: desc,
        GMNotes: "",
        AltLookAngle: { x: 0, y: 0, z: 0 },
        ColorDiffuse: color,
        LayoutGroupSortIndex: 0,
        Value: 0,
        Locked: locked,
        Grid: grid,
        Snap: true,
        IgnoreFoW: false,
        MeasureMovement: false,
        DragSelectable: true,
        Autoraise: true,
        Sticky: true,
        Tooltip: true,
        GridProjection: false,
        HideWhenFaceDown: false,
        Hands: false,
        LuaScript: "",
        LuaScriptState: "",
        XmlUI: "",
    };
}

const objects = [];

// ─── 0. CUSTOM TABLE SURFACE (4× area of stock Table_RPG) ───────────
// We use Table_None and place a giant locked Custom_Tile at y≈0.95 so the
// usable play area is ~160 × 76 (±80 X, ±38 Z). Widened from ±54 in v75
// to fit the ED → PB → UZ row east of the planet board with proper gaps,
// plus the Conspire deck and resource bags east of the Unloading Zone.
const tableTile = baseObj("Custom_Tile", "Play Surface",
    "W.A.R.H.A.M.S play surface — extra-wide table area.",
    0, 0.9, 0,
    { scaleX: 120, scaleY: 1, scaleZ: 38, color: { r: 1, g: 1, b: 1 }, locked: true, grid: false });
tableTile.CustomImage = {
    ImageURL: TABLE_SURFACE_URL,
    ImageSecondaryURL: "",
    ImageScalar: 1,
    WidthScale: 0,
    CustomTile: { Type: 0, Thickness: 0.1, Stackable: false, Stretch: true },
};
objects.push(tableTile);

// ═════════════════════════════════════════════════════════════════════
//  TABLE LAYOUT — Custom 4× table usable area: X ≈ ±54, Z ≈ ±38
//
//  Each player owns one CORNER of the table. Anchors at (±42, ±28).
//  Per corner (signed by sx,sz): squad boards toward center, combat
//  dice in the middle, bags toward the edge, hand trigger at very edge.
//
//        -X side                             +X side
//   ┌───────────────────────────────────────────────────┐
//   │ GREEN corner                       YELLOW corner  │  +Z
//   │  (-42, +28)                          (+42, +28)   │
//   │                                                   │
//   │              Decks + Resource bags                │
//   │              CENTER (hexes spawn here)            │
//   │              Misc bags / zones                    │
//   │                                                   │
//   │ RED corner                            BLUE corner │  -Z
//   │  (-42, -28)                          (+42, -28)   │
//   └───────────────────────────────────────────────────┘
// ═════════════════════════════════════════════════════════════════════

const playerColors = [
    { label: "Red",    color: { r: 0.86, g: 0.21, b: 0.21 }, fog: "Red" },
    { label: "Blue",   color: { r: 0.22, g: 0.38, b: 0.86 }, fog: "Blue" },
    { label: "Green",  color: { r: 0.18, g: 0.72, b: 0.28 }, fog: "Green" },
    { label: "Yellow", color: { r: 0.9,  g: 0.82, b: 0.15 }, fog: "Yellow" },
];

// ─── Per-player corner layout ───────────────────────────────────────
// sx: -1 = left side, +1 = right side
// sz: -1 = bottom (player sits at -Z), +1 = top (player sits at +Z)
// boardRotY: orientation so board text reads correctly to that player
// handRotY:  hand-trigger orientation
const cornerLayout = [
    // Red — bottom-left (anchor x aligned with Green at x=-60)
    { sx: -1, sz: -1, anchor: { x: -60, z: -28 }, boardRotY: 180, handRotY:   0 },
    // Blue — bottom-right (mirrors Red's distance from the planet board:
    // Red dx = -60 - (-7.19) = -52.81, so Blue x = -7.19 + 52.81 ≈ 45.62)
    { sx:  1, sz: -1, anchor: { x:  45.62, z: -28 }, boardRotY: 180, handRotY:   0 },
    // Green — top-left (anchor x aligned above the user manual at x=-60)
    { sx: -1, sz:  1, anchor: { x: -60, z:  28 }, boardRotY:   0, handRotY: 180 },
    // Yellow — top-right (mirrors Green's distance from the planet board:
    // Green dx = -60 - (-7.19) = -52.81, so Yellow x = -7.19 + 52.81 ≈ 45.62)
    { sx:  1, sz:  1, anchor: { x:  45.62, z:  28 }, boardRotY:   0, handRotY: 180 },
];

// Helper: spot inside a corner, expressed in TOWARD-CENTER (tc) and
// SIDE coordinates so layout reads naturally regardless of which corner.
//   tc:  >0 = toward center, <0 = toward edge
//   side: signed offset along the player's left/right axis
function cornerSpot(idx, tc, side) {
    const { sx, sz, anchor } = cornerLayout[idx];
    return {
        x: anchor.x + sx * side,    // sx flips left/right
        z: anchor.z - sz * tc,      // -sz so +tc moves toward center
    };
}

// ─── 1. BAC DECK (100 cards) ─────────────────────────────────────────
let nextDeckDefId = 100;  // global counter so BAC and Conspire don't collide
function buildBACDeck() {
    const cards = [];
    const allCustomDecks = {};
    gameData.basic_armament_cards.forEach(bac => {
        const faceURL = bacFaceURL(bac.abbr);
        for (let c = 0; c < bac.copies; c++) {
            // Each individual card gets its own unique deck definition ID
            const thisDeckId = nextDeckDefId++;
            const deckDef = { [String(thisDeckId)]: { FaceURL: faceURL, BackURL: BAC_BACK, NumWidth: 1, NumHeight: 1, BackIsHidden: true, UniqueBack: false, Type: 0 } };
            Object.assign(allCustomDecks, deckDef);
            const costStr = typeof bac.cost === 'string' ? bac.cost : Object.entries(bac.cost).map(([k,v]) => `${v} ${k}`).join(', ');
            const desc = `[${bac.category}] Slot: ${bac.slot}\nCost: ${costStr}\nDP: ${bac.dp}\n\n${bac.text}${bac.special ? '\nSpecial: ' + bac.special : ''}`;
            const card = baseObj("CardCustom", bac.abbr, desc, 0, 0.1 * cards.length, 0);
            card.CardID = thisDeckId * 100;
            card.CustomDeck = deckDef;
            card.SidewaysCard = false;
            card.HideWhenFaceDown = true;
            card.Hands = true;
            cards.push(card);
        }
    });
    // Spawn at the DECK slot on the Planet Bound Area board.
    // v77 PB is at rotY:270 with center (53, 1.02, 0). Empirically, the
    // DECK slot is at z=+9.5 (north end of PB's long axis); z=-9.5 lands
    // on slot 6. Deck shares PB's rotY:270.
    const deck = baseObj("Deck", "Spaceport Deck",
        `Basic Armament Cards — ${gameData.deck_counts.total_BAC_cards} cards.\nRefills the Planet Bound Area as cards are taken (always keep 6 face-up).`,
        44.31, 1.5, 9.5, { rotY: 270, rotZ: 180, color: { r: 0.8, g: 0.6, b: 0.3 } });
    deck.DeckIDs = cards.map(c => c.CardID);
    deck.CustomDeck = allCustomDecks;
    deck.HideWhenFaceDown = true;
    deck.Hands = true;
    deck.SidewaysCard = false;
    deck.ContainedObjects = cards;
    return deck;
}
objects.push(buildBACDeck());

// ─── 3. CONSPIRE DECK (72 cards) ────────────────────────────────────
function buildConspireDeck() {
    const cards = [];
    const allCustomDecks = {};
    gameData.conspire_cards.forEach(cc => {
        const faceURL = conspireFaceURL(cc.name);
        for (let c = 0; c < cc.copies; c++) {
            const thisDeckId = nextDeckDefId++;
            const deckDef = { [String(thisDeckId)]: { FaceURL: faceURL, BackURL: CONSPIRE_BACK, NumWidth: 1, NumHeight: 1, BackIsHidden: true, UniqueBack: false, Type: 0 } };
            Object.assign(allCustomDecks, deckDef);
            const costStr = typeof cc.cost === 'string' ? cc.cost : Object.entries(cc.cost).map(([k,v]) => `${v} ${k}`).join(', ');
            const desc = `[${cc.timing}]\nCost: ${costStr}\n\n${cc.text}${cc.condition ? '\nCondition: ' + cc.condition : ''}`;
            const card = baseObj("CardCustom", cc.name, desc, 0, 0.1 * cards.length, 0);
            card.CardID = thisDeckId * 100;
            card.CustomDeck = deckDef;
            card.SidewaysCard = false;
            card.HideWhenFaceDown = true;
            card.Hands = true;
            cards.push(card);
        }
    });
    const deck = baseObj("Deck", "Conspire Deck",
        `Conspire Cards — ${gameData.deck_counts.total_conspire_cards} cards\nForfeit Movement or Combat to draw 1.\nHover cards to see effects.`,
        53, 1.5, 10, { rotY: 180, rotZ: 180, color: { r: 0.3, g: 0.2, b: 0.5 } });
    deck.DeckIDs = cards.map(c => c.CardID);
    deck.CustomDeck = allCustomDecks;
    deck.HideWhenFaceDown = true;
    deck.Hands = true;
    deck.SidewaysCard = false;
    deck.ContainedObjects = cards;
    return deck;
}
objects.push(buildConspireDeck());

// ─── 4. RESOURCE DICE ────────────────────────────────────────────────
// All three Phase 1 dice live one row above the number-token deck on
// the LEFT edge (x=-44). The dice and the number tokens are used
// together: the dice say which numbers produced this round; the
// number tokens on the hexes say which hexes those numbers refer to.
// Keeping them adjacent makes Phase 1 self-explanatory.
[
    { name: "Resource Die 1", color: { r: 1, g: 1, b: 1 }, x: -58 },
    { name: "Resource Die 2", color: { r: 1, g: 1, b: 1 }, x: -56 },
    { name: "Separatist Die", color: { r: 0.5, g: 0.5, b: 0.5 }, x: -54 },
].forEach(d => {
    objects.push(baseObj("Die_6", d.name,
        d.name.includes("Separatist") ? "Grey — triggers Separatist spawning" : "Resource production",
        d.x, 2, 12, { color: d.color }));
});

// ─── 5. COMBAT DICE (7 per player, in their corner) ─────────────────
playerColors.forEach((pc, idx) => {
    for (let i = 0; i < 7; i++) {
        // Dice row in the middle of the corner (tc=0), spread across side axis
        const side = -7 + i * 2.3;   // -7 .. +6.8
        const p = cornerSpot(idx, 0, side);
        objects.push(baseObj("Die_6", `${pc.label} D${i+1}`, `Combat die for ${pc.label}`,
            p.x, 2, p.z, { color: pc.color }));
    }
});

// ─── 6. RESOURCE TOKEN BAGS ─────────────────────────────────────────
// Per rulebook: each resource has a prescribed depiction.
//   Oil → Oil Drum, Electricity → Lightning Bolt, Intelligence → Transmitting
//   Wave, Industry → Hammer, Local Favor → Recruit.
// All five are Custom_Model meshes built bottom-up (y=0 at the base) and
// stored in a regular Bag so each token spawns upright on its base.
// (Infinite_Bag auto-orients spawned items toward the puller — we don't want
//  that for these 3D shapes.)
// Uniform scale factor per token so each model's top extent equals the
// hammer's top extent (mesh y ≈ 0.78). Keeps proportions correct (no
// distortion) while making all five tokens the same visual height.
//   Native top y of each mesh:
//     Barrel ≈ 0.62  → scale 1.258
//     Lightning ≈ 0.67  → scale 1.164
//     Wave ≈ 0.70  → scale 1.114
//     Hammer ≈ 0.78  → scale 1.000  (reference)
//     Recruit ≈ 0.85  → scale 0.918
const resourceDefs = [
    { name: "Oil",          mesh: BARREL_MESH_URL,    diffuse: BARREL_DIFFUSE_URL,    label: "WW2 steel drum",    scale: 1.258, color: { r: 0.12, g: 0.12, b: 0.12 } },
    { name: "Electricity",  mesh: LIGHTNING_MESH_URL, diffuse: RESOURCE_DIFFUSE_URL,  label: "lightning bolt",    scale: 1.164, color: { r: 0.95, g: 0.82, b: 0.10 } },
    { name: "Intelligence", mesh: WAVE_MESH_URL,      diffuse: RESOURCE_DIFFUSE_URL,  label: "transmitting wave", scale: 1.114, color: { r: 0.20, g: 0.45, b: 0.95 } },
    { name: "Industry",     mesh: HAMMER_MESH_URL,    diffuse: RESOURCE_DIFFUSE_URL,  label: "hammer",            scale: 1.000, color: { r: 0.85, g: 0.15, b: 0.15 } },
    { name: "Local Favor",  mesh: RECRUIT_MESH_URL,   diffuse: RESOURCE_DIFFUSE_URL,  label: "recruit",           scale: 0.918, color: { r: 0.15, g: 0.70, b: 0.20 } },
];
function makeResourceToken(res) {
    const token = baseObj("Custom_Model", res.name,
        `${res.name} resource token — ${res.label}`,
        0, 1.0, 0,
        {
            rotX: 0, rotY: 0, rotZ: 0,
            scaleX: res.scale, scaleY: res.scale, scaleZ: res.scale,
            color: res.color,
        });
    token.CustomMesh = {
        MeshURL: res.mesh,
        DiffuseURL: res.diffuse,
        NormalURL: "",
        ColliderURL: "",
        Convex: true,
        MaterialIndex: 3,
        TypeIndex: 0,
        CustomShader: {
            SpecularColor: { r: 1, g: 1, b: 1 },
            SpecularIntensity: 0,   // matte — moving highlight reads as rotation
            SpecularSharpness: 2,
            FresnelStrength: 0,
        },
        CastShadows: true,
    };
    return token;
}
resourceDefs.forEach((res, i) => {
    const tokens = [];
    for (let n = 0; n < 50; n++) tokens.push(makeResourceToken(res));
    // Resource bags lined up along the right edge of the table, between
    // the BAC deck (z=-20) and the Conspire deck (z=+20).
    const bag = baseObj("Bag", `${res.name} Tokens (50)`,
        `Stack of ${res.name} tokens (${res.label}). Each spawns upright on its base.`,
        62, 1.5, -12 + i * 6, { color: res.color });
    bag.ContainedObjects = tokens;
    objects.push(bag);
});

// ─── 7. HAND TRIGGERS — at the very edge of each player's corner ────
playerColors.forEach((pc, idx) => {
    const cl = cornerLayout[idx];
    // Centered in corner X-wise, pushed to the table edge Z-wise (negative tc)
    const p = cornerSpot(idx, -8, 0);
    const ht = baseObj("HandTrigger", `${pc.label} Hand`, "",
        p.x, 4.84, p.z, {
            rotY: cl.handRotY, scaleX: 12, scaleY: 9.17, scaleZ: 5,
            color: { ...pc.color, a: 0 }, locked: true, grid: false
        });
    ht.FogColor = pc.fog;
    objects.push(ht);
});

// ─── 8. SOLDIER STANDEES (28 Custom_Token per player, in corner) ────
// v33: each H.A.M.S is a stand-up Custom_Token figurine that visually
// mirrors the physical mini-on-a-numbered-base spec from the rulebook.
// Top of the image = the soldier silhouette in player color; bottom of
// the image = the 40mm base disc with the squad letter + soldier number
// (A1-A7, B1-B7, C1-C7, D1-D7) and three blood-drop divots. TTS extrudes
// the opaque pixels into a vertical figurine via Custom_Token Stand mode.
// Equipment modules in the physical game (5 magnetized add-ons) are
// played out by attaching the BAC card module to the soldier in the
// Equipment Display; on the TTS table, players can stack BAC cards
// under the standee or beside it. Damage pegs (separate bag) are placed
// near the standee — three per soldier max, 4th = death.
const SQUAD_LETTERS = ["A", "B", "C", "D"];
function soldierTextureURL(colorName, id) {
    return `${SOLDIER_BASE}/soldier_${colorName}_${id}.png`;
}
const SOLDIER_MESH_URL = `${SOLDIER_BASE}/hams-soldier.obj`;
function makeSoldierStandee(pc, squadLetter, soldierNum, px, py, pz) {
    const id = `${squadLetter}${soldierNum}`;
    const obj = baseObj(
        "Custom_Model",
        `${pc.label} ${id}`,
        `${pc.label} Squad ${squadLetter} — Soldier ${soldierNum}\n` +
        `40mm magnetized base — printed ID and 3 blood-drop divots.\n` +
        `Magnet points: Head, Chest, Hands, Legs, Backpack.\n` +
        `4th damage peg = death.`,
        px, py, pz,
        // Scale the mesh up so the mini reads at hex scale (the OBJ is in
        // ~1 inch units; 2.5× gives a properly-tabletop-sized figurine)
        // v115: scaled down so Hams are 2× the Separatist size (sep = 0.918 → Hams = 1.836).
        { color: pc.color, scaleX: 1.836, scaleY: 1.836, scaleZ: 1.836 }
    );
    obj.CustomMesh = {
        MeshURL: SOLDIER_MESH_URL,
        DiffuseURL: soldierTextureURL(pc.label.toLowerCase(), id),
        NormalURL: "",
        ColliderURL: "",
        // v50: Convex back to TRUE (the v48/v49 Convex:false experiment
        // broke the body silhouette into a flat L-strip — apparently TTS
        // does something destructive to the visible mesh when it has to
        // generate a non-convex collider from it). Pegs no longer rely
        // on physically dropping INTO the wells — instead each soldier
        // exposes 3 AttachedSnapPoints (added below) at the divot
        // positions, so a player dragging a peg near a divot snaps it
        // into place visually.
        Convex: true,
        MaterialIndex: 0,    // 0 = plastic
        TypeIndex: 1,        // 1 = figurine (vertical pickup, snaps to grid)
        CustomShader: {
            SpecularColor: { r: 1, g: 1, b: 1 },
            SpecularIntensity: 0.05,
            SpecularSharpness: 2,
            FresnelStrength: 0
        },
        CastShadows: true
    };
    // v50: snap a dragged peg straight into a divot well. Positions
    // are in LOCAL OBJ-unit space (TTS applies the object's scale).
    // Y = BASE_H + DIVOT_RIM_H = 0.125 puts the peg's bottom flush
    // with the well rim, so it reads as inserted into the socket.
    obj.AttachedSnapPoints = [
        { Position: { x: -0.36, y: 0.125, z: 0.30 } },
        { Position: { x:  0.00, y: 0.125, z: 0.42 } },
        { Position: { x:  0.36, y: 0.125, z: 0.30 } },
    ];
    return obj;
}
playerColors.forEach((pc, idx) => {
    // Pre-deploy A1–A4 and B1–B4 as standees on the table near the
    // player's corner. The remaining 20 soldiers (A5–A7, B5–B7, all of
    // C, all of D) go into the bag in REVERSE order so A5 is pulled
    // first when reinforcements arrive.
    const PRE_DEPLOY = new Set(["A1", "A2", "A3", "A4", "B1", "B2", "B3", "B4"]);

    // 2-row × 4-column grid: squad A nearer center, squad B nearer corner
    const colSides = [-5.25, -1.75, 1.75, 5.25];   // 3.5u spacing, 4 columns
    const rowTcs   = { A: 8, B: 4.5 };              // squad A toward center, B toward corner

    for (const letter of SQUAD_LETTERS) {           // A, B, C, D
        for (let n = 1; n <= 7; n++) {
            const id = `${letter}${n}`;
            if (!PRE_DEPLOY.has(id)) continue;
            const sp = cornerSpot(idx, rowTcs[letter], colSides[n - 1]);
            objects.push(makeSoldierStandee(pc, letter, n, sp.x, 1.4, sp.z));
        }
    }

    // Remaining soldiers go into the bag — added in reverse so A5
    // (next reinforcement) sits on top of the LIFO stack.
    const soldiers = [];
    let stackPos = 0;
    for (let s = SQUAD_LETTERS.length - 1; s >= 0; s--) {
        for (let n = 7; n >= 1; n--) {
            const id = `${SQUAD_LETTERS[s]}${n}`;
            if (PRE_DEPLOY.has(id)) continue;
            soldiers.push(
                makeSoldierStandee(pc, SQUAD_LETTERS[s], n,
                    0, 0.5 * stackPos++, 0)
            );
        }
    }
    const sp = cornerSpot(idx, -5, -7);
    const bag = baseObj("Bag", `${pc.label} Soldiers (20)`,
        `${pc.label} reinforcements — A5-A7, B5-B7, full C and D Squads. ` +
        `Pre-deployed on the table: A1-A4 + B1-B4. Pull from this bag as ` +
        `you recruit. Next out is A5.`,
        sp.x, 1.5, sp.z, { color: pc.color });
    bag.ContainedObjects = soldiers;
    objects.push(bag);
});

// ─── 9. SEPARATIST BAG (24 grey soldiers) ───────────────────────────
// v51 (round 2): Separatists reuse the RECRUIT (Local Favor) pawn mesh
// — the small simple silhouette — tinted grey instead of green. This
// matches the "look like Local Favor but in grey" spec and keeps
// Separatists visually distinct from the much larger H.A.M.S
// player-soldier figurines.
function makeSeparatistPawn(stackIdx) {
    const sep = baseObj(
        "Custom_Model", "Separatist", "Grey Separatist soldier",
        0, 0.5 * stackIdx, 0,
        // Match Local Favor's scale (0.918) so Separatists read at the
        // same size as the green recruit pawns.
        { scaleX: 0.918, scaleY: 0.918, scaleZ: 0.918,
          color: { r: 0.55, g: 0.55, b: 0.58 } }
    );
    sep.CustomMesh = {
        MeshURL: RECRUIT_MESH_URL,
        DiffuseURL: RESOURCE_DIFFUSE_URL,
        NormalURL: "",
        ColliderURL: "",
        Convex: true,
        MaterialIndex: 3,
        TypeIndex: 0,
        CustomShader: {
            SpecularColor: { r: 1, g: 1, b: 1 },
            SpecularIntensity: 0,
            SpecularSharpness: 2,
            FresnelStrength: 0,
        },
        CastShadows: true,
    };
    return sep;
}
const sepSoldiers = [];
for (let i = 0; i < 24; i++) sepSoldiers.push(makeSeparatistPawn(i));
const sepBag = baseObj("Bag", "Separatist Soldiers (24)", "24 grey Separatists. Spawn at bases.",
    -54, 1.5, -6, { color: { r: 0.5, g: 0.5, b: 0.5 } });
sepBag.ContainedObjects = sepSoldiers;
objects.push(sepBag);

// ─── 10. (REMOVED) SQUAD BOARDS ─────────────────────────────────────
// As of v33, squad boards are deleted. All soldier state lives on the
// mini itself: ID printed on the 40mm magnetized base, damage tracked
// via blood-drop pegs in 3 divots on the base, equipment as magnetized
// add-ons on the body. The freed corner area can be used for player
// staging / equipment-module trays in a later pass.

// ─── 11. CONTROL FLAG BAGS (25 per player, in corner) ───────────────
// Per rulebook: a single set of Control Flags is used BOTH to mark
// territorial control on hexes AND to mark unlocked BAC types on the
// Equipment Display. One unified component, two uses.
playerColors.forEach((pc, idx) => {
    const flags = [];
    for (let i = 0; i < 25; i++) {
        const flag = baseObj("Custom_Model", `${pc.label} Control Flag`,
            `${pc.label} Control Flag. Place on hexes you control OR on BAC cards in the Equipment Display. Permanent on the Display.`,
            0, 0.3 * i, 0,
            { scaleX: 1, scaleY: 1, scaleZ: 1, color: pc.color });
        flag.CustomMesh = {
            MeshURL: FLAG_MESH_URL,
            DiffuseURL: FLAG_DIFFUSE_URL,
            NormalURL: "",
            ColliderURL: "",
            Convex: true,
            MaterialIndex: 3,
            TypeIndex: 6,
            CustomShader: {
                SpecularColor: { r: 1, g: 1, b: 1 },
                SpecularIntensity: 0.1,
                SpecularSharpness: 3,
                FresnelStrength: 0,
            },
            CastShadows: true,
        };
        flags.push(flag);
    }
    const fp = cornerSpot(idx, -5, 0);
    const bag = baseObj("Bag", `${pc.label} Control Flags (25)`,
        "Mark hex control AND Equipment Display unlocks. One bag, two uses.",
        fp.x, 1.5, fp.z, { color: pc.color });
    bag.ContainedObjects = flags;
    objects.push(bag);
});

// ─── 13. DAMAGE PEGS (infinite bag) ─────────────────────────────────
// Blood-drop pegs that drop into the 3 divot wells on a soldier's base.
// 4th wound = death.
//
// Sizing — the well in hams-soldier.obj has inner radius 0.052 in OBJ
// units; the soldier renders at 2.5× scale, so the well opening on the
// table is ~0.26 units across. The peg mesh below is a 12-sided
// cylinder (radius 1.0 in OBJ space) with a domed top. Scaled to 0.10
// in TTS, its world diameter is ~0.20 — comfortably under the well
// opening — and it stands ~0.24 tall so it reads as a real inserted
// peg from any angle.
const PEG_MESH_URL = `${SOLDIER_BASE}/peg.obj`;
const dmgToken = baseObj(
    "Custom_Model", "Blood Peg",
    "Damage peg. Drops into a divot well on a soldier's base. 3 max, 4th = death.",
    0, 0.5, 0,
    // v49: shrunk from 0.10 → 0.085 so the peg's collider footprint is
    // comfortably under the well's 0.13 world-radius opening even
    // accounting for collision skin width.
    { scaleX: 0.085, scaleY: 0.085, scaleZ: 0.085, color: { r: 0.85, g: 0.05, b: 0.05 } }
);
dmgToken.CustomMesh = {
    MeshURL: PEG_MESH_URL,
    DiffuseURL: "",
    NormalURL: "",
    ColliderURL: "",
    Convex: true,
    MaterialIndex: 0,
    TypeIndex: 0,
    CustomShader: { SpecularColor: { r: 1, g: 1, b: 1 }, SpecularIntensity: 0.4, SpecularSharpness: 3, FresnelStrength: 0.1 },
    CastShadows: true,
};
const dmgBag = baseObj("Infinite_Bag", "Damage Pegs", "Infinite blood-drop damage pegs. Each soldier base has 3 divots; 4th wound = death.",
    -54, 1.5, -12, { color: { r: 0.9, g: 0.1, b: 0.1 } });
dmgBag.ContainedObjects = [dmgToken];
objects.push(dmgBag);

// ─── 14. BUNKER TOKENS (bag of 12) ──────────────────────────────────
// v50: WW2 hex pillbox mesh (concrete bunker with overhanging roof slab,
// embrasure slit and observation cupola). Built by generate-bunker-model.js.
function makeBunkerToken(stackIdx) {
    const concrete = { r: 0.58, g: 0.57, b: 0.52 };  // weathered grey
    const tok = baseObj("Custom_Model", "Bunker",
        "+1 defense, 1/hex max, destroyable.",
        0, 0.4 * stackIdx, 0,
        { scaleX: 1.4, scaleY: 1.4, scaleZ: 1.4, color: concrete });
    tok.CustomMesh = {
        MeshURL: BUNKER_MESH_URL,
        DiffuseURL: BUNKER_DIFFUSE_URL,
        NormalURL: "",
        ColliderURL: "",
        Convex: true,
        MaterialIndex: 1,    // 1 = wood/stone-ish (less plasticky than 0)
        TypeIndex: 0,        // generic prop
        CustomShader: {
            SpecularColor: { r: 1, g: 1, b: 1 },
            SpecularIntensity: 0.05,
            SpecularSharpness: 2,
            FresnelStrength: 0,
        },
        CastShadows: true,
    };
    return tok;
}
const bunkerTokens = [];
for (let i = 0; i < 12; i++) bunkerTokens.push(makeBunkerToken(i));
const bunkerBag = baseObj("Bag", "Bunker Tokens (12)", "Neutral WW2 concrete bunkers via D.U.D.S.",
    -54, 1.5, 0, { color: { r: 0.55, g: 0.55, b: 0.50 } });
bunkerBag.ContainedObjects = bunkerTokens;
objects.push(bunkerBag);

// ─── 15. NUMBER TOKENS (face-down shuffleable Deck of 16) ───────────
// Catan-style chits with a big bold digit on the FRONT and a blank
// cream BACK. Implemented as a TTS CardCustom Deck because that's the
// only TTS object type with a native R-key Shuffle (Custom_Tile stacks
// just throw their contents in the air on R).
//
// Textures generated by generate-number-tokens.js:
//   tts/v<VERSION>/number_<n>.png    — face per number (1..6)
//   tts/v<VERSION>/number_back.png   — shared blank cream back
//
// 6 deck definitions (one per unique number); 16 cards spread across
// them according to the production-distribution pool.
const numberPool = [1, 1, 2, 2, 3, 3, 3, 4, 4, 4, 5, 5, 5, 6, 6, 6];
function shuffleSeeded(arr, seed) {
    const a = arr.slice();
    let s = seed;
    for (let i = a.length - 1; i > 0; i--) {
        s = (s * 1103515245 + 12345) & 0x7fffffff;
        const j = s % (i + 1);
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}
const shuffledNumbers = shuffleSeeded(numberPool, 0xCA7AB1E);
const NUMBER_BACK_URL = `${SOLDIER_BASE}/number_back.png`;
const numberDeckDefs = {};
const numberDeckIdByValue = {};
for (let n = 1; n <= 6; n++) {
    const did = nextDeckDefId++;
    numberDeckIdByValue[n] = did;
    numberDeckDefs[String(did)] = {
        FaceURL: `${SOLDIER_BASE}/number_${n}.png`,
        BackURL: NUMBER_BACK_URL,
        NumWidth: 1, NumHeight: 1,
        BackIsHidden: true, UniqueBack: false, Type: 0,
    };
}
const numberCards = shuffledNumbers.map((num, i) => {
    const card = baseObj("CardCustom", `#${num}`,
        `Number ${num} — every resource hex marked with this token produces on a ${num}.`,
        0, 0.1 * i, 0);
    card.CardID = numberDeckIdByValue[num] * 100;
    card.CustomDeck = { [String(numberDeckIdByValue[num])]: numberDeckDefs[String(numberDeckIdByValue[num])] };
    card.SidewaysCard = false;
    card.HideWhenFaceDown = true;
    return card;
});
const numberDeck = baseObj("Deck", "Number Tokens (16)",
    "Catan-style chits placed on resource hexes during setup. Press R to shuffle, deal 1 per resource hex (one hex gets 2).",
    -54, 1.5, 6, { rotZ: 180 });
numberDeck.DeckIDs = numberCards.map(c => c.CardID);
numberDeck.CustomDeck = numberDeckDefs;
numberDeck.HideWhenFaceDown = true;
numberDeck.SidewaysCard = false;
numberDeck.ContainedObjects = numberCards;
objects.push(numberDeck);

// ─── 16. CARGO CONTAINERS (12 = 2 matching sets of 1-6) ─────────────
// Per rulebook: 12 numbered containers, 2*(1-6). One set marks the
// Unloading Zone slots (BAC cards stack underneath); the matching
// second set is placed on the corresponding spaceport hex on the
// board when BACs arrive there. Both sets share the same colour
// per number so the pairing is obvious at a glance.
//
// ISO-style cargo shipping container mesh from
// generate-container-model.js — corrugated long sides, doors on the
// +X end, steel corner posts and rails. Each number gets its own
// shipping-line colour.
const containerColors = [
    { r: 0.85, g: 0.20, b: 0.18 },   // 1 — Maersk-ish red
    { r: 0.10, g: 0.45, b: 0.75 },   // 2 — CMA-blue
    { r: 0.95, g: 0.70, b: 0.10 },   // 3 — Hapag-yellow
    { r: 0.20, g: 0.55, b: 0.30 },   // 4 — Evergreen
    { r: 0.85, g: 0.45, b: 0.10 },   // 5 — Hamburg-orange
    { r: 0.92, g: 0.92, b: 0.90 },   // 6 — bone white
];
function makeContainer(num, role, px, py, pz) {
    const c = containerColors[num - 1];
    const cont = baseObj("Custom_Model", `Container #${num} (${role})`,
        role === "Unloading Zone"
            ? `Marks the Unloading Zone slot for Spaceport ${num}. BAC cards arriving at Spaceport ${num} stack face-up under this container.`
            : `Spaceport ${num} board marker. Place on the matching spaceport hex when a BAC arrives there; remove when a Squad collects the BACs.`,
        px, py, pz,
        // rotY: 90 — turn each container 90° so its long axis points
        // along Z (toward/away from the camera) rather than along X.
        { rotY: 90, scaleX: 1.0, scaleY: 1.0, scaleZ: 1.0, color: c });
    cont.CustomMesh = {
        MeshURL: CONTAINER_MESH_URL,
        DiffuseURL: containerDiffuseURL(num),
        NormalURL: "",
        ColliderURL: "",
        Convex: true,
        MaterialIndex: 1,    // metal-ish
        TypeIndex: 0,        // generic prop
        CustomShader: {
            SpecularColor: { r: 1, g: 1, b: 1 },
            SpecularIntensity: 0.15,
            SpecularSharpness: 3,
            FresnelStrength: 0,
        },
        CastShadows: true,
    };
    return cont;
}
// The 12 containers form 6 stacked PAIRS on the Unloading Zone
// board — one Unloading-Zone container at the bottom of each slot
// (y=1.2) with the matching Board-Marker container dropped on top
// (y=2.0). Gravity settles the top container cleanly onto the
// bottom one, so the two sets are visually paired by colour AND
// co-located. Players lift the top (Board Marker) one off and
// place it on the matching spaceport hex when a BAC arrives there.
//
// Unloading Zone board lives at (UZ_BOARD_X, UZ_BOARD_Z) — moved to
// sit directly south of the Conspire deck (which is at x=34, z=8).
// Slot grid is 3 cols × 2 rows; world slot pitch matches the texture
// geometry (see UZ board derivation in section 17b).
// v75: moved further east (56 → 68) so the Planet Bound Area can fit
// between the Equipment Display (x=37) and the Unloading Zone.
const UZ_BOARD_X = 52.81;
const UZ_BOARD_Z = 0;
// Slot center pitches derived from the v59 board texture geometry
// (1000×950 px, 250×350 slots, gaps 30/50, gridTop 110), using the
// re-derived empirical Custom_Tile factor ~2× per scale-unit on
// BOTH axes (see uzBoard scaleX/scaleZ comment):
//   W_world ≈ 5.0  × 2 = 10.0 ; Z_world ≈ 4.75 × 2 = 9.5
//   col centers (px 220, 500, 780) → world x_off ≈ ±2.8
//   row centers (px 285, 685)      → world z_off ≈ +1.9 / -2.1
const UZ_COL_PITCH = 2.8;        // world units between slot centers (X)
const UZ_ROW_PITCH = 4.0;        // world units between slot centers (Z)
for (let i = 1; i <= 6; i++) {
    const col = (i - 1) % 3;     // 0,1,2
    const row = Math.floor((i - 1) / 3); // 0 (top) or 1 (bottom)
    // Texture-LEFT maps to world-LEFT (negative X) on rotY:180 tile.
    // Texture-TOP maps to world+Z (away from south camera).
    const px = UZ_BOARD_X + (col - 1) * UZ_COL_PITCH;
    const pz = UZ_BOARD_Z + (0.5 - row) * UZ_ROW_PITCH;
    // Bottom: Unloading Zone container (sits in the slot).
    objects.push(makeContainer(i, "Unloading Zone", px, 1.2, pz));
    // Top: matching Board Marker container, dropped slightly higher
    // so gravity settles it onto its UZ pair.
    objects.push(makeContainer(i, "Board Marker",   px, 2.0, pz));
}

// ─── 17. ZONE LABELS (locked, thin, smaller) ────────────────────────
// Both UNLOADING ZONE and EQUIPMENT DISPLAY labels removed — they're
// now full Custom_Tile boards (section 17c and 17d below). No
// BlockRectangle zone labels remain.

// ─── 17b. PLANET BOUND AREA BOARD (movable Custom_Tile) ─────────────
// A single MOVABLE Custom_Tile painted with a black background, a
// gold outer border, "PLANET BOUND AREA" title, and 6 card-shaped
// gold slot outlines (numbered 1-6). Players lay face-up BACs into
// the slots during setup and refill them as cards are taken.
// Texture aspect (3:1) matches the tile scale (18 x 6 TTS units) so
// the slot outlines stay card-shaped.
const PLANETBOUND_BOARD_URL = `${SOLDIER_BASE}/planetbound-board.png`;
// Custom_Tile X scale empirically renders ~6× wider than its scale
// number (e.g. scaleX:8 produced a board where each slot was ~3 cards
// wide, despite the texture/math saying it should be 1× card wide).
// scaleZ behaves as the documented 2× factor. So to make each slot
// match a 2.5×3.5 card on the in-world board (~19 wide × 5 deep):
//   scaleX = 19 / 6 ≈ 3.17
//   scaleZ = 5 / 2  = 2.5
// rotY:180 so the title and 'DECK'/'1'-'6' labels read upright from
// the south-facing camera.
const pbBoard = baseObj("Custom_Tile", "Planet Bound Area",
    "Movable board with 7 slots: leftmost slot is for the Spaceport Deck, the other 6 hold the face-up Planet Bound BAC cards. Always keep 6 face-up; refill immediately whenever one is taken.",
    // v75: positioned between ED (x=37) and UZ (x=68).
    // v76: rotated 90° to the right (rotY 180 → 90) per user request.
    // Footprint at rotY:90 ~5 (X) × 19 (Z). Position x=53 → x ∈ [50.5, 55.5],
    // long axis north-south (z ∈ [-9.5, +9.5]).
    44.31, 1.02, 0,
    { rotY: 270, scaleX: 3.17, scaleY: 0.2, scaleZ: 2.5, color: { r: 1, g: 1, b: 1 }, grid: false });
pbBoard.CustomImage = {
    ImageURL: PLANETBOUND_BOARD_URL,
    ImageSecondaryURL: "",
    ImageScalar: 1,
    WidthScale: 0,
    CustomTile: { Type: 0, Thickness: 0.1, Stackable: false, Stretch: true },
};
objects.push(pbBoard);

// ─── 17c. UNLOADING ZONE BOARD (movable Custom_Tile) ────────────────
// Rectangular companion to the Planet Bound Area board: black with a
// neon-green border, "UNLOADING ZONE" title, and 6 card-shaped slots
// in a 3-col × 2-row grid (Spaceports 1-6, top-left → bottom-right).
// Each slot is the home for the matching numbered cargo container;
// BAC cards arriving at that spaceport stack face-up under it.
//
// Texture is 1000×950 px. EMPIRICAL Custom_Tile scaling (re-derived
// after v59 rendered as a tall-narrow portrait): at small scale
// values BOTH axes render ~2× per scale-unit (matches the documented
// table_surface comment, NOT the earlier "X renders ~6×" claim that
// was inferred from PB deck-positioning). To get a ~10 × 9.5 world
// footprint so each 250-px slot maps to a ~2.5 world-unit card width:
//   scaleX = 10  / 2 = 5.0
//   scaleZ = 9.5 / 2 = 4.75
// rotY:180 so the title and "1"-"6" labels read upright from the
// south-facing camera.
const UNLOADING_BOARD_URL = `${SOLDIER_BASE}/unloading-zone-board.png`;
const uzBoard = baseObj("Custom_Tile", "Unloading Zone",
    "Movable board with 6 slots (Spaceports 1-6). Place each numbered cargo container on its matching slot. BAC cards arriving at a spaceport stack face-up under that slot's container.",
    UZ_BOARD_X, 1.02, UZ_BOARD_Z,
    { rotY: 180, scaleX: 5.0, scaleY: 0.2, scaleZ: 4.75, color: { r: 1, g: 1, b: 1 }, grid: false });
uzBoard.CustomImage = {
    ImageURL: UNLOADING_BOARD_URL,
    ImageSecondaryURL: "",
    ImageScalar: 1,
    WidthScale: 0,
    CustomTile: { Type: 0, Thickness: 0.1, Stackable: false, Stretch: true },
};
objects.push(uzBoard);

// ─── 17d. EQUIPMENT DISPLAY BOARD (movable Custom_Tile) ─────────────
// The big shared board where players place face-up BAC cards as they
// unlock new equipment types, then drop their Control Flags on top
// to mark personal access. Sits between the Blue (x=+42, z=-28) and
// Red (x=-42, z=-28) player corners, on the south edge of the table.
//
// 20 slots in a 10-col × 2-row LANDSCAPE strip (one slot per BAC
// type). Texture is 2900×900 px.
//
// Slot scale derived directly from Planet Bound's working ratios.
// PB has slots that fit cards with scaleX:3.17 in a 1900×500
// texture. Matching px-per-world ratio guarantees slots fit cards
// the same way on this board too:
//   scaleX = 2900  × (3.17 / 1900) = 4.84
//   scaleZ = 1000  × (2.50 /  500) = 5.00
// (Texture H bumped 900 -> 1000 to add room between the two rows
//  and a bottom margin below row 2.)
// rotY:180 — flips the board so the title and slot grid face the
// opposite direction. Board nudged south (z -22 -> -25) per user
// request.
const EQUIPMENT_BOARD_URL = `${SOLDIER_BASE}/equipment-display-board.png`;
const eqBoard = baseObj("Custom_Tile", "Equipment Display",
    "Shared reference board: 20 slots for face-up BAC cards (one per BAC type). When you unlock a new BAC type for the first time, place its card face-up here and drop one of your Control Flags on top to mark permanent access. Multiple flags may share a slot.",
    // v75: shifted east to clear the planet board (east edge at x=30).
    // v76: rotated 90° to the right (rotY 180 → 90) per user request.
    // Footprint at rotY:90 ~10 (X) × 9.68 (Z). Position x=37 → x ∈ [32, 42].
    35.81, 1.02, 0,
    { rotY: 270, scaleX: 4.84, scaleY: 0.2, scaleZ: 5.00, color: { r: 1, g: 1, b: 1 }, grid: false });
eqBoard.CustomImage = {
    ImageURL: EQUIPMENT_BOARD_URL,
    ImageSecondaryURL: "",
    ImageScalar: 1,
    WidthScale: 0,
    CustomTile: { Type: 0, Thickness: 0.1, Stackable: false, Stretch: true },
};
objects.push(eqBoard);

// ─── 17e0. PLANET BOARD (single locked board with 61 hex slots) ─────
// Single rectangular board with all 61 hex slot outlines printed onto
// its top surface. Players drop hex tiles INTO the printed slots.
//
// v69: ENLARGED to give the cluster comfortable margin (~5u of
// "atmosphere" frame around the outermost hex). Surrounding boards
// were pushed outward to free the room:
//   Planet Bound   z 33.5 → 36   (south edge stays at z=33.5)
//   Equipment Disp z -31  → -34  (north edge moves z -26 → -29)
//   Unloading Zone x 34   → 36   (west edge moves x 29 → 31)
//
// Custom_Tile Type=0 base = 2 world units per scale unit.
//
//   Board world size:  60 × 60 square  (scaleX = scaleZ = 30)
//   Centered at:       (0, 0.95, 2.5)  — same xz as the hex cluster
//                      so the printed hex slots line up exactly with
//                      the spawned hex tiles overhead.
//   Board edges:       x ∈ [-30, 30],  z ∈ [-27.5, 32.5]
//   Margins:           1.0u to PB north, 1.5u to ED south, 1.0u to UZ
//   Cluster→frame gap: ~5.5u left/right, ~2.7u top/bottom
//
// Texture: tts/v69/planet-board.png (3000×3000 @ 50 px/world unit,
// generated by tts/generate-planet-board.js — 61 flat-top hex slot
// outlines at the exact axial coords used below).
const PLANET_BOARD_URL = `${SOLDIER_BASE}/planet-board.png?v114`;
const planetBoard = baseObj("Custom_Tile", "Planet Board",
    "The planet's surface — drop the 61 Hex Tiles into the printed slots. Locked.",
    -7.19, 0.95, 0.5,
    { rotY: 0, scaleX: 36.0, scaleY: 0.2, scaleZ: 36.0,
      color: { r: 1, g: 1, b: 1 }, locked: true, grid: false });
planetBoard.CustomImage = {
    ImageURL: PLANET_BOARD_URL,
    ImageSecondaryURL: "",
    ImageScalar: 1,
    WidthScale: 0,
    CustomTile: { Type: 0, Thickness: 0.1, Stackable: false, Stretch: true },
};
objects.push(planetBoard);

// ─── 17e. PLANET HEX TILES (61 hex tiles = the planet surface) ──────
// Per rulebook §"Hex Tiles (61 total)":
//   3 Oil Rig (black border)        3 Power Plant (yellow)
//   3 Factory (red)                  3 Radar Dish (blue)
//   3 City / Village (green)         3 Separatist Base (grey, # 2/4/6)
//   6 Spaceport Drop Zone (purple, # 1-6)   37 Terrain
// Textures generated by tts/generate-hex-tiles.js, hosted at
// tts/v<VERSION>/hex_*.png.  Each tile is a movable Custom_Tile of
// Type=1 (hex), face-up, laid out in a radius-4 hex-of-hexes
// (1+6+12+18+24 = 61 cells) centered on the table.
const HEX_TEX = (name) => `${SOLDIER_BASE}/hex_${name}.png`;

// Build the 61-tile manifest from the rulebook.
const HEX_MANIFEST = [];
for (let i = 0; i < 3; i++) HEX_MANIFEST.push({ kind: "oil",     url: HEX_TEX("oil"),     label: "Oil Rig" });
for (let i = 0; i < 3; i++) HEX_MANIFEST.push({ kind: "power",   url: HEX_TEX("power"),   label: "Power Plant" });
for (let i = 0; i < 3; i++) HEX_MANIFEST.push({ kind: "factory", url: HEX_TEX("factory"), label: "Factory" });
for (let i = 0; i < 3; i++) HEX_MANIFEST.push({ kind: "radar",   url: HEX_TEX("radar"),   label: "Radar Dish" });
for (let i = 0; i < 3; i++) HEX_MANIFEST.push({ kind: "city",    url: HEX_TEX("city"),    label: "City / Village" });
for (const n of [2, 4, 6])         HEX_MANIFEST.push({ kind: `separatist_${n}`, url: HEX_TEX(`separatist_${n}`), label: `Separatist Base (${n})` });
for (const n of [1, 2, 3, 4, 5, 6]) HEX_MANIFEST.push({ kind: `spaceport_${n}`,  url: HEX_TEX(`spaceport_${n}`),  label: `Spaceport Drop Zone (${n})` });
for (let i = 0; i < 37; i++) HEX_MANIFEST.push({ kind: "terrain", url: HEX_TEX("terrain"), label: "Terrain Hex" });
if (HEX_MANIFEST.length !== 61) throw new Error("hex manifest count: " + HEX_MANIFEST.length);

// Deterministic Fisher-Yates so the planet layout is reproducible.
let _hexRng = 0xCA7AB1E ^ 0x48455845; // "HEXE" mixed in
function _hexRnd() { _hexRng = (_hexRng * 1664525 + 1013904223) >>> 0; return _hexRng / 0x100000000; }
for (let i = HEX_MANIFEST.length - 1; i > 0; i--) {
    const j = Math.floor(_hexRnd() * (i + 1));
    [HEX_MANIFEST[i], HEX_MANIFEST[j]] = [HEX_MANIFEST[j], HEX_MANIFEST[i]];
}

// Axial coords for radius-4 hex-of-hexes (61 cells).
const HEX_COORDS = [];
for (let q = -4; q <= 4; q++)
    for (let r = -4; r <= 4; r++)
        if (Math.abs(q + r) <= 4) HEX_COORDS.push([q, r]);
if (HEX_COORDS.length !== 61) throw new Error("hex coord count: " + HEX_COORDS.length);

// FLAT-TOP axial → world. TTS Custom_Tile Type=1 cuts a flat-top
// hex (flat edge at top/bottom, point at left/right). Pitches chosen
// so neighboring hexes touch edge-to-edge for the chosen scale.
// (User may iterate HEX_SCALE / pitches if hexes overlap or gap.)
//
// Hex back face: every tile shows the same Earth image
// (hex_back_earth.png) on its underside, so flipped tiles all look
// like a planet from orbit (black space + blue/green Earth).
// HEX_SCALE chosen so the cluster's z extent fits between the Planet
// Bound board (south edge ≈ z=31) and the Equipment Display (north
// edge ≈ z=-26) with ~1 unit ("inch") margin on each side.
//   z extent = R * (4√3 + √3/2) = R * 7.794 each side
//   55 / (2*7.794) = 3.53  →  pick 3.5 and offset center to z=2.5.
const HEX_SCALE   = 3.96;
const HEX_R_WORLD = 3.96;
const PITCH_X = 1.5 * HEX_R_WORLD;
const PITCH_Z = Math.sqrt(3) * HEX_R_WORLD;
const PLANET_CX = -7.19, PLANET_CZ = 0.5;
const HEX_BACK_URL = `${SOLDIER_BASE}/hex_back_earth.png`;

for (let i = 0; i < 61; i++) {
    const [q, r] = HEX_COORDS[i];
    const tile = HEX_MANIFEST[i];
    const x = PLANET_CX + PITCH_X * q;
    const z = PLANET_CZ + PITCH_Z * (r + q / 2);
    const hex = baseObj("Custom_Tile", tile.label, `Hex tile — ${tile.kind}.`,
        x, 1.02, z,
        { rotY: 180, scaleX: HEX_SCALE, scaleY: 0.2, scaleZ: HEX_SCALE,
          color: { r: 1, g: 1, b: 1 }, grid: false });
    hex.CustomImage = {
        ImageURL: tile.url,
        ImageSecondaryURL: HEX_BACK_URL,
        ImageScalar: 1,
        WidthScale: 0,
        CustomTile: { Type: 1, Thickness: 0.1, Stackable: false, Stretch: true },
    };
    objects.push(hex);
}

// ─── 18. REFERENCE BOOKS — Quick Ref + Full User Guide ──────────────
// Custom_PDF objects render as physical book/folder shapes on the
// table. Right-click → Open shows a scrollable PDF reader. The
// previous Notecard implementation was a tiny flat note that didn't
// look like a book and stayed on the play surface.
//
// Both books float locked just past the western play-surface edge
// (x=-54), elevated above the table so they read as a "shelf"
// beside the board. The Quick Reference sits on top, the full
// User Guide just behind it.
const QUICKREF_PDF_URL = "https://raw.githubusercontent.com/YossiTurgeman/WarHams/main/design/WARHAMS-QuickRef.pdf";
const RULEBOOK_PDF_URL = "https://raw.githubusercontent.com/YossiTurgeman/WarHams/main/design/WARHAMS-Rulebook.pdf";
function makeReferenceBook(nickname, desc, pdfUrl, px, py, pz, color) {
    const book = baseObj("Custom_PDF", nickname, desc,
        px, py, pz,
        // Default Custom_PDF orientation lies the book flat with the
        // cover up; players right-click → Open to read the pages.
        // rotY: 90 turns the book 90° clockwise (viewed from above)
        // so the long edge of the cover faces toward the camera.
        { rotY: 90, scaleX: 2, scaleY: 2, scaleZ: 2, color, locked: true, grid: false });
    book.CustomPDF = {
        PDFUrl: pdfUrl,
        PDFPassword: "",
        PDFPage: 0,
        PDFPageOffset: 0,
    };
    return book;
}
objects.push(makeReferenceBook(
    "Quick Reference", "Single-page summary: turn phases, combat sequence, equipment slots, victory conditions.",
    QUICKREF_PDF_URL,
    -60, 2.0, 8,
    { r: 0.85, g: 0.90, b: 0.95 }
));
objects.push(makeReferenceBook(
    "User Guide (Full Rulebook)", "Complete W.A.R H.A.M.S rulebook. Right-click → Open to read.",
    RULEBOOK_PDF_URL,
    -60, 2.0, -8,
    { r: 0.95, g: 0.90, b: 0.75 }
));

// ═════════════════════════════════════════════════════════════════════
//  BUILD SAVE FILE
// ═════════════════════════════════════════════════════════════════════

const saveFile = {
    SaveName: "W.A.R H.A.M.S",
    EpochTime: Math.floor(Date.now() / 1000),
    Date: new Date().toISOString().split('T')[0],
    VersionNumber: "v13.3.0",
    GameMode: "",
    GameType: "",
    GameComplexity: "",
    Tags: ["Strategy", "Sci-Fi", "Wargame"],
    Gravity: 0.5,
    PlayArea: 1.0,
    Table: "Table_None",
    Sky: "Sky_Museum",
    Note: [
        "W.A.R H.A.M.S: The Battle for Planet X",
        "========================================",
        "", "2-4 Players | Sci-Fi Corporate Military Conquest",
        "", "SETUP:",
        "1. Place hex tiles manually to build the planet board",
        "2. Each player takes a soldier bag and Control Flag bag (10 minis = 2 squads of 5; squad/soldier numbers printed on bases)",
        "3. Place 10 soldiers (2 squads of 5) on starting hexes",
        "4. Deal 3 BAC cards each, then draft (pick 1, pass 2 left, etc.)",
        "5. Shuffle the Conspire Deck",
        "", "VICTORY CONDITIONS:",
        "- Spaceport Domination: 5/6 spaceports (2p) or 4/6 (3-4p)",
        "- Military Supremacy: Hold 28 soldiers for 1 full round",
        "- Dominance: 50 DP from equipped BAC cards",
    ].join('\n'),
    Rules: "",
    PlayerTurn: "",
    DrawImage: "",
    TabStates: {},
    Grid: { Type: 0, Lines: false, Snapping: false, Offset: false, BothSnapping: false, xSize: 2, ySize: 2 },
    Lighting: {},
    Hands: {},
    ComponentTags: {},
    Turns: { Enable: false, Type: 0, TurnOrder: [], Reverse: false, SkipEmpty: false, DisableInteractions: false, PassTurns: true },
    DecalPallet: [],
    LuaScript: "",
    LuaScriptState: "",
    XmlUI: "",
    ObjectStates: objects,
    SnapPoints: [],
};

// Write to tts/ directory
const outPath = path.join(__dirname, 'WARHAMS_TTS.json');
fs.writeFileSync(outPath, JSON.stringify(saveFile, null, 2));

// Also copy to TTS Saves folder
const ttsPath = path.join('/mnt/c/Users/User/OneDrive/Documents/My Games/Tabletop Simulator/Saves', 'WARHAMS_TTS.json');
try {
    fs.copyFileSync(outPath, ttsPath);
    console.log(`Copied to TTS Saves: ${ttsPath}`);
} catch (e) {
    console.log(`Warning: Could not copy to TTS Saves: ${e.message}`);
}

// Summary
const objCount = objects.length;
let containedCount = 0;
objects.forEach(o => { if (o.ContainedObjects) containedCount += o.ContainedObjects.length; });
console.log(`\nGenerated ${outPath}`);
console.log(`Top-level objects: ${objCount}`);
console.log(`Contained objects: ${containedCount}`);
console.log(`Total objects: ${objCount + containedCount}`);
