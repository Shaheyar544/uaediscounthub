// ─── UAEDiscountHub Product Importer — Popup Logic ────────────────────────────
'use strict';

// ── State ─────────────────────────────────────────────────────────────────────
let scrapedData = null;
let scrapedDeals = [];   // full list from deals page

// ── DOM refs ──────────────────────────────────────────────────────────────────
const mainView        = document.getElementById('mainView');
const previewView     = document.getElementById('previewView');
const settingsView    = document.getElementById('settingsView');
const successView     = document.getElementById('successView');
const dealsView       = document.getElementById('dealsView');

const storeBadge      = document.getElementById('storeBadge');
const scrapeBtn       = document.getElementById('scrapeBtn');
const scrapeDealsBtn  = document.getElementById('scrapeDealsBtn');
const status          = document.getElementById('status');
const previewStatus   = document.getElementById('previewStatus');
const settingsStatus  = document.getElementById('settingsStatus');
const dealsStatus     = document.getElementById('dealsStatus');

// ── Helpers ───────────────────────────────────────────────────────────────────

function showView(view) {
  [mainView, previewView, settingsView, successView, dealsView].forEach(v => v.classList.add('hidden'));
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
  const url = tab.url || '';
  let host;
  try { host = new URL(url).hostname; } catch { host = ''; }

  const storeMap = {
    'amazon.ae':        '🛒 Amazon UAE',
    'noon.com':         '🌅 Noon',
    'sharafdg.com':     '📱 SharafDG',
    'carrefouruae.com': '🛒 Carrefour UAE',
  };

  const match = Object.entries(storeMap).find(([domain]) => host.includes(domain));

  // Check if this is an Amazon deals page
  const isAmazonDealsPage =
    host.includes('amazon.ae') &&
    (url.includes('/deals') || url.includes('/b/') && url.includes('deal'));

  if (match) {
    storeBadge.textContent = match[1];
    storeBadge.className = `store-badge ${storeClass(match[1])}`;

    if (isAmazonDealsPage) {
      // Show deals scraper mode
      scrapeBtn.classList.add('hidden');
      scrapeDealsBtn.classList.remove('hidden');
      document.getElementById('heroText').textContent =
        'Amazon Deals page detected! Click below to scrape all visible deals.';
    } else {
      scrapeBtn.classList.remove('hidden');
      scrapeDealsBtn.classList.add('hidden');
    }
  } else {
    storeBadge.textContent = '⚠ Not a supported store page';
    storeBadge.className = 'store-badge unknown';
    scrapeBtn.classList.remove('hidden');
    scrapeDealsBtn.classList.add('hidden');
  }
}

// ── Single Product Scrape ─────────────────────────────────────────────────────

