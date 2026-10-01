/**
 * Verbatim for Google Docs
 * Copyright (C) 2026 Ethan Lau / paperlessdebate.com contributors
 * Licensed GPL-3.0 — see LICENSE
 *
 * Entry points and top-level plumbing.
 */

// Entry: add-on opens
function onOpen(e) {
  DocumentApp.getUi()
    .createAddonMenu()
    .addItem('Open Verbatim sidebar', 'showSidebar')
    .addItem('New Verbatim Document', 'cmdNewDocument')
    .addItem('New Speech Document', 'cmdNewSpeech')
    .addSeparator()
    .addSubMenu(DocumentApp.getUi().createMenu('Format')
          .addItem('Paste Text (F2)', 'cmdPasteText')
          .addItem('Condense (F3)', 'cmdCondense')
          .addItem('Condense No Pilcrows', 'cmdCondenseNoPilcrows')
          .addItem('Condense With Pilcrows', 'cmdCondenseWithPilcrows')
          .addItem('Uncondense', 'cmdUncondense')
          .addItem('Shrink', 'cmdShrink')
          .addItem('Unshrink All', 'cmdUnshrinkAll')
          .addItem('Highlight (F11)', 'cmdHighlight')
          .addItem('Underline (F9)', 'cmdUnderline')
          .addItem('Emphasis (F10)', 'cmdEmphasis')
          .addItem('Cite (F8)', 'cmdCite')
          .addItem('Clear Formatting (F12)', 'cmdClearFormatting')
          .addItem('Remove Blanks', 'cmdRemoveBlanks')
          .addItem('Remove Pilcrows', 'cmdRemovePilcrows')
          .addItem('Remove Hyperlinks', 'cmdRemoveHyperlinks')
          .addItem('Auto Format Cite', 'cmdAutoFormatCite')
          .addItem('Auto Number Tags', 'cmdAutoNumberTags')
          .addItem('De-Number Tags', 'cmdDeNumberTags')
          .addItem('Fix Formatting Gaps', 'cmdFixFormattingGaps')
          .addItem('Convert To Default Styles', 'cmdConvertToDefaultStyles')
          .addItem('Select Similar', 'cmdSelectSimilar'))
    .addSubMenu(DocumentApp.getUi().createMenu('Organize')
          .addItem('Pocket (F4)', 'cmdPocket')
          .addItem('Hat (F5)', 'cmdHat')
          .addItem('Block (F6)', 'cmdBlock')
          .addItem('Tag (F7)', 'cmdTag')
          .addItem('Move Up', 'cmdMoveUp')
          .addItem('Move Down', 'cmdMoveDown')
          .addItem('Move To Bottom', 'cmdMoveToBottom')
          .addItem('Select Heading', 'cmdSelectHeading')
          .addItem('Delete Heading', 'cmdDeleteHeading'))
    .addSubMenu(DocumentApp.getUi().createMenu('Paperless')
          .addItem('Send To Speech', 'cmdSendToSpeech')
          .addItem('Send To Speech End', 'cmdSendToSpeechEnd')
          .addItem('Mark Card', 'cmdMarkCard')
          .addItem('Word Count', 'cmdWordCount')
          .addItem('Document Stats', 'cmdDocStats')
          .addItem('Insert Header', 'cmdInsertHeader'))
    .addSubMenu(DocumentApp.getUi().createMenu('View')
          .addItem('Toggle Invisibility', 'cmdInvisibilityToggle')
          .addItem('Invisibility On', 'cmdInvisibilityOn')
          .addItem('Invisibility Off', 'cmdInvisibilityOff')
          .addItem('Default View', 'cmdDefaultView'))
    .addSubMenu(DocumentApp.getUi().createMenu('Help')
          .addItem('Verbatim Help', 'showHelp')
          .addItem('Cheat Sheet', 'showCheatSheet')
          .addItem('Install Styles (run once)', 'cmdInstallStyles'))
    .addSubMenu(DocumentApp.getUi().createMenu('Tools')
          .addItem('Migrate From Word', 'cmdMigrateFromWord')
          .addItem('Auto Format Cite (selection)', 'cmdAutoFormatSelectionAsCite'))
    .addToUi();
}

// Drive-homepage trigger: lets users "Make a copy" / open from Drive
function onHomepage(e) {
  const card = CardService.newCardBuilder()
    .setHeader(CardService.newCardHeader().setTitle('Verbatim for Google Docs'))
    .addSection(
      CardService.newCardSection()
        .addWidget(CardService.newTextParagraph().setText(
          'Open a Google Doc, then use Extensions → Verbatim for Google Docs → Open Verbatim sidebar.'))
        .addWidget(CardService.newTextParagraph().setText(
          'On first run, choose Extensions → Verbatim for Google Docs → Help → Install Styles (run once).'))
    ).build();
  return [card];
}

// Show the sidebar UI
function showSidebar() {
  const html = HtmlService.createHtmlOutputFromFile('Sidebar')
    .setTitle('Verbatim')
    .setWidth(320);
  DocumentApp.getUi().showSidebar(html);
}

function showHelp() {
  const html = HtmlService.createHtmlOutputFromFile('Help').setWidth(720).setHeight(640);
  DocumentApp.getUi().showModalDialog(html, 'Verbatim Help');
}

function showCheatSheet() {
  const html = HtmlService.createHtmlOutputFromFile('CheatSheet').setWidth(560).setHeight(640);
  DocumentApp.getUi().showModalDialog(html, 'Keyboard Shortcuts');
}

function cmdInstallStyles() {
  installCanonicalStyles(DocumentApp.getActiveDocument());
}

function cmdAutoFormatSelectionAsCite() {
  cmdAutoFormatCite();
}

// Stub for "default view" — Google Docs view toggles aren't scriptable,
// but we surface it for parity and offer a "Reading mode" hint.
function cmdDefaultView() {
  DocumentApp.getUi().alert(
    'Google Docs uses its own view toggles (View → Mode).\n' +
    'Verbatim\'s "Default View" (Word Draft view) maps to the Google Docs default editing view — no action needed.'
  );
}

// (No include() needed — multi-file Apps Script shares a global namespace.
//  See Styles.gs, Formatting.gs, Condense.gs, Shrink.gs, Cards.gs,
//  Paperless.gs, Speech.gs, Analytics.gs, View.gs, Settings.gs, Util.gs.)