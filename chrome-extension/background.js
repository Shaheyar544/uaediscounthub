// ─── UAEDiscountHub Product Importer — Service Worker ────────────────────────
// Minimal background service worker for Manifest V3.
// Handles extension lifecycle events.

'use strict';

chrome.runtime.onInstalled.addListener(({ reason }) => {
  if (reason === 'install') {
    // Set defaults on first install
    chrome.storage.local.set({
      adminUrl: 'https://uaediscounthub.com',
      apiKey: '',
      defaultStore: '',
    });
  }
});

// Keep the service worker alive during import fetch calls
chrome.runtime.onMessage.addListener((_msg, _sender, _sendResponse) => {
  // No-op — actual messaging handled in popup.js and content.js
});