scrapeBtn.addEventListener('click', async () => {
  clearStatus(status);
  scrapeBtn.disabled = true;
  scrapeBtn.innerHTML = '<span class="spinner"></span> Scraping...';

  try {
    const tab = await getActiveTab();

    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['content.js'],
    }).catch(() => {});

    const response = await chrome.tabs.sendMessage(tab.id, { action: 'scrape' });

    if (!response?.success) {
      throw new Error(response?.error || 'Scraping failed. Make sure you are on a product page.');
    }

    scrapedData = response.data;

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

// ── Deals Page Scrape (storage-polling pattern) ───────────────────────────────

const dealsLoadingState = document.getElementById('dealsLoadingState');
const dealsLoadingText  = document.getElementById('dealsLoadingText');

function showDealsLoading(msg) {
  scrapeDealsBtn.classList.add('hidden');
  dealsLoadingState.classList.remove('hidden');
  dealsLoadingText.textContent = msg || 'Scanning deals page...';
}

function hideDealsLoading() {
  dealsLoadingState.classList.add('hidden');
  scrapeDealsBtn.classList.remove('hidden');
  scrapeDealsBtn.disabled = false;
  scrapeDealsBtn.innerHTML = '<span class="btn-icon">🏷</span> Scrape Deals Page';
}

scrapeDealsBtn.addEventListener('click', async () => {
  clearStatus(status);
  scrapeDealsBtn.disabled = true;

  try {
    const tab = await getActiveTab();

    // Clear previous results
    await chrome.storage.local.remove(['scrapedDeals', 'scrapeComplete', 'scrapeError']);

    // Inject content script (no-op if already loaded)
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['content.js'],
    }).catch(() => {});

    // Fire scrape command — content script ACKs immediately then writes to storage
    chrome.tabs.sendMessage(tab.id, { action: 'scrapeDeals' }).catch(() => {});

    showDealsLoading('Scanning deals page...');

    const MAX_WAIT = 20000;
    const start    = Date.now();

    const poll = setInterval(async () => {
      const elapsed = Date.now() - start;
      dealsLoadingText.textContent = `Scanning... ${Math.round(elapsed / 1000)}s`;

      const result = await chrome.storage.local.get([
        'scrapeComplete', 'scrapedDeals', 'scrapeError', 'scrapeCount',
      ]);

      if (result.scrapeComplete) {
        clearInterval(poll);
        hideDealsLoading();

        if (result.scrapeError) {
          setStatus(status, `Error: ${result.scrapeError}`, 'error');
          return;
        }

        scrapedDeals = result.scrapedDeals || [];

        if (scrapedDeals.length === 0) {
          setStatus(status, 'No deals detected. Scroll down to load more, then retry.', 'error');
          return;
        }

        renderDealsView(scrapedDeals);
        showView(dealsView);
        return;
      }

      if (elapsed > MAX_WAIT) {
        clearInterval(poll);
        hideDealsLoading();
        setStatus(status, 'Page still loading deals — scroll down on Amazon first, then retry.', 'error');
      }
    }, 300);

  } catch (err) {
    hideDealsLoading();
    setStatus(status, err.message, 'error');
  }
});

// ── Deals View Rendering ──────────────────────────────────────────────────────

function renderDealsView(deals) {
  document.getElementById('dealsCount').textContent = `${deals.length} deal${deals.length !== 1 ? 's' : ''} found`;
  document.getElementById('selectAllDeals').checked = false;

  const list = document.getElementById('dealsList');
  list.innerHTML = '';

  deals.forEach((deal, idx) => {
    const item = document.createElement('div');
    item.className = 'deal-item';
    item.dataset.idx = idx;

    // Support both old field names (current_price/title) and new (deal_price/name)
    const displayName  = deal.name || deal.title || '';
    const displayPrice = deal.deal_price ?? deal.current_price;
    const discount = deal.discount_percent ? `−${deal.discount_percent}%` : '';
    const couponLabel = deal.coupon_text || (deal.coupon_value ? `${deal.coupon_value}${deal.coupon_type === 'percentage' ? '%' : ' AED'} off` : '');
    const couponBadge = couponLabel
      ? `<span class="deal-coupon">🏷 ${couponLabel}</span>` : '';
    const lightningBadge = (deal.is_limited_time || deal.is_lightning)
      ? `<span class="deal-lightning">⚡ Limited</span>` : '';

    item.innerHTML = `
      <label class="deal-row">
        <input type="checkbox" class="deal-checkbox" data-idx="${idx}" />
        <div class="deal-thumb-container">
          <img class="deal-thumb" 
            src="${deal.image_url || ''}" 
            alt="" 
            onerror="this.src='/icons/icon48.png'; this.classList.add('fallback-img')" />
        </div>
        <div class="deal-info">
          <div class="deal-name">${displayName.slice(0, 70)}${displayName.length > 70 ? '…' : ''}</div>
          <div class="deal-pricing">
            <span class="deal-price">AED ${displayPrice?.toLocaleString()}</span>
            ${deal.original_price ? `<span class="deal-original">AED ${deal.original_price?.toLocaleString()}</span>` : ''}
            ${discount ? `<span class="deal-discount">${discount}</span>` : ''}
          </div>
          <div class="deal-badges">
            ${lightningBadge}${couponBadge}
          </div>
        </div>
      </label>
    `;

    list.appendChild(item);
  });

  // Wire checkboxes
  list.querySelectorAll('.deal-checkbox').forEach(cb => {
    cb.addEventListener('change', updateImportButton);
  });

  updateImportButton();
}

