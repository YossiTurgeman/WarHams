#!/usr/bin/env node
/**
 * W.A.R H.A.M.S Rulebook PDF Generator
 * Converts the Markdown rulebook to a styled PDF using PDFKit (no browser needed).
 */

const fs = require('fs');
const PDFDocument = require('pdfkit');

const INPUT = '/mnt/c/AMP/WarHams/design/WARHAMS-Rulebook.md';
const OUTPUT = '/mnt/c/AMP/WarHams/design/WARHAMS-Rulebook.pdf';

const md = fs.readFileSync(INPUT, 'utf-8');
const lines = md.split('\n');

const doc = new PDFDocument({
  size: 'A4',
  margins: { top: 60, bottom: 0, left: 50, right: 50 },
  info: {
    Title: 'W.A.R H.A.M.S — The Battle for Planet X — Official Rulebook',
    Author: 'W.A.R H.A.M.S Design Team',
    Subject: 'Board Game Rulebook',
  },
});

let outputPath = OUTPUT;
try { fs.accessSync(OUTPUT, fs.constants.W_OK); } catch (e) {
  outputPath = OUTPUT.replace('.pdf', '-new.pdf');
  console.log('Original PDF locked, writing to: ' + outputPath);
}
const stream = fs.createWriteStream(outputPath);
doc.pipe(stream);

// Color palette
const COLORS = {
  bg: '#ffffff',
  text: '#1a1a2e',
  heading1: '#0a0a0f',
  heading2: '#1a1a2e',
  heading3: '#223344',
  heading4: '#334455',
  accent: '#cc4444',
  link: '#2266cc',
  blockquoteBg: '#f0f3f7',
  blockquoteBorder: '#4488cc',
  tableBorder: '#cccccc',
  tableHeader: '#1a1a2e',
  tableHeaderText: '#ffffff',
  tableStripe: '#f4f6f8',
  hrColor: '#cccccc',
  lightText: '#667788',
};

const PAGE_WIDTH = 595.28; // A4
const CONTENT_WIDTH = PAGE_WIDTH - 100; // margins
let y = 60;
let pageNum = 0;

// Sync y on any auto-paginated pages PDFKit creates
doc.on('pageAdded', () => {
  y = 60;
});

function addInlineFooter() {
  doc.font('Helvetica').fontSize(8).fillColor(COLORS.lightText);
  doc.text(
    `W.A.R H.A.M.S -- The Battle for Planet X    |    Page ${pageNum}`,
    50,
    doc.page.height - 40,
    { width: CONTENT_WIDTH, align: 'center', lineBreak: false }
  );
}

function checkPageBreak(needed) {
  if (y + needed > doc.page.height - 60) {
    if (pageNum > 0) addInlineFooter();
    doc.addPage();
    pageNum++;
    return true;
  }
  return false;
}

function drawText(text, options = {}) {
  const {
    fontSize = 10,
    color = COLORS.text,
    bold = false,
    italic = false,
    indent = 0,
    spacing = 4,
    align = 'left',
    width = CONTENT_WIDTH,
  } = options;

  const font = bold && italic ? 'Helvetica-BoldOblique' : bold ? 'Helvetica-Bold' : italic ? 'Helvetica-Oblique' : 'Helvetica';

  // Estimate height
  doc.font(font).fontSize(fontSize);
  const textHeight = doc.heightOfString(text, { width: width - indent });
  checkPageBreak(textHeight + spacing);

  doc.font(font).fontSize(fontSize).fillColor(color);
  doc.text(text, 50 + indent, y, { width: width - indent, align });
  y = doc.y + spacing;
}

function drawHR() {
  checkPageBreak(20);
  y += 6;
  doc.strokeColor(COLORS.hrColor).lineWidth(0.5)
    .moveTo(50, y).lineTo(PAGE_WIDTH - 50, y).stroke();
  y += 10;
}

