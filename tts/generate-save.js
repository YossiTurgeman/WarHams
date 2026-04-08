#!/usr/bin/env node
/**
 * W.A.R H.A.M.S — TTS Save File Generator
 * Generates WARHAMS_TTS.json from game-data.json and setup.lua
 *
 * Uses built-in TTS object types with MaterialIndex for color where supported.
 * Card decks use placehold.co images for visible face/back art.
 *
 * Usage: node generate-save.js
 */

const fs = require('fs');
const path = require('path');

const gameData = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'design', 'game-data.json'), 'utf8'));
const luaScript = fs.readFileSync(path.join(__dirname, 'scripts', 'setup.lua'), 'utf8');

// Card deck images — placehold.co with readable text
const BAC_FACE = "https://placehold.co/300x420/cc9933/ffffff.png?text=B.A.C";
const BAC_BACK = "https://placehold.co/300x420/664400/ffffff.png?text=BASIC+ARMAMENT";
const CONSPIRE_FACE = "https://placehold.co/300x420/4033cc/ffffff.png?text=CONSPIRE";
const CONSPIRE_BACK = "https://placehold.co/300x420/1a1a66/ffffff.png?text=CONSPIRE+CARD";

// GUID generator — 6 hex chars
let guidCounter = 0x100000;
function nextGUID() {
    return (guidCounter++).toString(16);
}

// Base transform helper
function transform(x, y, z, rotY = 0, scale = 1) {
    const s = typeof scale === 'object' ? scale : { x: scale, y: scale, z: scale };
    return {
        posX: x, posY: y, posZ: z,
        rotX: 0, rotY: rotY, rotZ: 0,
        scaleX: s.x, scaleY: s.y || 1, scaleZ: s.z
    };
}

// Base object template — only include fields TTS expects
function baseObj(name, nickname, desc, tf, color = null) {
    return {
        GUID: nextGUID(),
        Name: name,
        Transform: tf,
        Nickname: nickname,
        Description: desc,
        ColorDiffuse: color || { r: 1, g: 1, b: 1 },
        Locked: false,
        Grid: true,
        Snap: true,
        Autoraise: true,
        Sticky: true,
        Tooltip: true,
        GridProjection: false
    };
}

// ─── All ObjectStates ───────────────────────────────────────────────
const objects = [];

// ═══════════════════════════════════════════════════════════════════
// TABLE LAYOUT — everything within ±28 x, ±28 z (spread wide)
// All rotY = 0 for consistent text alignment
//
//  z = -28  ┌─────────────────────────────────────┐
//           │  P1(Red) area      P2(Blue) area     │
//  z = -20  │  [squad boards]    [squad boards]    │
//           │                                      │
//  z = -12  │  [resource bags across top]          │
//           │                                      │
//  z = -4   │  [decks/zones flanking center]       │
//  z =  0   │         *** BOARD CENTER ***         │
//  z =  4   │  [setup panel above center]          │
//           │                                      │
//  z = 12   │  [misc bags across bottom]           │
//           │                                      │
//  z = 20   │  [squad boards]    [squad boards]    │
//  z = 28   │  P3(Green) area    P4(Yellow) area   │
//           └─────────────────────────────────────┘
// ═══════════════════════════════════════════════════════════════════

// Player color definitions with MaterialIndex for PlayerPawn (0=White,1=Red,2=Orange,3=Yellow,4=Green,5=Blue,6=Purple,7=Pink,8=Black)
// and Chinese_Checkers_Piece MaterialIndex (0=White,1=Red,2=Yellow,3=Green,4=Blue,5=Pink,6=Black)
const playerColors = [
    { label: "Red",    color: { r: 0.86, g: 0.21, b: 0.21 }, materialIndex: 1, checkerIndex: 1 },
    { label: "Blue",   color: { r: 0.22, g: 0.38, b: 0.86 }, materialIndex: 5, checkerIndex: 4 },
    { label: "Green",  color: { r: 0.18, g: 0.72, b: 0.28 }, materialIndex: 4, checkerIndex: 3 },
    { label: "Yellow", color: { r: 0.9,  g: 0.82, b: 0.15 }, materialIndex: 3, checkerIndex: 2 },
];

// Player zone positions (spread wider: ~2x original)
const playerZones = [
    { name: "Player 1 (Red)",    x: -16, z: -25 },
    { name: "Player 2 (Blue)",   x:  16, z: -25 },
    { name: "Player 3 (Green)",  x: -16, z:  25 },
    { name: "Player 4 (Yellow)", x:  16, z:  25 },
];

