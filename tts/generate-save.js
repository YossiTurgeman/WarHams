#!/usr/bin/env node
/**
 * W.A.R H.A.M.S — TTS Save File Generator
 * Generates WARHAMS_TTS.json from game-data.json and setup.lua
 *
 * Uses ONLY built-in TTS object types that require no external image URLs.
 * Custom art can be added later by swapping objects in TTS editor.
 *
 * Usage: node generate-save.js
 */

const fs = require('fs');
const path = require('path');

const gameData = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'design', 'game-data.json'), 'utf8'));
const luaScript = fs.readFileSync(path.join(__dirname, 'scripts', 'setup.lua'), 'utf8');

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

// Base object template
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
        GridProjection: false,
        HideWhenFaceDown: false,
        Hands: false
    };
}

// ─── All ObjectStates ───────────────────────────────────────────────
const objects = [];

// ─── 1. SETUP PANEL (scripted block with board setup buttons) ──────
const setupPanel = baseObj(
    "BlockSquare",
    "SETUP PANEL — Click Buttons",
    "Click buttons to generate the hex board.\nRandom = shuffled tiles.\nFixed = balanced playtesting layout.",
    transform(0, 1.05, 0, 0, { x: 4, y: 0.1, z: 2 }),
    { r: 0.15, g: 0.15, b: 0.2 }
);
setupPanel.LuaScript = luaScript;
setupPanel.LuaScriptState = "";
objects.push(setupPanel);

// ─── 2. BAC CARD DECK (100 cards) ──────────────────────────────────
// Use a single shared deck image (1x1 grid placeholder).
// TTS requires a valid-looking URL format for CustomDeck — use a known
// public 1x1 white card placeholder hosted on imgur.
const BAC_FACE = "https://i.imgur.com/wUFnJCH.png";   // simple white square
const BAC_BACK = "https://i.imgur.com/wUFnJCH.png";
const CONSPIRE_FACE = "https://i.imgur.com/wUFnJCH.png";
const CONSPIRE_BACK = "https://i.imgur.com/wUFnJCH.png";

function buildBACDeck() {
    const cards = [];
    const bacs = gameData.basic_armament_cards;

    // Use a single CustomDeck entry for the whole deck (1x1 grid = 1 card face)
    const deckDef = {
        1: {
            FaceURL: BAC_FACE,
            BackURL: BAC_BACK,
            NumWidth: 1,
            NumHeight: 1,
            BackIsHidden: true,
            UniqueBack: false
        }
    };

    bacs.forEach((bac, typeIdx) => {
        for (let copy = 0; copy < bac.copies; copy++) {
            const costStr = typeof bac.cost === 'string' ? bac.cost :
                Object.entries(bac.cost).map(([k, v]) => `${v} ${k}`).join(', ');
            const desc = [
                `[${bac.category}] Slot: ${bac.slot}`,
                `Cost: ${costStr}`,
                `DP: ${bac.dp}`,
                '',
                bac.text,
                bac.special ? `Special: ${bac.special}` : ''
            ].join('\n').trim();

            const card = baseObj(
                "Card",
                bac.abbr,
                desc,
                transform(0, 0.1 * (typeIdx * bac.copies + copy), 0)
            );
            card.CardID = 100; // all use deck 1, card index 0
            card.CustomDeck = deckDef;
            cards.push(card);
        }
    });

    const deck = baseObj(
        "Deck",
        "BAC Deck",
        `Basic Armament Cards — ${gameData.deck_counts.total_BAC_cards} cards (${gameData.deck_counts.BAC_unique_types} types x ${gameData.deck_counts.BAC_copies_each} copies)\n\nDraw 3 per player during setup, then draft.\nHover over cards to see stats.`,
        transform(18, 1.5, 0, 180),
        { r: 0.8, g: 0.6, b: 0.3 }
    );
    deck.DeckIDs = cards.map(c => c.CardID);
    deck.CustomDeck = deckDef;
    deck.ContainedObjects = cards;
    return deck;
}
objects.push(buildBACDeck());

