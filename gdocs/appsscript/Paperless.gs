/**
 * Verbatim — paperless operations
 *
 * Send-to-speech and Mark-Card are the centerpiece of paperless debate:
 * cut a card from the open file and append it (or insert a marker) into
 * the speech document.
 *
 * We approximate the Word behavior as follows:
 *   - The active speech doc is identified by document property
 *     'VerbatimSpeechDocId' (set by the user with "Set Speech Doc" in the
 *     sidebar).  If unset, we scan open docs by title containing "Speech".
 *   - If no speech doc is open, we prompt the user to create one.
 *   - On cross-doc copy, we strip Verbatim style metadata that won't
 *     render well in a speech doc (bold/italic still preserved).
 */

function cmdSendToSpeech() { sendToSpeech_(false); }
function cmdSendToSpeechEnd() { sendToSpeech_(true); }
function cmdMarkCard() { markCardInSpeechDoc_(); }

function cmdNewDocument() { newVerbatimDocument_(false); }
function cmdNewSpeech() { newVerbatimDocument_(true); }
function cmdWordCount() { wordCount_(false); }
function cmdDocStats() { docStats_(); }

function setActiveSpeechDoc(docId) {
  PropertiesService.getDocumentProperties().setProperty('VerbatimSpeechDocId', docId);
  return { ok: true };
}

// ---------- Implementations ----------

function sendToSpeech_(atEnd) {
  const cur = DocumentApp.getActiveDocument();
  const speechDoc = resolveSpeechDoc_(cur);
  if (!speechDoc) return;
  const sel = cur.getSelection();
  const paragraphs = cur.getBody().getParagraphs();
  let targets = [];
  if (sel) {
    // Capture selected range paragraphs.
    const elements = sel.getSelectedElements();
    const seen = new Set();
    for (const el of elements) {
      const p = el.getElement().asParagraph ? el.getElement().asParagraph() :
                (el.getElement().getParent && el.getElement().getParent().asParagraph
                  ? el.getElement().getParent().asParagraph() : null);
      if (p && !seen.has(p)) { seen.add(p); targets.push(p); }
    }
    if (!targets.length) {
      DocumentApp.getUi().alert('Send To Speech: selection is empty.');
      return;
    }
  } else {
    // Cursor: use heading+content.
    const cursor = cur.getCursor();
    if (!cursor) {
      DocumentApp.getUi().alert('Send To Speech: place cursor in a card.');
      return;
    }
    const el = cursor.getElement();
    const p = el.asParagraph ? el.asParagraph() :
              (el.getParent && el.getParent().asParagraph ? el.getParent().asParagraph() : null);
    if (!p) return;
    const endIdx = findHeadingEndIndex_(p);
    const startIdx = paragraphs.indexOf(p);
    for (let i = startIdx; i <= endIdx; i++) targets.push(paragraphs[i]);
  }
  // Append to speech doc.
  const speechBody = speechDoc.getBody();
  if (atEnd) {
    speechBody.appendParagraph('');
  }
  for (const p of targets) {
    const txt = p.getText();
    const heading = p.getHeading();
    const bold = p.isBold();
    const fontSize = p.getFontSize();
    let newP;
    if (atEnd) {
      newP = speechBody.appendParagraph(txt);
    } else {
      newP = speechBody.appendParagraph(txt);
    }
    newP.setHeading(heading);
    if (bold) newP.setBold(true);
    if (fontSize) newP.setFontSize(fontSize);
  }
  DocumentApp.getUi().alert('Sent ' + targets.length + ' paragraph(s) to speech doc.');
}

function markCardInSpeechDoc_() {
  const cur = DocumentApp.getActiveDocument();
  const speechDoc = resolveSpeechDoc_(cur);
  if (!speechDoc) return;
  if (speechDoc.getId() !== cur.getId()) {
    DocumentApp.getUi().alert('Mark Card: switch to the speech doc first; cursor must be inside it.');
    return;
  }
  const marker = markedMarker(new Date());
  const body = speechDoc.getBody();
  const p = body.appendParagraph(marker);
  p.setFontSize(16);
  p.setForegroundColor('#cc0000');
  p.setBold(true);
  DocumentApp.getUi().alert('Marked at ' + marker);
}