// ─── 1. SETUP PANEL (scripted block, above board center) ───────────
const setupPanel = baseObj(
    "BlockSquare",
    "SETUP PANEL — Click Buttons",
    "Click buttons to generate the hex board.\nRandom = shuffled tiles.\nFixed = balanced playtesting layout.",
    transform(0, 1.05, -4, 0, { x: 5, y: 0.1, z: 2 }),
    { r: 0.15, g: 0.15, b: 0.2 }
);
setupPanel.LuaScript = luaScript;
setupPanel.LuaScriptState = "";
objects.push(setupPanel);

// ─── 2. BAC CARD DECK (100 cards) ──────────────────────────────────
function buildBACDeck() {
    const cards = [];
    const bacs = gameData.basic_armament_cards;
    const deckDef = {
        1: { FaceURL: BAC_FACE, BackURL: BAC_BACK, NumWidth: 1, NumHeight: 1, BackIsHidden: true, UniqueBack: false }
    };

    bacs.forEach((bac, typeIdx) => {
        for (let copy = 0; copy < bac.copies; copy++) {
            const costStr = typeof bac.cost === 'string' ? bac.cost :
                Object.entries(bac.cost).map(([k, v]) => `${v} ${k}`).join(', ');
            const desc = [
                `[${bac.category}] Slot: ${bac.slot}`,
                `Cost: ${costStr}`,
                `DP: ${bac.dp}`,
                '', bac.text,
                bac.special ? `Special: ${bac.special}` : ''
            ].join('\n').trim();

            const card = baseObj("Card", bac.abbr, desc, transform(0, 0.1 * (typeIdx * bac.copies + copy), 0));
            card.CardID = 100;
            card.CustomDeck = deckDef;
            card.HideWhenFaceDown = true;
            card.Hands = true;
            cards.push(card);
        }
    });

    const deck = baseObj("Deck", "BAC Deck",
        `Basic Armament Cards — ${gameData.deck_counts.total_BAC_cards} cards\nDraw 3 per player, then draft.\nHover cards to see stats.`,
        transform(18, 1.5, -6, 0), { r: 0.8, g: 0.6, b: 0.3 });
    deck.DeckIDs = cards.map(c => c.CardID);
    deck.CustomDeck = deckDef;
    deck.HideWhenFaceDown = true;
    deck.Hands = true;
    deck.ContainedObjects = cards;
    return deck;
}
objects.push(buildBACDeck());

// ─── 3. CONSPIRE CARD DECK (72 cards) ──────────────────────────────
function buildConspireDeck() {
    const cards = [];
    const conspires = gameData.conspire_cards;
    const deckDef = {
        2: { FaceURL: CONSPIRE_FACE, BackURL: CONSPIRE_BACK, NumWidth: 1, NumHeight: 1, BackIsHidden: true, UniqueBack: false }
    };

    conspires.forEach((card, typeIdx) => {
        for (let copy = 0; copy < card.copies; copy++) {
            const costStr = typeof card.cost === 'string' ? card.cost :
                Object.entries(card.cost).map(([k, v]) => `${v} ${k}`).join(', ');
            const desc = [
                `[${card.timing}]`, `Cost: ${costStr}`, '', card.text,
                card.condition ? `Condition: ${card.condition}` : ''
            ].join('\n').trim();

            const c = baseObj("Card", card.name, desc, transform(0, 0.1 * (typeIdx * card.copies + copy), 0));
            c.CardID = 200;
            c.CustomDeck = deckDef;
            c.HideWhenFaceDown = true;
            c.Hands = true;
            cards.push(c);
        }
    });

    const deck = baseObj("Deck", "Conspire Deck",
        `Conspire Cards — ${gameData.deck_counts.total_conspire_cards} cards\nForfeit Movement or Combat to draw 1.\nHover cards to see effects.`,
        transform(-18, 1.5, -6, 0), { r: 0.3, g: 0.2, b: 0.5 });
    deck.DeckIDs = cards.map(c => c.CardID);
    deck.CustomDeck = deckDef;
    deck.HideWhenFaceDown = true;
    deck.Hands = true;
    deck.ContainedObjects = cards;
    return deck;
}
objects.push(buildConspireDeck());

// ─── 4. DICE ───────────────────────────────────────────────────────
[
    { name: "Resource Die 1", color: { r: 1, g: 1, b: 1 }, x: -2 },
    { name: "Resource Die 2", color: { r: 1, g: 1, b: 1 }, x: 0 },
    { name: "Separatist Die", color: { r: 0.5, g: 0.5, b: 0.5 }, x: 2 },
].forEach(d => {
    objects.push(baseObj("Die_6", d.name,
        d.name.includes("Separatist") ? "Grey — triggers Separatist spawning" : "Resource production",
        transform(d.x, 2, -8), d.color));
});