// ─── 3. CONSPIRE CARD DECK (72 cards) ──────────────────────────────
function buildConspireDeck() {
    const cards = [];
    const conspires = gameData.conspire_cards;

    const deckDef = {
        2: {
            FaceURL: CONSPIRE_FACE,
            BackURL: CONSPIRE_BACK,
            NumWidth: 1,
            NumHeight: 1,
            BackIsHidden: true,
            UniqueBack: false
        }
    };

    conspires.forEach((card, typeIdx) => {
        for (let copy = 0; copy < card.copies; copy++) {
            const costStr = typeof card.cost === 'string' ? card.cost :
                Object.entries(card.cost).map(([k, v]) => `${v} ${k}`).join(', ');
            const desc = [
                `[${card.timing}]`,
                `Cost: ${costStr}`,
                '',
                card.text,
                card.condition ? `Condition: ${card.condition}` : ''
            ].join('\n').trim();

            const c = baseObj(
                "Card",
                card.name,
                desc,
                transform(0, 0.1 * (typeIdx * card.copies + copy), 0)
            );
            c.CardID = 200; // deck 2, card index 0
            c.CustomDeck = deckDef;
            cards.push(c);
        }
    });

    const deck = baseObj(
        "Deck",
        "Conspire Deck",
        `Conspire Cards — ${gameData.deck_counts.total_conspire_cards} cards (${gameData.deck_counts.conspire_unique_types} types x ${gameData.deck_counts.conspire_copies_each} copies)\n\nForfeit Movement or Combat to draw 1.\nHover over cards to see effects.`,
        transform(-18, 1.5, 0, 180),
        { r: 0.3, g: 0.2, b: 0.5 }
    );
    deck.DeckIDs = cards.map(c => c.CardID);
    deck.CustomDeck = deckDef;
    deck.ContainedObjects = cards;
    return deck;
}
objects.push(buildConspireDeck());

// ─── 4. DICE ───────────────────────────────────────────────────────
// Resource dice (2 white + 1 grey separatist die)
const resourceDice = [
    { name: "Resource Die 1", color: { r: 1, g: 1, b: 1 }, x: 8, z: 12 },
    { name: "Resource Die 2", color: { r: 1, g: 1, b: 1 }, x: 9.5, z: 12 },
    { name: "Separatist Die (Grey)", color: { r: 0.5, g: 0.5, b: 0.5 }, x: 11, z: 12 },
];
resourceDice.forEach(d => {
    objects.push(baseObj("Die_6", d.name,
        d.name.includes("Separatist") ?
            "Grey die — triggers Separatist spawning at matching base numbers" :
            "White die — resource production",
        transform(d.x, 2, d.z), d.color));
});

// Combat dice — 7 per player color for max engagement (28 total)
const playerColors = [
    { label: "Red", color: { r: 0.86, g: 0.21, b: 0.21 } },
    { label: "Blue", color: { r: 0.22, g: 0.38, b: 0.86 } },
    { label: "Green", color: { r: 0.18, g: 0.72, b: 0.28 } },
    { label: "Yellow", color: { r: 0.9, g: 0.82, b: 0.15 } },
];
playerColors.forEach((col, pi) => {
    for (let i = 0; i < 7; i++) {
        objects.push(baseObj("Die_6",
            `${col.label} D${i + 1}`,
            `Combat die for ${col.label} player`,
            transform(-12 + pi * 5, 2, 14 + i * 1.2),
            col.color));
    }
});

// ─── 5. RESOURCE TOKEN BAGS (infinite) ─────────────────────────────
// Use built-in checker pieces as tokens (no image URL needed)
const resourceDefs = [
    { name: "Oil",          color: { r: 0.15, g: 0.15, b: 0.15 }, x: -12 },
    { name: "Electricity",  color: { r: 0.95, g: 0.85, b: 0.1 },  x: -6 },
    { name: "Intelligence", color: { r: 0.2,  g: 0.4,  b: 0.9 },  x: 0 },
    { name: "Industry",     color: { r: 0.85, g: 0.15, b: 0.15 }, x: 6 },
    { name: "Local Favor",  color: { r: 0.15, g: 0.7,  b: 0.2 },  x: 12 },
];
resourceDefs.forEach(res => {
    const token = baseObj(
        "Checker_white",
        `${res.name}`,
        `${res.name} resource token`,
        transform(0, 0.5, 0),
        res.color
    );

    const bag = baseObj(
        "Infinite_Bag",
        `${res.name} Tokens`,
        `Infinite bag of ${res.name} resource tokens.\nTake as needed during resource gathering.`,
        transform(res.x, 2, -18),
        res.color
    );
    bag.ContainedObjects = [token];
    objects.push(bag);
});

