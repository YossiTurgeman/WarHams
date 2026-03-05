# W.A.R H.A.M.S — Graphics Production Brief

## For: Graphic Designer / Illustrator
## Game: W.A.R H.A.M.S (World Access Retrievable Heavy Assault Modifiable Suites) — The Battle for Planet X

---

## 1. Game Overview

A sci-fi board game of corporate warfare on an alien planet. 2–4 players command squads of modular soldiers (H.A.M.S) fighting for resources, territory, and dominance. The tone is **gritty military sci-fi with dark humor** — think Warhammer 40K meets Catan meets Risk.

**Key Visual Themes:**
- Dark, industrial sci-fi aesthetic
- Corporate military branding (each player is a rival megacorporation)
- Alien planet surface — craters, strange terrain, industrial installations
- Modular soldiers with swappable equipment
- 4 player colors: Red, Blue, Yellow, Green (bold, saturated, easily distinguishable)

---

## 2. Existing Reference Assets

SVG wireframes exist in `design/assets/` for layout reference. These are **code-generated placeholders**, not production art, but they define the exact layout, zones, and information hierarchy for each component.

| Reference File | Purpose |
|----------------|---------|
| `cards/bac-card-template.svg` | BAC card layout — zones, text placement, cost indicators |
| `cards/bac-card-hcar.svg` | Filled example (H.C.A.R rifle card) |
| `cards/conspire-card-template.svg` | Conspire card layout |
| `cards/conspire-card-guerrilla.svg` | Filled example |
| `hex-tiles/hex-*.svg` (8 files) | Hex tile layouts for each terrain type |
| `tokens/token-*.svg` (5 files) | Resource token designs |
| `tokens/damage-token.svg` | Damage marker |
| `tokens/bunker-token.svg` | Bunker fortification marker |
| `tokens/cargo-container.svg` | Cargo container |
| `tokens/control-hex-frame.svg` | Control flag (now renamed to flags — see below) |
| `boards/squad-board.svg` | Squad board layout (7 soldiers × 5 slots + damage) |
| `logo/warhams-logo.svg` | Game logo |
| `box-art/box-art-concept.svg` | Box art concept |
| `reference/player-reference-sheet.svg` | Quick reference card |
| `diagrams/board-setup-diagram.svg` | Setup diagram |
| `diagrams/combat-flow-diagram.svg` | Combat flow chart |

---

## 3. Color Palette

