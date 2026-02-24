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
  margins: { top: 60, bottom: 60, left: 50, right: 50 },
  info: {
    Title: 'W.A.R H.A.M.S — The Battle for Planet X — Official Rulebook',
    Author: 'W.A.R H.A.M.S Design Team',
    Subject: 'Board Game Rulebook',
  },
  bufferPages: true,
});

const stream = fs.createWriteStream(OUTPUT);
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

function checkPageBreak(needed) {
  if (y + needed > doc.page.height - 60) {
    doc.addPage();
    y = 60;
    return true;
  }
  return false;
}

function addFooter() {
  // Will be added via bufferPages at the end
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

function parseInlineFormatting(text) {
  // Strip markdown inline formatting for plain text rendering
  return text
    .replace(/\*\*\*(.*?)\*\*\*/g, '$1')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/`(.*?)`/g, '$1')
    .replace(/\[(.*?)\]\(.*?\)/g, '$1');
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
  // Skip separator line (index 1)
  const rows = tableLines.slice(2).map(parseRow);
  const colCount = headers.length;

  if (colCount === 0) return;

  const colWidth = Math.min(CONTENT_WIDTH / colCount, 200);
  const tableWidth = Math.min(colCount * colWidth, CONTENT_WIDTH);
  const actualColWidths = [];

  // Calculate column widths proportionally
  const totalWeight = headers.reduce((sum, h) => sum + Math.max(h.length, 5), 0);
  headers.forEach((h) => {
    actualColWidths.push((Math.max(h.length, 5) / totalWeight) * CONTENT_WIDTH);
  });

  const rowHeight = 18;
  const totalHeight = (1 + rows.length) * rowHeight + 4;

  checkPageBreak(Math.min(totalHeight, 200));

  // Header row
  let x = 50;
  doc.rect(x, y, CONTENT_WIDTH, rowHeight).fill(COLORS.tableHeader);
  headers.forEach((h, i) => {
    doc.font('Helvetica-Bold').fontSize(7.5).fillColor(COLORS.tableHeaderText);
    doc.text(parseInlineFormatting(h), x + 3, y + 4, {
      width: actualColWidths[i] - 6,
      height: rowHeight,
      ellipsis: true,
    });
    x += actualColWidths[i];
  });
  y += rowHeight;

  // Data rows
  rows.forEach((row, ri) => {
    checkPageBreak(rowHeight);
    x = 50;
    if (ri % 2 === 0) {
      doc.rect(x, y, CONTENT_WIDTH, rowHeight).fill(COLORS.tableStripe);
    }

    row.forEach((cell, ci) => {
      if (ci >= colCount) return;
      doc.font('Helvetica').fontSize(7).fillColor(COLORS.text);
      doc.text(parseInlineFormatting(cell), x + 3, y + 4, {
        width: actualColWidths[ci] - 6,
        height: rowHeight - 2,
        ellipsis: true,
      });
      x += actualColWidths[ci];
    });
    y += rowHeight;
  });

  // Table border
  doc.strokeColor(COLORS.tableBorder).lineWidth(0.5);
  doc.rect(50, y - (1 + rows.length) * rowHeight, CONTENT_WIDTH, (1 + rows.length) * rowHeight).stroke();
  y += 8;
}

// Process the markdown
let i = 0;
let inBlockquote = false;
let blockquoteLines = [];
let inTable = false;
let tableLines = [];

function flushBlockquote() {
  if (blockquoteLines.length === 0) return;
  const text = blockquoteLines.map((l) => l.replace(/^>\s*/, '')).join(' ').trim();

  checkPageBreak(40);
  // Draw blockquote background
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
y = doc.y + 10;
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
y = 60;

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
    doc.addPage();
    y = 60;
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
    checkPageBreak(50);
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
    checkPageBreak(40);
    y += 6;
    const text = parseInlineFormatting(line.replace(/^#+\s*/, ''));
    drawText(text, { fontSize: 16, color: COLORS.heading2, bold: true, spacing: 6 });
    doc.strokeColor(COLORS.heading2).lineWidth(1).moveTo(50, y - 2).lineTo(PAGE_WIDTH - 50, y - 2).stroke();
    y += 6;
    i++;
    continue;
  }

  if (line.startsWith('### ')) {
    checkPageBreak(30);
    y += 4;
    const text = parseInlineFormatting(line.replace(/^#+\s*/, ''));
    drawText(text, { fontSize: 13, color: COLORS.heading3, bold: true, spacing: 5 });
    i++;
    continue;
  }

  if (line.startsWith('#### ')) {
    checkPageBreak(25);
    y += 2;
    const text = parseInlineFormatting(line.replace(/^#+\s*/, ''));
    drawText(text, { fontSize: 11, color: COLORS.heading4, bold: true, spacing: 4 });
    i++;
    continue;
  }

  // Horizontal rule
  if (line.match(/^---+$/)) {
    drawHR();
    i++;
    continue;
  }

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
    checkPageBreak(20);
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

// Add page numbers
const pageCount = doc.bufferedPageRange().count;
for (let p = 0; p < pageCount; p++) {
  doc.switchToPage(p);
  if (p === 0) continue; // Skip title page
  doc.font('Helvetica').fontSize(8).fillColor(COLORS.lightText);
  doc.text(
    `W.A.R H.A.M.S — The Battle for Planet X    |    Page ${p} of ${pageCount - 1}`,
    50,
    doc.page.height - 40,
    { width: CONTENT_WIDTH, align: 'center' }
  );
}

doc.end();

stream.on('finish', () => {
  const stats = fs.statSync(OUTPUT);
  console.log(`PDF generated: ${OUTPUT}`);
  console.log(`Size: ${(stats.size / 1024).toFixed(0)} KB, Pages: ${pageCount}`);
});
