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
  - Only **engaged soldiers** with at least one enemy soldier in their current combat range participate and roll dice. Empty Hands has range 1; Hands-slot weapons normally have range 2; special weapons use their stated range. Updated: Phase 3, Initiating Combat, Step 1 dice rolls, quick references, game-data.json.
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

## Task 5b: 🔴 Rules Audit — Fourth Pass

- [x] **C1 🔴 CRITICAL — Phase 4: Who actually collects resources?** ✅ FIXED
  - Clarified: **active player always collects + defending players involved in combat also collect**. Winner picks first, loser second. No combat = only active player. Updated: Turn Structure intro (added Phase 4 exception), Phase 4 section, both quick references, game-data.json.
- [x] **C2 🔴 CRITICAL — P.C.S.M.G effect is mechanically vague** ✅ FIXED
  - Clarified: within 1 hex, P.C.S.M.G soldier **rolls 2d6 instead of 1d6** for their attack die and picks the higher result (roll with advantage). Updated: rulebook BAC table, game-data.json.
- [x] **M1 🟡 MEDIUM — Phase 7 omits Instigate Uprising** ✅ FIXED
  - Added **Step 0 — Instigate Uprising** to Phase 7 section before Consume/Seek/Wander, cross-referencing the Separatist section for full details.
- [x] **M2 🟡 MEDIUM — End of Round references BAC cards on spaceport hexes** ✅ FIXED
  - Rewritten to correctly reference **Unloading Zone**: controlled spaceports with container markers → collect BACs from matching UZ slot, remove container, reset slot.
- [x] **M3 🟡 MEDIUM — B.A.S.R labeled "extended range" but has 2-hex range** ✅ FIXED
  - Removed B.A.S.R from "extended range" grouping. Now correctly notes S.L.I.M.E as the only inherently extended-range weapon (3 hex). B.A.S.R described as pre-combat at normal 2-hex range, extendable via L.P.M. Updated: Initiating Combat section, game-data.json.
- [x] **M4 🟡 MEDIUM — T.I.L.T.S "pay once" contradicts equipping rules** ✅ FIXED
  - Added **Exception — T.I.L.T.S** note to Equipping Rules: pay listed cost once to equip any number of soldiers in the same Squad.
- [x] **M5 🟡 MEDIUM — Hack a PortNet Relay wording is ambiguous** ✅ FIXED
  - Clarified: take 1 face-up BAC from PBA **into your hand**, then refill slot from Spaceport Deck. Updated: rulebook Conspire table, game-data.json.
- [x] **M6 🟡 MEDIUM — Separatists moving onto player-occupied hexes** ✅ FIXED
  - Added rule: Separatists entering a player-occupied hex trigger **immediate combat** (player defends, Separatist attacks with −1 dice). Resolve before moving other Separatists. Updated: Phase 7 Wander section, game-data.json.
- [x] **M7 🟡 MEDIUM — S.L.I.M.E crew behavior when defending** ✅ FIXED
  - Added **−1 defense when defending** to S.L.I.M.E, matching B.A.S.R's penalty. Both heavy pre-combat weapons now carry a defensive tradeoff. Updated: rulebook BAC table, Special Weapon Rules, game-data.json.
- [x] **N1 🟢 MINOR — Death: no rule for empty hit slot** ✅ FIXED
  - Added clarification: if struck slot is **empty**, no module is destroyed — proceed to salvage distribution. Updated: Death section (Module Destroyed step).
- [x] **N2 🟢 MINOR — Card Anatomy lists "Set Indicator" but set bonuses removed** ✅ FIXED
  - Removed "Set Indicator" row from Card Anatomy table. No set bonuses exist after B1/B8 fixes.

> **Fourth Pass Status:** 11 issues found and fixed (2 critical, 7 medium, 2 minor). Phase 4 collection clarified, P.C.S.M.G defined, Instigate Uprising cross-referenced, Unloading Zone corrected, B.A.S.R range fixed, T.I.L.T.S exception noted, Hack a PortNet Relay clarified, Separatist movement rule added, S.L.I.M.E defense penalty added, empty slot edge case covered, Set Indicator removed.

## Task 5c: 🔴 Rules Audit — Fifth Pass

- [x] **M8 🟡 MEDIUM — Controlling Territory End-of-Round Bonus still says "BAC cards on hexes"** ✅ FIXED
  - Updated Controlling Territory End-of-Round Bonus to correctly reference **Unloading Zone**, matching the End of Round section fix from M2.
- [x] **M9 🟡 MEDIUM — Resource table columns still say "Card Color" / "Card Depiction"** ✅ FIXED
  - Renamed columns to **"Color"** and **"Depiction"** in both Components and Quick Reference tables. Renamed `card_depiction` → `depiction` in game-data.json (all 5 resources).
- [x] **M10 🟡 MEDIUM — Doubles: do matched hexes produce resources once or twice?** ✅ FIXED
  - Clarified: each **unique number** produces once — duplicates don't double production. Added doubles example. Replaced ambiguous "third die" sentence with clear "all unique numbers produce normally" text.
- [x] **N3 🟢 MINOR — B.A.S.R BAC table missing "pick higher result"** ✅ FIXED
  - Updated BAC table to **"roll 2d6 (pick higher)"**, matching Special Weapon Rules section.
- [x] **N4 🟢 MINOR — Free Resource Conspire cards bonus wording ambiguous** ✅ FIXED
  - Reworded all 5 Free Resource cards: **"gain 1 additional resource token of any type you choose"**. Updated: rulebook Conspire table, game-data.json (all 5 entries).

> **Fifth Pass Status:** 5 issues found and fixed (3 medium, 2 minor). Unloading Zone reference fixed in Territory section, resource table columns renamed, doubles production clarified, B.A.S.R "pick higher" added, Free Resource bonus wording clarified.

## Task 5d: 🟡 Playability Review — Player Experience Issues

- [ ] **P1 🟡 MEDIUM — No starting resources = dead first turn** ⏭️ SKIPPED
  - Players start with 0 resources and 3 BACs. Can't equip or recruit turn 1. First 1-2 rounds feel like waiting.
  - Deferred — revisit after playtesting.