function sanitizeForHelvetica(text) {
  // Replace special Unicode characters that Helvetica/WinAnsi can't render
  return text
    // Arrows
    .replace(/\u2192/g, '->')    // →
    .replace(/\u2190/g, '<-')    // ←
    // Math operators
    .replace(/\u2212/g, '-')     // minus sign
    .replace(/\u2264/g, '<=')    // ≤
    .replace(/\u2265/g, '>=')    // ≥
    // Check/cross marks
    .replace(/\u2705/g, '[Y]')   // ✅
    .replace(/\u274C/g, '[X]')   // ❌
    // Color squares
    .replace(/\u2B1B/g, '')      // ⬛
    .replace(/\u2B1C/g, '')      // ⬜
    // Strip all remaining emoji (surrogate pairs + common emoji ranges)
    .replace(/[\u{1F000}-\u{1FFFF}]/gu, '')
    .replace(/[\u{2600}-\u{27BF}]/gu, function(m) {
      if (m === '\u2022') return m; // bullet
      return '';
    })
    .replace(/[\u{FE00}-\u{FE0F}]/gu, '') // variation selectors
    .replace(/[\u{200D}]/gu, '')           // zero-width joiner
    .replace(/\s{2,}/g, ' ')              // collapse double spaces from removed emoji
    .trim();
}

function parseInlineFormatting(text) {
  // Strip markdown inline formatting for plain text rendering
  return sanitizeForHelvetica(
    text
      .replace(/\*\*\*(.*?)\*\*\*/g, '$1')
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/`(.*?)`/g, '$1')
      .replace(/\[(.*?)\]\(.*?\)/g, '$1')
  );
}

function drawRichText(text, options = {}) {
  const cleaned = parseInlineFormatting(text);
  // Check if the original has bold markers to determine emphasis
  const hasBold = /\*\*/.test(text);
  drawText(cleaned, { ...options, bold: options.bold || false });
}

// Parse and render tables
function renderTable(tableLines) {
  if (tableLines.length < 2) return;

  const parseRow = (line) =>
    line.split('|').map((c) => c.trim()).filter((c) => c.length > 0);

  const headers = parseRow(tableLines[0]);
  const rows = tableLines.slice(2).map(parseRow);
  const colCount = headers.length;
  if (colCount === 0) return;

  const CELL_PAD = 3;
  const CELL_FONT = 7;
  const HDR_FONT = 7.5;
  const MIN_ROW_H = 16;

  // Column widths proportional to max content length, with minimum width
  const MIN_COL_W = 55;
  const colMaxLen = headers.map((h, ci) => {
    let max = h.length;
    rows.forEach((r) => { if (r[ci]) max = Math.max(max, r[ci].length); });
    return Math.max(max, 5);
  });
  const totalWeight = colMaxLen.reduce((s, l) => s + l, 0);
  let colWidths = colMaxLen.map((len) => (len / totalWeight) * CONTENT_WIDTH);
  // Enforce minimum width — redistribute from wider columns
  let deficit = 0;
  let wideCount = 0;
  colWidths.forEach((w) => { if (w < MIN_COL_W) deficit += MIN_COL_W - w; else wideCount++; });
  if (deficit > 0 && wideCount > 0) {
    const shrinkEach = deficit / wideCount;
    colWidths = colWidths.map((w) => w < MIN_COL_W ? MIN_COL_W : w - shrinkEach);
  }

  // Calculate dynamic row height based on actual text wrapping
  function calcRowH(cells, fontSize, fontName) {
    let maxH = MIN_ROW_H;
    doc.font(fontName).fontSize(fontSize);
    cells.forEach((cell, ci) => {
      if (ci >= colCount) return;
      const h = doc.heightOfString(parseInlineFormatting(cell || ''), { width: colWidths[ci] - 6 }) + CELL_PAD * 2;
      if (h > maxH) maxH = h;
    });
    return Math.ceil(maxH);
  }

  // Draw one row (header or data)
  function drawRow(cells, isHeader, stripe) {
    const fontSize = isHeader ? HDR_FONT : CELL_FONT;
    const fontName = isHeader ? 'Helvetica-Bold' : 'Helvetica';
    const h = calcRowH(cells, fontSize, fontName);

    let x = 50;
    // Background
    if (isHeader) {
      doc.rect(x, y, CONTENT_WIDTH, h).fill(COLORS.tableHeader);
    } else if (stripe) {
      doc.rect(x, y, CONTENT_WIDTH, h).fill(COLORS.tableStripe);
    }
    // Cell text
    cells.forEach((cell, ci) => {
      if (ci >= colCount) return;
      const fc = isHeader ? COLORS.tableHeaderText : COLORS.text;
      doc.font(fontName).fontSize(fontSize).fillColor(fc);
      doc.text(parseInlineFormatting(cell || ''), x + 3, y + CELL_PAD, { width: colWidths[ci] - 6 });
      x += colWidths[ci];
    });
    // Bottom border line
    doc.strokeColor(COLORS.tableBorder).lineWidth(0.5);
    doc.moveTo(50, y + h).lineTo(50 + CONTENT_WIDTH, y + h).stroke();
    y += h;
  }

  // Try to keep small tables together on one page
  const estHeight = rows.reduce((sum, r) => sum + calcRowH(r, CELL_FONT, 'Helvetica'), 0)
    + calcRowH(headers, HDR_FONT, 'Helvetica-Bold');
  if (estHeight <= doc.page.height - 120) {
    checkPageBreak(estHeight + 8);
  }

  // Top border + header
  doc.strokeColor(COLORS.tableBorder).lineWidth(0.5);
  doc.moveTo(50, y).lineTo(50 + CONTENT_WIDTH, y).stroke();
  drawRow(headers, true, false);

  // Data rows
  rows.forEach((row, ri) => {
    const h = calcRowH(row, CELL_FONT, 'Helvetica');
    if (checkPageBreak(h)) {
      // Repeat header on new page
      doc.strokeColor(COLORS.tableBorder).lineWidth(0.5);
      doc.moveTo(50, y).lineTo(50 + CONTENT_WIDTH, y).stroke();
      drawRow(headers, true, false);
    }
    drawRow(row, false, ri % 2 === 0);
  });

  y += 8;
}

