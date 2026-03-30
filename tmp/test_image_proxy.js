const { uploadRemoteImage } = require('./lib/r2-storage');
require('dotenv').config({ path: '.env.local' });

async function test() {
  console.log('--- Testing Image Proxy ---');
  const testUrl = 'https://m.media-amazon.com/images/I/313M6vTtEBL._AC_SR240,220_.jpg';
  const fileName = 'test-proxy-img.webp';

  try {
    const result = await uploadRemoteImage(testUrl, fileName);
    console.log('SUCCESS!');
    console.log('R2 URL:', result.url);
    console.log('Key:', result.key);
  } catch (err) {
    console.error('FAILED!', err.message);
  }
}

test();
