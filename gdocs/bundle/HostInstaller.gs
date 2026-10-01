/**
 * Verbatim Host Installer
 *
 * Paste this ENTIRE file into a fresh Apps Script project bound to a Google
 * Doc that you share with your debate teammates ( view access).
 *
 * When a teammate opens the shared Doc and clicks:
 *   Extensions → Verbatim Host → Install Verbatim
 * …they get a modal with five files (Code.gs, appsscript.json, Sidebar.html,
 * CheatSheet.html, Help.html), each with a "Copy contents" button. They
 * paste each into a NEW Apps Script project (a single new tab opens), save,
 * and they're done.
 *
 * Why this lives in a Doc-bound script: Apps Script can't create new Apps
 * Script projects programmatically. So we settle for the next best thing —
 * a single modal that contains the entire bundle and a "new tab" button.
 *
 * Setup steps for the captain:
 *   1. Create a Google Doc called "Verbatim Installer".
 *   2. Open Extensions → Apps Script. Delete the placeholder function.
 *   3. Paste this entire file. Save.
 *   4. Reload the Doc. You should see "Extensions → Verbatim Host → ..."
 *      menu items.
 *   5. Share the Doc with "anyone with the link can view".
 */

const VERBATIM_BUNDLE_VERSION = '1.0.0';

// Menu
function onOpen() {
  DocumentApp.getUi()
    .createAddonMenu()
    .addItem('Install Verbatim', 'showInstallDialog')
    .addItem('How this works', 'showAbout')
    .addToUi();
}

function showAbout() {
  DocumentApp.getUi().alert(
    'Verbatim Host Installer v' + VERBATIM_BUNDLE_VERSION + '\n\n\n' +
    'This Doc is the entry point for installing Verbatim for Google Docs.\n\n' +
    'Click "Install Verbatim" to get the five-file bundle. Open a new tab to\n' +
    'script.google.com/create, paste each file, save, and you have Verbatim.'
  );
}

// Show the install modal — the actual content is built server-side and
// inlined into the HTML to avoid an extra fetch round-trip.
function showInstallDialog() {
  const html = HtmlService.createHtmlOutput(buildInstallHtml_())
    .setWidth(640)
    .setHeight(560);
  DocumentApp.getUi().showModalDialog(html, 'Install Verbatim');
}

