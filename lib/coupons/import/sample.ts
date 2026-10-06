import { couponImportFields } from './types';

const sampleRows = [
  ['Example Store UAE', 'TESTPERCENT15', '15% off selected accessories', 'percent', '15%', 'خصم 15% على إكسسوارات مختارة', 'Use this test code on selected accessories.', 'استخدم رمز الاختبار هذا على إكسسوارات مختارة.', '100', '500', '2099-12-31', 'true', 'yes', 'no', ''],
  ['Example Store UAE', 'TESTAED25', 'AED 25 off orders over AED 200', 'fixed', 'AED 25', 'خصم 25 درهماً على طلبات تزيد عن 200 درهم', 'Use this test code when your order reaches AED 200.', 'استخدم رمز الاختبار هذا عند وصول طلبك إلى 200 درهم.', '200', '250', '2099-12-31', 'true', 'no', 'yes', ''],
  ['Example Store UAE', 'TESTPERCENT20', '20% off new-customer orders', 'percent', '20%', 'خصم 20% على طلبات العملاء الجدد', 'A test offer for first-time customer orders.', 'عرض تجريبي لطلبات العملاء لأول مرة.', '50', '1000', '2099-12-31', 'true', 'yes', 'no', ''],
] as const;

function escapeCsvValue(value: string) {
  return /[",\r\n]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value;
}

export function createCouponImportSampleCsv() {
  return `\ufeff${[couponImportFields, ...sampleRows]
    .map((row) => row.map(escapeCsvValue).join(','))
    .join('\r\n')}\r\n`;
}
