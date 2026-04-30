#!/usr/bin/env node
/**
 * W.A.R H.A.M.S — Squad Board Image Generator (DEPRECATED in v33)
 *
 * Squad boards have been removed from the game. Soldier state now lives
 * on the miniature itself:
 *   - Squad letter + soldier number printed on the 40mm magnetized base
 *   - Damage tracked via blood-drop pegs in 3 divots on the base
 *   - Equipment as 5 magnetized add-ons on the body (Head, Chest, Hands,
 *     Legs, Backpack)
 *
 * This script is kept as a tombstone so the old artifact path is documented.
 * Running it is a no-op.
 *
 * See:
 *   - design/WARHAMS-Rulebook.md (Components, Setup, Combat → Damage)
 *   - design/GRAPHICS-BRIEF.md   (4F Damage Pegs, 4J Lethal Hit Reference, 5A H.A.M.S Base)
 *   - design/TODO.md             (Task 7 — Squad Board Removal & On-Mini State)
 */

console.log("[generate-boards.js] Deprecated in v33. Squad boards removed — soldier state lives on the mini base. No output produced.");
process.exit(0);
