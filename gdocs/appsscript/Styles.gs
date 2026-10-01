/**
 * Verbatim — canonical style installation & helpers
 *
 * On first install (or "Install Styles (run once)"), we create the
 * canonical paragraph styles:
 *
 *   Pocket     — Heading 1 (largest, bold)
 *   Hat        — Heading 2
 *   Block      — Heading 3
 *   Tag        — Heading 4 (smallest heading)
 *   Cite       — NORMAL_TEXT, bold, used for lastname/date in citations
 *   VerbatimCard — NORMAL_TEXT, the default card text style
 *
 * These match the Word .dotm semantics: the heading levels map to
 * Word's outline so the Navigation Pane (Google Docs' outline pane)
 * shows the same hierarchy.
 */

function installCanonicalStyles(doc) {
  doc = doc || DocumentApp.getActiveDocument();
  if (!doc) throw new Error('No document.');
  const styles = doc.getStyles();

  // Ensure each canonical style exists. If not, create it.
  ensureParagraphStyle(doc, 'Pocket', {
    FOREGROUND_COLOR: '#000000',
    FONT_SIZE: 20,
    BOLD: true,
    HEADING: DocumentApp.ParagraphHeading.HEADING1,
  });
  ensureParagraphStyle(doc, 'Hat', {
    FOREGROUND_COLOR: '#000000',
    FONT_SIZE: 16,
    BOLD: true,
    HEADING: DocumentApp.ParagraphHeading.HEADING2,
  });
  ensureParagraphStyle(doc, 'Block', {
    FOREGROUND_COLOR: '#000000',
    FONT_SIZE: 14,
    BOLD: true,
    HEADING: DocumentApp.ParagraphHeading.HEADING3,
  });
  ensureParagraphStyle(doc, 'Tag', {
    FOREGROUND_COLOR: '#000000',
    FONT_SIZE: 12,
    BOLD: true,
    HEADING: DocumentApp.ParagraphHeading.HEADING4,
  });
  ensureParagraphStyle(doc, 'Cite', {
    FOREGROUND_COLOR: '#000000',
    FONT_SIZE: 12,
    BOLD: true,
    HEADING: DocumentApp.ParagraphHeading.NORMAL,
  });
  ensureParagraphStyle(doc, 'VerbatimCard', {
    FOREGROUND_COLOR: '#000000',
    FONT_SIZE: 11,
    HEADING: DocumentApp.ParagraphHeading.NORMAL,
  });

  DocumentApp.getUi().alert(
    'Verbatim styles installed. You can now use Pocket/Hat/Block/Tag/Cite formatting.'
  );
}

function ensureParagraphStyle(doc, name, attrs) {
  // Apps Script's getStyles() returns names of paragraph styles.
  // We probe via Document.getNamedStyle(name) which throws if missing.
  try {
    const s = doc.getNamedStyle(name);
    if (s) return s; // exists
  } catch (e) { /* not present */ }
  // Create new style: Apps Script doesn't expose createStyle; we use
  // document.addStyle(name, paragraphStyleType) which throws if exists.
  try {
    const style = doc.addStyle(name, DocumentApp.StyleType.PARAGRAPH_STYLE);
    if (attrs && style.setAttributes) {
      // Apps Script Style.setAttributes exists on ParagraphStyle in current runtime
      try { style.setAttributes(attrs); } catch (e) { /* older runtime */ }
    }
    return style;
  } catch (e) {
    // Style exists but not retrievable via getNamedStyle on this runtime —
    // surface a clear error if we ever need to mutate it.
    console.warn('Style "' + name + '" could not be created:', e.message);
    return null;
  }
}

// Convert a paragraph to a canonical heading style by name.
function applyParagraphStyle(p, name) {
  const heading = HEADING_OUTLINE[name];
  if (heading !== undefined) {
    const hs = [
      DocumentApp.ParagraphHeading.HEADING1,
      DocumentApp.ParagraphHeading.HEADING2,
      DocumentApp.ParagraphHeading.HEADING3,
      DocumentApp.ParagraphHeading.HEADING4,
    ];
    p.setHeading(hs[heading]);
    // Also bold and size to match installCanonicalStyles defaults.
    const sizes = [20, 16, 14, 12];
    p.setFontSize(sizes[heading]);
    p.setBold(true);
    return;
  }
  if (name === 'Cite') {
    p.setHeading(DocumentApp.ParagraphHeading.NORMAL);
    p.setBold(true);
    p.setFontSize(12);
    return;
  }
  if (name === 'VerbatimCard') {
    p.setHeading(DocumentApp.ParagraphHeading.NORMAL);
    p.setBold(false);
    p.setFontSize(11);
    return;
  }
}

// Detect the canonical name of a paragraph's current style by *appearance*,
// not by stored style id — this lets us normalize documents imported from
// Word that may have heading 1 etc. but no Verbatim style metadata.
function detectParagraphStyle(p) {
  const h = p.getHeading();
  switch (h) {
    case DocumentApp.ParagraphHeading.HEADING1: return 'Pocket';
    case DocumentApp.ParagraphHeading.HEADING2: return 'Hat';
    case DocumentApp.ParagraphHeading.HEADING3: return 'Block';
    case DocumentApp.ParagraphHeading.HEADING4: return 'Tag';
  }
  if (p.isBold()) return 'Cite';
  return 'Normal';
}