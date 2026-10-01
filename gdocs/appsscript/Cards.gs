/**
 * Verbatim — card cutting / organization
 *
 * Mapping to Word:
 *   - F4/F5/F6/F7 apply Pocket/Hat/Block/Tag style to the current paragraph.
 *   - MoveUp/MoveDown reorders paragraphs (cards, tags, etc.).
 *   - SelectHeading picks the current paragraph + its content.
 *   - DeleteHeading deletes the heading and any content beneath it up to
 *     the next sibling-or-higher heading.
 *   - RemoveBlanks deletes empty heading paragraphs.
 *   - RemovePilcrows removes all pilcrow characters.
 *   - Invisibility modes flip text color to background.
 */

function cmdPocket() { applyHeadingAtCursor_('Pocket'); }
function cmdHat()    { applyHeadingAtCursor_('Hat'); }
function cmdBlock()  { applyHeadingAtCursor_('Block'); }
function cmdTag()    { applyHeadingAtCursor_('Tag'); }

function cmdMoveUp()    { moveHeading_(false); }
function cmdMoveDown()  { moveHeading_(true); }
function cmdMoveToBottom() { moveHeadingToBottom_(); }

function cmdSelectHeading() { selectHeadingAndContent_(); }

function cmdDeleteHeading() { deleteHeading_(); }

function cmdRemoveBlanks() { removeBlanks_(); }

function cmdRemovePilcrows() { removePilcrows_(); }

function cmdInvisibilityToggle() { toggleInvisibility_(); }
function cmdInvisibilityOn() { setInvisibility_(true); }
function cmdInvisibilityOff() { setInvisibility_(false); }

// ---------- Implementations ----------

function applyHeadingAtCursor_(style) {
  const doc = DocumentApp.getActiveDocument();
  const cursor = doc.getCursor();
  const sel = doc.getSelection();
  if (cursor) {
    const el = cursor.getElement();
    const p = el.asParagraph ? el.asParagraph() :
              (el.getParent && el.getParent().asParagraph ? el.getParent().asParagraph() : null);
    if (p) { applyParagraphStyle(p, style); return; }
  }
  if (sel) {
    const elements = sel.getSelectedElements();
    for (const el of elements) {
      if (el.getElement().asParagraph) {
        applyParagraphStyle(el.getElement().asParagraph(), style);
      }
    }
    return;
  }
  DocumentApp.getUi().alert('Place the cursor in the paragraph to format.');
}

function moveHeading_(down) {
  const doc = DocumentApp.getActiveDocument();
  const cursor = doc.getCursor();
  if (!cursor) return;
  const p = currentParagraph_(cursor);
  if (!p) return;
  const body = doc.getBody();
  const content = p.getText();
  const heading = p.getHeading();
  const isBold = p.isBold();
  const fontSize = p.getFontSize();
  const paragraphs = body.getParagraphs();
  const idx = paragraphs.indexOf(p);
  if (idx < 0) return;
  if (down && idx === paragraphs.length - 1) return;
  if (!down && idx === 0) return;
  // Remove the original paragraph first; the array is mutated.
  p.removeFromParent();
  // Recompute the live array and use the index that *would* have been there.
  const live = body.getParagraphs();
  const targetIdx = down ? idx : idx - 1;
  const after = live[targetIdx];
  const newP = down ? body.insertParagraphAfter(after, content)
                    : body.insertParagraphBefore(after, content);
  newP.setHeading(heading);
  newP.setBold(isBold);
  if (fontSize) newP.setFontSize(fontSize);
  // Move cursor to the new paragraph.
  doc.setCursor(doc.newPosition(newP, 0));
}

function moveHeadingToBottom_() {
  const doc = DocumentApp.getActiveDocument();
  const cursor = doc.getCursor();
  if (!cursor) return;
  const p = currentParagraph_(cursor);
  if (!p) return;
  const body = doc.getBody();
  const content = p.getText();
  const heading = p.getHeading();
  const isBold = p.isBold();
  const fontSize = p.getFontSize();
  p.removeFromParent();
  const newP = body.appendParagraph(content);
  newP.setHeading(heading);
  newP.setBold(isBold);
  if (fontSize) newP.setFontSize(fontSize);
  doc.setCursor(doc.newPosition(newP, 0));
}