- [x] **P2 🟡 MEDIUM — Counterattack chains can loop forever** ✅ FIXED
  - Added **Combat Fatigue** mechanic: counterattacks can still chain, but each successive counterattack suffers a cumulative **−1 penalty** to all dice rolls (1st counter: no penalty, 2nd: −1, 3rd: −2, etc.). Naturally decays — extremely unlikely past 2 chains. Updated: Step 6 + worked example, both quick references, game-data.json.
- [ ] **P3 🟡 MEDIUM — Active player moves ALL Separatists — tedious** ⏭️ SKIPPED
  - Could be 15-20+ Separatists. Active player moves every one, every turn. Boring bookkeeping.
  - Deferred — revisit after playtesting.
- [x] **P4 🟡 MEDIUM — Squad coherency broken by death — no rule** ✅ FIXED
  - Added **Step 5: Coherency Check** to Death sequence. Surviving soldiers beyond 2 hexes of all squadmates are disconnected — fight alone (own dice only, no Squad-level BAC effects), must rejoin next Movement phase. Same rules as J.J disconnection. Updated: Death section (both rulebooks), game-data.json.
- [x] **P5 🟢 MINOR — Phase 4 resource collection priority is complex** ✅ FIXED
  - Added **Quick Priority Reminder** callout box to Phase 4 (① winner → ② loser → ③ active player). Updated both quick reference tables with inline priority summary. Rules unchanged, just clearer presentation. Updated: both rulebooks.
- [x] **P6 🟢 MINOR — Flag removal from Equipment Display unclear** ✅ FIXED
  - Clarified: **flags are permanent**. Once placed on a BAC card in the Equipment Display, your flag stays for the rest of the game — even if all soldiers carrying that module die. Marks that you've unlocked the BAC type and can re-equip it. Updated: components table, Equipping Rules (both rulebooks), game-data.json.
- [ ] **P7 🟢 MINOR — "Oldest player goes first" is awkward** ⏭️ SKIPPED
  - Could create discomfort in mixed-age groups.
  - Keeping as-is — revisit after playtesting.

## Task 5e: 🔴 BAC Rebalance & Wording Overhaul

### Overpowered BACs
- [x] **BAC-1 🔴 CRITICAL — T.I.L.T.S is broken** ✅ FIXED — pay per soldier, adjacent only, always active, no other backpack allowed
- [x] **BAC-2 🔴 CRITICAL — S.L.I.M.E is overtuned** ✅ FIXED — removed −1 defense debuff, added Civilian Damage Rule reference
- [x] **BAC-3 🟡 MEDIUM — D.U.D.S scales too well** ⏭️ ACCEPTABLE — one-shot, neutral, destroyable; +1 is fair. Turtle meta addressed by BAC-21 (defense stacking cap). Revisit after playtesting.
- [x] **BAC-4 🟡 MEDIUM — N.I.N.J.A timing undefined** ✅ ALREADY DEFINED — activates at Step 3 (equipment bonuses), after matchup assignment but before Conspire cards. Strong but fair as a tap ability. Revisit after playtesting.

### Underwhelming BACs
- [x] **BAC-5 🟡 MEDIUM — B.E.A.R is too weak for its cost** ✅ FIXED — reduced cost to 1 Oil, 1 Industry, 1 Electricity (removed Intelligence and Local Favor)
- [x] **BAC-6 🟡 MEDIUM — S.H.A.D is low-impact** ✅ FIXED — increased DP from 4 to 5
- [x] **BAC-7 🟡 MEDIUM — P.C.S.M.G is dominated by H.C.A.R** ✅ FIXED — buffed to 3d6 pick highest at close range
- [x] **BAC-8 🟢 MINOR — L.P.M is parasitic** ✅ FIXED — increased DP from 3 to 4

### Wording Fixes
- [x] **BAC-9 🔴 CRITICAL — Armor card wording ambiguous** ✅ FIXED — all S.A.P/C.A.P now read "This soldier gets +N to its defense die"
- [x] **BAC-10 🟡 MEDIUM — P.A.E.H wording unclear** ✅ FIXED — specifies same-soldier H.C.A.R requirement
- [x] **BAC-11 🟡 MEDIUM — B.A.S.R wording unclear** ✅ FIXED — clarified: both sniper and target get −1 defense when defending
- [x] **BAC-12 🟡 MEDIUM — S.L.I.M.E wording unclear** ✅ FIXED — 4d6 assigned as normal matchups, civilian damage referenced
- [x] **BAC-13 🟡 MEDIUM — T.I.L.T.S wording unclear** ✅ FIXED — resolved by BAC-1 rework
- [x] **BAC-14 🟡 MEDIUM — N.I.N.J.A / P.L.A.S.T.E.R timing undefined** ✅ FIXED — already defined (Step 3 / Phase 5); P.L.A.S.T.E.R heals any soldier on same hex
- [x] **BAC-15 🟡 MEDIUM — B.E.A.R extra resource source undefined** ✅ FIXED — extra resource from same hex
- [x] **BAC-16 🟡 MEDIUM — D.U.D.S "flip this card" doesn't fit module system** ✅ FIXED — module removed after deployment, frees backpack slot

### Resource & Economy Issues
- [x] **BAC-17 🟡 MEDIUM — Electricity is over-demanded** ✅ FIXED — swapped H.C.A.R/R.S.G/B.A.S.R to Oil, D.U.D.S to Industry. Electricity now 9/20 (was 13/20)
- [x] **BAC-18 🟡 MEDIUM — Intelligence has no recruiting pressure** ⏭️ DEFERRED — accepted as design feature (tech vs growth currency). Revisit after playtesting.
- [x] **BAC-19 🟢 MINOR — Chest slot is overpriced across the set** ⏭️ DEFERRED — revisit after playtesting
- [x] **BAC-20 🟢 MINOR — DP values don't match actual power** ✅ FIXED — S.H.A.D bumped to 5 DP; D.U.D.S bunker DP split: 2 DP on deployment + 2 DP to hex controller