function getSelectedDeals() {
  return Array.from(document.querySelectorAll('.deal-checkbox:checked'))
    .map(cb => scrapedDeals[parseInt(cb.dataset.idx, 10)])
    .filter(Boolean);
}

function updateImportButton() {
  const selected = getSelectedDeals();
  const btn = document.getElementById('importDealsBtn');
  btn.disabled = selected.length === 0;
  btn.innerHTML = `<span class="btn-icon">🚀</span> Import Selected (${selected.length})`;
}

document.getElementById('selectAllDeals').addEventListener('change', function () {
  document.querySelectorAll('.deal-checkbox').forEach(cb => {
    cb.checked = this.checked;
  });
  updateImportButton();
});

document.getElementById('backFromDeals').addEventListener('click', () => {
  scrapedDeals = [];
  showView(mainView);
});

// ── Import Deals ──────────────────────────────────────────────────────────────

document.getElementById('importDealsBtn').addEventListener('click', async () => {
  const selected = getSelectedDeals();
  if (selected.length === 0) return;

  const settings = await getSettings();
  if (!settings.apiKey) {
    setStatus(dealsStatus, 'API key not set. Open Settings ⚙ and add your IMPORT_API_KEY.', 'error');
    return;
  }

  const btn = document.getElementById('importDealsBtn');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Importing...';
  clearStatus(dealsStatus);

  try {
    const targetUrl = `${settings.adminUrl}/api/admin/import-deals`;
    console.log('Sending deals to:', targetUrl);
    
    const res = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${settings.apiKey}`,
      },
      body: JSON.stringify(selected),
    });

    const json = await res.json();

    if (!res.ok) {
      throw new Error(json.error || `Server returned ${res.status}`);
    }

    // Show success
    document.getElementById('successTitle').textContent = 'Deals Imported!';
    const errorCount = json.errors?.length || 0;
    let statusText = `${json.imported} of ${json.total} deal${json.total !== 1 ? 's' : ''} imported successfully.`;
    if (errorCount > 0) {
      statusText += `\n(${errorCount} items failed)`;
      
      // Show first few errors in UI
      var errorList = document.createElement('div');
      errorList.style = 'margin-top: 10px; font-size: 11px; text-align: left; color: #ef4444; background: #fee2e2; padding: 8px; border-radius: 6px; max-height: 100px; overflow-y: auto;';
      errorList.innerHTML = '<strong>Errors:</strong><ul style="margin: 4px 0 0 16px; padding:0;">' + 
        json.errors.slice(0, 3).map(function(e) { 
          return '<li>' + (e.asin || 'Unknown') + ': ' + (e.error || 'Unknown error') + '</li>'; 
        }).join('') + 
        (json.errors.length > 3 ? '<li>...and ' + (json.errors.length - 3) + ' more</li>' : '') + 
        '</ul>';
      
      document.getElementById('successView').appendChild(errorList);
      console.error('Import Errors:', json.errors);
    }
    document.getElementById('successSub').textContent = statusText;

    const editLink = document.getElementById('editLink');
    editLink.href = `${settings.adminUrl}/en/admin/deals`;
    editLink.textContent = 'View Deals in Admin →';

    scrapedDeals = [];
    showView(successView);

  } catch (err) {
    setStatus(dealsStatus, `Import failed: ${err.message}`, 'error');
    btn.disabled = false;
    updateImportButton();
  }
});

// ── Preview (single product) ──────────────────────────────────────────────────

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

// ── Import (single product) ───────────────────────────────────────────────────

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

    document.getElementById('successTitle').textContent = 'Product Imported!';
    document.getElementById('successSub').textContent =
      `"${scrapedData.name?.slice(0, 60)}${scrapedData.name?.length > 60 ? '…' : ''}" has been ${publishStatus === 'published' ? 'published' : 'saved as draft'}.`;

    const editUrl = `${settings.adminUrl}/en/admin/products/${json.productId}/edit`;
    const editLink = document.getElementById('editLink');
    editLink.href = editUrl;
    editLink.textContent = 'Open in Admin →';

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
