/**
 * Verbatim — formatting operations
 *
 * Each cmd* function is a thin wrapper around the implementation in
 * Formatting.gs. They handle the menu wiring; the implementation lives
 * here for testability and reuse.
 */

function cmdPasteText() {
  const text = readClipboardViaUi();
  if (text == null) {
    DocumentApp.getUi().alert(
      'Paste Text: copy text from another source, then run Paste Text (F2). ' +
      'Google Apps Script cannot read the system clipboard, so we paste whatever ' +
      'you typed into the sidebar prompt. Tip: use Edit → Paste special → Paste text ' +
      'in Google Docs instead, which is functionally equivalent to F2.'
    );
    return;
  }
  pasteAsPlainText_(text);
}

function cmdHighlight() {
  toggleHighlightOnSelection_();
}

function cmdUnderline() {
  toggleUnderlineOnSelection_();
}

function cmdEmphasis() {
  toggleEmphasisOnSelection_();
}

function cmdCite() {
  applyCiteOnSelection_();
}

function cmdClearFormatting() {
  clearFormattingOnSelection_();
}

function cmdInsertHeader() {
  insertHeader_();
}

function cmdRemoveHyperlinks() {
  removeHyperlinks_();
}

function cmdAutoFormatCite() {
  autoFormatCites_();
}

function cmdAutoNumberTags() {
  autoNumberTags_();
}

function cmdDeNumberTags() {
  deNumberTags_();
}

function cmdFixFormattingGaps() {
  fixFormattingGaps_();
}

function cmdConvertToDefaultStyles() {
  convertToDefaultStyles_();
}

function cmdSelectSimilar() {
  selectSimilarFormatting_();
}

// ---------- Implementations ----------

function pasteAsPlainText_(text) {
  const doc = DocumentApp.getActiveDocument();
  const sel = doc.getSelection();
  if (!sel) {
    DocumentApp.getUi().alert('Paste Text: cursor or selection required.');
    return;
  }
  // Replace the selected range with plain text.
  const elements = sel.getSelectedElements();
  for (const el of elements) {
    const p = el.getElement().asParagraph ? el.getElement().asParagraph() : null;
    if (p) {
      // Insert plain text after the paragraph.
      p.appendText(text);
      return;
    }
  }
  // Fallback: append at end of body.
  doc.getBody().appendParagraph(text);
}

function toggleHighlightOnSelection_() {
  const doc = DocumentApp.getActiveDocument();
  const sel = doc.getSelection();
  if (!sel) return;
  const elements = sel.getSelectedElements();
  for (const el of elements) {
    const r = el.getElement().asText ? el.getElement().asText() : null;
    if (!r) continue;
    const start = el.getStartOffset ? el.getStartOffset() : 0;
    const end = el.getEndOffsetInclusive ? el.getEndOffsetInclusive() + 1 : r.getText().length;
    // Decide on/off from current state of first character.
    const current = r.getBackgroundColor(start);
    const next = current === '#ffff00' || current === '#FFFF00' ? null : '#ffff00';
    r.setBackgroundColor(start, end - 1, next);
  }
}

function toggleUnderlineOnSelection_() {
  const doc = DocumentApp.getActiveDocument();
  const sel = doc.getSelection();
  if (!sel) return;
  const elements = sel.getSelectedElements();
  for (const el of elements) {
    const r = el.getElement().asText ? el.getElement().asText() : null;
    if (!r) continue;
    const start = el.getStartOffset ? el.getStartOffset() : 0;
    const end = el.getEndOffsetInclusive != null ? el.getEndOffsetInclusive() : r.getText().length - 1;
    const current = r.isUnderline(start);
    r.setUnderline(start, end, !current);
  }
}

function toggleEmphasisOnSelection_() {
  const doc = DocumentApp.getActiveDocument();
  const sel = doc.getSelection();
  if (!sel) return;
  const elements = sel.getSelectedElements();
  for (const el of elements) {
    const p = el.getElement().asParagraph ? el.getElement().asParagraph() : null;
    if (!p) continue;
    const isBoxed = p.getBorderTop && p.getBorderTop();
    if (isBoxed) {
      p.setBorderTop(null);
      p.setBorderBottom(null);
      p.setBorderLeft(null);
      p.setBorderRight(null);
    } else {
      p.setBorderTop(DocumentApp.BorderStyle.SOLID);
      p.setBorderBottom(DocumentApp.BorderStyle.SOLID);
      p.setBorderLeft(DocumentApp.BorderStyle.SOLID);
      p.setBorderRight(DocumentApp.BorderStyle.SOLID);
    }
  }
}