// Combat dice — 7 per player color
playerColors.forEach((col, pi) => {
    for (let i = 0; i < 7; i++) {
        objects.push(baseObj("Die_6", `${col.label} D${i + 1}`,
            `Combat die for ${col.label} player`,
            transform(-14 + pi * 9, 2, 10 + i * 1.5), col.color));
    }
});

// ─── 5. RESOURCE TOKEN BAGS (infinite, row across top) ─────────────
const resourceDefs = [
    { name: "Oil",          color: { r: 0.15, g: 0.15, b: 0.15 } },
    { name: "Electricity",  color: { r: 0.95, g: 0.85, b: 0.1 } },
    { name: "Intelligence", color: { r: 0.2,  g: 0.4,  b: 0.9 } },
    { name: "Industry",     color: { r: 0.85, g: 0.15, b: 0.15 } },
    { name: "Local Favor",  color: { r: 0.15, g: 0.7,  b: 0.2 } },
];
resourceDefs.forEach((res, i) => {
    const token = baseObj("Checker_white", res.name, `${res.name} resource token`, transform(0, 0.5, 0), res.color);
    const bag = baseObj("Infinite_Bag", `${res.name} Tokens`,
        `Infinite bag of ${res.name} resource tokens.`,
        transform(-16 + i * 8, 2, -14), res.color);
    bag.ContainedObjects = [token];
    objects.push(bag);
});

// ─── 6. PLAYER AREAS (4 corners, spread wide) ─────────────────────
playerZones.forEach((p, idx) => {
    const zone = baseObj("HandTrigger", `${p.name} Hand`,
        `Hand zone for ${p.name}. Cards here are hidden.`,
        transform(p.x, 3, p.z, 0, { x: 12, y: 4, z: 5 }),
        playerColors[idx].color);
    objects.push(zone);
});

// ─── 7. SOLDIER BAGS (28 per player, PlayerPawn + MaterialIndex) ──
playerColors.forEach((sc, idx) => {
    const soldiers = [];
    for (let i = 0; i < 28; i++) {
        const soldier = baseObj("PlayerPawn", `${sc.label} Soldier`, `${sc.label} player soldier`,
            transform(0, 0.5 * i, 0, 0, { x: 0.5, y: 0.5, z: 0.5 }), sc.color);
        soldier.MaterialIndex = sc.materialIndex;
        soldiers.push(soldier);
    }
    const bag = baseObj("Bag", `${sc.label} Soldiers (28)`,
        `28 ${sc.label} soldiers. Start with 10 (2x5), max 28 (4x7).`,
        transform(playerZones[idx].x - 5, 2, playerZones[idx].z), sc.color);
    bag.ContainedObjects = soldiers;
    objects.push(bag);
});

// ─── 8. SEPARATIST SOLDIERS (24, rpg_GOBLIN) ──────────────────────
const sepSoldiers = [];
for (let i = 0; i < 24; i++) {
    const sep = baseObj("rpg_GOBLIN", "Separatist", "Grey Separatist soldier",
        transform(0, 0.5 * i, 0, 0, { x: 0.5, y: 0.5, z: 0.5 }), { r: 0.5, g: 0.5, b: 0.5 });
    sepSoldiers.push(sep);
}
const sepBag = baseObj("Bag", "Separatist Soldiers (24)",
    "24 grey Separatists. Spawn at bases. Also used as Militia.",
    transform(0, 2, 22), { r: 0.5, g: 0.5, b: 0.5 });
sepBag.ContainedObjects = sepSoldiers;
objects.push(sepBag);

// ─── 9. SQUAD BOARDS (4 per player, near their zone, bigger) ──────
const colorHexMap = { Red: "cc3333", Blue: "3355cc", Green: "33aa44", Yellow: "ccaa22" };
playerColors.forEach((sc, idx) => {
    for (let b = 0; b < 4; b++) {
        const zOff = playerZones[idx].z > 0 ? -4 : 4;
        const boardImg = `https://placehold.co/400x600/${colorHexMap[sc.label]}/ffffff.png?text=${encodeURIComponent(sc.label + ' Squad ' + (b + 1))}`;
        const board = baseObj("BlockRectangle", `${sc.label} Squad ${b + 1}`,
            `Squad Board — ${sc.label} Squad ${b + 1}\n7 slots | 5 equip each | 3 dmg cap`,
            transform(playerZones[idx].x - 7 + b * 5, 1.05, playerZones[idx].z + zOff, 0, { x: 2.5, y: 0.1, z: 3 }),
            sc.color);
        board.Locked = true;
        objects.push(board);
    }
});

