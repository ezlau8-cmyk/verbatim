/**
 * Verbatim — condense / shrink operations
 *
 * condense(): removes whitespace and optionally inserts pilcrow markers.
 * shrink(): cycles un-underlined text 11 -> 8 -> 7 -> 6 -> 5 -> 4 -> 11
 *
 * Both honor the "Selection Modes" rule:
 *   - explicit selection wins
 *   - else the current card (paragraph beneath a Tag) wins
 *   - else the current heading
 */

function cmdCondense()           { condenseCard_(null); }
function cmdCondenseNoPilcrows() { condenseNoPilcrows_(); }
function cmdCondenseWithPilcrows() { condenseWithPilcrows_(); }
function cmdUncondense()         { uncondense_(); }
function cmdShrink()             { shrinkText_(); }
function cmdUnshrinkAll()        { unshrinkAll_(); }

// ---------- Condense ----------

function condenseCard_(opt) {
  const doc = DocumentApp.getActiveDocument();
  const body = doc.getBody();
  const paragraphs = body.getParagraphs();
  const range = resolveScope_(doc, paragraphs, /*preferCard=*/true);
  if (!range) {
    DocumentApp.getUi().alert('Condense: place cursor in a card or select text.');
    return;
  }
  const usePilcrows = (opt === null) ? loadSettings_().usePilcrows !== false : opt;
  const paraIntegr = (opt === null) ? loadSettings_().paragraphIntegrity !== false : false;
  const startIdx = paragraphs.indexOf(range.startP);
  const endIdx = paragraphs.indexOf(range.endP);
  let touched = 0;
  for (let i = startIdx; i <= endIdx; i++) {
    const p = paragraphs[i];
    if (p.getHeading() !== DocumentApp.ParagraphHeading.NORMAL) continue;
    condenseParagraph_(p, usePilcrows, paraIntegr);
    touched++;
  }
  DocumentApp.getUi().alert('Condensed ' + touched + ' card paragraph(s).');
}

function condenseParagraph_(p, usePilcrows, paraIntegr) {
  let txt = p.getText();
  // 1) Replace tabs / soft breaks / page breaks / non-breaking spaces with a single space.
  txt = txt.replace(/[\u00A0\u2007\u202F\u200B\u200C\u200D]/g, ' '); // nbsp, figure space, thin space, zero-width
  txt = txt.replace(/\t/g, ' ');
  txt = txt.replace(/\r/g, '');
  txt = txt.replace(/\u2028/g, '');  // line separator
  // 2) Replace multiple spaces with one.
  txt = txt.replace(/[ ]{2,}/g, ' ');
  if (paraIntegr) {
    // Insert pilcrow at every paragraph break.
    if (usePilcrows) {
      txt = txt.replace(/\n+/g, ' ' + PILCROW + ' ');
    } else {
      txt = txt.replace(/\n+/g, ' ');
    }
  } else {
    txt = txt.replace(/\n+/g, ' ');
  }
  txt = txt.replace(/^\s+|\s+$/g, '');
  // Only assign if it actually changed.
  if (txt !== p.getText()) p.setText(txt);
}

function condenseNoPilcrows_() { condenseCard_(false); }
function condenseWithPilcrows_() { condenseCard_(true); }

function uncondense_() {
  // Replace pilcrows with real paragraph breaks.
  const doc = DocumentApp.getActiveDocument();
  const body = doc.getBody();
  const paragraphs = body.getParagraphs();
  let n = 0;
  for (const p of paragraphs) {
    const txt = p.getText();
    const m = txt.match(PILCROW_RE);
    if (!m) continue;
    // We must split the paragraph by pilcrows; subsequent ones become children of p.
    const parts = txt.split(PILCROW_RE);
    if (parts.length <= 1) continue;
    p.setText(parts[0].trim());
    let last = p;
    for (let i = 1; i < parts.length; i++) {
      const np = doc.getBody().insertParagraphAfter(last, parts[i].trim());
      np.setHeading(DocumentApp.ParagraphHeading.NORMAL);
      last = np;
    }
    n++;
  }
  DocumentApp.getUi().alert('Uncondensed ' + n + ' paragraph(s).');
}

// ---------- Shrink ----------