function applyCiteOnSelection_() {
  // Apply Cite style to the paragraph(s) of the selection.
  const doc = DocumentApp.getActiveDocument();
  const sel = doc.getSelection();
  if (!sel) {
    DocumentApp.getUi().alert('Cite: place the cursor on the cite paragraph.');
    return;
  }
  const elements = sel.getSelectedElements();
  for (const el of elements) {
    if (el.getElement().asParagraph) {
      applyParagraphStyle(el.getElement().asParagraph(), 'Cite');
    }
  }
}

function clearFormattingOnSelection_() {
  const doc = DocumentApp.getActiveDocument();
  const sel = doc.getSelection();
  if (!sel) return;
  const elements = sel.getSelectedElements();
  for (const el of elements) {
    const r = el.getElement().asText ? el.getElement().asText() : null;
    if (!r) continue;
    const start = el.getStartOffset ? el.getStartOffset() : 0;
    const end = el.getEndOffsetInclusive != null ? el.getEndOffsetInclusive() : r.getText().length - 1;
    // Setting NORMAL attributes is the closest to "clear formatting" in Docs.
    r.setBold(start, end, false);
    r.setItalic(start, end, false);
    r.setUnderline(start, end, false);
    r.setBackgroundColor(start, end, null);
    r.setForegroundColor(start, end, null);
    r.setFontSize(start, end, 11);
  }
  // Heading → NORMAL
  for (const el of elements) {
    const p = el.getElement().asParagraph ? el.getElement().asParagraph() : null;
    if (!p) continue;
    p.setHeading(DocumentApp.ParagraphHeading.NORMAL);
    p.setBold(false);
  }
}

function insertHeader_() {
  const doc = DocumentApp.getActiveDocument();
  const header = doc.getHeader() || doc.addHeader();
  const profile = loadProfile_();
  const defaultTxt = (profile.name || '') + ' — ' + (profile.school || '') + ' — Verbatim';
  const current = header.getText();
  if (current && current.length) {
    DocumentApp.getUi().alert('Header already present:\n' + current);
    return;
  }
  header.setText(defaultTxt);
  header.setFontSize(10);
  header.setForegroundColor('#666666');
}

function removeHyperlinks_() {
  const doc = DocumentApp.getActiveDocument();
  const body = doc.getBody();
  let count = 0;
  const paragraphs = body.getParagraphs();
  for (const p of paragraphs) {
    const text = p.editAsText();
    for (let i = 0; i < text.getText().length; i++) {
      const link = text.getLinkUrl(i);
      if (link) {
        text.setLinkUrl(i, i, null);
        count++;
      }
    }
  }
  DocumentApp.getUi().alert('Removed ' + count + ' hyperlink(s).');
}

function autoFormatCites_() {
  const doc = DocumentApp.getActiveDocument();
  const body = doc.getBody();
  const paragraphs = body.getParagraphs();
  let touched = 0;
  for (const p of paragraphs) {
    if (p.getHeading() !== DocumentApp.ParagraphHeading.NORMAL) continue;
    if (!p.isBold()) continue; // cite style must already be present
    const txt = p.getText();
    const m = txt.match(/^([A-Z][\w'\-]+(?:\s+[A-Z][\w'\-]+){0,3})/);
    if (!m) continue;
    const nameLen = m[0].length;
    const text = p.editAsText();
    // Bold the entire paragraph if it isn't already (matches Word behavior)
    if (!p.isBold()) text.setBold(0, txt.length - 1, true);
    // Re-bold name and date (date is next 1-12 chars after the name).
    text.setBold(0, nameLen - 1, true);
    // Try to find a 1- to 4-digit year/date after the name.
    const after = txt.substring(nameLen);
    const dm = after.match(/^\s*[,]?\s*(\d{1,4}[\-\/]?\d{0,4})/);
    if (dm) {
      const start = nameLen + dm[0].indexOf(dm[1]);
      const end = start + dm[1].length - 1;
      text.setBold(start, end, true);
    }
    touched++;
  }
  DocumentApp.getUi().alert('Re-formatted ' + touched + ' cite paragraph(s).');
}

function autoNumberTags_() {
  const doc = DocumentApp.getActiveDocument();
  const body = doc.getBody();
  const paragraphs = body.getParagraphs();
  let blockIdx = -1;
  let tagIdx = 0;
  for (let i = 0; i < paragraphs.length; i++) {
    const p = paragraphs[i];
    const h = p.getHeading();
    if (h === DocumentApp.ParagraphHeading.HEADING3) { blockIdx++; tagIdx = 0; }
    if (h === DocumentApp.ParagraphHeading.HEADING4) {
      tagIdx++;
      const txt = p.getText();
      if (!/^\s*\d+\.\s/.test(txt)) {
        p.setText(tagIdx + '. ' + txt.trim());
      }
    }
  }
}

