# W.A.R H.A.M.S — Tabletop Simulator Mod

## Overview
This is the TTS (Tabletop Simulator) prototype for W.A.R H.A.M.S: The Battle for Planet X. It provides a digital sandbox for manual playtesting with all game components.

## Installation
1. Copy `WARHAMS_TTS.json` to your TTS saves folder:
   - **Windows:** `Documents/My Games/Tabletop Simulator/Saves/`
   - **macOS:** `~/Library/Tabletop Simulator/Saves/`
   - **Linux:** `~/.local/share/Tabletop Simulator/Saves/`
2. Launch Tabletop Simulator
3. Go to **Games > Save & Load** and load "W.A.R H.A.M.S"

## Board Setup
When you load the mod, you'll see a Setup Panel in the center with two buttons:
- **Random Board** — Shuffles all 61 hex tiles randomly. Good for replayability.
- **Fixed Board** — Uses a balanced, pre-designed layout. Good for consistent playtesting.

Both modes automatically:
- Place all 61 hex tiles (15 resource, 3 Separatist Bases, 6 Spaceports, 37 Terrain)
- Assign number tokens to resource hexes
- Label Separatist Bases (2, 4, 6) and Spaceports (1-6)

## Components on the Table

| Component | Location | Count |
|-----------|----------|-------|
| BAC Card Deck | Right of board | 100 cards (20 types × 5) |
| Conspire Card Deck | Left of board | 72 cards (24 types × 3) |
| Resource Dice (3d6) | Near center | 3 white dice |
| Combat Dice | Near players | 11 colored dice |
| Resource Token Bags | Top edge | 5 bags (Oil/Elec/Intel/Ind/LF) |
| Player Soldier Bags | Corners | 4 bags × 28 soldiers |
| Separatist Bag | Edge | 1 bag × 24 grey soldiers |
| Control Frame Bags | Near players | 4 bags × 25 frames |
| Damage Pegs Bag | Edge | Infinite bag (blood-drop pegs for base divots) |
| Bunker Token Bag | Edge | Bag |
| Number Tokens | On resource hexes | 16 tokens |
| Cargo Containers | Unloading Zone | 6 containers |
| DP/Turn Tracker | Edge | Notecard |

## Custom Art
All components currently use **placeholder colors/images**. Replace with final art by updating the image URLs in the save file or using TTS's object editor.

Art source files are in `design/assets/`:
- `hex-tiles/` — SVG hex tile art (8 types)
- `cards/` — SVG card templates
- `tokens/` — SVG token art (resources, damage pegs, bunker, control frames, cargo)
- `boards/` — (deprecated v33) historical squad board SVG; squad boards removed from the game

## File Structure
```
tts/
├── README.md              # This file
├── WARHAMS_TTS.json       # TTS save file (load in TTS)
└── scripts/
    └── setup.lua          # Board setup script (reference copy)
```

## Development
- Edit `scripts/setup.lua` for board layout changes
- After editing, paste the updated script into the save file's `LuaScript` field
- Or paste directly into TTS's scripting editor (Components > Global > Scripting)

## Manual Play Notes
This mod is designed for **manual play** — no automation. Players handle:
- Rolling dice and placing resource tokens
- Moving soldiers and tracking coherency
- Resolving combat (dice assignment, damage, death)
- Drawing/playing cards from hand
- Tracking DP (use the notecard or TTS's built-in counters)
- Moving Separatists (Phase 7)

Refer to the rulebook (`design/WARHAMS-Rulebook.pdf`) for complete rules.
