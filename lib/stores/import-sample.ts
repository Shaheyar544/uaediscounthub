export function createStoreImportSampleCsv() {
  return [
    '\uFEFFname,slug,base_url,affiliate_base_url,logo_url,is_active,is_featured,display_order',
    'Example Store UAE,example-store-uae,https://example.com,https://affiliate.example.com/redirect,https://example.com/logo.png,true,false,0',
    'Example Fashion UAE,example-fashion-uae,https://fashion.example.com,,,true,false,10',
  ].join('\n');
}
