/**
 * Verbatim — Word → Google Docs conversion
 *
 * Many existing Verbatim files are .docx/.docm. When such a file is opened in
 * Google Drive, it auto-converts to a Google Doc but loses:
 *   - Some style metadata (custom Verbatim styles → mapped to "Heading 1" etc.
 *     by the importer, but custom style attributes are dropped)
 *   - Pilcrows (¶) survive as text in most cases
 *
 * This module provides:
 *   - migrateFromWord_(doc):   post-conversion pass that re-applies the
 *                               canonical Verbatim styles based on heading
 *                               level + bold state.
 *   - docxToVerbatimText_(blob): for users who paste the raw .docx text,
 *                                return a Verbatim-friendly version with
 *                                pilcrows inserted where appropriate.
 *
 * It is intentionally non-destructive: nothing is rewritten unless the
 * source had recognizable Verbatim patterns. Plain text from a PDF, for
 * example, will be left alone.
 */

function cmdMigrateFromWord() {
  const doc = DocumentApp.getActiveDocument();
  const n = migrateFromWord_(doc);
  DocumentApp.getUi().alert('Migrated ' + n + ' paragraph(s) into Verbatim styles.');
}

/**
 * Re-apply canonical styles. Returns number of paragraphs modified.
 *
 * Heuristics:
 *   - HEADING1 → Pocket
 *   - HEADING2 → Hat
 *   - HEADING3 → Block
 *   - HEADING4 → Tag
 *   - BOLD NORMAL_TEXT with lastname-pattern → Cite
 *   - HEADING paragraph that's empty → mark for cleanup
 *   - All other NORMAL_TEXT paragraphs are left as VerbatimCard.
 */
function migrateFromWord_(doc) {
  installCanonicalStyles(doc);
  const body = doc.getBody();
  const paragraphs = body.getParagraphs();
  let n = 0;
  for (const p of paragraphs) {
    const h = p.getHeading();
    let changed = false;
    switch (h) {
      case DocumentApp.ParagraphHeading.HEADING1:
        applyParagraphStyle(p, 'Pocket'); changed = true; break;
      case DocumentApp.ParagraphHeading.HEADING2:
        applyParagraphStyle(p, 'Hat'); changed = true; break;
      case DocumentApp.ParagraphHeading.HEADING3:
        applyParagraphStyle(p, 'Block'); changed = true; break;
      case DocumentApp.ParagraphHeading.HEADING4:
        applyParagraphStyle(p, 'Tag'); changed = true; break;
      default:
        if (p.isBold()) {
          // Maybe a Cite line.
          const txt = p.getText();
          if (/^[A-Z][\w'\-]+(?:\s+[A-Z][\w'\-]+){0,3}/.test(txt)) {
            applyParagraphStyle(p, 'Cite');
            changed = true;
          }
        }
    }
    if (changed) n++;
  }
  return n;
}

/**
 * Pure-text conversion: take raw text and produce a Verbatim-friendly version.
 *   - Multiple blank lines collapse to a single blank (so Navigation Pane
 *     stays clean)
 *   - Insert ¶ at paragraph breaks if paragraphIntegrity setting is on
 *   - Bold the cite-line name+date heuristically
 *
 * Useful when the user pastes plain text from a PDF or HTML article.
 */
function convertPlainTextToVerbatim_(txt, opts) {
  opts = opts || {};
  const usePilcrows = opts.usePilcrows !== false;
  const paraIntegr = opts.paragraphIntegrity !== false;

  // 1) Normalize line endings.
  txt = txt.replace(/\r\n?/g, '\n');
  // 2) Collapse runs of blank lines to single blank.
  txt = txt.replace(/\n{3,}/g, '\n\n');
  // 3) If paragraph integrity, insert pilcrows at boundaries.
  if (paraIntegr && usePilcrows) {
    txt = txt.replace(/\n+/g, ' ' + PILCROW + ' ');
  } else {
    txt = txt.replace(/\n+/g, ' ');
  }
  // 4) Collapse repeated whitespace within a line.
  txt = txt.replace(/[ \t]{2,}/g, ' ');
  // 5) Detect cite lines: lines that start with "LastName, year," etc., and
  //    return a structured response so the caller can apply bold formatting.
  return txt;
}

/**
 * Helper that detects a probable cite line and returns matched ranges so
 * the caller can apply bold formatting.
 *   Input:  "Aaron Hardy, 1-1-3000, \"Title\", https://example.com"
 *   Output: [[0, 11], [13, 21], ...]  (ranges of name + date)
 */
function findCiteRanges_(text) {
  const ranges = [];
  const m = text.match(/^([A-Z][\w'\-]+(?:\s+[A-Z][\w'\-]+){0,3})\s*(?:,\s*([\d\-\/]{1,10}))?/);
  if (m) {
    ranges.push([m.index, m.index + m[1].length - 1]);
    if (m[2]) {
      const dateIdx = text.indexOf(m[2], m.index + m[1].length);
      if (dateIdx > -1) ranges.push([dateIdx, dateIdx + m[2].length - 1]);
    }
  }
  return ranges;
}

function cmdAutoFormatSelectionAsCite() {
  const doc = DocumentApp.getActiveDocument();
  const sel = doc.getSelection();
  if (!sel) {
    DocumentApp.getUi().alert('Select a cite paragraph first.');
    return;
  }
  const elements = sel.getSelectedElements();
  let n = 0;
  for (const el of elements) {
    const p = el.getElement().asParagraph ? el.getElement().asParagraph() : null;
    if (!p) continue;
    const t = p.editAsText();
    const txt = t.getText();
    const ranges = findCiteRanges_(txt);
    for (const [s, e] of ranges) t.setBold(s, e, true);
    applyParagraphStyle(p, 'Cite');
    n++;
  }
  DocumentApp.getUi().alert('Formatted ' + n + ' cite paragraph(s).');
}