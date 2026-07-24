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
- [x] Implement turn tracker and DP counter ✅ — Notecard with round/DP/spaceport tracking
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
- [ ] **Change the tree terrain color.** Its current green is too similar to the Green player's color; use a clearly distinguishable terrain color.
- [ ] **Change each player's starting soldier formations.** Arrange both groups of 5 soldiers like the five pips on a die (a plus formation), instead of lines.
- [ ] **Make setup pieces truly immovable after locking.** Once setup locks the planet tiles and number tokens, they must actually be locked and unable to move.
- [ ] **Consolidate all Separatist rules in the rulebook.** Unite the rules currently spread across different sections into one authoritative place, using cross-references elsewhere as needed.
- [ ] **Verify Separatist targeting behavior.** Decide and document whether Separatists seek BAC containers as well as resources, or resources only; keep the rulebook, game data, and TTS behavior consistent.
- [ ] **Clarify the base range of an unequipped soldier.** Explicitly state a soldier's initial attack range when they have no equipment.
- [ ] **Consolidate the rule that fighting is optional.** Remove repeated instances from the rulebook and rephrase the single authoritative statement that remains.
- [ ] **Add a large locked dice tray east of the Blue and Yellow player areas.** Provide a dedicated enclosed area where players can throw dice, and lock the tray so it cannot move.
- [ ] **Increase dice sizes.** Make the player-colored dice twice their current size, then make the 3 main resource dice twice as large as the resized player dice.
- [ ] **Consider compensation for heavy battle losses.** Explore and balance a comeback benefit for a player who loses soldiers in battle and/or suffers more than 3 wounds, without making intentional losses exploitable.
- [ ] **Add 2 combat-location markers.** Make each marker the same size as the First Player marker and use them to mark the board locations where combat is happening.
- [ ] **Add a dedicated combat zone.** Provide an area where the squads currently fighting can be brought together and placed facing each other while combat is resolved.
- [ ] **Reward battle victories.** Design and balance a victory-point reward for winning battles to encourage players to initiate combat, while preventing easy point farming or collusion.
- [ ] **Revise the Spaceport Domination victory condition.** In "How to Win," change the requirement to controlling and holding the required Spaceport Landing Zones for 1 whole turn.
- [ ] **Revise the third victory condition.** Count DP earned from cards and DP earned from battle victories toward this victory condition; define and balance both sources clearly.
- [ ] **Delay victory until one whole round after an end-game trigger.** Triggering a win condition should start the final round rather than ending the game immediately; determine the winner after every player has had the appropriate final turn.
- [ ] **Consider a planet-control victory path.** Explore a fourth victory condition for controlling most of the planet, or combine planet control with the revised third victory condition; define a measurable threshold and balance it against the other paths to victory.
- [ ] **Consider squad-based resource collection.** Change collection to: "Gain 1 resource from every resource hex controlled by a Squad. If a soldier in that Squad has B.E.A.R equipped, you may collect 1 additional resource from that hex." Review timing, multiple Squads/B.E.A.R modules, contested hexes, and balance before adopting the rule.
- [ ] **Improve BAC resource-cost clarity.** On each BAC card, surround every required resource type with a background matching that resource's established color, while preserving readable contrast.
- [ ] **Clarify Phase 5: Purchase & Equip.** State that unlocking a BAC also equips the first copy, and revise step 3 to say: "Pay the card's cost for each additional soldier you wish to equip."
- [ ] **Rotate spawned Unloading Zone containers.** Containers spawned on the Unloading Zone should face south instead of west.
- [ ] **Fix card resource-text overflow.** Ensure resource wording has enough room within every card's layout and does not spill past its line or text area; specifically check "A Rough Night" and audit all BAC and Conspire cards for the same issue.
- [ ] **Streamline Phase 7: Move Separatists.** Remove confusing wording inherited from previous rule versions and rewrite the section as one concise, current procedure with no obsolete qualifications or repetition.
- [ ] **Clarify Phase 7, Step 3: Move.** State that Separatists move directly to the chosen hex even when friendly or enemy forces are in the way. Add flavor text explaining that the locals use native knowledge and their own hidden routes to get around intervening forces.
- [ ] **Add a combat FAQ entry for attacks involving multiple hexes.** Explain that one Squad may attack while its engaged soldiers occupy multiple hexes, and that a Squad concentrated on one hex may target an enemy Squad split across multiple hexes. Combat targets the enemy Squad rather than one occupied hex; soldiers on either side participate only when within engagement range of at least one opposing soldier. Clarify that all engaged soldiers resolve one combat together, out-of-range soldiers sit out, multiple friendly Squads cannot combine into one attack, each Squad attacks only once per turn, and squad coherency still applies.
- [ ] **Add Control Flags during Game Setup, Step 9: Squad Placement.** When players place their starting Squads, also place each player's Control Flag on their Landing Zone to show that it begins under their control.
- [ ] **Fix Control Flag token height.** Raise the token so its base rests on top of the hex instead of intersecting or passing through the hex surface.
- [ ] **Consider healing as an alternative to Conspiring.** Explore allowing a Squad to choose a healing action instead of taking an available Conspire action; define eligibility, healing amount, timing, location requirements, and balance against drawing a Conspire card.
- [ ] **Consider removing counterattack Combat Fatigue.** Re-evaluate whether the cumulative dice penalty is necessary, including the risk of long counterattack chains and whether a simpler limit or no restriction would play better.
- [ ] **Add a visible Extra Actions reference board.** Clearly list Trade, Recruit a New Soldier, Recruit a New Squad, and every other extra action with its resource cost, timing, location requirement, and key restrictions.
- [ ] **Consider pre-battle retreat and post-battle advance options.** Explore allowing the defender to retreat before combat and the winner or attacker to push forward after combat; define timing, movement distance, eligible hexes, pursuit or penalties, control changes, coherency, and interactions with declined or unresolved combat.
- [ ] **Add Dominion Point counters for every player.** Provide a clearly visible counter that tracks each player's current DP total.
- [ ] **Document when Dominion Points are recorded.** In the user guide, list every DP source and state exactly when players add or remove those points on their counters, including equipment, battle victories, bunker effects, and any revised victory scoring.
- [ ] **Consider revising the R.S.G range modifier.** Change the Repeating Shotgun to grant +2 attack when the attacker and target are on the same hex, and impose -1 attack whenever they are not on the same hex; review the balance and update all card and rule references if adopted.
- [ ] **Add Combat Resolution Step 0: Pre-Combat.** Insert a formal step before dice are rolled in which all pre-combat cards are played and resolved; define player order, response opportunities, and how simultaneous effects are ordered.
- [ ] **Reword Phase 7, Step 2: Consume.** Replace "Every Separatist sitting on a hex..." with: "Remove 1 token from every hex containing Separatists." Ensure the rest of the step consistently applies consumption once per occupied hex rather than once per Separatist.
- [ ] **Clarify Phase 7, Step 3: Move resource behavior.** State that Separatists occupying a hex where resource tokens are still available remain on that hex and do not move.
- [ ] **Consider replacing fixed Squad phases with a 2-action system.** Give each Squad 2 actions to spend on Move, Combat, Heal/Rest, or Conspire instead of the current fixed Move/Fight/Conspire/Rest structure. Decide whether actions may repeat, define action timing and limits, preserve shared phases such as resource gathering and Separatist movement, and review equipment/card interactions and overall balance.
- [ ] **Consider revising the first victory condition to use relative army strength.** Explore requiring the leading player to have more than twice the strength of the second-largest army, or a similar comparative threshold. Define how army strength is measured, when it is checked, how ties work, and how to prevent an abrupt or unreachable victory condition.
- [ ] **Consider assigning each soldier their own combat die.** Tie each rolled die to a specific soldier so players cannot assign the best attack results to whichever soldiers or weapons are most advantageous. Review how this affects matchup assignment, equipment modifiers, larger-Squad dice advantage, targeting, and combat speed.
- [ ] **Consider removing double-number resource tiles.** Re-evaluate tiles that carry two number tokens because their production is too powerful; compare removing the second number with alternative limits and rebalance tile setup and resource availability accordingly.
- [ ] **Consider reducing normal combat engagement range to 1 hex.** Evaluate whether soldiers should participate only when on the same or an adjacent hex, making split Squads more vulnerable. Review weapon ranges, extended-range BACs, defending split Squads, coherency, balance, and how clearly distance is communicated.
- [ ] **Consider strengthening Separatists.** Replace their general -1 combat penalty with -1 to defense dice only, allowing unmodified attack rolls. Re-evaluate combat odds for roaming groups, base defenders, attacks against players, and militia before adopting the change.
- [ ] **Consider lowering the Counterattack threshold to 2+.** Allow a defender to Counterattack when their defense result exceeds the attack result by 2 or more instead of 3 or more, increasing defensive damage potential. Model the probability, expected damage, chain frequency, equipment interactions, and effect of retaining or removing Combat Fatigue.
- [ ] **Consider combining Phases 5 and 6: Purchase, Equip & Trade.** Allow players to trade resources and then immediately spend resources received during the same combined phase to purchase or equip BACs, recruit, or perform other eligible actions. Define action order, repeated trading and purchasing, location requirements, and multiplayer trade timing.
- [ ] **Consider adding round and completed-turn tracking.** Add a visible round counter plus one player-colored token per player to mark that they have completed their turn in the current round; define how tokens reset and when the round counter advances.
- [ ] **Consider reordering the turn to Movement → Resource Gathering → Combat → Salvage.** Place resource collection early enough that players can use newly gained resources later in the same turn. Review when Purchase/Equip/Trade occurs, whether combat-created salvage can be collected immediately, control timing, contested hexes, BAC collection, and all phase-dependent cards and abilities.
- [ ] **Remove extra costs from 1-for-3 resource exchange cards.** Cards stating "exchange 1 X for 3 Y" should have no separate play cost, ensuring the total transaction is truly 1 resource spent for 3 received rather than 2 for 3. Audit all equivalent cards and align card art, rulebook text, and game data.
- [ ] **Consider moving C.A.P and prerequisite-based BACs into a Level 2 deck.** Separate BACs that require other BACs from the starting deck and unlock their stack later in the game, if they are retained at all. Identify every qualifying BAC, define the unlock trigger and access method, and compare progression, deck balance, availability, and whether removing some cards is preferable.
- [ ] **Consider lowering the minimum size of a newly purchased Squad to 3 soldiers.** Compare the current 5-soldier requirement with a 3-soldier minimum, including total cost, map expansion, action economy, vulnerability, recruitment pacing, Squad limits, and military victory balance.
