#!/usr/bin/env node
/**
 * W.A.R H.A.M.S — TTS Save File Generator
 * Generates WARHAMS_TTS.json from game-data.json and setup.lua
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
    const obj = {
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
    return obj;
}

// ─── All ObjectStates ───────────────────────────────────────────────
const objects = [];

// ─── 1. SETUP PANEL (scripted token with board setup buttons) ──────
const setupPanel = baseObj(
    "BlockSquare",
    "SETUP PANEL",
    "Click buttons to generate the hex board.\nRandom = shuffled tiles.\nFixed = balanced playtesting layout.",
    transform(0, 1.5, 0, 0, { x: 3, y: 0.5, z: 1.5 }),
    { r: 0.15, g: 0.15, b: 0.2 }
);
setupPanel.LuaScript = luaScript;
setupPanel.LuaScriptState = "";
objects.push(setupPanel);

// ─── 2. BAC CARD DECK (100 cards) ──────────────────────────────────
const PLACEHOLDER_IMG = "https://i.imgur.com/PLACEHOLDER.png";

function buildBACDeck() {
    const cards = [];
    const bacs = gameData.basic_armament_cards;

    bacs.forEach((bac, typeIdx) => {
        for (let copy = 0; copy < bac.copies; copy++) {
            const costStr = typeof bac.cost === 'string' ? bac.cost :
                Object.entries(bac.cost).map(([k, v]) => `${v} ${k}`).join(', ');
            const desc = [
                `[${bac.category}] — Slot: ${bac.slot}`,
                `Cost: ${costStr}`,
                `DP: ${bac.dp}`,
                '',
                bac.text,
                bac.special ? `\nSpecial: ${bac.special}` : ''
            ].join('\n').trim();

            const card = baseObj(
                "Card",
                bac.abbr,
                desc,
                transform(0, 0.1 * (typeIdx * bac.copies + copy), 0),
                null
            );
            card.CardID = (typeIdx + 1) * 100;
            card.CustomDeck = {
                [typeIdx + 1]: {
                    FaceURL: PLACEHOLDER_IMG,
                    BackURL: PLACEHOLDER_IMG,
                    NumWidth: 1,
                    NumHeight: 1,
                    BackIsHidden: true,
                    UniqueBack: false
                }
            };
            cards.push(card);
        }
    });

    const deck = baseObj(
        "Deck",
        "BAC Deck",
        `Basic Armament Cards — ${gameData.deck_counts.total_BAC_cards} cards (${gameData.deck_counts.BAC_unique_types} types x ${gameData.deck_counts.BAC_copies_each} copies)\n\nDraw 3 per player during setup, then draft.`,
        transform(18, 1.5, 0, 180),
        { r: 0.3, g: 0.2, b: 0.1 }
    );
    deck.DeckIDs = cards.map(c => c.CardID);
    deck.CustomDeck = {};
    // Merge all custom deck entries
    cards.forEach(c => Object.assign(deck.CustomDeck, c.CustomDeck));
    deck.ContainedObjects = cards;
    return deck;
}
objects.push(buildBACDeck());

// ─── 3. CONSPIRE CARD DECK (72 cards) ──────────────────────────────
function buildConspireDeck() {
    const cards = [];
    const conspires = gameData.conspire_cards;

    conspires.forEach((card, typeIdx) => {
        for (let copy = 0; copy < card.copies; copy++) {
            const costStr = typeof card.cost === 'string' ? card.cost :
                Object.entries(card.cost).map(([k, v]) => `${v} ${k}`).join(', ');
            const desc = [
                `[${card.timing}]`,
                `Cost: ${costStr}`,
                '',
                card.text,
                card.condition ? `\nCondition: ${card.condition}` : ''
            ].join('\n').trim();

            const c = baseObj(
                "Card",
                card.name,
                desc,
                transform(0, 0.1 * (typeIdx * card.copies + copy), 0),
                null
            );
            c.CardID = (typeIdx + 100) * 100;
            c.CustomDeck = {
                [typeIdx + 100]: {
                    FaceURL: PLACEHOLDER_IMG,
                    BackURL: PLACEHOLDER_IMG,
                    NumWidth: 1,
                    NumHeight: 1,
                    BackIsHidden: true,
                    UniqueBack: false
                }
            };
            cards.push(c);
        }
    });

    const deck = baseObj(
        "Deck",
        "Conspire Deck",
        `Conspire Cards — ${gameData.deck_counts.total_conspire_cards} cards (${gameData.deck_counts.conspire_unique_types} types x ${gameData.deck_counts.conspire_copies_each} copies)\n\nForfeit Movement or Combat to draw 1.`,
        transform(-18, 1.5, 0, 180),
        { r: 0.1, g: 0.1, b: 0.3 }
    );
    deck.DeckIDs = cards.map(c => c.CardID);
    deck.CustomDeck = {};
    cards.forEach(c => Object.assign(deck.CustomDeck, c.CustomDeck));
    deck.ContainedObjects = cards;
    return deck;
}
objects.push(buildConspireDeck());

// ─── 4. DICE ───────────────────────────────────────────────────────
// 3 white resource dice
const diceColors = [
    { name: "Resource Die 1", color: { r: 1, g: 1, b: 1 }, x: 8, z: 12 },
    { name: "Resource Die 2", color: { r: 1, g: 1, b: 1 }, x: 9.5, z: 12 },
    { name: "Separatist Die", color: { r: 0.5, g: 0.5, b: 0.5 }, x: 11, z: 12 },
];
diceColors.forEach(d => {
    const die = baseObj("Die_6", d.name, d.name === "Separatist Die" ?
        "Grey die — triggers Separatist spawning at matching base numbers" :
        "White die — resource production",
        transform(d.x, 2, d.z),
        d.color
    );
    objects.push(die);
});

// 11 combat dice — grouped by player color (rough distribution)
const combatDiceColors = [
    { r: 0.9, g: 0.2, b: 0.2, label: "Red" },
    { r: 0.2, g: 0.4, b: 0.9, label: "Blue" },
    { r: 0.2, g: 0.8, b: 0.3, label: "Green" },
    { r: 0.9, g: 0.8, b: 0.1, label: "Yellow" },
];
combatDiceColors.forEach((col, pi) => {
    const count = pi < 3 ? 3 : 2; // 3+3+3+2 = 11
    for (let i = 0; i < count; i++) {
        const die = baseObj("Die_6",
            `${col.label} Combat Die ${i + 1}`,
            `Combat die for ${col.label} player`,
            transform(-8 + pi * 3, 2, 12 + i * 1.5),
            { r: col.r, g: col.g, b: col.b }
        );
        objects.push(die);
    }
});

// ─── 5. RESOURCE TOKEN BAGS (infinite) ─────────────────────────────
const resourceBags = [
    { name: "Oil", color: { r: 0.15, g: 0.15, b: 0.15 }, x: -12 },
    { name: "Electricity", color: { r: 0.95, g: 0.85, b: 0.1 }, x: -6 },
    { name: "Intelligence", color: { r: 0.2, g: 0.4, b: 0.9 }, x: 0 },
    { name: "Industry", color: { r: 0.85, g: 0.15, b: 0.15 }, x: 6 },
    { name: "Local Favor", color: { r: 0.15, g: 0.7, b: 0.2 }, x: 12 },
];
resourceBags.forEach(res => {
    const token = baseObj(
        "Custom_Tile",
        `${res.name} Token`,
        `${res.name} resource token`,
        transform(0, 0, 0, 0, { x: 0.5, y: 1, z: 0.5 }),
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

// ─── 6. PLAYER ZONES (4 corners) ──────────────────────────────────
const players = [
    { name: "Player 1 (Red)", color: { r: 0.9, g: 0.2, b: 0.2 }, x: -28, z: -28 },
    { name: "Player 2 (Blue)", color: { r: 0.2, g: 0.4, b: 0.9 }, x: 28, z: -28 },
    { name: "Player 3 (Green)", color: { r: 0.2, g: 0.8, b: 0.3 }, x: -28, z: 28 },
    { name: "Player 4 (Yellow)", color: { r: 0.9, g: 0.8, b: 0.1 }, x: 28, z: 28 },
];
players.forEach(p => {
    const zone = baseObj(
        "FogOfWarTrigger",
        `${p.name} — Zone`,
        `Player area for ${p.name}.\nPlace squad boards, hand cards, and resources here.`,
        transform(p.x, 1, p.z, 0, { x: 12, y: 5, z: 12 }),
        p.color
    );
    zone.FogColor = "Revealed";
    objects.push(zone);
});

// ─── 7. SOLDIER FIGURINE BAGS (28 per player) ─────────────────────
const soldierColors = [
    { label: "Red", color: { r: 0.85, g: 0.15, b: 0.15 } },
    { label: "Blue", color: { r: 0.2, g: 0.35, b: 0.85 } },
    { label: "Green", color: { r: 0.15, g: 0.7, b: 0.2 } },
    { label: "Yellow", color: { r: 0.9, g: 0.8, b: 0.1 } },
];
soldierColors.forEach((sc, idx) => {
    const soldiers = [];
    for (let i = 0; i < 28; i++) {
        soldiers.push(baseObj(
            "Figurine_Custom",
            `${sc.label} Soldier ${i + 1}`,
            `${sc.label} player soldier miniature`,
            transform(0, 0.5 * i, 0),
            sc.color
        ));
    }
    const bag = baseObj(
        "Bag",
        `${sc.label} Soldiers (28)`,
        `28 ${sc.label} soldier miniatures.\nStart with 10 (2 squads of 5), grow to 28 (4 squads of 7).`,
        transform(players[idx].x + 5, 2, players[idx].z),
        sc.color
    );
    bag.ContainedObjects = soldiers;
    objects.push(bag);
});

// ─── 8. SEPARATIST SOLDIERS (24 grey) ──────────────────────────────
const sepSoldiers = [];
for (let i = 0; i < 24; i++) {
    sepSoldiers.push(baseObj(
        "Figurine_Custom",
        `Separatist ${i + 1}`,
        "Grey Separatist miniature",
        transform(0, 0.5 * i, 0),
        { r: 0.5, g: 0.5, b: 0.5 }
    ));
}
const sepBag = baseObj(
    "Bag",
    "Separatist Soldiers (24)",
    "24 grey Separatist miniatures.\nSpawn at bases when Separatist Die matches base number.\nAlso used as Militia substitutes.",
    transform(0, 2, 22),
    { r: 0.5, g: 0.5, b: 0.5 }
);
sepBag.ContainedObjects = sepSoldiers;
objects.push(sepBag);

// ─── 9. SQUAD BOARDS (16 total, 4 per player) ─────────────────────
soldierColors.forEach((sc, idx) => {
    for (let b = 0; b < 4; b++) {
        const board = baseObj(
            "Custom_Tile",
            `${sc.label} Squad Board ${b + 1}`,
            `Squad board for ${sc.label} player, Squad ${b + 1}.\n7 soldier slots, 5 equipment slots each, 3 damage capacity.`,
            transform(players[idx].x - 4 + b * 3, 1.2, players[idx].z - 5, 0, { x: 2, y: 1, z: 3 }),
            sc.color
        );
        objects.push(board);
    }
});

// ─── 10. CONTROL HEX FRAME BAGS ───────────────────────────────────
soldierColors.forEach((sc, idx) => {
    const frames = [];
    for (let i = 0; i < 25; i++) {
        frames.push(baseObj(
            "Custom_Tile",
            `${sc.label} Control Frame`,
            `Place on hex to mark ${sc.label} player control`,
            transform(0, 0.1 * i, 0, 0, { x: 1.8, y: 1, z: 1.8 }),
            sc.color
        ));
    }
    const bag = baseObj(
        "Bag",
        `${sc.label} Control Frames (25)`,
        `25 control hex frames for ${sc.label} player.\nPlace on hexes you control.`,
        transform(players[idx].x - 5, 2, players[idx].z + 5),
        sc.color
    );
    bag.ContainedObjects = frames;
    objects.push(bag);
});

// ─── 11. DAMAGE TOKENS (infinite bag) ──────────────────────────────
const dmgToken = baseObj(
    "Custom_Tile",
    "Damage Token",
    "Place on soldier. 3 damage = death on 4th hit.",
    transform(0, 0, 0, 0, { x: 0.4, y: 1, z: 0.4 }),
    { r: 0.9, g: 0.1, b: 0.1 }
);
const dmgBag = baseObj(
    "Infinite_Bag",
    "Damage Tokens",
    "Infinite bag of damage tokens.\n3 damage capacity per soldier, 4th hit = death.",
    transform(-15, 2, 22),
    { r: 0.9, g: 0.1, b: 0.1 }
);
dmgBag.ContainedObjects = [dmgToken];
objects.push(dmgBag);

// ─── 12. BUNKER TOKENS ────────────────────────────────────────────
const bunkerTokens = [];
for (let i = 0; i < 12; i++) {
    bunkerTokens.push(baseObj(
        "Custom_Tile",
        "Bunker Token",
        "+1 defense for any unit on this hex.\n1 per hex max. Destroyed by attacker winning combat.",
        transform(0, 0.1 * i, 0, 0, { x: 0.8, y: 1, z: 0.8 }),
        { r: 0.4, g: 0.35, b: 0.25 }
    ));
}
const bunkerBag = baseObj(
    "Bag",
    "Bunker Tokens",
    "Neutral fortifications. +1 defense for any unit on hex.\n1 per hex max. Destroyed by attacker winning combat.\nDeployed via D.U.D.S module.",
    transform(-10, 2, 22),
    { r: 0.4, g: 0.35, b: 0.25 }
);
bunkerBag.ContainedObjects = bunkerTokens;
objects.push(bunkerBag);

// ─── 13. NUMBER TOKENS (16) ───────────────────────────────────────
const numberPool = [1, 1, 2, 2, 3, 3, 3, 4, 4, 4, 5, 5, 5, 6, 6, 6];
const numTokens = [];
numberPool.forEach((num, i) => {
    numTokens.push(baseObj(
        "Custom_Tile",
        `Number ${num}`,
        `Resource production number. Produces when this number is rolled on any die.`,
        transform(0, 0.15 * i, 0, 0, { x: 0.5, y: 1, z: 0.5 }),
        { r: 0.95, g: 0.9, b: 0.8 }
    ));
});
const numBag = baseObj(
    "Bag",
    "Number Tokens (16)",
    "16 number tokens for resource hexes.\n2x1, 2x2, 3x3, 3x4, 3x5, 3x6.\nPlace on 15 resource tiles (one gets 2).\nNote: Separatist Bases and Spaceports have PRINTED numbers.",
    transform(5, 2, 22),
    { r: 0.95, g: 0.9, b: 0.8 }
);
numBag.ContainedObjects = numTokens;
objects.push(numBag);

// ─── 14. CARGO CONTAINERS (6, for Unloading Zone) ─────────────────
const cargoContainers = [];
for (let i = 1; i <= 6; i++) {
    cargoContainers.push(baseObj(
        "Custom_Tile",
        `Cargo Container #${i}`,
        `Spaceport ${i} cargo container.\nPlace on spaceport hex when BAC lands.\nCollect BACs from Unloading Zone slot when squad arrives.`,
        transform(22 + (i <= 3 ? (i - 1) * 2.5 : (i - 4) * 2.5), 1.2, i <= 3 ? 4 : 6.5, 0, { x: 1.2, y: 1, z: 0.8 }),
        { r: 0.4, g: 0.55, b: 0.4 }
    ));
}
// Unloading Zone label
const uzLabel = baseObj(
    "Custom_Tile",
    "UNLOADING ZONE",
    "BAC cards land here on doubles.\n6 slots matching Spaceport numbers 1-6.\nPlace cargo container on board spaceport when BAC arrives.\nCollect: squad on spaceport takes all BACs from matching slot, removes container.",
    transform(24.5, 1, 2, 0, { x: 6, y: 1, z: 1 }),
    { r: 0.25, g: 0.35, b: 0.25 }
);
objects.push(uzLabel);
cargoContainers.forEach(c => objects.push(c));

// ─── 15. PLANET BOUND AREA (face-up BAC display) ──────────────────
const pbaLabel = baseObj(
    "Custom_Tile",
    "PLANET BOUND AREA",
    "Face-up BAC display area.\nDuring setup: deal cards face-up here.\nRefill empty slots from Spaceport Deck.",
    transform(18, 1, 5, 0, { x: 6, y: 1, z: 1 }),
    { r: 0.2, g: 0.15, b: 0.1 }
);
objects.push(pbaLabel);

// ─── 16. TURN TRACKER / DP COUNTER ────────────────────────────────
const turnTracker = baseObj(
    "Notecard",
    "Turn & DP Tracker",
    [
        "═══ W.A.R H.A.M.S — GAME TRACKER ═══",
        "",
        "ROUND: ___    ACTIVE PLAYER: ___",
        "",
        "─── Dominance Points ───",
        "Player 1 (Red):    ___",
        "Player 2 (Blue):   ___",
        "Player 3 (Green):  ___",
        "Player 4 (Yellow): ___",
        "",
        "─── Spaceports Controlled ───",
        "P1: __/6  P2: __/6  P3: __/6  P4: __/6",
        "",
        "─── Victory Conditions ───",
        "Spaceport Domination: 5/6 (2p) or 4/6 (3-4p)",
        "Military Supremacy: 28 soldiers, hold 1 round",
        "Dominance: 50 DP from equipped BACs",
    ].join('\n'),
    transform(15, 2, -14, 0, { x: 3, y: 1, z: 3 }),
    { r: 0.95, g: 0.9, b: 0.75 }
);
objects.push(turnTracker);

// ─── 17. PLAYER FLAG BAGS (25 per player) ─────────────────────────
soldierColors.forEach((sc, idx) => {
    const flags = [];
    for (let i = 0; i < 25; i++) {
        flags.push(baseObj(
            "Custom_Tile",
            `${sc.label} Flag`,
            `${sc.label} player flag.\nPlace on Equipment Display to mark unlocked BAC types.\nPermanent — never removed.`,
            transform(0, 0.1 * i, 0, 0, { x: 0.3, y: 1, z: 0.3 }),
            sc.color
        ));
    }
    const bag = baseObj(
        "Bag",
        `${sc.label} Flags (25)`,
        `25 flags for ${sc.label} player.\nMark unlocked BAC types on Equipment Display.\nPermanent once placed.`,
        transform(players[idx].x, 2, players[idx].z + 5),
        sc.color
    );
    bag.ContainedObjects = flags;
    objects.push(bag);
});

// ─── 18. EQUIPMENT DISPLAY LABEL ──────────────────────────────────
const eqDisplay = baseObj(
    "Custom_Tile",
    "EQUIPMENT DISPLAY",
    "Shared display area.\nWhen a player equips a BAC type for the first time, place the BAC card face-up here and put your flag on it.\nFlags are permanent.",
    transform(18, 1, -5, 0, { x: 8, y: 1, z: 3 }),
    { r: 0.15, g: 0.12, b: 0.08 }
);
objects.push(eqDisplay);

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
    Table: "Table_Custom",
    TableURL: "",
    Sky: "Sky_Museum",
    SkyURL: "",
    Note: [
        "W.A.R H.A.M.S: The Battle for Planet X",
        "═══════════════════════════════════════",
        "",
        "2-4 Players | Sci-Fi Corporate Military Conquest",
        "",
        "SETUP:",
        "1. Click 'Random Board' or 'Fixed Board' on the Setup Panel to generate the hex board",
        "2. Each player takes a soldier bag, flag bag, control frame bag, and 2 squad boards",
        "3. Place 10 soldiers (2 squads of 5) on starting hexes",
        "4. Deal 3 BAC cards each from the BAC Deck, then draft (pick 1, pass 2 left, etc.)",
        "5. Shuffle the Conspire Deck",
        "",
        "VICTORY CONDITIONS:",
        "- Spaceport Domination: Control 5/6 spaceports (2p) or 4/6 (3-4p)",
        "- Military Supremacy: Hold 28 soldiers for 1 full round",
        "- Dominance: Accumulate 50 DP from equipped BAC cards",
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
    Turns: { Enable: false, Type: 0, TurnOrder: [], Reverse: false, SkipEmpty: false, DisableInteractions: false, PassTurns: true }
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
