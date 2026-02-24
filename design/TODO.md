# W.A.R H.A.M.S — Project TODO

## Task 1: 📖 Rulebook Redesign ✅ COMPLETE
- [x] Structure rulebook into clear sections (Overview, Setup, Turn Phases, Combat, Cards, Winning)
- [x] Write concise rules with consistent terminology
- [x] Add worked examples for combat, resource gathering, and counterattacks
- [x] Add quick-reference tables (turn order, slot numbers, resource icons, costs, combat steps)
- [x] Full BAC card list (20 cards) and Conspire card list (24 cards) with tables
- [x] Victory conditions, Separatist rules, Territory control, Death/loot mechanics
- **Output:** `design/WARHAMS-Rulebook.md` (966 lines)
- [x] Create visual diagrams for board setup and combat flow → `assets/diagrams/board-setup-diagram.svg`, `combat-flow-diagram.svg`
- [x] Convert to print-ready PDF layout → `design/WARHAMS-Rulebook.pdf` (18 pages, styled with title page & page numbers)

## Task 2: 🎨 Graphic Assets Generation ✅ COMPLETE
- [x] Design game logo / branding → `assets/logo/warhams-logo.svg`
- [x] Create BAC card template + H.C.A.R example → `assets/cards/bac-card-template.svg`, `bac-card-hcar.svg`
- [x] Create Conspire card template + Guerrilla Warfare example → `assets/cards/conspire-card-template.svg`, `conspire-card-guerrilla.svg`
- [x] Design hex tile artwork (all 8 types) → `assets/hex-tiles/hex-*.svg`
- [x] Design resource token icons (all 5 types + combined) → `assets/tokens/token-*.svg`, `tokens-all.svg`
- [x] Design squad board layout (7 soldiers, 5 equipment slots, 3 damage, KIA) → `assets/boards/squad-board.svg`
- [x] Create player reference sheet / cheat sheet → `assets/reference/player-reference-sheet.svg`
- [x] Box art concept → `assets/box-art/box-art-concept.svg`
- [x] Cargo containers (single + set of 6) → `assets/tokens/cargo-container.svg`, `cargo-containers-set.svg`
- [x] Damage token → `assets/tokens/damage-token.svg`
- [x] Bunker token → `assets/tokens/bunker-token.svg`
- [x] Control hex frames (4 player colors) → `assets/tokens/control-hex-frame.svg`
- **Output:** 27 SVG files in `design/assets/`

## Task 3: 🔴 Rules Audit — Critical Issues (Game-Breaking)

- [x] **#1 — Separatist Bases need number tokens but never receive them** ✅ FIXED
  - Bases now have **printed numbers (2, 4, 6)** on the tile. No number tokens needed. Updated: hex table, number tokens section, Setup Step 4, Separatist Spawning, game-data.json.
- [x] **#2 — Spaceport numbering is never established** ✅ FIXED
  - Spaceports now have **printed numbers (1–6)** on the tile. Updated: hex table, number tokens section, Phase 1 doubles/triples text, game-data.json.
- [x] **#3 — BAC delivery destination contradicts itself** ✅ FIXED
  - BACs always go to the **Unloading Zone** (stacked under matching container). Container marker placed on board spaceport hex. Collection: squad on spaceport takes all BACs from that slot, removes container. Updated: Setup Step 10, Phase 1 doubles/triples, Phase 5 collection.
- [x] **#4 — Combat with spread-out squads is undefined** ✅ FIXED
  - Only **engaged soldiers** (within 2 hexes of at least one enemy soldier in target squad) participate and roll dice. Extended-range weapons (B.A.S.R, S.L.I.M.E) count as engaged from their weapon range. Updated: Phase 3, Initiating Combat, Step 1 dice rolls, quick references, game-data.json.
- [x] **#5 — Miniature count: 14 vs 28 per player** ✅ FIXED
  - game-data.json updated to **28 per player × 4 = 112 total**. Start with 10 (2×5), grow to 28 (4×7). Rulebook was already correct.
- [x] **#6 — Conspire timing contradicts itself** ✅ FIXED
  - **Drawing:** Forfeit Movement (Phase 2) OR Combat (Phase 3), per Squad. Can do both in same turn. **Playing:** Split into Combat Cards (played only at combat Step 4, defender first) and Tactical Cards (played any time). Updated: Phase 2, Phase 3, Conspiring section, combat Step 4, quick references.
- [x] **#7 — Controlling Spaceports has no rule** ✅ FIXED
  - "Claiming a Hex" now covers **any hex** — resource hexes, Spaceports, conquered Separatist Bases, and Terrain. Move a Squad onto it, place your Control Hex Frame.

## Task 4: 🟡 Rules Audit — Medium Issues (Unclear/Inconsistent)

- [x] **#8 — Resource tokens vs cards terminology** ✅ FIXED
  - Standardized to **resource tokens** everywhere. Removed the token→card conversion step from Phase 4. Players collect and hold tokens directly. All "resource card(s)" references replaced.