// Process the markdown
let i = 0;
let inBlockquote = false;
let blockquoteLines = [];
let inTable = false;
let tableLines = [];
let lastWasHR = false;

function flushBlockquote() {
  if (blockquoteLines.length === 0) return;
  const text = blockquoteLines.map((l) => l.replace(/^>\s*/, '')).join(' ').trim();

  doc.font('Helvetica').fontSize(8);
  const h = doc.heightOfString(parseInlineFormatting(text), { width: CONTENT_WIDTH - 30 }) + 16;
  checkPageBreak(h + 4);
  doc.rect(50, y, CONTENT_WIDTH, h).fill(COLORS.blockquoteBg);
  doc.rect(50, y, 3, h).fill(COLORS.blockquoteBorder);
  doc.font('Helvetica').fontSize(8).fillColor(COLORS.heading4);
  doc.text(parseInlineFormatting(text), 60, y + 8, { width: CONTENT_WIDTH - 30 });
  y = doc.y + 8;

  blockquoteLines = [];
  inBlockquote = false;
}

function flushTable() {
  if (tableLines.length > 0) {
    renderTable(tableLines);
    tableLines = [];
  }
  inTable = false;
}

// Title page
doc.rect(0, 0, PAGE_WIDTH, doc.page.height).fill('#0a0a0f');
y = 200;
doc.font('Helvetica-Bold').fontSize(36).fillColor('#e0d0a0');
doc.text('W.A.R H.A.M.S', 50, y, { width: CONTENT_WIDTH, align: 'center' });
y = doc.y + 6;
doc.font('Helvetica').fontSize(9).fillColor('#998866');
doc.text('WORLD ACCESS RETRIEVABLE HEAVY ASSAULT MODIFIABLE SUITES', 50, y, { width: CONTENT_WIDTH, align: 'center' });
y = doc.y + 16;
doc.font('Helvetica').fontSize(16).fillColor('#cc4444');
doc.text('THE BATTLE FOR PLANET X', 50, y, { width: CONTENT_WIDTH, align: 'center' });
y = doc.y + 40;
doc.strokeColor('#cc4444').lineWidth(1).moveTo(150, y).lineTo(PAGE_WIDTH - 150, y).stroke();
y += 30;
doc.font('Helvetica-Bold').fontSize(18).fillColor('#cccccc');
doc.text('Official Rulebook', 50, y, { width: CONTENT_WIDTH, align: 'center' });
y = doc.y + 60;
doc.font('Helvetica-Oblique').fontSize(10).fillColor('#667788');
doc.text(
  'The corporations have spoken. The planet is rich. The orders are clear.\nDeploy your H.A.M.S, seize every resource, and crush anyone who stands in your way.\nThere is no diplomacy — only Dominance.',
  100,
  y,
  { width: CONTENT_WIDTH - 100, align: 'center' }
);
y = doc.y + 80;
doc.font('Helvetica').fontSize(10).fillColor('#556677');
doc.text('2–4 Players  •  Ages 14+  •  90–150 Minutes', 50, y, { width: CONTENT_WIDTH, align: 'center' });

doc.addPage();
pageNum++; // = 1 (first content page)