### Structural Design Issues
- [x] **BAC-21 🔴 CRITICAL — Defense stacking creates unkillable tanks** ⏭️ DEFERRED — revisit after playtesting
- [x] **BAC-22 🟡 MEDIUM — Indirect fire is non-interactive** ⏭️ DEFERRED — targets defend normally, both weapons have −1 defense vulnerability. Revisit after playtesting.
- [x] **BAC-23 🟡 MEDIUM — Backpack slot is overloaded** ⏭️ DEFERRED — D.U.D.S now frees slot after use. Revisit after playtesting.
- [x] **BAC-24 🟡 MEDIUM — 8-copy cap + permanent unlock = monopoly risk** ⏭️ DEFERRED — revisit after playtesting
- [x] **BAC-25 🟡 MEDIUM — Turtling may become optimal** ⏭️ DEFERRED — bunker DP incentivizes capturing, not just building. Revisit after playtesting.

### Data Inconsistency
- [x] **BAC-26 🟡 MEDIUM — Card count mismatch** ✅ FIXED — standardized to 5 copies per type = 100 BAC cards. 8 physical modules remain per type.

> **BAC Rebalance Status:** 26 issues reviewed. 16 fixed, 3 acceptable/already defined, 7 deferred to playtesting.

## Task 6: 🖥️ Tabletop Simulator Prototype
- [x] Set up TTS mod project structure ✅ — `tts/` directory with save generator, Lua scripts, README
- [x] Build hex board with randomized tile placement inside planet frame ✅ — Lua script with Random + Fixed board modes, 61-hex axial grid
- [x] Create all hex tile assets for TTS ✅ — Color-coded placeholder tiles (8 types), ready for art replacement
- [x] Implement BAC card deck (100 cards) with spaceport deck + planet bound area ✅ — 20 types × 5 copies, full descriptions from game-data.json
- [x] Implement Conspire card deck (72 cards) with draw/discard ✅ — 24 types × 3 copies, timing/cost/conditions included
- [x] Build squad board UI with drag-and-drop module slots ✅ — 16 squad boards (4 per player), placeholder tiles
- [x] Script dice rolling (3d6 resource production, combat dice) ✅ — 3 resource dice + 11 combat dice (color-coded per player)
- [x] Implement resource token spawning on hex tiles ✅ — 5 infinite bags (Oil/Elec/Intel/Ind/LF) with colored tokens
- [x] Add number tokens (1-6) placement system ✅ — 16 tokens in bag + Lua auto-placement during board setup
- [x] Build control hex frame system (player colors) ✅ — 4 bags × 25 frames per player
- [x] Add damage token tracking on squad boards ✅ — Infinite bag of red damage tokens
- [x] Implement turn tracker and DP counter ✅ — Interactive shared round counter plus color-coded DP/completed-turn tracker for every player
- [x] Add separatist miniature spawning and movement logic ✅ — Bag of 24 grey minis (manual movement for now)
- [x] Player hand zones and hidden information ✅ — 4 player zones in corners + flag bags
- [ ] Scripted automation (resource production on roll, separatist spawning on matching numbers) — DEFERRED to post-playtesting
- [x] Unloading Zone + Cargo Containers ✅ — 6 containers with labeled zone area
- [x] Planet Bound Area + Equipment Display ✅ — Labeled zones for face-up BAC display and flag tracking
- [x] Bunker tokens ✅ — Bag of 12 bunker tokens
- [x] Player flags (25 per player) ✅ — 4 bags for Equipment Display tracking
- [x] Save file generator ✅ — `tts/generate-save.js` builds save from game-data.json + setup.lua

> **TTS Prototype Status:** Manual play sandbox complete (610 total objects). All game components present with placeholder art. Board setup offers Random or Fixed layout. Scripted automation deferred to post-playtesting.

## Task 7: 🪖 Squad Board Removal & On-Mini State (v33)

**Design pivot:** Squad boards are redundant. All soldier state moves onto the miniature itself.

- [x] **#27 — Soldier ID printed on 40mm magnetized base** (squad letter + number, A1–A7, B1–B7, C1–C7, D1–D7) — spec'd in rulebook + graphics brief
- [x] **#28 — Damage tracking via 3 blood-drop divots on the base** (insert red pegs; 4th wound = death) — spec'd in rulebook + graphics brief
- [x] **#29 — Equipment as 5 magnetized add-ons on the mini** (Head, Chest, Hands, Legs, Backpack) — already specified, reaffirmed
- [x] **#30 — Damage Tokens renamed to Damage Pegs** — global rename in rulebook + game-data.json
- [x] **#31 — Squad Boards removed from rulebook components, setup, combat resolution, and Quick Reference** — done in `WARHAMS-Rulebook.md` and `WARHAMS-Rulebook-Print.md`
- [x] **#32 — Damage resolution rewritten** — pegs go into divots on the defending mini's base, not on a board slot
- [x] **#33 — Setup updated** — players take 10 minis (2 squads of 5) + a damage-peg pool; no squad boards distributed
- [x] **#34 — Graphics brief updated** — new Damage Peg spec (4F), new Lethal Hit Reference Card (4J replacing Squad Boards), new H.A.M.S Base spec (5A)
- [x] **#35 — game-data.json components_summary updated** — `squad_boards` key removed, `damage_tokens` → `damage_pegs`, soldier_miniatures expanded with base spec
- [x] **#36 — TTS: stop generating squad board images** ✅ — `tts/generate-boards.js` replaced with deprecation tombstone (no-op)
- [x] **#37 — TTS: remove squad boards from save layout** ✅ — `tts/generate-save.js` Section 10 removed; 4× squad board tiles + 4× extra-board bags cleared from the table
- [x] **#38 — TTS: damage pegs replace damage tokens** ✅ — bag renamed to "Damage Pegs", item nickname "Blood Peg" with darker red tint; description references base divots
- [x] **#39 — TTS: per-mini squad/soldier ID + standee figurines** ✅ — replaced generic chess-pawn `PlayerPawn` with **stand-up `Custom_Token` figurines**. New script `tts/generate-soldier-figures.js` produces 112 PNGs (4 colors × 28 soldiers) showing a soldier silhouette in player color above a 40mm base disc with the printed squad letter + soldier number and 3 visible blood-drop divots. TTS extrudes the image into a vertical figurine via `CustomToken.Stand=true`. Each soldier is also nicknamed `Red A1` … `Yellow D7` for scripts/UI. This is the TTS analog of the physical mini on its numbered magnetized base.
- [x] **#40 — Regenerate `WARHAMS-Rulebook.pdf`** ✅ — 30 pages, 80 KB, reflects all v33 changes
- [x] **#41 — `CARD_VERSION` bumped v32 → v33** ✅ — cache-busts updated TTS art + JSON

