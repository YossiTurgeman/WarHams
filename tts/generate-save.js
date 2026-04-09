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
 *   - Proportional notecard/squad board scales
 *
 * Usage: node generate-save.js
 */

const fs = require('fs');
const path = require('path');

const gameData = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'design', 'game-data.json'), 'utf8'));
const luaScript = fs.readFileSync(path.join(__dirname, 'scripts', 'setup.lua'), 'utf8');

// Card images (hosted on GitHub for TTS compatibility)
const CARD_BASE = "https://raw.githubusercontent.com/YossiTurgeman/WarHams/main/tts/cards";
const BAC_FACE = `${CARD_BASE}/bac_face.png`;
const BAC_BACK = `${CARD_BASE}/bac_back.png`;
const CONSPIRE_FACE = `${CARD_BASE}/conspire_face.png`;
const CONSPIRE_BACK = `${CARD_BASE}/conspire_back.png`;

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

// ═════════════════════════════════════════════════════════════════════
//  TABLE LAYOUT — Table_RPG usable area: X ≈ ±27, Z ≈ ±19
//  (verified from working saves — objects beyond this fall off)
//
//  z ≈ -16: P1(Red) & P2(Blue) squad boards (2 each, compact)
//  z ≈ -13: P1/P2 bags + combat dice
//  z ≈  -9: Resource token bags
//  z ≈  -6: Decks + notecards
//  z ≈  -3: Setup panel + resource dice
//  z =   0: *** BOARD CENTER *** (hexes spawn here via Lua)
//  z ≈   5: Zone labels + cargo containers
//  z ≈   9: Misc bags (damage, bunker, number, separatist)
//  z ≈  13: P3/P4 bags + combat dice
//  z ≈  16: P3(Green) & P4(Yellow) squad boards (2 each, compact)
// ═════════════════════════════════════════════════════════════════════

const playerColors = [
    { label: "Red",    color: { r: 0.86, g: 0.21, b: 0.21 }, fog: "Red" },
    { label: "Blue",   color: { r: 0.22, g: 0.38, b: 0.86 }, fog: "Blue" },
    { label: "Green",  color: { r: 0.18, g: 0.72, b: 0.28 }, fog: "Green" },
    { label: "Yellow", color: { r: 0.9,  g: 0.82, b: 0.15 }, fog: "Yellow" },
];

// ─── 1. SETUP PANEL ──────────────────────────────────────────────────
const setupPanel = baseObj("BlockSquare", "SETUP PANEL", 
    "Click a button to generate the hex board.\nRandom = shuffled tiles.\nFixed = balanced playtesting layout.",
    0, 1.05, -3, { scaleX: 4, scaleY: 0.2, scaleZ: 2, rotY: 0, color: { r: 0.15, g: 0.15, b: 0.2 }, locked: true });
setupPanel.LuaScript = luaScript;
objects.push(setupPanel);

// ─── 2. BAC DECK (100 cards) ─────────────────────────────────────────
function buildBACDeck() {
    const deckDef = { "1": { FaceURL: BAC_FACE, BackURL: BAC_BACK, NumWidth: 1, NumHeight: 1, BackIsHidden: true, UniqueBack: false, Type: 0 } };
    const cards = [];
    gameData.basic_armament_cards.forEach(bac => {
        for (let c = 0; c < bac.copies; c++) {
            const costStr = typeof bac.cost === 'string' ? bac.cost : Object.entries(bac.cost).map(([k,v]) => `${v} ${k}`).join(', ');
            const desc = `[${bac.category}] Slot: ${bac.slot}\nCost: ${costStr}\nDP: ${bac.dp}\n\n${bac.text}${bac.special ? '\nSpecial: ' + bac.special : ''}`;
            const card = baseObj("Card", bac.abbr, desc, 0, 0.1 * cards.length, 0);
            card.CardID = 100;
            card.CustomDeck = deckDef;
            card.SidewaysCard = false;
            card.HideWhenFaceDown = true;
            card.Hands = true;
            cards.push(card);
        }
    });
    const deck = baseObj("Deck", "BAC Deck",
        `Basic Armament Cards — ${gameData.deck_counts.total_BAC_cards} cards\nDraw 3 per player, then draft.\nHover cards to see stats.`,
        10, 1.5, -6, { color: { r: 0.8, g: 0.6, b: 0.3 } });
    deck.DeckIDs = cards.map(c => c.CardID);
    deck.CustomDeck = deckDef;
    deck.HideWhenFaceDown = true;
    deck.Hands = true;
    deck.SidewaysCard = false;
    deck.ContainedObjects = cards;
    return deck;
}
objects.push(buildBACDeck());

