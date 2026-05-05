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
const CARD_VERSION = "v43";
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
const RESOURCE_DIFFUSE_URL = `${CARD_BASE}/resource-texture.png?${CARD_VERSION}`;
const LIGHTNING_MESH_URL = `${CARD_BASE}/lightning.obj?${CARD_VERSION}`;
const WAVE_MESH_URL = `${CARD_BASE}/wave.obj?${CARD_VERSION}`;
const HAMMER_MESH_URL = `${CARD_BASE}/hammer.obj?${CARD_VERSION}`;
const RECRUIT_MESH_URL = `${CARD_BASE}/recruit.obj?${CARD_VERSION}`;
const TABLE_SURFACE_URL = `${CARD_BASE}/table_surface.png?${CARD_VERSION}`;

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
// usable play area is ~108 × 76 (±54 X, ±38 Z), 4× the area of Table_RPG.
const tableTile = baseObj("Custom_Tile", "Play Surface",
    "W.A.R.H.A.M.S play surface — 4× standard table area.",
    0, 0.9, 0,
    { scaleX: 54, scaleY: 1, scaleZ: 38, color: { r: 1, g: 1, b: 1 }, locked: true, grid: false });
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
    // Red — bottom-left
    { sx: -1, sz: -1, anchor: { x: -42, z: -28 }, boardRotY: 180, handRotY:   0 },
    // Blue — bottom-right
    { sx:  1, sz: -1, anchor: { x:  42, z: -28 }, boardRotY: 180, handRotY:   0 },
    // Green — top-left
    { sx: -1, sz:  1, anchor: { x: -42, z:  28 }, boardRotY:   0, handRotY: 180 },
    // Yellow — top-right
    { sx:  1, sz:  1, anchor: { x:  42, z:  28 }, boardRotY:   0, handRotY: 180 },
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
    const deck = baseObj("Deck", "BAC Deck",
        `Basic Armament Cards — ${gameData.deck_counts.total_BAC_cards} cards\nDraw 3 per player, then draft.\nHover cards to see stats.`,
        44, 1.5, -20, { rotY: 180, rotZ: 180, color: { r: 0.8, g: 0.6, b: 0.3 } });
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
        44, 1.5, 20, { rotY: 180, rotZ: 180, color: { r: 0.3, g: 0.2, b: 0.5 } });
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
[
    { name: "Resource Die 1", color: { r: 1, g: 1, b: 1 }, x: 8 },
    { name: "Resource Die 2", color: { r: 1, g: 1, b: 1 }, x: 10 },
    { name: "Separatist Die", color: { r: 0.5, g: 0.5, b: 0.5 }, x: 12 },
].forEach(d => {
    objects.push(baseObj("Die_6", d.name,
        d.name.includes("Separatist") ? "Grey — triggers Separatist spawning" : "Resource production",
        d.x, 2, -3, { color: d.color }));
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
        44, 1.5, -12 + i * 6, { color: res.color });
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
        { color: pc.color, scaleX: 2.5, scaleY: 2.5, scaleZ: 2.5 }
    );
    obj.CustomMesh = {
        MeshURL: SOLDIER_MESH_URL,
        DiffuseURL: soldierTextureURL(pc.label.toLowerCase(), id),
        NormalURL: "",
        ColliderURL: "",
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
const sepSoldiers = [];
for (let i = 0; i < 24; i++) {
    const sep = baseObj("PlayerPawn", "Separatist", "Grey Separatist soldier",
        0, 0.5 * i, 0, { color: { r: 0.5, g: 0.5, b: 0.5 } });
    sep.MaterialIndex = 8;
    sepSoldiers.push(sep);
}
const sepBag = baseObj("Bag", "Separatist Soldiers (24)", "24 grey Separatists. Spawn at bases.",
    0, 1.5, 9, { color: { r: 0.5, g: 0.5, b: 0.5 } });
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
// Blood-drop pegs that snap into the 3 divots on a soldier's 40mm base.
// 4th wound = death. Physical product: translucent red blood-drop sculpts.
const dmgToken = baseObj("Checker_white", "Blood Peg", "Damage peg. Insert into a divot on a soldier's base. 3 max, 4th = death.", 0, 0.5, 0, { color: { r: 0.85, g: 0.05, b: 0.05 } });
const dmgBag = baseObj("Infinite_Bag", "Damage Pegs", "Infinite blood-drop damage pegs. Each soldier base has 3 divots; 4th wound = death.",
    -6, 1.5, 9, { color: { r: 0.9, g: 0.1, b: 0.1 } });
dmgBag.ContainedObjects = [dmgToken];
objects.push(dmgBag);

// ─── 14. BUNKER TOKENS (bag of 12) ──────────────────────────────────
const bunkerTokens = [];
for (let i = 0; i < 12; i++) {
    bunkerTokens.push(baseObj("BlockSquare", "Bunker", "+1 defense, 1/hex max, destroyable.",
        0, 0.4 * i, 0, { scaleX: 0.6, scaleY: 0.3, scaleZ: 0.6, color: { r: 0.45, g: 0.38, b: 0.25 } }));
}
const bunkerBag = baseObj("Bag", "Bunker Tokens (12)", "Neutral fortifications via D.U.D.S.",
    -3, 1.5, 9, { color: { r: 0.45, g: 0.38, b: 0.25 } });
bunkerBag.ContainedObjects = bunkerTokens;
objects.push(bunkerBag);

// ─── 15. NUMBER TOKENS (bag of 16) ──────────────────────────────────
const numberPool = [1, 1, 2, 2, 3, 3, 3, 4, 4, 4, 5, 5, 5, 6, 6, 6];
const numTokens = [];
numberPool.forEach((num, i) => {
    numTokens.push(baseObj("BlockSquare", `#${num}`, `Number ${num} — produces on this roll`,
        0, 0.4 * i, 0, { scaleX: 0.5, scaleY: 0.15, scaleZ: 0.5, color: { r: 0.95, g: 0.92, b: 0.82 } }));
});
const numBag = baseObj("Bag", "Number Tokens (16)", "For resource hexes. 2×1, 2×2, 3×3-6.",
    3, 1.5, 9, { color: { r: 0.95, g: 0.92, b: 0.82 } });
numBag.ContainedObjects = numTokens;
objects.push(numBag);

// ─── 16. CARGO CONTAINERS (6) ───────────────────────────────────────
for (let i = 1; i <= 6; i++) {
    objects.push(baseObj("BlockSquare", `Container #${i}`, `Spaceport ${i} cargo container.`,
        4 + (i - 1) * 2.5, 1.2, 5, { scaleX: 0.8, scaleY: 0.8, scaleZ: 0.8, color: { r: 0.35, g: 0.5, b: 0.35 } }));
}

// ─── 17. ZONE LABELS (locked, thin, smaller) ────────────────────────
const zones = [
    { name: "UNLOADING ZONE", desc: "BAC cards land here on doubles. 6 slots for Spaceports 1-6.",
      x: 16, z: 3, sx: 5, sz: 1, color: { r: 0.2, g: 0.3, b: 0.2 } },
    { name: "PLANET BOUND AREA", desc: "Face-up BAC display. Refill from Spaceport Deck.",
      x: 16, z: 7, sx: 4, sz: 1, color: { r: 0.2, g: 0.15, b: 0.1 } },
    { name: "EQUIPMENT DISPLAY", desc: "First-time equip: place BAC face-up + your flag. Flags permanent.",
      x: 16, z: -3, sx: 4, sz: 1.5, color: { r: 0.15, g: 0.12, b: 0.08 } },
];
zones.forEach(z => {
    const label = baseObj("BlockRectangle", z.name, z.desc,
        z.x, 1.02, z.z, { scaleX: z.sx, scaleY: 0.05, scaleZ: z.sz, color: z.color, locked: true });
    objects.push(label);
});

// ─── 18. TURN TRACKER ───────────────────────────────────────────────
objects.push(baseObj("Notecard", "Turn & DP Tracker", [
    "W.A.R H.A.M.S  GAME TRACKER",
    "============================",
    "", "ROUND: ___  ACTIVE PLAYER: ___",
    "", "--- Dominance Points ---",
    "P1 Red: ___  P2 Blue: ___",
    "P3 Green: ___  P4 Yellow: ___",
    "", "--- Spaceports Controlled ---",
    "P1:__/6  P2:__/6  P3:__/6  P4:__/6",
    "", "--- Victory ---",
    "Spaceport: 5/6(2p) 4/6(3-4p)",
    "Military: 28 soldiers, hold 1 round",
    "Dominance: 50 DP from BACs",
].join('\n'), -18, 1.5, -6, { scaleX: 1.2, scaleZ: 1.2, color: { r: 0.95, g: 0.9, b: 0.75 } }));

// ─── 19. QUICK REFERENCE ────────────────────────────────────────────
objects.push(baseObj("Notecard", "Quick Reference", [
    "TURN PHASES",
    "1. Resource Prod — Roll 2d6+Sep Die",
    "2. Movement — 1 hex (2 w/ J.J)",
    "3. Combat — within 2 hexes",
    "4. Resource Gathering",
    "5. Purchase & Equip",
    "6. Trade (bank 3:1)",
    "7. Move Separatists",
    "", "COMBAT: Pre→1.Roll→2.Assign→",
    "3.Equip bonus→4.Conspire→",
    "5.Damage→6.Counter(3+ block)",
    "", "SLOTS: 1=Head 2=Back 3=Legs",
    "4-5=Chest 6=Hands",
].join('\n'), -22, 1.5, -6, { scaleX: 1.2, scaleZ: 1.2, color: { r: 0.85, g: 0.9, b: 0.95 } }));

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
    PlayArea: 0.5,
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