function selectHeadingAndContent_() {
  // Expand the user selection to cover the entire heading paragraph plus
  // all body paragraphs beneath it until the next same-or-higher heading.
  const doc = DocumentApp.getActiveDocument();
  const cursor = doc.getCursor();
  const sel = doc.getSelection();
  let startP;
  if (cursor) startP = currentParagraph_(cursor);
  if (sel && !startP) {
    const els = sel.getSelectedElements();
    if (els.length) startP = els[0].getElement().asParagraph;
  }
  if (!startP) return;
  const endIdx = findHeadingEndIndex_(startP);
  const body = doc.getBody();
  const paragraphs = body.getParagraphs();
  const startIdx = paragraphs.indexOf(startP);
  const range = doc.newRange()
    .addElementsBetween(paragraphs[startIdx], paragraphs[endIdx])
    .build();
  doc.setSelection(range);
}

function currentParagraph_(cursor) {
  const el = cursor.getElement();
  if (el.asParagraph) return el.asParagraph();
  if (el.getParent && el.getParent().asParagraph) return el.getParent().asParagraph();
  return null;
}

function findHeadingEndIndex_(startP) {
  const doc = DocumentApp.getActiveDocument();
  const body = doc.getBody();
  const paragraphs = body.getParagraphs();
  const startIdx = paragraphs.indexOf(startP);
  const startLevel = headingLevel_(startP.getHeading());
  for (let i = startIdx + 1; i < paragraphs.length; i++) {
    const lvl = headingLevel_(paragraphs[i].getHeading());
    if (lvl <= startLevel) return i - 1;
  }
  return paragraphs.length - 1;
}

function headingLevel_(h) {
  switch (h) {
    case DocumentApp.ParagraphHeading.HEADING1: return 0;
    case DocumentApp.ParagraphHeading.HEADING2: return 1;
    case DocumentApp.ParagraphHeading.HEADING3: return 2;
    case DocumentApp.ParagraphHeading.HEADING4: return 3;
    default: return 99;
  }
}

function deleteHeading_() {
  const doc = DocumentApp.getActiveDocument();
  const cursor = doc.getCursor();
  if (!cursor) return;
  const p = currentParagraph_(cursor);
  if (!p) return;
  const body = doc.getBody();
  const paragraphs = body.getParagraphs();
  const idx = paragraphs.indexOf(p);
  if (idx < 0) return;
  const endIdx = findHeadingEndIndex_(p);
  // Remove p..endIdx inclusive.
  for (let i = endIdx; i >= idx; i--) {
    paragraphs[i].removeFromParent();
  }
}

function removeBlanks_() {
  const doc = DocumentApp.getActiveDocument();
  const body = doc.getBody();
  const paragraphs = body.getParagraphs();
  let removed = 0;
  for (let i = paragraphs.length - 1; i >= 0; i--) {
    const p = paragraphs[i];
    const h = p.getHeading();
    if (h === DocumentApp.ParagraphHeading.NORMAL) continue;
    if (isEmptyParagraph(p)) {
      p.removeFromParent();
      removed++;
    }
  }
  DocumentApp.getUi().alert('Removed ' + removed + ' blank heading(s).');
}

function removePilcrows_() {
  const doc = DocumentApp.getActiveDocument();
  const body = doc.getBody();
  const paragraphs = body.getParagraphs();
  let removed = 0;
  for (const p of paragraphs) {
    const t = p.editAsText();
    const txt = t.getText();
    const replaced = txt.replace(PILCROW_RE, '');
    if (replaced.length !== txt.length) {
      p.setText(replaced);
      removed++;
    }
  }
  DocumentApp.getUi().alert('Removed pilcrows from ' + removed + ' paragraph(s).');
}

function toggleInvisibility_() {
  const doc = DocumentApp.getActiveDocument();
  const sel = doc.getSelection();
  if (!sel) return;
  const elements = sel.getSelectedElements();
  for (const el of elements) {
    const r = el.getElement().asText ? el.getElement().asText() : null;
    if (!r) continue;
    const start = el.getStartOffset != null ? el.getStartOffset() : 0;
    const end = el.getEndOffsetInclusive != null ? el.getEndOffsetInclusive() : r.getText().length - 1;
    const current = r.getForegroundColor(start);
    const next = current === '#ffffff' || current === '#FFFFFF' ? null : '#ffffff';
    r.setForegroundColor(start, end, next);
  }
}

function setInvisibility_(on) {
  const doc = DocumentApp.getActiveDocument();
  const sel = doc.getSelection();
  if (!sel) return;
  const elements = sel.getSelectedElements();
  for (const el of elements) {
    const r = el.getElement().asText ? el.getElement().asText() : null;
    if (!r) continue;
    const start = el.getStartOffset != null ? el.getStartOffset() : 0;
    const end = el.getEndOffsetInclusive != null ? el.getEndOffsetInclusive() : r.getText().length - 1;
    r.setForegroundColor(start, end, on ? '#ffffff' : null);
  }
}