function shrinkText_() {
  const doc = DocumentApp.getActiveDocument();
  const body = doc.getBody();
  const paragraphs = body.getParagraphs();
  const range = resolveScope_(doc, paragraphs, /*preferCard=*/true);
  if (!range) {
    DocumentApp.getUi().alert('Shrink: place cursor in a card or select text.');
    return;
  }
  const startIdx = paragraphs.indexOf(range.startP);
  const endIdx = paragraphs.indexOf(range.endP);
  let touched = 0;
  for (let i = startIdx; i <= endIdx; i++) {
    const p = paragraphs[i];
    if (p.getHeading() !== DocumentApp.ParagraphHeading.NORMAL) continue;
    shrinkParagraph_(p);
    touched++;
  }
  DocumentApp.getUi().alert('Shrunk ' + touched + ' card paragraph(s).');
}

function shrinkParagraph_(p) {
  // Decide target size: walk the size cycle by reading the smallest font size
  // in any un-underlined range.
  const text = p.editAsText();
  const t = text.getText();
  if (!t.length) return;
  let baseSize = text.getFontSize(0) || 11;
  // Find smallest non-pilcrow font size (Word ignores pilcrows for size decision).
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (PILCROW_RE.test(c)) continue;
    const s = text.getFontSize(i) || 11;
    if (s && s < baseSize) baseSize = s;
  }
  // Find the next smaller size in cycle, else wrap to base (Normal).
  const cycleIdx = SHRINK_SIZES.indexOf(baseSize);
  let newSize;
  if (cycleIdx === -1) newSize = 8;
  else if (cycleIdx === SHRINK_SIZES.length - 1) newSize = 11;
  else newSize = SHRINK_SIZES[cycleIdx + 1];
  // Apply to un-underlined runs only.
  let i = 0;
  while (i < t.length) {
    // Skip pilcrows
    if (PILCROW_RE.test(t[i])) { i++; continue; }
    // Find end of un-underlined run.
    let j = i;
    while (j < t.length && !text.isUnderline(j) && !PILCROW_RE.test(t[j])) j++;
    if (j > i) text.setFontSize(i, j - 1, newSize);
    i = j + 1;
  }
  // Restore omission note size if option says so.
  const settings = loadSettings_();
  if (!settings.shrinkOmissions) {
    const re = OMISSION_RE;
    let m;
    while ((m = re.exec(t)) !== null) {
      const start = m.index;
      const end = m.index + m[0].length - 1;
      try { text.setFontSize(start, end, 11); } catch (e) {}
    }
  }
}

function unshrinkAll_() {
  const doc = DocumentApp.getActiveDocument();
  const body = doc.getBody();
  const paragraphs = body.getParagraphs();
  let n = 0;
  for (const p of paragraphs) {
    if (p.getHeading() !== DocumentApp.ParagraphHeading.NORMAL) continue;
    const text = p.editAsText();
    const t = text.getText();
    let i = 0;
    while (i < t.length) {
      let j = i + 1;
      while (j < t.length && text.getFontSize(j) === text.getFontSize(i)) j++;
      if (text.getFontSize(i) < 11) {
        text.setFontSize(i, j - 1, 11);
      }
      i = j;
    }
    n++;
  }
  DocumentApp.getUi().alert('Reset font size on ' + n + ' paragraph(s).');
}

// ---------- Scope resolution ----------

function resolveScope_(doc, paragraphs, preferCard) {
  const sel = doc.getSelection();
  if (sel) {
    const elements = sel.getSelectedElements();
    if (elements && elements.length) {
      // Find paragraph indices for first and last selected paragraph.
      let startIdx = -1, endIdx = -1;
      for (const el of elements) {
        const p = el.getElement().asParagraph ? el.getElement().asParagraph() :
                  (el.getElement().getParent && el.getElement().getParent().asParagraph
                    ? el.getElement().getParent().asParagraph() : null);
        if (!p) continue;
        const idx = paragraphs.indexOf(p);
        if (idx < 0) continue;
        if (startIdx === -1) startIdx = idx;
        endIdx = idx;
      }
      if (startIdx !== -1) {
        return { startP: paragraphs[startIdx], endP: paragraphs[endIdx] };
      }
    }
  }
  // No selection: prefer the cursor's card; fall back to heading+content.
  const cursor = doc.getCursor();
  if (!cursor) return null;
  const el = cursor.getElement();
  const p = el.asParagraph ? el.asParagraph() :
            (el.getParent && el.getParent().asParagraph ? el.getParent().asParagraph() : null);
  if (!p) return null;
  if (preferCard && p.getHeading() === DocumentApp.ParagraphHeading.NORMAL) {
    return { startP: p, endP: p };
  }
  const endIdx = findHeadingEndIndex_(p);
  const startIdx = paragraphs.indexOf(p);
  return { startP: paragraphs[startIdx], endP: paragraphs[endIdx] };
}