// Returns an HTML string with the bundle inlined. The bundle is embedded at
// build time by publish.sh — for the manual install (you pasting this file
// into the host Doc) we fall back to a fetch from raw.githubusercontent.com.
function buildInstallHtml_() {
  const baseUrl = 'https://ezlau8-cmyk.github.io/verbatim/gdocs/bundle';
  const files = [
    { name: 'Code.gs',         url: baseUrl + '/Code.gs',         isBig: true,  isManifest: false },
    { name: 'appsscript.json', url: baseUrl + '/appsscript.json', isBig: false, isManifest: true  },
    { name: 'Sidebar.html',    url: baseUrl + '/Sidebar.html',    isBig: false, isManifest: false },
    { name: 'CheatSheet.html', url: baseUrl + '/CheatSheet.html', isBig: false, isManifest: false },
    { name: 'Help.html',       url: baseUrl + '/Help.html',       isBig: false, isManifest: false },
  ];

  const css = `
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
           padding: 18px 22px; line-height: 1.5; color: #202124; max-width: 100%; }
    h2 { font-size: 16px; margin: 18px 0 8px; color: #1a73e8; }
    p  { font-size: 13px; color: #5f6368; margin: 6px 0; }
    ol { font-size: 13px; padding-left: 22px; }
    li { margin-bottom: 4px; }
    .file-row {
      display: flex; align-items: center; justify-content: space-between;
      padding: 10px 14px; margin: 6px 0;
      background: #f1f3f4; border: 1px solid #dadce0; border-radius: 6px;
      font-size: 14px;
    }
    .file-row .name {
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
      font-size: 13px; color: #1a73e8;
    }
    .file-row .tag {
      background: #fbbc04; color: #202124; padding: 1px 6px; border-radius: 3px;
      font-size: 11px; margin-left: 8px;
    }
    .file-row.done { border-color: #34a853; background: #e6f4ea; }
    .file-row .copy-btn {
      background: #1a73e8; color: #fff; border: none; border-radius: 4px;
      padding: 6px 14px; font-size: 12px; cursor: pointer; font-weight: 500;
    }
    .file-row .copy-btn:hover { background: #1765c4; }
    .file-row .copy-btn:disabled { background: #dadce0; cursor: default; }
    .file-row .copy-btn.copied { background: #34a853; }
    .progress {
      height: 6px; background: #f1f3f4; border-radius: 3px; overflow: hidden;
      margin: 14px 0;
    }
    .progress > div {
      height: 100%; background: #1a73e8; transition: width 0.2s; width: 0%;
    }
    .next-btn {
      margin-top: 12px; background: #34a853; color: #fff; border: none;
      border-radius: 4px; padding: 8px 16px; font-size: 13px; cursor: pointer;
    }
    .next-btn:hover { background: #2d9249; }
    .next-btn:disabled { background: #dadce0; cursor: default; }
    .warn { background: #fce8e6; border-left: 3px solid #d93025; padding: 10px 14px;
      border-radius: 4px; font-size: 12px; color: #5f6368; margin: 10px 0; }
  `;

  const rowsHtml = files.map((f, i) => `
    <div class="file-row" id="row-${i}" data-url="${f.url}">
      <span>
        <span class="name">${f.name}</span>
        ${f.isManifest ? '<span class="tag">paste last</span>' : ''}
      </span>
      <button class="copy-btn" id="btn-${i}">Copy contents</button>
    </div>
  `).join('');

  const js = `
    const TOTAL = ${files.length};
    let done = 0;
    function updateProgress() {
      const pct = (done / TOTAL * 100);
      document.getElementById('progress').style.width = pct + '%';
      document.getElementById('progress-label').textContent =
        'Progress: ' + done + ' / ' + TOTAL + ' files copied';
      if (done === TOTAL) {
        document.getElementById('next').disabled = false;
      }
    }
    document.querySelectorAll('.copy-btn').forEach((btn, i) => {
      btn.addEventListener('click', async () => {
        btn.disabled = true;
        btn.textContent = 'Loading…';
        const row = document.getElementById('row-' + i);
        const url = row.dataset.url;
        try {
          const r = await fetch(url, { cache: 'no-store' });
          if (!r.ok) throw new Error('HTTP ' + r.status);
          const text = await r.text();
          await navigator.clipboard.writeText(text);
          row.classList.add('done');
          btn.textContent = '✓ Copied';
          btn.classList.add('copied');
          done++;
          updateProgress();
        } catch (e) {
          btn.textContent = '✗ Failed';
          btn.disabled = false;
        }
      });
    });
    document.getElementById('next').addEventListener('click', () => {
      window.open('https://script.google.com/create', '_blank');
    });
    updateProgress();
  `;

  return `<!DOCTYPE html><html><head><style>${css}</style></head><body>
>
      <h2>Install Verbatim for Google Docs</h2>
>
      <div class="warn">
        <strong>Make sure you're on your SCHOOL account</strong> — not personal Gmail.
        Your school has Apps Script enabled; your personal account doesn't.
        If unsure, click your profile picture top-right and switch accounts before continuing.
      </div>
>
      <ol>
        <li>Click <strong>Open new Apps Script project</strong> below.</li>
        <li>In the new tab, delete the placeholder <code>function myFunction() {}</code>.</li>
        <li>Come back here. Click <strong>Copy contents</strong> on each row below.</li>
        <li>In the new tab, click <kbd>File → New → Script file</kbd>, type the filename (with extension), paste the contents.</li>
        <li>After all five files are in, save and <strong>Deploy → Test deployments → Install</strong>.</li>
      </ol>
>
      <button class="next-btn" id="next" disabled>① Open new Apps Script project</button>
>
      <div class="progress"><div id="progress"></div></div>
>
      <p id="progress-label" style="text-align: center;">Progress: 0 / ${files.length} files copied</p>
>
      ${rowsHtml}
>
      <script>${js}</script>
>
    </body></html>`;
}