### Player Colors (4 factions)
| Player | Primary | Use |
|--------|---------|-----|
| Player 1 | **Red** (#cc3333) | Miniatures, flags, squad boards |
| Player 2 | **Blue** (#3366cc) | Miniatures, flags, squad boards |
| Player 3 | **Yellow** (#ccaa00) | Miniatures, flags, squad boards |
| Player 4 | **Green** (#339933) | Miniatures, flags, squad boards |

### Resource Colors
| Resource | Color | Hex Code | Token Shape |
|----------|-------|----------|-------------|
| Oil | Black | #1a1a1a | Oil Drum |
| Electricity | Yellow | #ccaa00 | Lightning Bolt |
| Intelligence | Blue | #3366cc | Transmitting Wave |
| Industry | Red | #cc3333 | Hammer |
| Local Favor | Green | #339933 | Recruit (person silhouette) |

### Card Backgrounds
| Card Type | Background | Accent | Pattern |
|-----------|-----------|--------|---------|
| BAC (Basic Armament Card) | Dark navy (#1a1a2e) | Steel grey (#8899aa) | Tech grid |
| Conspire Card | Dark purple (#12091f) | Purple (#6633aa) | Diagonal intrigue lines |

### Hex Tile Border Colors
| Hex Type | Border Color |
|----------|-------------|
| Oil Rig | Black (#1a1a1a) |
| Power Plant | Yellow (#ccaa00) |
| Factory | Red (#cc3333) |
| Radar Dish | Blue (#3366cc) |
| City / Village | Green (#339933) |
| Separatist Base | Grey (#888888) |
| Spaceport | Purple (#6633aa) |
| Terrain | No border / neutral brown |

---

## 4. Component Specifications

### 4A. BAC Cards (Basic Armament Cards)

**Count:** 20 unique designs × 8 copies each = **160 cards total**
**Print Size:** Standard poker card (63 × 88 mm / 2.5 × 3.5 in)
**Bleed:** 3mm all sides

#### Card Layout (see `bac-card-template.svg`)

```
┌────────────────────────────┐
│  [ABBREVIATION]    [COST]  │  ← Top: abbreviated name + resource cost circles
│  [FULL NAME]               │
│                            │
│  ┌──────────────────────┐  │
│  │                      │  │  ← Center: unique artwork per card
│  │     CARD ARTWORK     │  │     (weapon, armor, gadget illustration)
│  │                      │  │
│  └──────────────────────┘  │
│  ┌──────────────────────┐  │
│  │                      │  │  ← Text box: mechanical effect description
│  │    EFFECT TEXT        │  │
│  │                      │  │
│  └──────────────────────┘  │
│  [SLOT] [DIE#]    [DP]     │  ← Bottom: equipment slot, die roll, DP badge (hex shape)
│  B.A.C — BASIC ARMAMENT    │
└────────────────────────────┘
```

**Cost Indicators:** Small colored circles (top-right), one per resource type needed. Use the resource colors above with quantity labels (×1, ×2).

**DP Badge:** Hexagonal badge (bottom-right) showing Dominance Points value.

**Slot Icon:** Bottom-left shows which body slot (Head/Chest/Legs/Backpack/Hands) with the corresponding die roll number.

**Top Accent Strip:** Thin colored line at very top of card. Color varies by card category:
- Weapons (Hands slot): Red/orange (#cc4422)
- Armor (Head/Chest/Legs): Steel/silver (#8899aa)
- Gadgets (Backpack): Cyan/teal (#22aacc)

#### All 20 BAC Cards — Artwork Needed

| # | Abbreviation | Full Name | Slot | Artwork Subject | DP |
|---|---|---|---|---|---|
| 1 | S.A.P Chest | Standard Armor Plating Chest Piece | Chest | Basic military chest plate, utilitarian | 1 |
| 2 | S.A.P Helmet | Standard Armor Plating Helmet | Head | Standard military helmet, visor down | 1 |
| 3 | S.A.P Legs | Standard Armor Plating Legs | Legs | Armored leg greaves, knee guards | 1 |
| 4 | C.A.P Chest | Custom Armor Plating Chest | Chest | Heavy custom chest armor, ornate, upgraded | 4 |
| 5 | C.A.P Head | Custom Armor Plating Helmet | Head | Advanced tactical helmet, HUD visor | 4 |
| 6 | C.A.P Legs | Custom Armor Plating Legs | Legs | Heavy armored leg plates, powered joints | 4 |
| 7 | J.J | Jump Jets | Legs | Leg-mounted jet thrusters, exhaust flames | 2 |
| 8 | S.H.A.D | Sensory Helmet, Advisory Drone | Head | Helmet with attached hovering mini-drone | 4 |
| 9 | H.C.A.R | Heavy Caliber Assault Rifle | Hands | Large-bore assault rifle, tactical rails | 2 |
| 10 | P.A.E.H | Personal Accuracy Enhancement Helmet | Head | Helmet with targeting reticle/HUD overlay | 4 |
| 11 | B.A.S.R | Bolt Action Sniper Rifle | Hands | Long-barrel sniper rifle with scope | 4 |
| 12 | S.L.I.M.E | Squad Light Interoperable Mortar Encampment | Backpack | Backpack-mounted mortar tube, heavy kit | 5 |
| 13 | B.E.A.R | Battlefield Extraction Airlift Rover | Chest | Chest-mounted drone/hover unit for extraction | 3 |
| 14 | P.L.A.S.T.E.R | Personal Lasting Aid Surgical Treatment Enhancement Robot | Chest | Chest-mounted medical bot, red cross, syringes | 2 |
| 15 | N.I.N.J.A | Nir Ion Nullifier Jammer Aid | Legs | Leg-mounted energy shield emitter, glowing | 2 |
| 16 | D.U.D.S | Deployable Unital Defense System | Backpack | Backpack with deployable barricade/turret | 4 |
| 17 | L.P.M | Laser Pointer Marker | Backpack | Backpack-mounted laser designator, targeting beam | 3 |
| 18 | R.S.G | Repeating Shotgun | Hands | Drum-fed combat shotgun, close quarters | 2 |
| 19 | P.C.S.M.G | Projectile Correcting Sub Machine Gun | Hands | Smart SMG with auto-correcting barrel | 3 |
| 20 | T.I.L.T.S | Tactical Ion Team Link Shield | Backpack | Backpack-mounted team shield generator, energy field | 5 |

**Card Back:** Uniform design — dark navy with tech grid pattern, "B.A.C" text centered, game logo.

---

### 4B. Conspire Cards

**Count:** 24 unique designs × 3 copies each = **72 cards total**
**Print Size:** Standard poker card (63 × 88 mm / 2.5 × 3.5 in)
**Bleed:** 3mm all sides

#### Card Layout (see `conspire-card-template.svg`)

```
┌────────────────────────────┐
│  [CARD NAME]       [COST]  │  ← Top: card name + cost circle (or "FREE" badge)
│                            │
│  ┌──────────────────────┐  │
│  │                      │  │  ← Center: thematic artwork
│  │     CARD ARTWORK     │  │     (espionage, political, tactical scenes)
│  │                      │  │
│  └──────────────────────┘  │
│  ┌──────────────────────┐  │
│  │                      │  │  ← Text box: effect description (larger than BAC)
│  │    EFFECT TEXT        │  │
│  │    (more lines)       │  │
│  │                      │  │
│  └──────────────────────┘  │
│  👁 [EYE]  [CATEGORY]     │  ← Bottom: eye icon + timing category pill
│  CONSPIRE — POLITICAL...   │
└────────────────────────────┘
```

**Category Pill:** Bottom-center pill-shaped badge:
- **⚔️ Combat** — played only during combat Step 4
- **🎯 Tactical** — played any time

**Cost:** Single circle (top-right) or green "FREE" badge for no-cost cards.

**Diagonal Watermark:** Faint "CLASSIFIED" text rotated across the card art area.

#### All 24 Conspire Cards — Artwork Needed

| # | Name | Category | Cost | Artwork Subject |
|---|------|----------|------|-----------------|
| 1 | Abandoned Satellite Control Station | Tactical | 1 Elec | Soldier at a derelict satellite dish console |
| 2 | Build a Wind Farm | Tactical | 1 Ind | Wind turbines being erected on alien terrain |
| 3 | Raid an Oil Cache | Tactical | 1 Int | Night raid on an oil storage facility |
| 4 | Factory Takeover | Tactical | 1 LF | Soldiers seizing a factory floor |
| 5 | Build a Follower Camp | Tactical | 1 Ind | Civilian camp being established near troops |
| 6 | Recruit Eager Volunteers | Tactical | Free | Locals lining up to join the cause |
| 7 | Scout Ahead | Tactical | Free | Lone soldier with binoculars on a ridge |
| 8 | Tap into Oil Reserves | Tactical | Free | Drilling into underground oil pocket |
| 9 | Proper Planning | Tactical | Free | Officers around a holographic battle map |
| 10 | Tap into the Local Power Grid | Tactical | Free | Soldier splicing into power cables |
| 11 | Guerrilla Warfare | Combat | 1 LF | Ambush from concealed positions |
| 12 | Defender Instant Shield | Combat | 1 Oil | Energy shield flaring under fire |
| 13 | Old School RPG | Combat | Free | Soldier with a rocket launcher, old school |
| 14 | One Pulse Barrier | Combat | Free | Shimmering one-shot energy barrier |
| 15 | Deal with Local Militia | Tactical | 3 LF | Armed civilians emerging from buildings |
| 16 | A Rough Night | Tactical | 1 LF + 2 Int | Soldiers stumbling, disoriented, dark scene |
| 17 | Traveling Med Bay | Tactical | X (≤3) | Mobile medical tent, injured soldiers |
| 18 | Deal with a Local Representative | Tactical | 1 any | Handshake with a shady local politician |
| 19 | Hack a PortNet Relay | Tactical | 1 Int | Hacker at a terminal, data streaming |
| 20 | Knowledge is Power | Tactical | Control 2+ Int tiles | Intelligence HQ, screens with data |
| 21 | Civilian Goods Transport | Tactical | Control 2+ LF tiles | Convoy of supply trucks through town |
| 22 | Black Gold Syndicate | Tactical | Control 2+ Oil tiles | Secret oil baron meeting, dark room |
| 23 | At the Cover of Darkness | Tactical | Control 2+ Elec tiles | Night theft operation, shadows |
| 24 | Factory Cost Savings | Tactical | Control 2+ Ind tiles | Efficient factory production line |

**Card Back:** Dark purple with diagonal intrigue pattern, "CONSPIRE" text centered, eye icon, game logo.

---

### 4C. Hex Tiles

**Count:** 61 total (8 types, varying quantities)
**Shape:** Regular hexagon
**Print Size:** ~75mm flat-to-flat (standard board game hex), or match Catan hex size
**Material:** Thick cardboard, double-sided printing not required (back is uniform)

#### Hex Types

| # | Type | Border Color | Count | Artwork Subject | Special |
|---|------|:---:|:---:|---|---|
| 1 | Oil Rig | Black | 3 | Alien oil drilling platform, pipelines, dark industrial | Number token placement circle (bottom) |
| 2 | Power Plant | Yellow | 3 | Futuristic power station, tesla coils, energy arcs | Number token placement circle |
| 3 | Factory | Red | 3 | Heavy manufacturing facility, smokestacks, gears | Number token placement circle |
| 4 | Radar Dish | Blue | 3 | Satellite dish array, antenna farm, data streams | Number token placement circle |
| 5 | City / Village | Green | 3 | Small alien settlement, buildings with windows, streets | Number token placement circle |
| 6 | Separatist Base | Grey | 3 | Fortified rebel camp, barricades, hostile banners | **Printed number** (2, 4, or 6) — one of each |
| 7 | Spaceport Drop Zone | Purple | 6 | Landing pad, blast marks, cargo cranes | **Printed number** (1–6) — one of each |
| 8 | Terrain | Neutral/brown | 37 | Varied alien landscapes: craters, rocky ground, alien flora, barren plains, canyon edges. **At least 6-8 different illustrations** to avoid repetition across 37 tiles |

**Common Elements:**
- Bold colored border (6px stroke matching hex type)
- Type name text at top inside hex
- Number token placement circle at bottom (resource hexes only) — clear circle with thin border, ~14mm diameter
- Art should fill the interior of the hex shape, clipped to hexagonal boundary

**Tile Back:** Uniform design — dark with game logo or planet texture.

---

### 4D. Resource Tokens

**Count:** ~60-80 total across all 5 types (exact count TBD, need enough for economy)
**Shape:** Circular, ~20mm diameter
**Material:** Thick cardboard punch-out or plastic chips

| Resource | Color | Border | Symbol | Text |
|----------|-------|--------|--------|------|
| Oil | White bg | Black border (#1a1a1a, 4px) | Oil drum | "OIL" |
| Electricity | White bg | Yellow border (#ccaa00, 4px) | Lightning bolt | "ELEC" |
| Intelligence | White bg | Blue border (#3366cc, 4px) | Transmitting wave / signal | "INTEL" |
| Industry | White bg | Red border (#cc3333, 4px) | Hammer | "IND" |
| Local Favor | White bg | Green border (#339933, 4px) | Recruit / person silhouette | "LF" |

**Design:** Clean, high-contrast, readable at table distance. White background with bold colored border and central icon. Resource abbreviation text below icon.

---

### 4E. Number Tokens

**Count:** 16 total (see distribution below)
**Shape:** Circular, ~20mm diameter (same as resource tokens)
**Material:** Thick cardboard

| Number | Count |
|:---:|:---:|
| 1 | 2 |
| 2 | 2 |
| 3 | 3 |
| 4 | 3 |
| 5 | 3 |
| 6 | 3 |

**Design:** Large centered number on neutral background. Clear, bold font. No color coding needed — these just sit on hex tiles to show which dice roll activates that hex.

---

### 4F. Damage Tokens

**Count:** ~50+ (soldiers take up to 3 damage before death on 4th)
**Shape:** Circular, ~15mm diameter (smaller than resource tokens)
**Design:** Red/dark red with a wound/damage icon (crack, explosion, blood drop). Simple, recognizable at a glance.

---

### 4G. Bunker Tokens

**Count:** ~10-12
**Shape:** Square or hexagonal, ~20mm
**Design:** Fortification icon — barricade, sandbags, shield wall. Neutral color (grey/brown) since bunkers are usable by any player.

---

### 4H. Cargo Containers

**Count:** 12 (numbered 1–6, two of each)
**Physical Form:** Small 3D plastic containers if possible, otherwise thick cardboard standees
**Design:** Numbered military shipping containers. Each shows a bold number (1-6). Industrial/military crate look — rivets, hazard stripes, corporate branding.

---

### 4I. Control Flags

**Count:** 25 per player × 4 players = **100 total**
**Physical Form:** Small flag miniatures (~15-20mm tall) on a base
**Colors:** 4 player colors (Red, Blue, Yellow, Green) — solid color
**Design:** Simple flag on a short pole with a flat base. Clean, identifiable by color from across the table. Used for two purposes:
1. Placed on hex tiles to mark territorial control
2. Placed on BAC cards in the Equipment Display to mark which BAC types a player has unlocked

---

### 4J. Squad Boards

**Count:** 16 total (4 per player × 4 players)
**Size:** ~160 × 60mm (landscape, compact — about the size of a large bookmark)
**Material:** Thick cardboard, player-colored border

**Design rationale:** Equipment is tracked on the miniatures themselves (magnetic modules) and the shared Equipment Display — not on the squad board. The squad board's job is purely **damage tracking** and **hit-location reference** for the Lethal Hit Roll on death.

#### Layout (see `squad-board.svg`)

```
┌──────────────────────────────────────────────────────────────┐
│ SQUAD   │  _1     │  _2     │  _3     │  _4     │  _5     │  _6     │  _7     │
│  _      │  🪖     │  🪖     │  🪖     │  🪖     │  🪖     │  🪖     │  🪖     │
│         │ ○ ○ ○ ☠ │ ○ ○ ○ ☠ │ ○ ○ ○ ☠ │ ○ ○ ○ ☠ │ ○ ○ ○ ☠ │ ○ ○ ○ ☠ │ ○ ○ ○ ☠ │
│ DP:___  │         │         │         │         │         │         │         │
├──────────────────────────────────────────────────────────────┤
│ LETHAL HIT: ⚀HEAD  ⚁BACKPACK  ⚂LEGS  ⚃⚄CHEST  ⚅HANDS    │
└──────────────────────────────────────────────────────────────┘
```

**Per Soldier Column:**
- Soldier number + silhouette icon at top
- 3 damage circles (○) + KIA skull (☠) — place damage tokens on circles, 4th token = death

**Left Sidebar:** Squad number, DP counter
**Bottom Legend:** Lethal Hit Roll mapping (rolled on death to determine which equipment slot is destroyed)

**Player Color:** Each set of 4 boards has a colored border matching the player (Red/Blue/Yellow/Green).

---

### 4K. Planet Frame (Board Edge)

**Count:** 5 interlocking puzzle pieces forming a circular border
**Size:** When assembled, creates a circle large enough to contain 61 hex tiles (~50-60cm diameter)
**Material:** Thick cardboard, jigsaw-style interlocking edges
**Design:** Planetary surface edge — atmosphere glow, stars, orbital debris, corporate satellite silhouettes. The frame creates the visual boundary of the alien world. Interior should be neutral/dark to contrast with hex tiles placed inside.

---

### 4L. Player Reference Sheet

**Count:** 4 (one per player)
**Size:** A5 or half-letter (landscape)
**Content:** Quick reference for:
- Turn phase summary (7 phases)
- Combat steps (Pre + Steps 1-6)
- Resource icon legend
- Equipment slot die roll chart
- Victory conditions (3 paths)
- Key costs (recruit soldier, create squad, etc.)

**Design:** Same dark theme as cards. Dense but readable. All critical info on one side.

---

### 4M. Dice

**Count:** 14 standard d6
**Color:** Suggest translucent smoke/dark with white pips, or match game theme
**Note:** No custom faces needed — standard 1-6 pips

---

### 4N. Box Art

**Size:** Standard board game box (~300 × 300 × 75mm)
**Subject:** Epic sci-fi battle scene on an alien planet. Multiple H.A.M.S soldiers in different colored armor (representing the 4 players) fighting each other and Separatists amidst alien terrain. Spaceport landing pad in background. Resource installations visible. Game logo prominent at top.
**Tone:** Action-packed, slightly gritty, corporate military sci-fi

---

## 5. Miniatures (3D — Separate Pipeline)

These require 3D modeling, not 2D illustration. Included here for completeness.

### 5A. H.A.M.S Soldier Miniature

**Count:** 28 per player × 4 colors = **112 total**
**Height:** ~28-32mm (standard tabletop mini scale)
**Key Feature:** **5 magnetized attachment points** for swappable equipment modules
- Head (top of helmet area)
- Chest (torso front)
- Legs (thigh/shin area)
- Backpack (upper back)
- Hands (weapon grip)

**Base Sculpt:** Generic soldier in powered suit — no equipment attached. Should look complete but "unequipped" (basic undersuit/frame visible at attachment points).

**Base Numbering:** Each mini's base has a **squad letter + soldier number** engraved/printed on the rim (A1–A7, B1–B7, C1–C7, D1–D7), matching the Squad Board columns. Each player color set contains 4 groups of 7 labeled minis (one group per squad).

**Colors:** 4 sets in Red, Blue, Yellow, Green (solid color plastic or primed).

### 5B. Equipment Modules (Magnetized Attachments)

**Count:** 20 unique sculpts × 8 copies each = **160 modules**
**Key Feature:** Each module has a **unique sculpt** identifiable at table distance + **abbreviation engraved on underside** for confirmation.

| Module | Slot | Sculpt Description |
|--------|------|--------------------|
| S.A.P Chest | Chest | Basic chest plate |
| S.A.P Helmet | Head | Standard helmet |
| S.A.P Legs | Legs | Basic leg armor |
| C.A.P Chest | Chest | Heavy ornate chest plate (visually distinct from S.A.P) |
| C.A.P Head | Head | Advanced helmet with HUD visor |
| C.A.P Legs | Legs | Heavy powered leg armor |
| J.J | Legs | Jet thruster pods |
| S.H.A.D | Head | Helmet with small drone attached |
| H.C.A.R | Hands | Large assault rifle |
| P.A.E.H | Head | Helmet with targeting scope |
| B.A.S.R | Hands | Long sniper rifle |
| S.L.I.M.E | Backpack | Mortar tube backpack |
| B.E.A.R | Chest | Chest-mounted hover drone |
| P.L.A.S.T.E.R | Chest | Medical bot chest unit |
| N.I.N.J.A | Legs | Energy shield emitters on legs |
| D.U.D.S | Backpack | Deployable barrier backpack |
| L.P.M | Backpack | Laser designator pack |
| R.S.G | Hands | Drum-fed shotgun |
| P.C.S.M.G | Hands | Compact smart SMG |
| T.I.L.T.S | Backpack | Team shield generator pack |

**Color:** All modules in neutral grey/silver (unpainted) — they are equipment, not player-specific.

### 5C. Separatist Miniatures

**Count:** 24 grey miniatures
**Sculpt:** Ragged rebel soldier — visually distinct from H.A.M.S (less armored, improvised gear, different silhouette). Should be immediately recognizable as "not a player's soldier" from across the table.
**Color:** Grey (neutral NPC color)

### 5D. Control Flag Miniatures

**Count:** 25 per player × 4 = 100 total
**Size:** ~15-20mm tall
**Design:** Small flag on a pole with flat circular base. Solid player color. Simple enough to mass-produce.

---

## 6. File Deliverables

### Per Component, Please Deliver:
1. **Print-ready files** — CMYK, 300 DPI, with bleed marks and cut lines
2. **Digital files** — RGB PNG/SVG for Tabletop Simulator integration
3. **Source files** — Layered PSD/AI/Figma for future edits

### File Naming Convention:
```
bac-card-[abbreviation].png     → bac-card-hcar.png
conspire-card-[name-slug].png   → conspire-card-guerrilla-warfare.png
hex-tile-[type].png             → hex-tile-oil-rig.png
token-[type].png                → token-oil.png
squad-board.png
reference-sheet.png
box-art.png
card-back-bac.png
card-back-conspire.png
```

---

## 7. Priority Order

If working in phases, prioritize in this order:

1. **Phase 1 — Playable Prototype**
   - 20 BAC card designs (unique art per card)
   - 24 Conspire card designs
   - Card backs (BAC + Conspire)
   - 8 hex tile types (6-8 terrain variants)
   - 5 resource tokens
   - Number tokens
   - Damage tokens

2. **Phase 2 — Full Component Set**
   - Squad boards (4 player colors)
   - Player reference sheets
   - Bunker tokens
   - Cargo containers
   - Planet frame artwork

3. **Phase 3 — Premium**
   - Box art (full illustration)
   - Logo refinement
   - Board setup diagram (illustrated)
   - Rulebook interior illustrations

4. **Phase 4 — 3D Models (Separate Artist)**
   - H.A.M.S base soldier sculpt with magnet points
   - 20 equipment module sculpts
   - Separatist soldier sculpt
   - Control flag miniature

---

## 8. Reference Material

- Full rulebook: `design/WARHAMS-Rulebook.md`
- Structured game data: `design/game-data.json`
- All SVG wireframes: `design/assets/` (use as layout blueprints)
- Game repository: https://github.com/YossiTurgeman/WarHams

---

*Document prepared for artist commission. All game mechanics and component counts are final as of this version.*