function deNumberTags_() {
  const doc = DocumentApp.getActiveDocument();
  const body = doc.getBody();
  const paragraphs = body.getParagraphs();
  let count = 0;
  for (const p of paragraphs) {
    if (p.getHeading() !== DocumentApp.ParagraphHeading.HEADING4) continue;
    const txt = p.getText();
    const m = txt.match(/^\s*(\d+)\.\s+(.*)$/);
    if (m) { p.setText(m[2]); count++; }
  }
  DocumentApp.getUi().alert('Removed numbers from ' + count + ' tag(s).');
}

function fixFormattingGaps_() {
  // Walk paragraphs and merge adjacent runs with identical attributes.
  const doc = DocumentApp.getActiveDocument();
  const body = doc.getBody();
  const paragraphs = body.getParagraphs();
  let merged = 0;
  for (const p of paragraphs) {
    const text = p.editAsText();
    const t = text.getText();
    let i = 0;
    while (i < t.length) {
      // Find next character whose attributes differ from position i.
      let j = i + 1;
      while (j < t.length && attrsEqual_(text, i, j)) j++;
      // If the run from i+1..j has identical formatting as i, the formatter
      // should already have collapsed it. We just normalize whitespace runs.
      i = j;
    }
    // Replace any "  " inside non-tag paragraphs with " ".
    const tt = p.getText();
    if (tt.includes('  ')) {
      p.setText(tt.replace(/[ \t]+/g, ' '));
      merged++;
    }
  }
  DocumentApp.getUi().alert('Normalized whitespace in ' + merged + ' paragraph(s).');
}

function attrsEqual_(text, a, b) {
  return (
    text.isBold(a) === text.isBold(b) &&
    text.isItalic(a) === text.isItalic(b) &&
    text.isUnderline(a) === text.isUnderline(b) &&
    text.getFontSize(a) === text.getFontSize(b) &&
    text.getBackgroundColor(a) === text.getBackgroundColor(b)
  );
}

function convertToDefaultStyles_() {
  // Map unknown styles to nearest built-in.
  const doc = DocumentApp.getActiveDocument();
  const body = doc.getBody();
  const paragraphs = body.getParagraphs();
  let n = 0;
  for (const p of paragraphs) {
    const name = (p.getAttributes && p.getAttributes().STYLE_NAME) || null;
    if (name && CANONICAL_STYLES.indexOf(name) === -1 && !name.startsWith('HEADING')) {
      // Map by appearance.
      const detected = detectParagraphStyle(p);
      applyParagraphStyle(p, detected === 'Normal' ? 'VerbatimCard' : detected);
      n++;
    }
  }
  DocumentApp.getUi().alert('Converted ' + n + ' unknown style paragraph(s).');
}

function selectSimilarFormatting_() {
  // Google Docs can't programmatically set the user-visible selection,
  // but it can highlight matching paragraphs by inserting a comment or
  // by changing the background briefly. We compromise: select all
  // paragraphs with the same canonical style as the cursor's paragraph.
  const doc = DocumentApp.getActiveDocument();
  const cursor = doc.getCursor();
  if (!cursor) return;
  const el = cursor.getElement();
  const p = el.getParent ? el.getParent().asParagraph() : (el.asParagraph ? el.asParagraph() : null);
  if (!p) return;
  const targetStyle = detectParagraphStyle(p);
  const body = doc.getBody();
  const paragraphs = body.getParagraphs();
  const rangeBuilder = doc.newRange();
  let count = 0;
  for (const pp of paragraphs) {
    if (detectParagraphStyle(pp) === targetStyle) {
      rangeBuilder.addElement(pp);
      count++;
    }
  }
  const range = rangeBuilder.build();
  if (count === 0) {
    DocumentApp.getUi().alert('No matching paragraphs.');
    return;
  }
  doc.setSelection(range);
  DocumentApp.getUi().alert('Selected ' + count + ' paragraph(s) matching style "' + targetStyle + '".');
}

// Stub clipboard reader — Apps Script can't access the system clipboard.
function readClipboardViaUi() {
  const ui = DocumentApp.getUi();
  const resp = ui.prompt(
    'Paste Text',
    'Google Apps Script cannot read the OS clipboard. Paste the text here:',
    ui.ButtonSet.OK_CANCEL
  );
  if (resp.getSelectedButton() !== ui.Button.OK) return null;
  return resp.getResponseText();
}