// ─── 3. CONSPIRE DECK (72 cards) ────────────────────────────────────
function buildConspireDeck() {
    const deckDef = { "2": { FaceURL: CONSPIRE_FACE, BackURL: CONSPIRE_BACK, NumWidth: 1, NumHeight: 1, BackIsHidden: true, UniqueBack: false, Type: 0 } };
    const cards = [];
    gameData.conspire_cards.forEach(cc => {
        for (let c = 0; c < cc.copies; c++) {
            const costStr = typeof cc.cost === 'string' ? cc.cost : Object.entries(cc.cost).map(([k,v]) => `${v} ${k}`).join(', ');
            const desc = `[${cc.timing}]\nCost: ${costStr}\n\n${cc.text}${cc.condition ? '\nCondition: ' + cc.condition : ''}`;
            const card = baseObj("Card", cc.name, desc, 0, 0.1 * cards.length, 0);
            card.CardID = 200;
            card.CustomDeck = deckDef;
            card.SidewaysCard = false;
            card.HideWhenFaceDown = true;
            card.Hands = true;
            cards.push(card);
        }
    });
    const deck = baseObj("Deck", "Conspire Deck",
        `Conspire Cards — ${gameData.deck_counts.total_conspire_cards} cards\nForfeit Movement or Combat to draw 1.\nHover cards to see effects.`,
        -10, 1.5, -6, { color: { r: 0.3, g: 0.2, b: 0.5 } });
    deck.DeckIDs = cards.map(c => c.CardID);
    deck.CustomDeck = deckDef;
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

// ─── 5. COMBAT DICE (7 per player, near their area) ─────────────────
const diceZones = [
    { xStart: -22, z: -13 },  // Red
    { xStart:  14, z: -13 },  // Blue
    { xStart: -22, z:  13 },  // Green
    { xStart:  14, z:  13 },  // Yellow
];
playerColors.forEach((pc, idx) => {
    for (let i = 0; i < 7; i++) {
        objects.push(baseObj("Die_6", `${pc.label} D${i+1}`, `Combat die for ${pc.label}`,
            diceZones[idx].xStart + i * 1.2, 2, diceZones[idx].z, { color: pc.color }));
    }
});

// ─── 6. RESOURCE TOKEN BAGS ─────────────────────────────────────────
const resourceDefs = [
    { name: "Oil",          color: { r: 0.15, g: 0.15, b: 0.15 } },
    { name: "Electricity",  color: { r: 0.95, g: 0.85, b: 0.1 } },
    { name: "Intelligence", color: { r: 0.2,  g: 0.4,  b: 0.9 } },
    { name: "Industry",     color: { r: 0.85, g: 0.15, b: 0.15 } },
    { name: "Local Favor",  color: { r: 0.15, g: 0.7,  b: 0.2 } },
];
resourceDefs.forEach((res, i) => {
    const token = baseObj("Checker_white", res.name, `${res.name} resource token`, 0, 0.5, 0, { color: res.color });
    const bag = baseObj("Infinite_Bag", `${res.name} Tokens`, `Infinite bag of ${res.name} tokens.`,
        -12 + i * 6, 1.5, -9, { color: res.color });
    bag.ContainedObjects = [token];
    objects.push(bag);
});

// ─── 7. HAND TRIGGERS (from working saves: Y=4.84, scale 12/9.17/5) ─
const handPositions = [
    { x: -15, z: -17, rotY: 0 },     // Red
    { x:  15, z: -17, rotY: 0 },     // Blue
    { x: -15, z:  17, rotY: 180 },   // Green
    { x:  15, z:  17, rotY: 180 },   // Yellow
];
handPositions.forEach((hp, idx) => {
    const ht = baseObj("HandTrigger", `${playerColors[idx].label} Hand`, "",
        hp.x, 4.84, hp.z, {
            rotY: hp.rotY, scaleX: 12, scaleY: 9.17, scaleZ: 5,
            color: { ...playerColors[idx].color, a: 0 }, locked: true, grid: false
        });
    ht.FogColor = playerColors[idx].fog;
    objects.push(ht);
});

// ─── 8. SOLDIER BAGS (28 PlayerPawn per player) ─────────────────────
const soldierBagPos = [
    { x: -10, z: -13 }, { x: 10, z: -13 },
    { x: -10, z:  13 }, { x: 10, z:  13 },
];
const materialIndices = [1, 5, 4, 3]; // Red, Blue, Green, Yellow
playerColors.forEach((pc, idx) => {
    const soldiers = [];
    for (let i = 0; i < 28; i++) {
        const soldier = baseObj("PlayerPawn", `${pc.label} Soldier`, `${pc.label} player soldier`,
            0, 0.5 * i, 0, { color: pc.color });
        soldier.MaterialIndex = materialIndices[idx];
        soldiers.push(soldier);
    }
    const bag = baseObj("Bag", `${pc.label} Soldiers (28)`,
        `28 ${pc.label} soldiers. Start with 10 (2×5), max 28 (4×7).`,
        soldierBagPos[idx].x, 1.5, soldierBagPos[idx].z, { color: pc.color });
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

// ─── 10. SQUAD BOARDS (2 per player to start, BlockRectangle, locked)
//     Smaller scale so they fit on table. 2 boards each, extras in bags.
const boardLayout = [
    // Red (P1): left side top
    { xs: [-22, -15], z: -16 },
    // Blue (P2): right side top
    { xs: [15, 22], z: -16 },
    // Green (P3): left side bottom
    { xs: [-22, -15], z: 16 },
    // Yellow (P4): right side bottom
    { xs: [15, 22], z: 16 },
];
playerColors.forEach((pc, idx) => {
    // 2 boards placed on table
    boardLayout[idx].xs.forEach((x, b) => {
        const board = baseObj("BlockRectangle", `${pc.label} Squad ${b+1}`,
            `Squad Board — ${pc.label} Squad ${b+1}\n7 slots | 5 equip each | 3 dmg cap`,
            x, 1.05, boardLayout[idx].z, { scaleX: 2.5, scaleY: 0.1, scaleZ: 3, color: pc.color, locked: true });
        objects.push(board);
    });
    // 2 extra boards in a bag
    const extras = [];
    for (let b = 2; b < 4; b++) {
        extras.push(baseObj("BlockRectangle", `${pc.label} Squad ${b+1}`,
            `Squad Board — ${pc.label} Squad ${b+1}\n7 slots | 5 equip each | 3 dmg cap`,
            0, 0.2 * (b-2), 0, { scaleX: 2.5, scaleY: 0.1, scaleZ: 3, color: pc.color }));
    }
    const extraBag = baseObj("Bag", `${pc.label} Extra Boards`, `Extra squad boards for ${pc.label}.`,
        boardLayout[idx].xs[0] + 3.5, 1.5, boardLayout[idx].z, { color: pc.color });
    extraBag.ContainedObjects = extras;
    objects.push(extraBag);
});

// ─── 11. CONTROL MARKER BAGS (25 per player) ────────────────────────
const controlBagPos = [
    { x: -7, z: -13 }, { x: 7, z: -13 },
    { x: -7, z:  13 }, { x: 7, z:  13 },
];
playerColors.forEach((pc, idx) => {
    const markers = [];
    for (let i = 0; i < 25; i++) {
        markers.push(baseObj("Chinese_Checkers_Piece", `${pc.label} Control`, `${pc.label} control marker`,
            0, 0.3 * i, 0, { color: pc.color }));
    }
    const bag = baseObj("Bag", `${pc.label} Control (25)`, `25 control markers for ${pc.label}.`,
        controlBagPos[idx].x, 1.5, controlBagPos[idx].z, { color: pc.color });
    bag.ContainedObjects = markers;
    objects.push(bag);
});

// ─── 12. FLAG BAGS (25 per player) ──────────────────────────────────
const flagBagPos = [
    { x: -4, z: -13 }, { x: 4, z: -13 },
    { x: -4, z:  13 }, { x: 4, z:  13 },
];
playerColors.forEach((pc, idx) => {
    const flags = [];
    for (let i = 0; i < 25; i++) {
        flags.push(baseObj("Chinese_Checkers_Piece", `${pc.label} Flag`, `${pc.label} flag — Equipment Display. Permanent.`,
            0, 0.3 * i, 0, { scaleX: 0.7, scaleY: 0.7, scaleZ: 0.7, color: pc.color }));
    }
    const bag = baseObj("Bag", `${pc.label} Flags (25)`, "Flags for Equipment Display.",
        flagBagPos[idx].x, 1.5, flagBagPos[idx].z, { color: pc.color });
    bag.ContainedObjects = flags;
    objects.push(bag);
});

// ─── 13. DAMAGE TOKENS (infinite bag) ───────────────────────────────
const dmgToken = baseObj("Checker_white", "DMG", "Damage. 3 max, 4th = death.", 0, 0.5, 0, { color: { r: 0.9, g: 0.1, b: 0.1 } });
const dmgBag = baseObj("Infinite_Bag", "Damage Tokens", "Infinite damage tokens. 3 per soldier max.",
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
    Table: "Table_RPG",
    Sky: "Sky_Museum",
    Note: [
        "W.A.R H.A.M.S: The Battle for Planet X",
        "========================================",
        "", "2-4 Players | Sci-Fi Corporate Military Conquest",
        "", "SETUP:",
        "1. Click 'Random Board' or 'Fixed Board' on the Setup Panel",
        "2. Each player takes a soldier bag, flag bag, control markers, and 2 squad boards",
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