// ─── 10. CONTROL MARKER BAGS (Chinese_Checkers_Piece + MaterialIndex) ─
playerColors.forEach((sc, idx) => {
    const markers = [];
    for (let i = 0; i < 25; i++) {
        const marker = baseObj("Chinese_Checkers_Piece", `${sc.label} Control`,
            `${sc.label} territory control marker`,
            transform(0, 0.3 * i, 0, 0, { x: 1.5, y: 1.5, z: 1.5 }), sc.color);
        marker.MaterialIndex = sc.checkerIndex;
        markers.push(marker);
    }
    const bag = baseObj("Bag", `${sc.label} Control (25)`, `25 control markers for ${sc.label}.`,
        transform(playerZones[idx].x + 5, 2, playerZones[idx].z), sc.color);
    bag.ContainedObjects = markers;
    objects.push(bag);
});

// ─── 11. DAMAGE TOKENS ────────────────────────────────────────────
const dmgToken = baseObj("Checker_white", "DMG", "Damage. 3 max, 4th = death.", transform(0, 0.5, 0), { r: 0.9, g: 0.1, b: 0.1 });
const dmgBag = baseObj("Infinite_Bag", "Damage Tokens", "Infinite damage tokens. 3 per soldier max.",
    transform(-10, 2, 22), { r: 0.9, g: 0.1, b: 0.1 });
dmgBag.ContainedObjects = [dmgToken];
objects.push(dmgBag);

// ─── 12. BUNKER TOKENS (Tileset_Barrel for thematic look) ─────────
const bunkerTokens = [];
for (let i = 0; i < 12; i++) {
    bunkerTokens.push(baseObj("Tileset_Barrel", "Bunker", "+1 defense, 1/hex max, destroyable.",
        transform(0, 0.5 * i, 0, 0, { x: 0.8, y: 0.8, z: 0.8 }), { r: 0.45, g: 0.38, b: 0.25 }));
}
const bunkerBag = baseObj("Bag", "Bunker Tokens (12)", "Neutral fortifications via D.U.D.S.",
    transform(-6, 2, 22), { r: 0.45, g: 0.38, b: 0.25 });
bunkerBag.ContainedObjects = bunkerTokens;
objects.push(bunkerBag);

// ─── 13. NUMBER TOKENS (16, kept as BlockSquare — spawned by Lua) ─
const numberPool = [1, 1, 2, 2, 3, 3, 3, 4, 4, 4, 5, 5, 5, 6, 6, 6];
const numTokens = [];
numberPool.forEach((num, i) => {
    numTokens.push(baseObj("BlockSquare", `#${num}`, `Number ${num} — produces on this roll`,
        transform(0, 0.4 * i, 0, 0, { x: 0.5, y: 0.15, z: 0.5 }), { r: 0.95, g: 0.92, b: 0.82 }));
});
const numBag = baseObj("Bag", "Number Tokens (16)", "For resource hexes. 2x1,2x2,3x3-6.",
    transform(6, 2, 22), { r: 0.95, g: 0.92, b: 0.82 });
numBag.ContainedObjects = numTokens;
objects.push(numBag);

// ─── 14. CARGO CONTAINERS (6, Tileset_Chest for container look) ──
for (let i = 1; i <= 6; i++) {
    objects.push(baseObj("Tileset_Chest", `Container #${i}`,
        `Spaceport ${i} cargo container.`,
        transform(18 + (i - 1) * 3, 1.2, 4, 0, { x: 1, y: 1, z: 1 }),
        { r: 0.35, g: 0.5, b: 0.35 }));
}

// ─── 15. ZONE LABELS (bigger BlockRectangle) ──────────────────────
const uzLabel = baseObj("BlockRectangle", "UNLOADING ZONE",
    "BAC cards land here on doubles. 6 slots for Spaceports 1-6.",
    transform(24, 1.02, 2, 0, { x: 8, y: 0.05, z: 1.5 }), { r: 0.2, g: 0.3, b: 0.2 });
uzLabel.Locked = true;
objects.push(uzLabel);

const pbaLabel = baseObj("BlockRectangle", "PLANET BOUND AREA",
    "Face-up BAC display. Refill from Spaceport Deck.",
    transform(18, 1.02, 7, 0, { x: 6, y: 0.05, z: 1.5 }), { r: 0.2, g: 0.15, b: 0.1 });
pbaLabel.Locked = true;
objects.push(pbaLabel);