// ─── 6. PLAYER HAND ZONES (4 corners) ─────────────────────────────
const playerZones = [
    { name: "Player 1 (Red)",    ttsColor: "Red",    x: -28, z: -28 },
    { name: "Player 2 (Blue)",   ttsColor: "Blue",   x: 28,  z: -28 },
    { name: "Player 3 (Green)",  ttsColor: "Green",  x: -28, z: 28 },
    { name: "Player 4 (Yellow)", ttsColor: "Yellow",  x: 28,  z: 28 },
];
playerZones.forEach((p, idx) => {
    const zone = baseObj(
        "HandTrigger",
        `${p.name} Hand Zone`,
        `Hand zone for ${p.name}.\nCards placed here are hidden from other players.`,
        transform(p.x, 3, p.z, 0, { x: 12, y: 5, z: 6 }),
        playerColors[idx].color
    );
    objects.push(zone);
});

// ─── 7. SOLDIER BAGS (28 per player, using pawns) ─────────────────
playerColors.forEach((sc, idx) => {
    const soldiers = [];
    for (let i = 0; i < 28; i++) {
        soldiers.push(baseObj(
            "PlayerPawn",
            `${sc.label} Soldier`,
            `${sc.label} player soldier`,
            transform(0, 0.5 * i, 0, 0, { x: 0.5, y: 0.5, z: 0.5 }),
            sc.color
        ));
    }
    const bag = baseObj(
        "Bag",
        `${sc.label} Soldiers (28)`,
        `28 ${sc.label} soldier miniatures.\nStart with 10 (2 squads x 5).\nGrow to max 28 (4 squads x 7).`,
        transform(playerZones[idx].x + 6, 2, playerZones[idx].z),
        sc.color
    );
    bag.ContainedObjects = soldiers;
    objects.push(bag);
});

// ─── 8. SEPARATIST SOLDIERS (24 grey pawns) ────────────────────────
const sepSoldiers = [];
for (let i = 0; i < 24; i++) {
    sepSoldiers.push(baseObj(
        "PlayerPawn",
        "Separatist",
        "Grey Separatist soldier",
        transform(0, 0.5 * i, 0, 0, { x: 0.5, y: 0.5, z: 0.5 }),
        { r: 0.5, g: 0.5, b: 0.5 }
    ));
}
const sepBag = baseObj(
    "Bag",
    "Separatist Soldiers (24)",
    "24 grey Separatist miniatures.\nSpawn at bases when Separatist Die matches.\nAlso used as Militia substitutes.",
    transform(0, 2, 22),
    { r: 0.5, g: 0.5, b: 0.5 }
);
sepBag.ContainedObjects = sepSoldiers;
objects.push(sepBag);

// ─── 9. SQUAD BOARDS (16 total — BlockRectangle per player) ───────
playerColors.forEach((sc, idx) => {
    for (let b = 0; b < 4; b++) {
        const board = baseObj(
            "BlockRectangle",
            `${sc.label} Squad ${b + 1}`,
            `Squad Board — ${sc.label} Player, Squad ${b + 1}\n7 soldier slots | 5 equipment slots each | 3 damage cap`,
            transform(
                playerZones[idx].x - 6 + b * 4.5,
                1.05,
                playerZones[idx].z - (playerZones[idx].z > 0 ? -4 : 4),
                0,
                { x: 2, y: 0.1, z: 3 }
            ),
            sc.color
        );
        board.Locked = true;
        objects.push(board);
    }
});

// ─── 10. CONTROL HEX FRAME BAGS (checker pieces) ─────────────────
playerColors.forEach((sc, idx) => {
    const frames = [];
    for (let i = 0; i < 25; i++) {
        frames.push(baseObj(
            "Checker_white",
            `${sc.label} Control`,
            `Place on hex to mark ${sc.label} player territory control`,
            transform(0, 0.3 * i, 0),
            sc.color
        ));
    }
    const bag = baseObj(
        "Bag",
        `${sc.label} Control Markers (25)`,
        `25 control markers for ${sc.label} player.\nPlace on hexes you control.`,
        transform(playerZones[idx].x - 6, 2, playerZones[idx].z + (playerZones[idx].z > 0 ? 4 : -4)),
        sc.color
    );
    bag.ContainedObjects = frames;
    objects.push(bag);
});

