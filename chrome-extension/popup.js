// ─── UAEDiscountHub Product Importer — Popup Logic ────────────────────────────
'use strict';

// ── State ─────────────────────────────────────────────────────────────────────
let scrapedData = null;

// ── DOM refs ──────────────────────────────────────────────────────────────────
const mainView        = document.getElementById('mainView');
const previewView     = document.getElementById('previewView');
const settingsView    = document.getElementById('settingsView');
const successView     = document.getElementById('successView');

const storeBadge      = document.getElementById('storeBadge');
const scrapeBtn       = document.getElementById('scrapeBtn');
const status          = document.getElementById('status');
const previewStatus   = document.getElementById('previewStatus');
const settingsStatus  = document.getElementById('settingsStatus');

// ── Helpers ───────────────────────────────────────────────────────────────────

function showView(view) {
  [mainView, previewView, settingsView, successView].forEach(v => v.classList.add('hidden'));
  view.classList.remove('hidden');
}

function setStatus(el, msg, type = 'info') {
  el.textContent = msg;
  el.className = `status ${type}`;
}

function clearStatus(el) {
  el.textContent = '';
  el.className = 'status';
}

function storeClass(storeName = '') {
  const s = storeName.toLowerCase();
  if (s.includes('amazon'))    return 'amazon';
  if (s.includes('noon'))      return 'noon';
  if (s.includes('sharaf'))    return 'sharafdg';
  if (s.includes('carrefour')) return 'carrefour';
  return 'unknown';
}

async function getSettings() {
  return new Promise(resolve => {
    chrome.storage.local.get(['adminUrl', 'apiKey', 'defaultStore'], data => {
      resolve({
        adminUrl:     data.adminUrl     || 'https://uaediscounthub.com',
        apiKey:       data.apiKey       || '',
        defaultStore: data.defaultStore || '',
      });
    });
  });
}

async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

// ── Store detection on popup open ─────────────────────────────────────────────

async function detectStoreOnPage() {
  const tab = await getActiveTab();
  const host = new URL(tab.url || 'https://example.com').hostname;

  const storeMap = {
    'amazon.ae':        '🛒 Amazon UAE',
    'noon.com':         '🌅 Noon',
    'sharafdg.com':     '📱 SharafDG',
    'carrefouruae.com': '🛒 Carrefour UAE',
  };

  const match = Object.entries(storeMap).find(([domain]) => host.includes(domain));
  if (match) {
    storeBadge.textContent = match[1];
    storeBadge.className = `store-badge ${storeClass(match[1])}`;
  } else {
    storeBadge.textContent = '⚠ Not a supported store page';
    storeBadge.className = 'store-badge unknown';
  }
}

// ── Scrape ────────────────────────────────────────────────────────────────────

scrapeBtn.addEventListener('click', async () => {
  clearStatus(status);
  scrapeBtn.disabled = true;
  scrapeBtn.innerHTML = '<span class="spinner"></span> Scraping...';

  try {
    const tab = await getActiveTab();

    // Inject content script first (in case it wasn't injected on navigation)
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['content.js'],
    }).catch(() => {}); // ignore if already injected

    const response = await chrome.tabs.sendMessage(tab.id, { action: 'scrape' });

    if (!response?.success) {
      throw new Error(response?.error || 'Scraping failed. Make sure you are on a product page.');
    }

    scrapedData = response.data;

    // Debug: log full scraped payload to extension's console
    console.log('[UAEDiscountHub] Scraped data:', JSON.stringify(scrapedData, null, 2));

    if (!scrapedData.name) {
      throw new Error('Could not detect product title. Try scrolling down so the page fully loads, then retry.');
    }

    renderPreview(scrapedData);
    showView(previewView);

  } catch (err) {
    setStatus(status, err.message, 'error');
  } finally {
    scrapeBtn.disabled = false;
    scrapeBtn.innerHTML = '<span class="btn-icon">⬇</span> Import This Product';
  }
});

// ── Preview ───────────────────────────────────────────────────────────────────