- [x] **#9 — End-of-round bonus never integrated into turn structure** ✅ FIXED
  - Added **End of Round** step after Phase 7: defined "round" as full cycle of all players' turns. Uncollected tokens/BACs on controlled hexes go to owner. Territory Control section now references it.
- [x] **#10 — Militia units (Deal with Local Militia) undefined** ✅ FIXED
  - Added **Militia** section: 1 HP, −1 dice, no equipment, attack once then removed. Use spare Separatist minis. Conspire card text updated. Summoning player controls them.
- [x] **#11 — Loot tokens don't exist as a component** ✅ FIXED
  - Rewrote entire equipment pipeline: BAC card (hidden in hand) → pay cost → card face-up on Squad Board + physical **equipment module** (magnetized) snaps onto mini. Death = module destroyed in hit slot, owner keeps 1, attacker takes 1, rest left on hex as **salvage**. Salvage picked up for free. Added Equipment Modules to components. "Loot tokens" replaced with salvage system.
- [x] **#12 — J.J. vs squad coherency contradiction** ✅ FIXED
  - J.J. now **explicitly overrides coherency**. Disconnected soldiers fight alone (own dice only), cannot benefit from Squad-level BAC effects (S.L.I.M.E, L.P.M, etc.), and may rejoin by moving back within 2 hexes. Updated: Phase 2 movement, BAC table, game-data.json.
- [x] **#13 — Conquered base spawning has no rules** ✅ FIXED
  - Added **Instigate Uprising** ability: Phase 7, pay **3 Local Favor** to spawn 3 Separatists at any unconquered base, once per round per conquered base. Separatists scatter normally. Updated: Conquering Bases section, game-data.json (special_tiles + Phase 7).
- [x] **#14 — Bunker token rules incomplete** ✅ FIXED
  - Added full **Bunker Rules** section: neutral fortifications (+1 defense for any unit), 1 per hex max, persist until destroyed. Attacker who wins combat on bunkered hex may destroy it. Updated: Special Weapon Rules, components table, D.U.D.S card text, game-data.json.
- [x] **#15 — Scenario cards referenced but don't exist** ✅ FIXED
  - Removed phantom "scenario card" reference from Setup Step 4. No scenario system exists in core game — future expansion concept only.
- [x] **#16 — Squad board component count wrong** ✅ FIXED
  - game-data.json updated from 8 to **16 total** (4 per player × 4 players). Start with 2, earn more during play. Rulebook was already correct.

## Task 4b: 🟡 Rules Audit — Second Pass

- [x] **#17 — "Resource cards" terminology still in game-data.json** ✅ FIXED
  - Replaced "resource cards" → "resource tokens" in Civilian Goods Transport and At the Cover of Darkness entries in game-data.json.
- [x] **#18 — Resource collection adjacency rule contradicts Separatist blocking rule** ✅ FIXED
  - Aligned to simpler rule: Separatists block collection **only on the hex they occupy**, not adjacent hexes. Removed adjacency block from Phase 4. Now matches Separatist rules section.
- [x] **#19 — Quick Reference combat steps don't match main section** ✅ FIXED
  - Rewrote bottom Quick Reference to match main section's **Pre + Steps 1–6** numbering exactly.
- [x] **#20 — Separatist miniature count not specified** ✅ FIXED
  - Specified **24 grey Separatist miniatures** in box. Covers base assault (7) + heavy spawning + militia spares. Updated: components table, game-data.json.
- [x] **#21 — "loot" key still in game-data.json** ✅ FIXED
  - Renamed JSON key from "loot" to "salvage" and updated description to match salvage system from #11.
- [x] **#22 — Tap/untap and module activation timing undefined** ✅ FIXED
  - Added **Activating Modules** section: Combat Modules activate at Step 3 (N.I.N.J.A), Field Modules activate during Phase 5 (P.L.A.S.T.E.R, D.U.D.S). Untapping also Phase 5 at City/Spaceport. Passive bonuses always active. Updated: Equipping Rules, game-data.json.

## Task 4c: 🟡 Rules Audit — Third Pass ✅ COMPLETE

- [x] **#23 — "Loot Distribution" header still in rulebook** ✅ FIXED
  - Renamed header to "Salvage Distribution" to match #11 rename.
- [x] **#24 — Phase 1 doesn't mention Separatist spawning** ✅ FIXED
  - Added Separatist spawning cross-reference to Phase 1, between resource production and doubles. Players now see the trigger where it matters.
- [x] **#25 — Phase 4 priority order unclear when no combat occurred** ✅ FIXED
  - Clarified: combat winner picks first if combat happened, otherwise active player picks first. Ties resolved by turn order clockwise.