// ─── 11. DAMAGE TOKENS (infinite bag of red checkers) ──────────────
const dmgToken = baseObj(
    "Checker_white",
    "DMG",
    "Damage token. 3 damage = death on 4th hit.",
    transform(0, 0.5, 0),
    { r: 0.9, g: 0.1, b: 0.1 }
);
const dmgBag = baseObj(
    "Infinite_Bag",
    "Damage Tokens",
    "Infinite bag of damage tokens.\n3 per soldier max, 4th hit = death.",
    transform(-15, 2, 22),
    { r: 0.9, g: 0.1, b: 0.1 }
);
dmgBag.ContainedObjects = [dmgToken];
objects.push(dmgBag);

// ─── 12. BUNKER TOKENS (BlockSquare pieces) ───────────────────────
const bunkerTokens = [];
for (let i = 0; i < 12; i++) {
    bunkerTokens.push(baseObj(
        "BlockSquare",
        "Bunker",
        "+1 defense for any unit on this hex.\n1 per hex max. Destroyed by attacker winning combat.",
        transform(0, 0.5 * i, 0, 0, { x: 0.8, y: 0.3, z: 0.8 }),
        { r: 0.45, g: 0.38, b: 0.25 }
    ));
}
const bunkerBag = baseObj(
    "Bag",
    "Bunker Tokens (12)",
    "Neutral fortifications.\n+1 defense for any unit on hex.\n1 per hex max. Deployed via D.U.D.S module.",
    transform(-10, 2, 22),
    { r: 0.45, g: 0.38, b: 0.25 }
);
bunkerBag.ContainedObjects = bunkerTokens;
objects.push(bunkerBag);

// ─── 13. NUMBER TOKENS (16 — using dice as visual markers) ────────
// Use small BlockSquare pieces with number in nickname
const numberPool = [1, 1, 2, 2, 3, 3, 3, 4, 4, 4, 5, 5, 5, 6, 6, 6];
const numTokens = [];
numberPool.forEach((num, i) => {
    numTokens.push(baseObj(
        "BlockSquare",
        `#${num}`,
        `Number ${num} — resource hex produces when this is rolled`,
        transform(0, 0.4 * i, 0, 0, { x: 0.5, y: 0.15, z: 0.5 }),
        { r: 0.95, g: 0.92, b: 0.82 }
    ));
});
const numBag = baseObj(
    "Bag",
    "Number Tokens (16)",
    "16 number tokens for resource hexes.\n2x1, 2x2, 3x3, 3x4, 3x5, 3x6.\nPlace on 15 resource tiles (one gets 2).\nSeparatist Bases and Spaceports have PRINTED numbers.",
    transform(5, 2, 22),
    { r: 0.95, g: 0.92, b: 0.82 }
);
numBag.ContainedObjects = numTokens;
objects.push(numBag);

// ─── 14. CARGO CONTAINERS (6 — small rectangles) ─────────────────
for (let i = 1; i <= 6; i++) {
    const container = baseObj(
        "BlockRectangle",
        `Container #${i}`,
        `Spaceport ${i} cargo container.\nPlace on spaceport hex when BAC lands.\nCollect BACs from Unloading Zone when squad arrives.`,
        transform(22 + (i - 1) * 2.5, 1.2, 5, 0, { x: 1, y: 0.3, z: 0.6 }),
        { r: 0.35, g: 0.5, b: 0.35 }
    );
    objects.push(container);
}

// ─── 15. ZONE LABELS (BlockRectangle as labeled areas) ────────────
// Unloading Zone
const uzLabel = baseObj(
    "BlockRectangle",
    "UNLOADING ZONE",
    "BAC cards land here on doubles.\n6 slots matching Spaceport numbers 1-6.\nPlace cargo container on spaceport when BAC arrives.\nCollect: squad on spaceport takes all BACs from slot, remove container.",
    transform(25, 1.02, 3, 0, { x: 8, y: 0.05, z: 2 }),
    { r: 0.2, g: 0.3, b: 0.2 }
);
uzLabel.Locked = true;
objects.push(uzLabel);

// Planet Bound Area
const pbaLabel = baseObj(
    "BlockRectangle",
    "PLANET BOUND AREA",
    "Face-up BAC display area.\nDuring setup: deal cards face-up here.\nRefill empty slots from Spaceport Deck.",
    transform(18, 1.02, 6, 0, { x: 6, y: 0.05, z: 2 }),
    { r: 0.2, g: 0.15, b: 0.1 }
);
pbaLabel.Locked = true;
objects.push(pbaLabel);

