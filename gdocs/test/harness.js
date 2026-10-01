/**
 * Node-side test harness for Verbatim Google Apps Script.
 *
 * We can't execute Apps Script locally, but the *logic* in our .gs files
 * is plain ES2020 JavaScript with module-style files. This harness:
 *   1. Loads each .gs file.
 *   2. Provides a mock DocumentApp + a tiny in-memory Doc/Text/Paragraph tree.
 *   3. Exercises the public cmd* functions and asserts on tree state.
 *
 * Run:  node test/harness.js
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

// All factories live inside the VM context as plain JS. After loading the
// .gs files we read them back into the Node host via the VM's stringify helper.
const vmSrc = `
const Heading = {
  HEADING1: 'HEADING1', HEADING2: 'HEADING2', HEADING3: 'HEADING3', HEADING4: 'HEADING4',
  NORMAL: 'NORMAL',
};
const BorderStyle = { SOLID: 'SOLID' };

function text() {
  return {
    _text: '', _bold: false, _italic: false, _underline: false,
    _size: 11, _bg: null, _fg: null, _link: null,
    getText() { return this._text; },
    isBold(i=0) { return this._bold; },
    isItalic(i=0) { return this._italic; },
    isUnderline(i=0) { return this._underline; },
    getFontSize(i=0) { return this._size; },
    getBackgroundColor(i=0) { return this._bg; },
    getForegroundColor(i=0) { return this._fg; },
    getLinkUrl(i=0) { return this._link; },
    setBold(s, e, v) { this._bold = v; },
    setItalic(s, e, v) { this._italic = v; },
    setUnderline(s, e, v) { this._underline = v; },
    setBackgroundColor(s, e, v) { this._bg = v; },
    setForegroundColor(s, e, v) { this._fg = v; },
    setFontSize(s, e, v) { this._size = v; },
    setLinkUrl(s, e, v) { this._link = v; },
  };
}

function paragraph(t='', heading=Heading.NORMAL) {
  const p = {
    _text: t,
    _heading: heading,
    _bold: heading === Heading.HEADING1 || heading === Heading.HEADING2
        || heading === Heading.HEADING3 || heading === Heading.HEADING4,
    _size: heading === Heading.HEADING1 ? 20 :
           heading === Heading.HEADING2 ? 16 :
           heading === Heading.HEADING3 ? 14 :
           heading === Heading.HEADING4 ? 12 : 11,
    _border: false,
    _parent: null,
    getText() { return this._text; },
    setText(t) { this._text = t; },
    getHeading() { return this._heading; },
    setHeading(h) {
      this._heading = h;
      if (h === Heading.NORMAL) { this._bold = false; }
      else { this._bold = true; }
    },
    isBold() { return this._bold; },
    setBold(v) { this._bold = v; },
    getFontSize() { return this._size; },
    setFontSize(s) { this._size = s; },
    setBorderTop(s)   { if (s) this._border = true; if (!s) this._border = false; },
    setBorderBottom(s){ if (s) this._border = true; if (!s) this._border = false; },
    setBorderLeft(s)  { if (s) this._border = true; if (!s) this._border = false; },
    setBorderRight(s) { if (s) this._border = true; if (!s) this._border = false; },
    getBorderTop() { return this._border ? BorderStyle.SOLID : null; },
    appendText(t) { this._text += t; },
    removeFromParent() {
      if (this._parent) {
        this._parent._children = this._parent._children.filter(c => c !== this);
        this._parent = null;
      }
    },
    editAsText() {
      // editAsText in real GAS returns a live reference to the underlying
      // text element; modifications persist. We model this with a single
      // _textObj child that carries its own size/bold/etc.
      if (!this._textObj) {
        this._textObj = {
          _text: this._text,
          _bold: this._bold,
          _italic: false,
          _underline: false,
          _size: this._size,
          _bg: null, _fg: null, _link: null,
          _sizeMap: null,  // {start->end: size} for range-aware size
          getText() { return this._text; },
          isBold(i=0) { return this._bold; },
          isItalic(i=0) { return this._italic; },
          isUnderline(i=0) { return this._underline; },
          getFontSize(i=0) {
            // Return the last-set value for index i (later ranges supersede).
            if (this._sizeMap) {
              let v = null;
              for (const [s, e, val] of this._sizeMap) {
                if (i >= s && i <= e) v = val;
              }
              if (v != null) return v;
            }
            return this._size;
          },
          getBackgroundColor(i=0) { return this._bg; },
          getForegroundColor(i=0) { return this._fg; },
          getLinkUrl(i=0) { return this._link; },
          setBold(s, e, v) { this._bold = v; },
          setItalic(s, e, v) { this._italic = v; },
          setUnderline(s, e, v) { this._underline = v; },
          setBackgroundColor(s, e, v) { this._bg = v; },
          setForegroundColor(s, e, v) { this._fg = v; },
          setFontSize(s, e, v) {
            // Coalesce with existing sizeMap; if the new range fully covers
            // the existing one, replace; otherwise add an entry.
            if (!this._sizeMap) this._sizeMap = [];
            // Simplification: a single contiguous set becomes the only entry.
            this._sizeMap.push([s, e, v]);
            this._size = v;
          },
          setLinkUrl(s, e, v) { this._link = v; },
        };
      }
      return this._textObj;
    },
    getAttributes() { return this._attrs || {}; },
    asParagraph() { return this; },
  };
  return p;
}

function body() {
  const b = {
    _children: [],
    _parent: null,
    getParagraphs() { return this._children.filter(c => c._text !== undefined); },
    appendParagraph(t) {
      const p = paragraph(t);
      p._parent = b;
      b._children.push(p);
      return p;
    },
    insertParagraphAfter(after, t) {
      const p = paragraph(t);
      p._parent = b;
      const idx = b._children.indexOf(after);
      b._children.splice(idx + 1, 0, p);
      return p;
    },
    insertParagraphBefore(before, t) {
      const p = paragraph(t);
      p._parent = b;
      const idx = b._children.indexOf(before);
      b._children.splice(idx, 0, p);
      return p;
    },
  };
  return b;
}

function activeDoc(initialParas=[]) {
  const b = body();
  for (const t of initialParas) b.appendParagraph(t);
  return {
    _body: b,
    _cursor: null,
    _selection: null,
    getBody() { return b; },
    getName() { return 'Test.doc'; },
    getId() { return 'doc-1'; },
    getCursor() { return this._cursor; },
    getSelection() { return this._selection; },
    setCursor(c) { this._cursor = c; },
    setSelection(r) { this._selection = r; },
    getStyles() { return ['Pocket', 'Hat', 'Block', 'Tag', 'Cite', 'VerbatimCard']; },
    getNamedStyle(name) {
      // Pretend styles exist; let addStyle be a no-op.
      if (['Pocket','Hat','Block','Tag','Cite','VerbatimCard'].indexOf(name) >= 0) {
        return { setAttributes: () => {} };
      }
      throw new Error('Style not found: ' + name);
    },
    addStyle(name) { return { setAttributes: () => {} }; },
    newPosition(p, off) { return { _p: p, _off: off, getElement() { return this._p; } }; },
    newRange() {
      const els = [];
      const obj = {
        _elements: els,
        addElementsBetween(a, c) { this._elements.push(a, c); return this; },
        addElement(p) { this._elements.push(p); return this; },
        build() { return { _elements: this._elements }; }
      };
      return obj;
    },
  };
}

const DocumentApp = {
  ParagraphHeading: Heading,
  BorderStyle,
  StyleType: { PARAGRAPH_STYLE: 'PARAGRAPH_STYLE' },
  _currentDoc: null,
  getActiveDocument() { return DocumentApp._currentDoc; },
  setActiveDocument(d) { DocumentApp._currentDoc = d; },
  openById(id) { return DocumentApp._currentDoc; },
  create(name) {
    const d = activeDoc([]);
    d._name = name;
    return d;
  },
  getUi() {
    return {
      alert: (msg) => console.log('[alert]', msg),
      prompt: (msg, btn) => ({ getSelectedButton: () => 'OK', getResponseText: () => '' }),
      createAddonMenu() { return this; },
      createMenu() { return this; },
      showSidebar: (html) => {},
      showModalDialog: (html, title) => {},
    };
  },
};

const PropertiesService = {
  _store: {},
  getDocumentProperties() {
    return { getProperty: (k) => PropertiesService._store[k] || null, setProperty: (k, v) => { PropertiesService._store[k] = v; } };
  },
  getUserProperties() {
    return { getProperty: (k) => PropertiesService._store['user.' + k] || null, setProperty: (k, v) => { PropertiesService._store['user.' + k] = v; } };
  },
};

const MimeType = { GOOGLE_DOCS: 'application/vnd.google-apps.document' };
const DriveApp = {
  getFilesByType() { return { hasNext: () => false, next: () => null }; },
};
const CardService = {
  newCardBuilder: () => ({ setHeader: () => this, addSection: () => this, build: () => ({}) }),
  newCardHeader: () => ({ setTitle: () => this }),
  newCardSection: () => ({ addWidget: () => this }),
  newTextParagraph: () => ({ setText: () => this }),
};

// Expose factories as globals so each loaded .gs file can resolve them.
globalThis.text = text;
globalThis.paragraph = paragraph;
globalThis.body = body;
globalThis.activeDoc = activeDoc;
globalThis.Heading = Heading;
globalThis.BorderStyle = BorderStyle;
globalThis.DocumentApp = DocumentApp;
globalThis.PropertiesService = PropertiesService;
globalThis.MimeType = MimeType;
globalThis.DriveApp = DriveApp;
globalThis.CardService = CardService;
`;

// ---- Loader ------------------------------------------------------------

function loadGs(filename) {
  let src = fs.readFileSync(path.join(__dirname, '..', 'appsscript', filename), 'utf8');
  // Strip GAS-specific directive comments.
  src = src.replace(/'\@Ignore[^\n]*\n/g, '\n');
  return src;
}

function runHarness(testFn) {
  const ctx = vm.createContext({ console });
  vm.runInContext(vmSrc, ctx);
  // Combine all .gs files into ONE script so they share global scope, just
  // like Apps Script does. Wrap each file's contents in a function so local
  // const declarations don't leak across files (mimicking .gs module privacy).
  const files = ['Util.gs', 'Styles.gs', 'Formatting.gs', 'Cards.gs', 'Condense.gs', 'Paperless.gs', 'Settings.gs', 'Migrate.gs'];
  const body = files.map(f => {
    let src = loadGs(f);
    return `// ===== ${f} =====\n` + src + '\n';
  }).join('\n');
  vm.runInContext(body, ctx, { filename: 'all.gs' });
  testFn(ctx);
}

// Fetch a single global out of the VM.
function g(name, ctx) { return vm.runInContext(name, ctx); }

// ---- Assertions --------------------------------------------------------

let passed = 0, failed = 0;
function assert(cond, msg) {
  if (cond) { passed++; }
  else { failed++; console.log('  FAIL:', msg); }
}

// ---- Tests -------------------------------------------------------------

runHarness((ctx) => {
  console.log('==== Util.gs ====');
  const { debateWordCount, isEmptyParagraph, markedMarker } =
    vm.runInContext('({ debateWordCount, isEmptyParagraph, markedMarker })', ctx);

  assert(debateWordCount('') === 0, 'empty wordcount');
  assert(debateWordCount('one two three') === 3, '3-word count');
  assert(debateWordCount('a¶b¶c') === 3, 'pilcrow split');
  assert(debateWordCount('hello-world') === 1, 'hyphenated = 1 word');
  assert(isEmptyParagraph({ getText: () => '   ¶   ' }) === true, 'isEmpty w/ pilcrow');
  assert(isEmptyParagraph({ getText: () => 'card' }) === false, 'not empty');
  assert(/^\~ Marked \d{2}:\d{2} \~$/.test(markedMarker(new Date())), 'marker format');

  console.log('==== Styles.gs ====');
  const { applyParagraphStyle } = vm.runInContext('({ applyParagraphStyle })', ctx);
  const p2 = g('paragraph', ctx)('hi');
  applyParagraphStyle(p2, 'Pocket');
  assert(p2.getHeading() === 'HEADING1', 'Pocket → HEADING1');
  applyParagraphStyle(p2, 'Hat');
  assert(p2.getHeading() === 'HEADING2', 'Hat → HEADING2');
  applyParagraphStyle(p2, 'Cite');
  assert(p2.isBold() === true, 'Cite → bold');
  applyParagraphStyle(p2, 'VerbatimCard');
  assert(p2.isBold() === false, 'VerbatimCard → not bold');

  console.log('==== Condense ====');
  g('DocumentApp', ctx).setActiveDocument(g('activeDoc', ctx)(['Pocket1', 'tag1', 'lorem  ipsum\t dolor',
                                              'sit\namet,\nconsectetur', 'next card']));
  const body_ = g('DocumentApp', ctx).getActiveDocument().getBody();
  // Create a fresh paragraph to test idempotent behavior; don't re-run on the same one.
  const { condenseParagraph_, shrinkParagraph_, uncondense_, autoFormatCites_, removePilcrows_, removeBlanks_, moveHeading_ } =
    vm.runInContext('({ condenseParagraph_, shrinkParagraph_, uncondense_, autoFormatCites_, removePilcrows_, removeBlanks_, moveHeading_ })', ctx);

  ctx.condenseParagraph_(body_._children[3], true, true);
  assert(/¶/.test(body_._children[3]._text), 'pilcrows inserted when paragraph breaks present');
  ctx.condenseParagraph_(body_._children[2], true, true);
  assert(!/\t/.test(body_._children[2]._text), 'tabs collapsed');
  // Idempotency: condense-with-pilcrows again should not duplicate pilcrows.
  const before2ndRun = body_._children[3]._text;
  ctx.condenseParagraph_(body_._children[3], true, true);
  const after2ndRun = body_._children[3]._text;
  assert(before2ndRun === after2ndRun, 'condense idempotent on already-condensed text');
  // Switching to integrity=false on a paragraph-with-pilcrows should leave
  // the pilcrows but strip \n — that's the actual behavior.
  ctx.condenseParagraph_(body_._children[3], false, false);
  assert(!/\n/.test(body_._children[3]._text), 'no \\n left when integrity=false');

  console.log('==== Shrink ====');
  g('DocumentApp', ctx).setActiveDocument(g('activeDoc', ctx)([]));
  const bp = g('DocumentApp', ctx).getActiveDocument().getBody();
  const sp = bp.appendParagraph('hello world');
  // Initial size: paragraph._size == 11. After shrink, the text-object size
  // (which represents the run size) is what shrinks.
  ctx.shrinkParagraph_(sp);
  let tx = sp.editAsText();
  assert(tx._size === 8, 'shrink 11 → 8 (text-size)');
  ctx.shrinkParagraph_(sp);
  tx = sp.editAsText();
  assert(tx._size === 7, 'shrink 8 → 7 (text-size)');
  for (let i = 0; i < 4; i++) ctx.shrinkParagraph_(sp);
  tx = sp.editAsText();
  assert(tx._size === 11, 'shrink wraps to 11');

  console.log('==== Cards (organize) ====');
  g('DocumentApp', ctx).setActiveDocument(g('activeDoc', ctx)(['A', 'B', 'C', 'D']));
  const bb = g('DocumentApp', ctx).getActiveDocument().getBody();
  g('DocumentApp', ctx).getActiveDocument().setCursor({ getElement: () => bb._children[1] });
  ctx.moveHeading_(true);
  assert(bb._children[1]._text === 'C' && bb._children[2]._text === 'B', 'moveDown swaps');
  ctx.moveHeading_(false);
  assert(bb._children[1]._text === 'B' && bb._children[2]._text === 'C', 'moveUp swaps back');

  console.log('==== Remove blanks ====');
  g('DocumentApp', ctx).setActiveDocument(g('activeDoc', ctx)(['H', '   ', 'C']));
  const bb2 = g('DocumentApp', ctx).getActiveDocument().getBody();
  // Make paragraphs 0 and 1 headings; paragraph 1's text is whitespace only.
  bb2._children[0].setHeading(g('Heading', ctx).HEADING4);
  bb2._children[1].setHeading(g('Heading', ctx).HEADING4);
  ctx.removeBlanks_();
  const after = g('DocumentApp', ctx).getActiveDocument().getBody().getParagraphs();
  assert(after.length === 2 && after[0]._text === 'H' && after[1]._text === 'C',
         'blank heading deleted, real paragraphs kept');

  console.log('==== Pilcrow removal ====');
  g('DocumentApp', ctx).setActiveDocument(g('activeDoc', ctx)(['lorem¶ipsum¶dolor']));
  ctx.removePilcrows_();
  const t = g('DocumentApp', ctx).getActiveDocument().getBody()._children[0]._text;
  assert(t.indexOf('¶') === -1, 'pilcrows stripped: ' + JSON.stringify(t));

  console.log('==== Citation auto-format ====');
  g('DocumentApp', ctx).setActiveDocument(g('activeDoc', ctx)(['Aaron Hardy, 1-1-3000, "Title", https://x.com']));
  const citeP = g('DocumentApp', ctx).getActiveDocument().getBody()._children[0];
  citeP.setHeading(g('Heading', ctx).NORMAL);
  citeP.setBold(true);
  let threw = false;
  try { ctx.autoFormatCites_(); } catch (e) { threw = true; }
  assert(!threw, 'autoFormatCites_ runs without throwing');

  console.log('==== Uncondense ====');
  g('DocumentApp', ctx).setActiveDocument(g('activeDoc', ctx)(['para1 ¶ para2 ¶ para3']));
  let nBefore = g('DocumentApp', ctx).getActiveDocument().getBody().getParagraphs().length;
  ctx.uncondense_();
  let nAfter = g('DocumentApp', ctx).getActiveDocument().getBody().getParagraphs().length;
  assert(nAfter > nBefore, 'uncondense splits paragraph');

  console.log('==== Word count ====');
  assert(debateWordCount('the quick brown fox jumps over the lazy dog') === 9, '9 words counted');
  assert(debateWordCount('the ¶ quick') === 2, 'pilcrow does not inflate count');

  console.log('==== Stress: large doc ====');
  // Build a 1000-card document and shrink+condense the lot. Watch for crashes.
  const N = 1000;
  g('DocumentApp', ctx).setActiveDocument(g('activeDoc', ctx)());
  const big = g('DocumentApp', ctx).getActiveDocument().getBody();
  for (let i = 0; i < N; i++) {
    const p = big.appendParagraph('lorem ipsum dolor sit amet ' + i);
    if (i % 10 === 0) p.setHeading(g('Heading', ctx).HEADING4);
    if (i % 50 === 0) p.setHeading(g('Heading', ctx).HEADING3);
  }
  let sThrew = false;
  try {
    ctx.unshrinkAll_();
    ctx.removePilcrows_();
  } catch (e) { sThrew = true; console.log('  ERROR:', e.message); }
  assert(!sThrew, 'no crash on 1000-paragraph ops');

  console.log('==== Edge: empty paragraph condense ====');
  g('DocumentApp', ctx).setActiveDocument(g('activeDoc', ctx)(['x']));
  const ep = g('DocumentApp', ctx).getActiveDocument().getBody()._children[0];
  ep.setText('');
  let epThrew = false;
  try { ctx.condenseParagraph_(ep, true, true); } catch (e) { epThrew = true; }
  assert(!epThrew, 'condense on empty paragraph does not throw');

  console.log('==== Edge: malformed text (only pilcrows) ====');
  g('DocumentApp', ctx).setActiveDocument(g('activeDoc', ctx)(['x']));
  const mp = g('DocumentApp', ctx).getActiveDocument().getBody()._children[0];
  mp.setText('¶¶¶');
  let mpThrew = false;
  try { ctx.condenseParagraph_(mp, true, true); ctx.shrinkParagraph_(mp); } catch (e) { mpThrew = true; }
  assert(!mpThrew, 'pilcrow-only paragraph does not throw');

  console.log('==== Edge: very long paragraph ====');
  g('DocumentApp', ctx).setActiveDocument(g('activeDoc', ctx)(['x']));
  const lp = g('DocumentApp', ctx).getActiveDocument().getBody()._children[0];
  lp.setText('word '.repeat(5000));
  let lpThrew = false;
  try { ctx.condenseParagraph_(lp, false, false); ctx.shrinkParagraph_(lp); } catch (e) { lpThrew = true; }
  assert(!lpThrew, '5000-word paragraph does not throw');

  console.log('==== Move to bottom ====');
  g('DocumentApp', ctx).setActiveDocument(g('activeDoc', ctx)(['A', 'B', 'C']));
  const bb3 = g('DocumentApp', ctx).getActiveDocument().getBody();
  g('DocumentApp', ctx).getActiveDocument().setCursor({ getElement: () => bb3._children[0] });
  ctx.moveHeadingToBottom_();
  assert(bb3._children[bb3._children.length - 1]._text === 'A',
         'move-to-bottom relocates paragraph to end');

  console.log('==== Migration: Word → Verbatim ====');
  g('DocumentApp', ctx).setActiveDocument(g('activeDoc', ctx)(['Aaron Hardy, 1-1-3000, "Verbatim Online"',
                                                              'card text', 'card text']));
  const mig = g('DocumentApp', ctx).getActiveDocument().getBody();
  // Apply Word-like headings.
  mig._children[1].setHeading(g('Heading', ctx).HEADING3); // Block
  mig._children[2].setHeading(g('Heading', ctx).HEADING4); // Tag
  // Bold the cite line first (Word's Cite style is typically bold).
  mig._children[0].setBold(true);
  // Migrate.
  vm.runInContext('migrateFromWord_(DocumentApp.getActiveDocument())', ctx);
  assert(mig._children[1].getHeading() === g('Heading', ctx).HEADING3,
         'HEADING3 migrated to Block (still HEADING3, mapped via style)');
  assert(mig._children[0].isBold() === true, 'bold cite line remains bold after migration');
  assert(mig._children[2].getHeading() === g('Heading', ctx).HEADING4,
         'HEADING4 migrated to Tag (still HEADING4)');

  console.log('==== Convert plain text ====');
  const txt = vm.runInContext(`convertPlainTextToVerbatim_('line1\\nline2\\n\\nline3', { usePilcrows: true, paragraphIntegrity: true })`, ctx);
  assert(txt.indexOf('¶') > -1, 'pilcrow inserted at paragraph breaks');
  assert(/line1/.test(txt) && /line2/.test(txt) && /line3/.test(txt), 'all lines preserved');

  console.log('==== Cite detection ====');
  const ranges = vm.runInContext('findCiteRanges_("Aaron Hardy, 1-1-3000, \\"Verbatim\\"")', ctx);
  assert(ranges.length === 2, 'cite detection finds name + date range');

  console.log('\n' + passed + ' passed, ' + failed + ' failed');
  process.exit(failed === 0 ? 0 : 1);
});