while (i < lines.length) {
  const line = lines[i];

  // Skip the frontmatter-like first few lines (title page content already rendered)
  if (i < 10 && (line.startsWith('# ⚔️') || line.startsWith('### *Official') || line.startsWith('---') || line.startsWith('>'))) {
    i++;
    continue;
  }

  // Page break div
  if (line.includes('page-break')) {
    flushBlockquote();
    flushTable();
    if (pageNum > 0) addInlineFooter();
    doc.addPage();
    pageNum++;
    i++;
    continue;
  }

  // Empty line
  if (line.trim() === '') {
    flushBlockquote();
    flushTable();
    i++;
    continue;
  }

  // Table detection
  if (line.includes('|') && line.trim().startsWith('|')) {
    flushBlockquote();
    if (!inTable) inTable = true;
    tableLines.push(line);
    i++;
    continue;
  } else if (inTable) {
    flushTable();
  }

  // Blockquote
  if (line.startsWith('>')) {
    inBlockquote = true;
    blockquoteLines.push(line);
    i++;
    continue;
  } else if (inBlockquote) {
    flushBlockquote();
  }

  // Headings
  if (line.startsWith('# ')) {
    checkPageBreak(120);
    const text = parseInlineFormatting(line.replace(/^#+\s*/, ''));
    drawText(text, { fontSize: 22, color: COLORS.heading1, bold: true, spacing: 8 });
    // Underline
    doc.strokeColor(COLORS.accent).lineWidth(2).moveTo(50, y - 4).lineTo(PAGE_WIDTH - 50, y - 4).stroke();
    y += 6;
    i++;
    continue;
  }

  if (line.startsWith('## ')) {
    flushBlockquote();
    flushTable();
    // Major sections always start on a new page
    if (pageNum > 0) addInlineFooter();
    doc.addPage();
    pageNum++;
    const text = parseInlineFormatting(line.replace(/^#+\s*/, ''));
    drawText(text, { fontSize: 16, color: COLORS.heading2, bold: true, spacing: 6 });
    doc.strokeColor(COLORS.heading2).lineWidth(1).moveTo(50, y - 2).lineTo(PAGE_WIDTH - 50, y - 2).stroke();
    y += 6;
    i++;
    continue;
  }

  if (line.startsWith('### ')) {
    // Reserve enough space for the heading + at least a few lines of content below it
    // so the heading never orphans at the bottom of a page
    checkPageBreak(140);
    y += 4;
    const text = parseInlineFormatting(line.replace(/^#+\s*/, ''));
    drawText(text, { fontSize: 13, color: COLORS.heading3, bold: true, spacing: 5 });
    i++;
    continue;
  }

  if (line.startsWith('#### ')) {
    checkPageBreak(100);
    y += 2;
    const text = parseInlineFormatting(line.replace(/^#+\s*/, ''));
    drawText(text, { fontSize: 11, color: COLORS.heading4, bold: true, spacing: 4 });
    i++;
    continue;
  }

  // Horizontal rule (skip consecutive HRs to avoid empty pages)
  if (line.match(/^---+$/)) {
    if (!lastWasHR) {
      drawHR();
      lastWasHR = true;
    }
    i++;
    continue;
  }

  // Any content below this point is non-HR, so reset the flag
  lastWasHR = false;

  // List items
  if (line.match(/^\s*[-*]\s/)) {
    const text = parseInlineFormatting(line.replace(/^\s*[-*]\s/, ''));
    drawText('•  ' + text, { indent: 10, fontSize: 9 });
    i++;
    continue;
  }

  // Numbered list
  if (line.match(/^\s*\d+\.\s/)) {
    const text = parseInlineFormatting(line.replace(/^\s*(\d+\.)\s/, '$1 '));
    drawText(text, { indent: 10, fontSize: 9 });
    i++;
    continue;
  }

  // Bold section headers (like **Step 1 — ...**)
  if (line.startsWith('**') && line.includes('**')) {
    const text = parseInlineFormatting(line);
    checkPageBreak(80);
    drawText(text, { fontSize: 10, bold: true, spacing: 4 });
    i++;
    continue;
  }

  // Regular paragraph
  const text = parseInlineFormatting(line);
  if (text.trim()) {
    drawRichText(text, { fontSize: 9.5 });
  }
  i++;
}

flushBlockquote();
flushTable();

// Add footer to the last page
if (pageNum > 0) addInlineFooter();

doc.end();

stream.on('finish', () => {
  const stats = fs.statSync(outputPath);
  console.log(`PDF generated: ${OUTPUT}`);
  console.log(`Size: ${(stats.size / 1024).toFixed(0)} KB, Pages: ${pageNum + 1}`);
});
