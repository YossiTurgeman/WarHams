#!/usr/bin/env node
/**
 * W.A.R H.A.M.S — Quick Reference PDF Generator
 * Writes a single-page Quick Reference card as a PDF for use as an
 * in-game Custom_PDF object alongside the full rulebook.
 *
 * Output: design/WARHAMS-QuickRef.pdf
 */

const fs = require("fs");
const path = require("path");
const PDFDocument = require("pdfkit");

const OUTPUT = path.join(__dirname, "WARHAMS-QuickRef.pdf");

const doc = new PDFDocument({
    size: "A5",
    margins: { top: 36, bottom: 36, left: 36, right: 36 },
    info: { Title: "W.A.R H.A.M.S — Quick Reference", Author: "WARHAMS" },
});
doc.pipe(fs.createWriteStream(OUTPUT));

// Cover-style header
doc.font("Helvetica-Bold").fontSize(20).fillColor("#a01818")
   .text("W.A.R H.A.M.S — Quick Reference", { align: "center" });
doc.moveDown(0.3);
doc.strokeColor("#a01818").lineWidth(1)
   .moveTo(36, doc.y).lineTo(doc.page.width - 36, doc.y).stroke();
doc.moveDown(0.8);

function section(title) {
    doc.moveDown(0.3);
    doc.font("Helvetica-Bold").fontSize(13).fillColor("#222").text(title);
    doc.moveDown(0.2);
    doc.font("Helvetica").fontSize(11).fillColor("#111");
}
function line(text) { doc.text(text, { paragraphGap: 1 }); }

section("TURN PHASES (in order)");
line("1. Resource Production — Roll 2d6 + Separatist Die");
line("2. Movement — 1 hex (2 with Jet Jump)");
line("3. Combat — within 2 hexes");
line("4. Resource Gathering");
line("5. Purchase & Equip");
line("6. Trade (bank 3:1)");
line("7. Move Separatists");

section("COMBAT SEQUENCE");
line("Pre → 1. Roll → 2. Assign → 3. Equipment Bonus");
line("→ 4. Conspire → 5. Damage → 6. Counter (3+ blocks)");

section("EQUIPMENT SLOTS");
line("1 = Head     2 = Back     3 = Legs");
line("4–5 = Chest  6 = Hands");

section("VICTORY (any one)");
line("• Spaceport Domination: 5/6 (2p) | 4/6 (3-4p)");
line("• Military Supremacy: 28 soldiers held 1 round");
line("• Dominance: 50 DP from equipped BACs");

section("DAMAGE PEGS");
line("Each soldier base has 3 divots. 4th wound = death.");

section("DOUBLES BONUS");
line("Doubles on the 2d6 trigger a free BAC delivery to the");
line("Unloading Zone (separate from production).");

doc.end();
console.log(`Wrote ${OUTPUT}`);