const eqDisplay = baseObj("BlockRectangle", "EQUIPMENT DISPLAY",
    "First-time equip: place BAC face-up + your flag. Flags permanent.",
    transform(18, 1.02, -2, 0, { x: 6, y: 0.05, z: 2 }), { r: 0.15, g: 0.12, b: 0.08 });
eqDisplay.Locked = true;
objects.push(eqDisplay);

// ─── 16. TURN TRACKER & QUICK REFERENCE ───────────────────────────
const turnTracker = baseObj("Notecard", "Turn & DP Tracker", [
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
].join('\n'), transform(-24, 2, -6, 0, { x: 2.5, y: 1, z: 2.5 }), { r: 0.95, g: 0.9, b: 0.75 });
objects.push(turnTracker);

const quickRef = baseObj("Notecard", "Quick Reference", [
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
].join('\n'), transform(-24, 2, 2, 0, { x: 2.5, y: 1, z: 2.5 }), { r: 0.85, g: 0.9, b: 0.95 });
objects.push(quickRef);

// ─── 17. PLAYER FLAG BAGS (Chinese_Checkers_Piece + MaterialIndex) ─
playerColors.forEach((sc, idx) => {
    const flags = [];
    for (let i = 0; i < 25; i++) {
        const flag = baseObj("Chinese_Checkers_Piece", `${sc.label} Flag`,
            `${sc.label} flag — Equipment Display. Permanent.`,
            transform(0, 0.3 * i, 0, 0, { x: 0.5, y: 0.5, z: 0.5 }), sc.color);
        flag.MaterialIndex = sc.checkerIndex;
        flags.push(flag);
    }
    const bag = baseObj("Bag", `${sc.label} Flags (25)`, `Flags for Equipment Display.`,
        transform(playerZones[idx].x, 2, playerZones[idx].z), sc.color);
    bag.ContainedObjects = flags;
    objects.push(bag);
});

// ─── BUILD SAVE FILE ──────────────────────────────────────────────
const saveFile = {
    SaveName: "W.A.R H.A.M.S",
    Date: new Date().toISOString().split('T')[0],
    VersionNumber: "v13.3.0",
    GameMode: "",
    GameType: "",
    GameComplexity: "",
    Tags: ["Strategy", "Sci-Fi", "Wargame", "Hex Grid", "Custom"],
    Gravity: 0.5,
    PlayArea: 500.0,
    Table: "Table_RPG",
    Sky: "Sky_Museum",
    Note: [
        "W.A.R H.A.M.S: The Battle for Planet X",
        "========================================",
        "",
        "2-4 Players | Sci-Fi Corporate Military Conquest",
        "",
        "SETUP:",
        "1. Click 'Random Board' or 'Fixed Board' on the Setup Panel",
        "2. Each player takes a soldier bag, flag bag, control markers, and 2 squad boards",
        "3. Place 10 soldiers (2 squads of 5) on starting hexes",
        "4. Deal 3 BAC cards each, then draft (pick 1, pass 2 left, etc.)",
        "5. Shuffle the Conspire Deck",
        "",
        "VICTORY CONDITIONS:",
        "- Spaceport Domination: 5/6 spaceports (2p) or 4/6 (3-4p)",
        "- Military Supremacy: Hold 28 soldiers for 1 full round",
        "- Dominance: 50 DP from equipped BAC cards",
        "",
        "See design/WARHAMS-Rulebook.pdf for complete rules."
    ].join('\n'),
    Rules: "",
    PlayerTurn: "",
    DrawImage: "",
    Grid: { Type: 0, Lines: false, Snapping: false, Offset: false, BothSnapping: false, xSize: 2.0, ySize: 2.0 },
    TabStates: {},
    LuaScript: "",
    LuaScriptState: "",
    XmlUI: "",
    ObjectStates: objects,
    SnapPoints: [],
    DecalPallet: [],
    Turns: {
        Enable: false, Type: 0, TurnOrder: [],
        Reverse: false, SkipEmpty: false,
        DisableInteractions: false, PassTurns: true
    }
};

// Write output
const outPath = path.join(__dirname, 'WARHAMS_TTS.json');
fs.writeFileSync(outPath, JSON.stringify(saveFile, null, 2));

const objCount = objects.length;
let containedCount = 0;
objects.forEach(o => {
    if (o.ContainedObjects) containedCount += o.ContainedObjects.length;
});
console.log(`Generated ${outPath}`);
console.log(`Top-level objects: ${objCount}`);
console.log(`Contained objects: ${containedCount}`);
console.log(`Total objects: ${objCount + containedCount}`);
