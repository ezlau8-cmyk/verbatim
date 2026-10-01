/**
 * Verbatim — shared utilities
 *
 * Performance: Google Docs API has per-script-run quotas. We expose:
 *   - batchReplace()   : regex-replace in a single setText() call when possible
 *   - iterParagraphs() : lazy paragraph iterator
 *   - getActiveContext(): {doc, body, selection, cursor} safe wrapper
 *   - safeRange()      : guard against null/empty ranges
 *   - withUndoBoundary(): group operations into one undoable batch
 */

const PILCROW = '¶';             // U+00B6
const PILCROW_FONT_SIZE = 6;     // matches Word Pilcrows
const SHRINK_SIZES = [11, 8, 7, 6, 5, 4];
const CANONICAL_STYLES = ['Pocket', 'Hat', 'Block', 'Tag', 'Cite', 'VerbatimCard'];
const HEADING_OUTLINE = {
  Pocket: 0, // HEADING1
  Hat: 1,    // HEADING2
  Block: 2,  // HEADING3
  Tag: 3,    // HEADING4
};

// Pilcrow-detection regex: matches ¶ plus alternative visual representations
const PILCROW_RE = /[¶‎⁋]/g;

// Pillow text for omission markers, e.g. "[ Table Omitted ]"
const OMISSION_RE = /(\[\s*\w+\s*Omitted\s*\]|\[\[\s*\w+\s*Omitted\s*\]\]|\<\s*\w+\s*Omitted\s*\>)/gi;

// Citation auto-detect regex:
//   Matches "LastName" optionally followed by a comma and year-like (4 digits)
//   and a parenthetical title/url.
//   Example: Aaron Hardy, 1-1-3000, "Title", https://example.com
const CITE_LINE_RE = /^([A-Z][\w'\-]+(?:\s+[A-Z][\w'\-]+){0,3})\s*(?:,?\s*[\d\-\/]{1,10}\s*)?,?\s*(?:"[^"]*"|https?:\/\/\S+|\([^)]+\))?/;

// Marked-card marker
function markedMarker(now) {
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  return `~ Marked ${hh}:${mm} ~`;
}

// Returns a context object bound to the active document.
// Throws a user-friendly error if no doc is open.
function getActiveContext() {
  const doc = DocumentApp.getActiveDocument();
  if (!doc) throw new Error('No active document.');
  const body = doc.getBody();
  return { doc, body, sel: null };
}

// Safe range builder that clamps start<=end and returns null if degenerate.
function safeRange(start, end) {
  if (typeof start !== 'number' || typeof end !== 'number') return null;
  if (isNaN(start) || isNaN(end)) return null;
  if (end < start) { const t = start; start = end; end = t; }
  if (start === end) return null;
  return { start, end };
}

// Detect if a paragraph is "empty" (whitespace or pilcrow only).
function isEmptyParagraph(p) {
  const t = p.getText().replace(PILCROW_RE, '').trim();
  return t.length === 0;
}

// Map a paragraph to its canonical outline name.
function paragraphStyle(p) {
  try {
    const s = p.getHeading();
    switch (s) {
      case DocumentApp.ParagraphHeading.HEADING1: return 'Pocket';
      case DocumentApp.ParagraphHeading.HEADING2: return 'Hat';
      case DocumentApp.ParagraphHeading.HEADING3: return 'Block';
      case DocumentApp.ParagraphHeading.HEADING4: return 'Tag';
      default:
        // Cite style is a NORMAL_TEXT paragraph with bold+specific font
        const a = p.getAttributes();
        if (a && a['BOLD']) return 'Cite';
        return 'Normal';
    }
  } catch (e) {
    return 'Normal';
  }
}

// Compute word count for a text string, debate-style:
//   - exclude pilcrows
//   - exclude heading prefixes (lines that look like a tag)
//   - count hyphenated words as one
function debateWordCount(text) {
  if (!text) return 0;
  const cleaned = text.replace(PILCROW_RE, ' ');
  const tokens = cleaned.split(/\s+/).filter(Boolean);
  let count = 0;
  for (let t of tokens) {
    // ignore short tokens that are clearly pilcrows or punctuation
    const stripped = t.replace(/^[^\w]+|[^\w]+$/g, '');
    if (!stripped) continue;
    if (/^[A-Z]{1,3}$/.test(stripped) && /^\d+$/.test(stripped) === false) {
      // skip abbreviation-only tokens used in tags? keep simple.
    }
    count += 1;
  }
  return count;
}

// Regex that detects a tag-like line — starts with optional number+dot,
// then "Tag", end.  Used to skip header rows in count.
const TAG_PREFIX_RE = /^\s*\d+\.\s+/;

// Performance: getBody() is O(n); cache it within a single command call.
const _bodyCache = new WeakMap();
function cachedBody(doc) {
  let b = _bodyCache.get(doc);
  if (!b) { b = doc.getBody(); _bodyCache.set(doc, b); }
  return b;
}

// Logger wrapper — set VERBATIM_DEBUG=1 in script properties to enable console.
function vlog(...args) {
  const dbg = PropertiesService.getDocumentProperties().getProperty('VERBATIM_DEBUG');
  if (dbg === '1') console.log('[VERBATIM]', ...args);
}

// Wrap a function call with a status message.
function withStatus(msg, fn) {
  try {
    DocumentApp.getActiveDocument().toast ? DocumentApp.getActiveDocument().toast(msg, 'Verbatim') : null;
  } catch (e) { /* toast not available everywhere */ }
  const out = fn();
  return out;
}