- [x] **#26 — Conspire card timing categories missing from game-data.json** ✅ FIXED
  - Added `"timing": "Combat"` to 4 combat cards and `"timing": "Tactical"` to all 20 tactical cards in game-data.json. Now matches rulebook's Combat/Tactical split.

> **Audit Status:** 3 passes complete, 26 issues found and fixed. Rulebook is structurally solid — no contradictions, missing rules, or terminology gaps remain. Ready for Task 5.

## Task 5: 📋 Design & Balance Review

- [x] Analyze resource cost curves across all 20 BACs ✅
- [x] Map DP economy — how fast can each win condition be reached? ✅
- [x] Evaluate win condition balance (Spaceports vs Military vs Dominance) ✅
- [x] Combat math analysis (extra soldiers advantage, counterattack probability) ✅
- [x] Review Conspire card power levels (free vs costed, conditional vs universal) ✅
- [x] Separatist AI behavior — edge cases and exploits ✅
- [x] Resource scarcity analysis (numbers 1&2 vs 3-6 distribution) ✅
- [x] Playtest scenario walkthroughs (early game, mid game, late game) ✅

### Balance Issues Found

- [x] **B1 🔴 CRITICAL — Full C.A.P set (+7 defense) makes soldiers invincible** ✅ FIXED
  - Removed C.A.P set bonus. Each piece independently grants +2 defense (no stacking bonus). Full C.A.P = +6 total. Hittable: atk 6+2=8 vs def 1+6=7 → hit for 1. Updated: rulebook BAC table, equipping rules, game-data.json.
- [x] **B2 🟡 MEDIUM — Spaceport Domination near-impossible in 4-player games** ✅ FIXED
  - Lowered threshold from 6/6 to **4/6 spaceports**. Achievable with focused play while still requiring significant map control. Updated: rulebook victory section + quick reference, game-data.json.
- [x] **B3 🟡 MEDIUM — L.P.M has best DP/cost ratio (1.50), enabling boring Dominance rush** ✅ FIXED
  - Added 1 Intelligence to L.P.M cost (now 1 Elec + 1 LF + 1 Int = 3 total). DP/cost drops to 1.00, in line with other BACs. Thematically fits (laser targeting = Intelligence). Updated: rulebook BAC table, game-data.json.
- [x] **B4 🟡 MEDIUM — No rule for Separatist mini cap during spawning** ✅ FIXED
  - Added hard cap rule: spawn as many as available, excess spawns lost. Updated: rulebook Separatist Spawning section, game-data.json special_tiles.
- [x] **B5 🟢 MINOR — P.C.S.M.G underpowered vs same-tier alternatives** ✅ FIXED
  - Bumped P.C.S.M.G DP from 2 to **3**. DP/cost now 1.00, in line with its tier. Still below B.A.S.R (4 DP) but reflects the reliable close-range combat value. Updated: rulebook BAC table, game-data.json.
- [x] **B6 🟢 MINOR — B.E.A.R has worst DP efficiency in the game (0.20)** ✅ FIXED
  - Bumped B.E.A.R DP from 1 to **3**. DP/cost now 0.60 — still lowest for its tier but reflects sustained resource advantage. Updated: rulebook BAC table, game-data.json.
- [x] **B7 🟢 MINOR — A Rough Night Conspire card is overcosted** ✅ FIXED
  - Buffed effect from "immobilize OR -1 combat" to "immobilize AND -1 combat" (both effects). Cost stays at 3 resources, now justified by the powerful combined debuff. Updated: rulebook Conspire table, game-data.json.
- [x] **B8 🟢 MINOR — Full S.A.P set (+4 defense) may be too strong defensively** ✅ FIXED
  - Removed S.A.P set bonus (same treatment as C.A.P). Each piece independently grants +1 defense. Full S.A.P = +3 total. Hit rate with H.C.A.R now ~19.4%. Updated: rulebook BAC table, equipping rules, game-data.json.

> **Balance Review Status:** 8 issues found and fixed. All BAC DP ratios normalized, armor stacking balanced, win conditions reachable, Separatist cap defined, Conspire cards tuned.

## Task 6: 🖥️ Tabletop Simulator Prototype
- [ ] Set up TTS mod project structure
- [ ] Build hex board with randomized tile placement inside planet frame
- [ ] Create all hex tile assets for TTS
- [ ] Implement BAC card deck (100 cards) with spaceport deck + planet bound area
- [ ] Implement Conspire card deck (72 cards) with draw/discard
- [ ] Build squad board UI with drag-and-drop module slots
- [ ] Script dice rolling (3d6 resource production, combat dice)
- [ ] Implement resource token spawning on hex tiles
- [ ] Add number tokens (1-6) placement system
- [ ] Build control hex frame system (player colors)
- [ ] Add damage token tracking on squad boards
- [ ] Implement turn tracker and DP counter
- [ ] Add separatist miniature spawning and movement logic
- [ ] Player hand zones and hidden information
- [ ] Scripted automation (resource production on roll, separatist spawning on matching numbers)