> **v33 Status:** ✅ COMPLETE. Squad boards removed from rulebook, game-data, graphics brief, and TTS save. Soldier state lives entirely on the mini: ID printed on the 40mm magnetized base (TTS nicknames mirror this), damage tracked via blood-drop pegs in 3 divots, equipment as 5 magnetized add-ons. Rulebook PDF and TTS save regenerated.

## Task 8: TTS Playtest Follow-ups

- [x] **Add a button that deals each player their 3 starting BAC cards.** — Added a one-use TTS button that shuffles the Spaceport Deck and deals 3 BACs to every seated Red, Blue, Green, and Yellow player.
- [x] **Change the tree terrain color.** — Kept the original green terrain background and recolored only the tree with orange autumn foliage, clearly separating it from the Green player's pieces.
- [x] **Change each player's starting soldier formations.** — Arranged both starting Squads for every player as separate compact five-soldier plus formations instead of lines.
- [x] **Make setup pieces truly immovable after locking.** — LOCK now applies TTS object locking to every targeted planet tile or number token; UNLOCK releases the pieces again, and the state persists across saves.
- [x] **Consolidate all Separatist rules in the rulebook.** — Made **Phase 7: Separatists** the single authoritative location for components, spawning, behavior, combat, and base conquest, eliminating the need to jump to a separate section.
- [x] **Verify Separatist targeting behavior.** — Confirmed that Separatists target resource-producing hexes only. BAC cards and cargo containers do not attract them; aligned the rulebook, game data, and TTS manual-play notes.
- [x] **Clarify the base range of an unequipped soldier.** — Empty Hands has range 1 (same or adjacent hex) and rolls 1d6 normally. A Hands-slot weapon has range 2 unless its rule states otherwise.
- [x] **Consolidate the rule that fighting is optional.** — Phase 3 now states the choice once, per Squad: declare combat, Conspire instead, or do nothing. Separatist combat during Phase 7 remains mandatory.
- [x] **Add a large locked dice tray east of the Blue and Yellow player areas.** — Added a shared 30 × 12 enclosed throwing tray on the far-east edge, oriented with its long side facing south. It has a black floor, purple walls, and five permanently locked pieces. The Hex Randomizer and resource bags form a column west of the Equipment Display; the display and remaining east-side components were shifted right to keep every area clear.
- [x] **Increase dice sizes.** — Doubled all player-colored combat dice to scale 2. The Separatist die and two Resource dice are twice that size at scale 4 and begin spaced apart inside the shared dice tray.
- [x] **Add combat-location markers.** — Added two movable red circular markers with white labels, matching the First Player marker's size. They stage above the First Player token; combat declaration places a marker at the board location and returns it after resolution.
- [x] **Add dedicated combat zones.** — Added locked North and South Combat Boards around the dice tray, each matching its 30 × 12 footprint. Each has numbered H.A.M.S positions 1–7 with matching die positions in front; the rules preserve every staged soldier's original board state and hex.
- [x] **Reward battle victories.** ✅ FIXED — Added **Combat Step 8: Battle Victory DP**. After combat resolves (including withdrawal), compare total wounds inflicted by each side. The side that inflicted more wounds than they received earns DP equal to the difference, up to **3 DP** per battle. Ties earn nothing. Both attacker and defender are eligible. Battle Victory DP is permanent (never lost) and counts toward **Victory 3: Dominance** alongside equipped BAC DP. The natural combat risk (losing your own soldiers) and the 3-DP cap prevent farming. Updated: Step 8 added to both rulebooks, Victory 3 section rewritten with two DP sources, combat flow tables, quick-reference victory table, and game-data.json (new battle_victory_dp field + updated dominance requirement).
- [x] **Revise the Spaceport Domination victory condition.** ✅ FIXED — Spaceport Domination now requires a **hold check**: declare at end of your turn when you fully control the required number, win at the start of your next turn if you still do. A Spaceport is **fully controlled** when your Control Hex Frame is on it and no enemy soldiers occupy the hex; contested Spaceports don't count. Threshold unchanged (2-player: 5 of 6, 3–4 player: 4 of 6). Also updated the HOW TO WIN intro to clarify that Victories 1 and 2 use hold checks while Victory 3 triggers immediately. Updated: both rulebooks (Victory 1 section, HOW TO WIN intro, quick-reference victory table), game-data.json.
- [x] **Revise the third victory condition.** ✅ FIXED — Victory 3 (Dominance) now clearly defines two DP sources: (1) **BAC card DP** — added to your counter every time you learn a new BAC (unlock) and every time you create a new instance (equip another soldier); subtracted when a soldier dies and their module is destroyed or salvaged. (2) **Battle Victory DP** — permanent DP from combat (Step 8). Threshold remains 50 DP. Updated: Logistics unlocking step 5 + re-equipping text in both rulebooks, Victory 3 tracking text, game-data.json dominance requirement.
- [x] **Delay victory until one whole round after an end-game trigger.** ✅ FIXED — Replaced the hold-check model with a unified **Final Round** mechanism for all three victory conditions. When any player meets any victory condition during their turn, the current round becomes the Final Round — all remaining players take their turns. At the end of the Final Round: one player meets a condition → they win; multiple meet conditions → highest DP wins; no one meets a condition → highest DP wins; DP tied → play additional rounds. Removed hold-check language from Victories 1 and 2. Updated: HOW TO WIN intro, Victory 1–3 sections, Final Round Resolution subsection, quick-reference victory table (added 🏁 Final Round row), game-data.json (removed hold requirements, added final_round entry).
- [x] **Consider a planet-control victory path.** ✅ FIXED — Combined planet control into Victory 3 (Dominance) as a third DP source: **Territory DP**. Each hex you claim (excluding your Landing Zones) is worth +1 DP, added immediately when you place your flag. If an opponent takes that hex from you, you subtract 1 DP and they gain 1 DP. Landing Zones are free starting territory (0 DP). This makes map control a dynamic, contested DP source that flows back and forth. Updated: Claiming a Hex section (both rulebooks), Victory 3 section (three DP sources + tracking text), quick-reference victory table, game-data.json dominance requirement.
- [x] **Adopt squad-based resource collection.** — During the active player's Phase 4, collect 1 available token from each distinct resource hex occupied by their Squads. Each hex provides resources once per turn; B.E.A.R grants +1 only on its soldier's hex and does not stack. Separatists block collection. Removed off-turn combat-participant collection and its priority procedure.
- [x] **Improve card resource clarity.** — Added the same individually outlined, color-coded resource chips to BAC and Conspire costs and to every named resource appearing in either deck's rules, requirements, and conditions. Oil is black, Electricity yellow, Intelligence blue, Industry red, and Local Favor green; numbered amounts stay inside their resource chip. Inline chips wrap with surrounding text without overflow, while non-resource prerequisites use neutral purple.
- [x] **Clarify Phase 5: Purchase & Equip.** State that unlocking a BAC also equips the first copy, and revise step 3 to say: "Pay the card's cost for each additional soldier you wish to equip."
- [x] **Rotate spawned Unloading Zone containers.** — All 12 containers begin east-west so their painted top numbers read upright from the table's south edge.
- [x] **Fix card text overflow.** — Added measured spacing for wrapped slot, timing, and cost fields plus adaptive rule/footer typography for every BAC and Conspire card. Audited the longest cards and A Rough Night so rules and requirements remain inside their designated areas without overlap or clipping.
- [x] **Streamline Phase 7: Separatists.** — Renamed the phase and moved all Separatist data into it as one current, self-contained procedure with no page-24 cross-reference.
- [x] **Clarify Phase 7, Step 3: Move.** ✅ FIXED — Added explicit rule: Separatists move directly to the chosen hex regardless of any friendly or enemy forces in the way — they do not stop, engage, or interact with units on intervening hexes. Interception and combat only happen on the destination hex (Step 4). Added flavor text: "The locals know every cave, tunnel, and goat-path across this world. They slip past armies and through front lines without pause — only the hex they're heading to matters." Updated: Step 3 in both rulebooks, game-data.json Phase 4 description.
- [x] **Add a combat FAQ entry for attacks involving multiple hexes.** Explain that one Squad may attack while its engaged soldiers occupy multiple hexes, and that a Squad concentrated on one hex may target an enemy Squad split across multiple hexes. Combat targets the enemy Squad rather than one occupied hex; soldiers on either side participate only when within engagement range of at least one opposing soldier. Clarify that all engaged soldiers resolve one combat together, out-of-range soldiers sit out, multiple friendly Squads cannot combine into one attack, each Squad attacks only once per turn, and squad coherency still applies.
- [x] **Add Control Flags during Game Setup, Step 9: Squad Placement.** ✅ FIXED — Added a callout after the placement table in Setup Step 9: after placing each Squad, also place one of your Control Flags on the same hex. These hexes are your Landing Zones — they start under your control and give 0 Territory DP. Updated: Setup Step 9 in both rulebooks.
- [x] **Fix Control Flag token height.** ✅ FIXED — Raised the token so its base rests on top of the hex instead of intersecting or passing through the hex surface.
- [x] **Consider healing as an alternative to Conspiring.** — FIXED — Rest action added as one of the 5 action types. Roll 1d3, heal that many damage pegs within the activating Squad.
- [x] **Consider removing counterattack Combat Fatigue.** ? FIXED ? Removed the cumulative -1 fatigue penalty entirely. Counterattack chains now continue naturally until a roll fails to trigger another counter (defense does not beat attack by 3+). Updated: Step 6, worked example, both quick references, game-data.json. Re-evaluate whether the cumulative dice penalty is necessary, including the risk of long counterattack chains and whether a simpler limit or no restriction would play better.
- [x] **Add a visible Extra Actions reference board.** ✅ — Created tts/generate-extra-actions-board.js which produces a 1600×1200 PNG board listing all 5 Squad Actions (Move, Combat, Logistics, Conspire, Rest) with costs, timing, location requirements, and key restrictions. Replaced the old Quick Reference PDF book with a visible Custom_Tile board on the TTS table. Full rulebook PDF remains as a separate book.
- [x] **Consider pre-battle retreat and post-battle advance options.** ? FIXED ? Added Step 7: Defender Withdrawal. After combat resolves, the defender may withdraw surviving soldiers 1 hex away from the attacker for free, following normal movement rules. Soldiers with no valid hex stay put. Only the defender withdraws; the attacker does not advance. Explore allowing the defender to retreat before combat and the winner or attacker to push forward after combat; define timing, movement distance, eligible hexes, pursuit or penalties, control changes, coherency, and interactions with declined or unresolved combat.
- [x] **Add Dominion Point counters for every player.** — Added one locked, color-coded interactive DP counter beside each player's combat dice; values persist with the TTS save.
- [x] **Document when Dominion Points are recorded.** ✅ FIXED — Added a comprehensive **Dominion Points Tracking** table to the Victory 3 section in both rulebooks, listing all four DP sources (BAC Card DP, Battle Victory DP, Territory DP, Bunker DP) with exact add/remove timing and permanence. Bunker DP was previously missing from the Victory 3 source list — now added as the 4th source. Updated: Victory 3 section + quick-reference victory table in both rulebooks, game-data.json dominance requirement.
- [x] **Consider revising the R.S.G range modifier.** ? FIXED ? Changed from "Within 1 hex: +2, Beyond 1 hex: -1" to "Same hex as target: +2, Not same hex: -1". Updated: both rulebooks, game-data.json. Change the Repeating Shotgun to grant +2 attack when the attacker and target are on the same hex, and impose -1 attack whenever they are not on the same hex; review the balance and update all card and rule references if adopted.
- [x] **Add Combat Resolution Step 0: Pre-Combat.** ✅ FIXED — Added formal **Step 0: Pre-Combat** before dice are rolled, with three sub-steps: 0a S.H.A.D reveal (attacker reveals Conspire cards to defender), 0b Pre-Combat Cards (defender first, then attacker responds, resolve immediately), 0c Pre-Combat Attacks (attacker resolves B.A.S.R then S.L.I.M.E; defender's pre-combat attacks resolve after attacker's). Soldiers killed in Step 0 are removed before normal combat; if defender is eliminated, skip to Step 7/8. Updated: combat intro, Step 0 section, both quick-reference tables in both rulebooks.
- [x] **Reword Phase 7, Step 2: Consume.** ✅ FIXED — Reworded to: "Remove 1 token from every hex containing one or more Separatists and one or more resource tokens. Consumption is once per occupied hex, not once per Separatist — a hex with 3 Separatists still loses only 1 token." Updated: Step 2 in both rulebooks, game-data.json Phase 4 description.
- [x] **Clarify Phase 7, Step 3: Move resource behavior.** ✅ NO CHANGE NEEDED — The existing priority rules already produce this behavior: a Separatist on a hex that still has resource tokens after Consume selects that hex as its target (it's a resource-producing hex with tokens within 3 hexes) and moves 0 hexes. No explicit addition required.
- [x] **Consider replacing fixed Squad phases with a 2-action system.** — FIXED — Turn restructured to 4 phases. Phase 2 (Activation Phase) gives each Squad 2 actions: Move, Combat, Logistics, Conspire, or Rest. Logistics combines Purchase/Equip/Trade.
- [x] **Consider revising the first victory condition to use relative army strength.** ✅ FIXED — Replaced the flat "28 soldiers" threshold with a relative comparison: your living soldier count must be **strictly more than 2×** the count of the player with the second-largest army. Exactly 2× does not trigger (ties don't count). Added a worked example (14 vs 4/5/6 → triggered; 14 vs 7 → not triggered). This scales naturally with player count and game state instead of requiring a fixed army size. Updated: Victory 2 section in both rulebooks (with explanation + example), quick-reference victory table, game-data.json military entry.
- [ ] **Consider assigning each soldier their own combat die.** ⏭️ DEFERRED — Tie each rolled die to a specific soldier so players cannot assign the best attack results to whichever soldiers or weapons are most advantageous. Review how this affects matchup assignment, equipment modifiers, larger-Squad dice advantage, targeting, and combat speed.
- [x] **Consider removing double-number resource tiles.** ✅ FIXED — Removed the double-number tile mechanic. Number Tokens reduced from 16 to **15** (removed one "6" token), giving a clean 1-token-per-hex distribution. Edge numbers (1, 2, 6) now have 2 hexes each; middle numbers (3, 4, 5) have 3 hexes each — a natural production curve with no random hotspot advantage. Updated: Number Tokens section + Setup Step 4 in both rulebooks, GRAPHICS-BRIEF, game-data.json, TTS save generator (pool, deck name, deal logic, button description, on-screen help).
- [x] **Consider reducing normal combat engagement range to 1 hex.** ? FIXED ? All Hands-slot weapons now have range 1 (same or adjacent hex) instead of 2. Special weapons retain their ranges: B.A.S.R (2 hex, pre-combat), S.L.I.M.E (3 hex), L.P.M extends to 4 hex. Updated: both rulebooks, BAC card table, game-data.json. Evaluate whether soldiers should participate only when on the same or an adjacent hex, making split Squads more vulnerable. Review weapon ranges, extended-range BACs, defending split Squads, coherency, balance, and how clearly distance is communicated.
- [x] **Consider strengthening Separatists.** ✅ FIXED — Replaced the general −1 combat penalty with **−1 to defense dice only** (minimum result 1), applied to **all Separatists** (roaming and base defenders). Attack dice are now unmodified. Updated: Separatist Combat Rules table, Conquering Bases paragraph, quick-reference table in both rulebooks, and game-data.json mechanics field. Local Militia card retains its own −1 to all dice.
- [x] **Consider lowering the Counterattack threshold to 2+.** ✅ FIXED — Counterattack now triggers when defense beats attack by **2 or more** (was 3+). Chain behavior unchanged: chains continue naturally until a roll fails to trigger another counter. Updated: Step 6 trigger + table + worked example in both rulebooks, combat flow table, key thresholds table, quick-reference combat flow, and game-data.json counterattack field (also cleaned a stray closing paren).
- [x] **Consider combining Phases 5 and 6: Purchase, Equip & Trade.** — FIXED — Combined into the Logistics action as part of the 2-action system.
- [x] **Add round and completed-turn tracking.** — Added a shared round counter and a READY/DONE control to every color-coded player tracker. Advancing to the next round automatically resets all four players to READY; a separate reset control handles corrections.
- [x] **Consider reordering the turn to Movement → Resource Gathering → Combat → Salvage.** — FIXED — Replaced by the 2-action system. Players choose any 2 actions per Squad in any order.
- [x] **Remove extra costs from 1-for-3 resource exchange cards.** — All five exchange cards are now free to play; the single resource named in each effect is the transaction's only payment, making every exchange a true 1-for-3 conversion. Updated card art, rulebook tables, game data, and TTS descriptions.
- [x] **Consider moving C.A.P and prerequisite-based BACs into a Level 2 deck.** ✅ FIXED — Split the 100 BAC cards into a **Spaceport Deck** (75 cards: 15 standard types × 5) and an **Advanced BAC Deck** (25 cards: 5 Level 2 types × 5 — 3 C.A.P armor upgrades + L.P.M + P.A.E.H). Starting draft and Planet Bound Area use only the Spaceport Deck. The Advanced BAC Deck is a face-down deck placed next to the Conspire Deck. A player may draw from it by spending 3 resource tokens of any single type at a Spaceport/City. If a drawn card's prerequisite isn't unlocked yet, the player keeps it in hand and can equip it later. Prerequisites: C.A.P Chest → S.A.P Chest, C.A.P Head → S.A.P Helmet, C.A.P Legs → S.A.P Legs, L.P.M → B.A.S.R or S.L.I.M.E, P.A.E.H → H.C.A.R. C.A.P equipping still trades in the corresponding S.A.P piece. Updated: both rulebooks (setup, acquisition, equipping, Full BAC List), game-data.json, GRAPHICS-BRIEF.md, TTS save.
- [x] **Consider lowering the minimum size of a newly purchased Squad to 3 soldiers.** ✅ FIXED — Reduced the minimum Squad size from 5 to 3 soldiers. Cost is now 3 × (1 Local Favor + 1 Oil + 1 Industry + 1 Electricity) = 3 of each resource. A 3-soldier Squad is cheaper and more accessible but fragile (9 HP, can be wiped in 1-2 bad combats). Max 4 Squads and max 7 soldiers per Squad unchanged. Updated: both rulebooks (Creating New Squads section, quick-reference tables, examples), game-data.json.
- [x] **Consider compensation for heavy battle losses.** ✅ FIXED — Added **Morale Compensation**: at the end of each round, any player who suffered 3 or more wounds during that round gains 1 free resource token of their choice per full 3 wounds suffered (e.g., 7 wounds = 2 tokens, 2 wounds = 0). This provides a gentle comeback path without being exploitable — the cost of losing soldiers (DP loss, board position, action economy) far exceeds the value of a few resource tokens. Updated: both rulebooks (Death section Step 6, combat flow quick-reference tables), game-data.json.
- [x] **Clarify Turn Structure, Step 1: Resource Production.** State what players do with the Separatist die/dice, and update the worked example to demonstrate that handling as well. ✅ FIXED — Phase 1 now explicitly states the Separatist Die's two roles (resource production + base result trigger). Examples updated to show base result resolution (unconquered spawn, conquered Local Favor, and no-match case). Quick reference and game-data.json updated.
- [x] **Clarify moving onto an unconquered Separatist Base.** The current rules allow a Squad to enter the base without triggering combat. Change the rule so that when a Squad enters an unconquered Separatist Base, the 7 base defenders spring into action and combat begins immediately. This combat is part of the Move action and does not cost the Squad another action. ✅ FIXED — Added "Entering an Unconquered Separatist Base" paragraph to the Move action in both rulebooks. Moving onto the base hex now triggers 7 defenders immediately; combat is part of the Move action (no extra action cost). Conquering Bases section updated from "first attack" to "entering." Combat Rules table mandatory combat row updated. game-data.json mechanics field updated.
- [x] **Consider making each battle last 3 combat rounds.** Review how three rounds would affect damage, counterattack chains, withdrawal timing, Separatist Base assaults, battle duration, and balance. ✅ FIXED — Added **Press the Attack** mechanic: combat is now up to 3 rounds (Steps 1–6 repeat). After each round, the defender may withdraw (7a) and the attacker may Press the Attack for another round or end combat (7b). Step 0 (pre-combat) happens once; Battle Victory DP compares total wounds across all rounds. Separatist base defenders never withdraw — attacker can press all 3 rounds, making base conquest feasible. Phase 4 roaming Separatist combats stay 1 round only. Updated: combat intro, Step 0, Steps 4–8, both quick reference tables, key thresholds, Conquering Bases, Separatist Combat section, game-data.json (new press_the_attack field).
- [x] **Resolve the contradiction between conquering a base and routing its defenders.** The current rules require the attacker to defeat all 7 Separatists to claim the base, but also say that every survivor becomes a roaming Separatist after combat. For example, killing only 3 does not conquer the base, yet the remaining 4 abandon it, leaving an empty unconquered base. This does not make sense. Consider requiring attackers to kill more than **X** defenders before the survivors flee; determine X and define what happens when the attackers do not reach it. ✅ FIXED — Added a **routing threshold of 4** (more than half of 7). Three outcomes after a base assault: **Conquest** (all 7 killed → place flag), **Route** (4–6 killed → survivors flee as roaming, base abandoned, attacker claims it or next entrant takes it free), **Hold** (0–3 killed → survivors remain as reduced garrison, attacker repelled, future assaults fight only survivors). Separatist Die spawns reinforce a reduced garrison up to 7. Updated: Conquering Bases section (both rulebooks), Step 7 callout (both rulebooks), game-data.json mechanics field.

## Task 9: Component & Quality-of-Life Improvements

- [ ] **Resource Ready Board** — Add a small shared board with a 2-column, 6-row table. Column 1 lists the numbers 1–6; column 2 has an empty box next to each number. Before the game, players identify which resource type each number currently produces (based on the number tokens placed on the board) and place one ready-to-take resource token of that type in the box next to the matching number. At any given moment, each box holds one resource token of its associated type, ready to be taken instantly. For example, if number 4 currently produces Oil and Electricity, the box next to 4 always has one Oil and one Electricity token available. When a token is taken, refill it from the supply at the end of the round (or when production rolls that number). Place this board **south of the Equipment Display** on the table. This gives players a quick visual reference of what each number produces and speeds up resource gathering.
- [ ] **3-Way Turn Status Button** — Change the current turn tracker button from a 2-state READY/DONE toggle to a **3-way state**: **Turn Ready** (green), **Turn Running** (yellow), **Turn Done** (red). This gives a clearer visual indication of which players are waiting, currently playing, and finished their turn. Update the TTS player trackers and any rulebook references to the turn tracker.
- [ ] **T.I.L.T.S requires at least 2 soldiers to function** — Paying the initial equip cost for T.I.L.T.S on a single soldier gives no benefit — the ability requires **at least 2 adjacent T.I.L.T.S soldiers** to operate (swap one attacker's assigned die between them). Consider whether the first soldier should provide some individual benefit, or whether the rules should explicitly state that equipping only 1 T.I.L.T.S soldier is a setup investment with no effect until a second is equipped. Clarify in the BAC table, equipping rules, and game-data.json.
- [ ] **Resource collection happens after movement — can't grab then leave** — Under the current turn order, resource collection (Phase 3) happens *after* the Activation Phase (Phase 2). A Squad sitting on a resource hex with tokens at the start of their turn must either stay on the hex to collect in Phase 3, or move and forfeit collection. There is no "collect before moving" step. This is counterintuitive — a soldier standing on a pile of oil can't pick it up before walking away. Consider adding a pre-movement collection step, allowing collection as part of a Move action, or reordering phases so collection happens before activation.
- [ ] **Territory Control Conspire cards need one-time-use clarification + consider DP rewards** — Cards like **At the Cover of Darkness** (steal from opponent), **Knowledge is Power** (gain 2 BACs), **Civilian Goods Transport** (gain 4 resources), **Black Gold Syndicate** (draw 2 Conspire cards), and **Factory Cost Savings** (equip BAC free for 2 soldiers) are powerful effects that only require controlling 2+ of a resource type. The rules should explicitly state these are **one-time use per card** (discard after playing, like all Conspire cards). Additionally, consider awarding **DP for successful completion** of these high-impact cards — e.g., +1 or +2 DP — to make them more meaningful and integrate them into the Dominance victory path. Update Conspire card table, game-data.json, and clarify in the Conspiring section.
- [ ] **Label attacker and defender on combat boards and combat markers** — The North and South Combat Boards and the red combat markers should clearly state **"Attacker"** (South) and **"Defender"** (North) so players always know which side is which during combat resolution. Update the combat board graphics, combat marker labels, TTS save, and any rulebook references to the combat boards.
- [ ] **Remove Separatist handicap (−1 to hit dice)** — Separatists are already easy to kill — they have **1 HP each** (die on any hit) and base attack dice. The current **−1 to hit (attack) dice** penalty (minimum result 1) makes them even less threatening, especially in base assaults where the attacker can Press the Attack for up to 3 rounds. Consider removing the penalty entirely so Separatists fight at full strength, making roaming encounters and base assaults more dangerous and rewarding players who prepare before engaging. If removed, also update the Militia dice penalty (currently matches Separatists). Update: Phase 4 Combat Rules table, Conquering Bases, Separatist Combat section, combat key thresholds table, Militia section, game-data.json mechanics field.
- [ ] **DP counter should track sources separately** — The current DP counter is a single total. Consider breaking it down by source so players can see at a glance where their DP comes from: **BAC Card DP**, **Battle Victory DP**, **Territory DP**, **Conquest Bonus DP**, and **Bunker DP**. This makes it easier to audit DP changes (e.g., subtracting BAC DP when a soldier dies, subtracting Territory DP when a hex is lost) and helps players understand which victory strategies are working. Could be done as a multi-row counter on the player tracker, separate colored tokens, or a breakdown panel on the TTS DP counter. Update: player tracker component spec, TTS DP counter, rulebook DP tracking section.
- [ ] **Spaceport Deck delivery frequency — doubles/triples may be too rare** - BACs are delivered from the Planet Bound Area to spaceports only on doubles (exactly two of 3d6 match) or triples (all three match) during Phase 1. Statistical analysis of 3d6 (216 equally likely outcomes):

  | Event | Outcomes | Probability |
  |-------|----------|-------------|
  | Doubles (exactly 2 match) | 90/216 | 41.67% |
  | Triples (all 3 match) | 6/216 | 2.78% |
  | **Combined (doubles or triples)** | **96/216** | **44.44%** |

  - **Per roll:** 0.44 deliveries (44.44% chance)
  - **Per round (2 players, 2 rolls):** 0.89 deliveries
  - **Over 10 rounds:** ~8.9 cards delivered (out of 75-card Spaceport Deck)
  - **Over 15 rounds:** ~13.3 cards delivered
  - **Deck depletion after 15 rounds:** only ~18% of the deck has been used

  This means in a typical game, fewer than 1 BAC per round reaches a spaceport, and the vast majority of the 75-card Spaceport Deck never enters play. Even when a delivery occurs, the card goes to a spaceport — a player still needs a Squad on that specific spaceport to collect it, further reducing the effective rate of cards reaching player hands. Possible solutions to consider:

  1. **Also trigger on "adjacent" numbers** — two dice within 1 of each other (e.g., 3 and 4) count as a match. This would dramatically increase frequency.
  2. **Trigger on any Separatist Die result of 1 or 2** — the grey die alone acts as a "delivery signal" regardless of the other dice, adding a flat ~33% trigger rate.
  3. **Fixed delivery per round** — at the end of each Phase 1, the active player delivers 1 BAC from the PBA to a spaceport of their choice (no dice condition needed). Doubles/triples become a bonus (choose 2 or pick any spaceport).
  4. **Lower the match threshold** — instead of exact matches, any two dice summing to 7 (probability ~41.67% for 2d6) triggers a delivery, independent of the doubles rule.
  5. **Increase PBA size and refill rate** — start with more face-up BACs and refill more aggressively, so even with the current trigger rate, more cards are in circulation.
  6. **Combine approaches** — e.g., fixed 1 delivery per round + doubles gives a bonus delivery + triples gives 2 bonus deliveries.

  Update: Phase 1 rules in both rulebooks, game-data.json Phase 1 description, and any TTS automation references.
- [ ] **+1 Attack Die and +1 Defense Die tokens** - Consider adding physical tokens (or TTS tokens) that grant a temporary **+1 to attack dice** or **+1 to defense dice** bonus to a soldier or Squad for a single combat. These could be earned through Conspire cards, resource spending, terrain effects, Stratagem cards, or as rewards for certain actions (e.g., holding a bunker, winning a battle). Key design questions to resolve: (1) Are they **one-use** (consumed after one combat round) or **persistent** (last the entire combat)? (2) Do they stack with equipment bonuses like C.A.P/S.A.P armor and weapon modifiers, or are they applied after equipment? (3) Can a soldier hold both an attack and defense token simultaneously? (4) How are they acquired — Conspire card effects, a new purchase option in Logistics, spent resources at a Spaceport/City, or earned via Battle Victory DP milestones? (5) Should there be a **−1 token** variant as well (for debuffing enemies)? (6) How do they interact with the Separatist −1 penalty and Combat Fatigue (if it returns)? Consider the impact on combat balance — a +1 attack token on a soldier with a H.C.A.R (+2 attack) could push attack to 9 vs a base defense of 1, nearly guaranteeing a hit. Update: combat rules (both rulebooks), Conspire card table if tied to cards, game-data.json, TTS token bags, and components table.
- [ ] **Action Selection Board with dice markers** - Consider adding a shared or per-player board where each Squad marks its chosen actions using small dice (e.g., player-colored d6s placed on the board). The board would list the 5 available Squad Actions (Move, Combat, Logistics, Conspire, Rest) and each Squad's 2 action slots. Players place a small die showing "1" on their first chosen action and "2" on their second, making it clear to everyone which Squads have acted, what they chose, and in what order. Key design questions: (1) Is the board **per-player** (each player has their own board next to their area) or **shared** (one central board like the round tracker)? (2) Are actions declared **simultaneously** (all players place dice, then resolve in turn order) or **sequentially** (place and resolve one Squad at a time)? (3) Does the board replace the current mental tracking / verbal declaration, or just supplement it? (4) Should used action slots be cleared at end of turn, or remain visible until end of round? (5) In TTS, could this be implemented as a locked board with draggable dice zones? This reduces confusion in multiplayer games about who has done what and prevents disputes over action order. Update: components table, TTS save (new board + small dice), rulebook Setup and Phase 2 sections, game-data.json.