function renderPreview(data) {
  const img = document.getElementById('previewImage');
  if (data.thumbnail_url || (data.images && data.images[0])) {
    img.src = data.thumbnail_url || data.images[0];
    img.style.display = 'block';
  } else {
    img.style.display = 'none';
  }

  document.getElementById('previewStore').textContent   = data.source_store || data.store || '';
  document.getElementById('previewName').textContent    = data.name || 'Unknown product';
  document.getElementById('previewPrice').textContent   = data.price ? `AED ${Number(data.price).toLocaleString()}` : 'Price N/A';
  document.getElementById('previewImages').textContent  = data.images?.length ? `📷 ${data.images.length} images` : '';
  document.getElementById('previewBrand').textContent   = data.brand ? `by ${data.brand}` : '';

  clearStatus(previewStatus);
}

// ── Import ────────────────────────────────────────────────────────────────────

async function doImport(publishStatus) {
  if (!scrapedData) return;

  const settings = await getSettings();

  if (!settings.apiKey) {
    setStatus(previewStatus, 'API key not set. Open Settings ⚙ and add your IMPORT_API_KEY.', 'error');
    return;
  }

  const btn = publishStatus === 'published' ? importPublishBtn : importDraftBtn;
  btn.disabled = true;
  const origText = btn.textContent;
  btn.innerHTML = '<span class="spinner"></span> Importing...';

  try {
    const payload = {
      ...scrapedData,
      status: publishStatus,
      default_store_id: settings.defaultStore || undefined,
    };

    const res = await fetch(`${settings.adminUrl}/api/admin/import-product`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${settings.apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    const json = await res.json();

    if (!res.ok || json.error) {
      throw new Error(json.error || `Server returned ${res.status}`);
    }

    // Show success
    document.getElementById('successSub').textContent =
      `"${scrapedData.name?.slice(0, 60)}${scrapedData.name?.length > 60 ? '…' : ''}" has been ${publishStatus === 'published' ? 'published' : 'saved as draft'}.`;

    const editUrl = `${settings.adminUrl}/en/admin/products/${json.productId}/edit`;
    const editLink = document.getElementById('editLink');
    editLink.href = editUrl;

    scrapedData = null;
    showView(successView);

  } catch (err) {
    setStatus(previewStatus, `Import failed: ${err.message}`, 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = origText;
  }
}

const importPublishBtn = document.getElementById('importPublishBtn');
const importDraftBtn   = document.getElementById('importDraftBtn');

importPublishBtn.addEventListener('click', () => doImport('published'));
importDraftBtn.addEventListener('click',   () => doImport('draft'));

document.getElementById('cancelBtn').addEventListener('click', () => {
  scrapedData = null;
  showView(mainView);
});

// ── Settings ──────────────────────────────────────────────────────────────────

document.getElementById('settingsBtn').addEventListener('click', async () => {
  const settings = await getSettings();
  document.getElementById('adminUrl').value    = settings.adminUrl;
  document.getElementById('apiKey').value      = settings.apiKey;
  document.getElementById('defaultStore').value = settings.defaultStore;
  clearStatus(settingsStatus);
  showView(settingsView);
});

document.getElementById('backFromSettings').addEventListener('click', () => showView(mainView));

document.getElementById('saveSettings').addEventListener('click', () => {
  const adminUrl    = document.getElementById('adminUrl').value.trim().replace(/\/$/, '');
  const apiKey      = document.getElementById('apiKey').value.trim();
  const defaultStore = document.getElementById('defaultStore').value.trim();

  if (!adminUrl) {
    setStatus(settingsStatus, 'Admin URL is required.', 'error');
    return;
  }

  chrome.storage.local.set({ adminUrl, apiKey, defaultStore }, () => {
    setStatus(settingsStatus, '✓ Settings saved!', 'success');
    setTimeout(() => showView(mainView), 800);
  });
});

// ── Success View ──────────────────────────────────────────────────────────────

document.getElementById('importAnother').addEventListener('click', () => showView(mainView));

// ── Init ──────────────────────────────────────────────────────────────────────

detectStoreOnPage();