// Equipment Display
const eqDisplay = baseObj(
    "BlockRectangle",
    "EQUIPMENT DISPLAY",
    "Shared display area.\nFirst time equipping a BAC type: place card face-up here + your flag.\nFlags are permanent.",
    transform(18, 1.02, -6, 0, { x: 8, y: 0.05, z: 3 }),
    { r: 0.15, g: 0.12, b: 0.08 }
);
eqDisplay.Locked = true;
objects.push(eqDisplay);

// ─── 16. TURN TRACKER / DP COUNTER ────────────────────────────────
const turnTracker = baseObj(
    "Notecard",
    "Turn & DP Tracker",
    [
        "W.A.R H.A.M.S — GAME TRACKER",
        "================================",
        "",
        "ROUND: ___    ACTIVE PLAYER: ___",
        "",
        "--- Dominance Points ---",
        "Player 1 (Red):    ___",
        "Player 2 (Blue):   ___",
        "Player 3 (Green):  ___",
        "Player 4 (Yellow): ___",
        "",
        "--- Spaceports Controlled ---",
        "P1: __/6  P2: __/6  P3: __/6  P4: __/6",
        "",
        "--- Victory Conditions ---",
        "Spaceport Domination: 5/6 (2p) or 4/6 (3-4p)",
        "Military Supremacy: 28 soldiers, hold 1 round",
        "Dominance: 50 DP from equipped BACs",
    ].join('\n'),
    transform(-18, 2, -14, 0, { x: 3, y: 1, z: 3 }),
    { r: 0.95, g: 0.9, b: 0.75 }
);
objects.push(turnTracker);

// ─── 17. PLAYER FLAG BAGS (checkers as flags) ─────────────────────
playerColors.forEach((sc, idx) => {
    const flags = [];
    for (let i = 0; i < 25; i++) {
        flags.push(baseObj(
            "Checker_white",
            `${sc.label} Flag`,
            `${sc.label} player flag.\nPlace on Equipment Display to mark unlocked BAC types.\nPermanent — never removed.`,
            transform(0, 0.3 * i, 0, 0, { x: 0.3, y: 0.3, z: 0.3 }),
            sc.color
        ));
    }
    const bag = baseObj(
        "Bag",
        `${sc.label} Flags (25)`,
        `25 flags for ${sc.label} player.\nMark unlocked BAC types on Equipment Display.`,
        transform(playerZones[idx].x + (playerZones[idx].x > 0 ? -6 : 6), 2, playerZones[idx].z + (playerZones[idx].z > 0 ? 4 : -4)),
        sc.color
    );
    bag.ContainedObjects = flags;
    objects.push(bag);
});

// ─── 18. QUICK REFERENCE NOTECARD ─────────────────────────────────
const quickRef = baseObj(
    "Notecard",
    "Quick Reference",
    [
        "TURN PHASES",
        "============",
        "1. Resource Production — Roll 2d6 + Separatist Die",
        "2. Movement — Move squads (1 hex, 2 with J.J)",
        "3. Combat — Attack enemies within 2 hexes",
        "4. Resource Gathering — Collect from hexes",
        "5. Purchase & Equip — Buy BAC modules",
        "6. Trade — Trade resources / bank 3:1",
        "7. Move Separatists — Consume/Seek/Wander",
        "",
        "COMBAT STEPS",
        "=============",
        "Pre: B.A.S.R/S.L.I.M.E fire",
        "1. Roll 1d6 per engaged soldier",
        "2. Attacker assigns dice to defenders",
        "3. Add equipment bonuses",
        "4. Play Conspire cards (defender first)",
        "5. Compare matchups — difference = damage",
        "6. Counterattack if defender blocks by 3+",
        "",
        "SOLDIER SLOTS (d6 hit roll)",
        "===========================",
        "1=Head  2=Backpack  3=Legs  4-5=Chest  6=Hands",
        "",
        "END OF ROUND",
        "=============",
        "Territory collection from controlled hexes",
        "(after ALL players complete their turns)"
    ].join('\n'),
    transform(-18, 2, -20, 0, { x: 3, y: 1, z: 3 }),
    { r: 0.85, g: 0.9, b: 0.95 }
);
objects.push(quickRef);

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
    PlayArea: 1.0,
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