function resolveSpeechDoc_(cur) {
  const docProps = PropertiesService.getDocumentProperties();
  let targetId = docProps.getProperty('VerbatimSpeechDocId');
  if (targetId) {
    try { return DocumentApp.openById(targetId); }
    catch (e) {
      DocumentApp.getUi().alert(
        'The configured speech doc cannot be opened. Clear the binding from the sidebar.'
      );
      return null;
    }
  }
  // Search all files in Drive for a doc containing "Speech" in the title and
  // matching this user.
  const files = DriveApp.getFilesByType(MimeType.GOOGLE_DOCS);
  const candidates = [];
  while (files.hasNext()) {
    const f = files.next();
    if (/speech/i.test(f.getName())) candidates.push(f);
  }
  if (candidates.length === 0) {
    const ui = DocumentApp.getUi();
    const resp = ui.alert(
      'No speech document found. Create one now?',
      ui.ButtonSet.OK
    );
    if (resp !== ui.Button.OK) return null;
    return newVerbatimDocument_(true);
  }
  if (candidates.length > 1) {
    const list = candidates.map((f, i) => `${i+1}. ${f.getName()}`).join('\n');
    const resp = DocumentApp.getUi().prompt(
      'Multiple speech documents found. Choose one (enter the number):\n' + list
    );
    const pick = parseInt(resp.getResponseText().trim(), 10);
    if (!pick || pick < 1 || pick > candidates.length) return null;
    targetId = candidates[pick - 1].getId();
  } else {
    targetId = candidates[0].getId();
  }
  docProps.setProperty('VerbatimSpeechDocId', targetId);
  return DocumentApp.openById(targetId);
}

function newVerbatimDocument_(asSpeech) {
  const doc = DocumentApp.create(asSpeech ? 'Speech.doc' : 'Verbatim Document.doc');
  installCanonicalStyles(doc);
  const body = doc.getBody();
  body.setText('');
  if (asSpeech) {
    // Speech docs have a simple "Tag" header at the top by convention.
    body.appendParagraph('Speech').setHeading(DocumentApp.ParagraphHeading.HEADING4);
  }
  DocumentApp.getUi().alert('Created ' + (asSpeech ? 'speech' : 'Verbatim') + ' document: ' + doc.getUrl());
  return doc;
}

function wordCount_(bySection) {
  const doc = DocumentApp.getActiveDocument();
  const body = doc.getBody();
  const paragraphs = body.getParagraphs();
  let total = 0;
  let headerCount = 0;
  for (const p of paragraphs) {
    const h = p.getHeading();
    if (h !== DocumentApp.ParagraphHeading.NORMAL) {
      headerCount += debateWordCount(p.getText());
      continue;
    }
    total += debateWordCount(p.getText());
  }
  DocumentApp.getUi().alert(
    'Word count (Verbatim style):\n' +
    '  Card text: ' + total + '\n' +
    '  Headings:  ' + headerCount + '\n' +
    '  Total:     ' + (total + headerCount)
  );
}

function docStats_() {
  const doc = DocumentApp.getActiveDocument();
  const body = doc.getBody();
  const paragraphs = body.getParagraphs();
  let cards = 0, tags = 0, blocks = 0, hats = 0, pockets = 0;
  for (const p of paragraphs) {
    const h = p.getHeading();
    if (h === DocumentApp.ParagraphHeading.HEADING1) pockets++;
    else if (h === DocumentApp.ParagraphHeading.HEADING2) hats++;
    else if (h === DocumentApp.ParagraphHeading.HEADING3) blocks++;
    else if (h === DocumentApp.ParagraphHeading.HEADING4) tags++;
    else cards++;
  }
  DocumentApp.getUi().alert(
    'Document stats:\n' +
    '  Pockets: ' + pockets + '\n' +
    '  Hats:    ' + hats + '\n' +
    '  Blocks:  ' + blocks + '\n' +
    '  Tags:    ' + tags + '\n' +
    '  Cards:   ' + cards
  );
}