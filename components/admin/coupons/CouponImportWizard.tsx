'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, Download, FileUp, Loader2, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createCouponImportSampleCsv } from '@/lib/coupons/import/sample';

type Store = { id: string; name: string; slug: string };
type Analysis = { headers: string[]; rowCount: number; suggestedMapping: Record<string, string> };
type StoreResolution = { sourceValue: string | null; status: 'auto_resolved' | 'needs_review' | 'unresolved' | 'new_store_candidate'; storeName: string | null; candidates: Array<{ id: string; name: string }>; reason: string; confidence: 'high' | 'review' | 'none'; rowCount: number };
type Preview = { importId: string; validationHash: string; counts: { total: number; valid: number; duplicates: number; invalid: number; warnings: number }; preview: Array<{ rowNumber: number; code: string | null; store: string | null; title: string | null; discount: string | null; status: string; problems: string[]; warnings: string[] }>; storeResolutions: StoreResolution[] };
const fields = [['store', 'Store'], ['code', 'Code *'], ['title_en', 'English Title *'], ['discount_type', 'Discount Type'], ['discount_value', 'Discount Value *'], ['expires_at', 'Expiry'], ['is_active', 'Active'], ['is_verified', 'Verified'], ['is_exclusive', 'Exclusive']] as const;

export function CouponImportWizard({ locale, stores }: { locale: string; stores: Store[] }) {
  const [file, setFile] = useState<File | null>(null);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [defaultStoreId, setDefaultStoreId] = useState('');
  const [preview, setPreview] = useState<Preview | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [complete, setComplete] = useState<number | null>(null);
  const [reviewTargets, setReviewTargets] = useState<Record<string, string>>({});
  const canStage = Boolean(mapping.code && mapping.title_en && mapping.discount_value && (mapping.store || defaultStoreId));
  const uploadLabel = useMemo(() => file ? file.name + ' · ' + Math.ceil(file.size / 1024) + ' KB' : 'Drop a CSV here or choose a file', [file]);

  async function analyze(nextFile: File | null) {
    setFile(nextFile); setAnalysis(null); setPreview(null); setError('');
    if (!nextFile) return;
    setBusy(true);
    const body = new FormData(); body.set('file', nextFile);
    try {
      const response = await fetch('/api/admin/coupons/import/analyze', { method: 'POST', body });
      const result = await response.json();
      if (!response.ok) return setError(result.error ?? 'The CSV could not be analyzed.');
      setAnalysis(result); setMapping(result.suggestedMapping);
    } catch {
      setError('The CSV could not be analyzed. Please try again.');
    } finally {
      setBusy(false);
    }
  }
  async function stage() {
    if (!file) return;
    setBusy(true); setError('');
    const body = new FormData(); body.set('file', file); body.set('mapping', JSON.stringify(mapping)); body.set('defaultStoreId', defaultStoreId);
    try {
      const response = await fetch('/api/admin/coupons/import/stage', { method: 'POST', body });
      const result = await response.json();
      if (!response.ok) return setError(result.error ?? 'The import could not be validated.');
      setPreview(result);
    } catch {
      setError('The import could not be validated. Please try again.');
    } finally {
      setBusy(false);
    }
  }
  async function commit() {
    if (!preview) return;
    setBusy(true); setError('');
    try {
      const response = await fetch('/api/admin/coupons/import/' + preview.importId + '/commit', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ validationHash: preview.validationHash }) });
      const result = await response.json();
      if (!response.ok) return setError(result.error ?? 'The import could not be committed.');
      setComplete(result.inserted_row_count);
    } catch {
      setError('The import could not be committed. No coupons were imported.');
    } finally {
      setBusy(false);
    }
  }
  async function reviewAlias(item: StoreResolution, decision: 'approve' | 'reject') {
    const key = item.sourceValue ?? '';
    setBusy(true); setError('');
    try {
      const response = await fetch('/api/admin/coupons/store-aliases', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ aliasValue: item.sourceValue, decision, storeId: reviewTargets[key] }),
      });
      const result = await response.json();
      if (!response.ok) return setError(result.error ?? 'The store alias could not be saved.');
      setPreview(null);
      setError('Store review saved. Validate and preview again to apply the decision to this file.');
    } catch {
      setError('The store alias could not be saved. Please try again.');
    } finally {
      setBusy(false);
    }
  }
  function reset() { setFile(null); setAnalysis(null); setPreview(null); setComplete(null); setError(''); setMapping({}); }
  function downloadSampleCsv() {
    const blob = new Blob([createCouponImportSampleCsv()], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'coupon-import-sample.csv';
    link.click();
    URL.revokeObjectURL(url);
  }

  if (complete !== null && preview) return <div className="mx-auto max-w-3xl rounded-2xl border bg-card p-8 text-center shadow-sm space-y-5"><CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500" /><h1 className="text-3xl font-black">Import Complete</h1><p className="text-muted-foreground">Batch {preview.importId}</p><div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4"><div><b>{complete}</b><br />Imported</div><div><b>{preview.counts.duplicates}</b><br />Duplicates skipped</div><div><b>{preview.counts.invalid}</b><br />Invalid</div><div><b>{preview.counts.warnings}</b><br />Warnings</div></div><div className="flex justify-center gap-3"><Link href={'/' + locale + '/admin/coupons'}><Button>View Coupons</Button></Link><Button variant="outline" onClick={reset}>Import Another File</Button></div></div>;

  return <div className="space-y-6">
    <div><p className="text-xs font-black uppercase tracking-[.16em] text-primary">Coupon operations</p><h1 className="text-3xl font-black tracking-tight">Import Coupons</h1><p className="text-muted-foreground">Upload, validate, preview, then explicitly commit your CSV.</p></div>
    {error && <div role="alert" className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>}
    <section className="rounded-2xl border bg-card p-5 shadow-sm space-y-4"><Label htmlFor="coupon-csv" className="block cursor-pointer rounded-xl border-2 border-dashed p-8 text-center hover:border-primary"><FileUp className="mx-auto mb-3 h-8 w-8 text-primary" /><b>{uploadLabel}</b><span className="mt-1 block text-xs text-muted-foreground">UTF-8 CSV only · up to 5 MB · 10,000 rows</span></Label><Input id="coupon-csv" className="sr-only" type="file" accept=".csv,text/csv" onChange={(event) => analyze(event.target.files?.[0] ?? null)} /><div className="flex flex-wrap items-center gap-3"><p className="text-sm text-muted-foreground">Not sure about the format? Download our sample CSV.</p><Button variant="outline" size="sm" onClick={downloadSampleCsv}><Download aria-hidden="true" className="mr-2 h-4 w-4" />Download Sample CSV</Button></div>{file && <Button variant="ghost" size="sm" onClick={() => analyze(null)}>Clear selected file</Button>}{busy && !analysis && <p className="flex items-center gap-2 text-sm"><Loader2 className="h-4 w-4 animate-spin" />Reading CSV securely…</p>}</section>
    {analysis && !preview && <section className="rounded-2xl border bg-card p-5 shadow-sm space-y-5"><div><h2 className="font-bold">Map columns</h2><p className="text-sm text-muted-foreground">{analysis.rowCount.toLocaleString()} rows detected. Required fields are marked with *. Discount Type may be inferred only from an explicit % or AED value.</p></div><div className="grid gap-3 sm:grid-cols-2">{fields.map(([key, label]) => <div key={key} className="grid grid-cols-2 items-center gap-3"><Label>{label}</Label><select className="h-10 rounded-md border bg-background px-3 text-sm" value={mapping[key] ?? ''} onChange={(event) => setMapping({ ...mapping, [key]: event.target.value })}><option value="">Not mapped</option>{analysis.headers.map((header) => <option key={header} value={header}>{header}</option>)}</select></div>)}</div><div className="max-w-md space-y-2"><Label>Default Store {mapping.store ? '(optional)' : '*'}</Label><select className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={defaultStoreId} onChange={(event) => setDefaultStoreId(event.target.value)}><option value="">Select an active store</option>{stores.map((store) => <option key={store.id} value={store.id}>{store.name}</option>)}</select></div><Button disabled={!canStage || busy} onClick={stage}>{busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}Validate and Preview</Button></section>}
    {preview && <section className="rounded-2xl border bg-card p-5 shadow-sm space-y-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-xl font-black">Ready to Import</h2><p className="text-sm text-muted-foreground">{preview.counts.valid.toLocaleString()} coupons will be created. Duplicates and invalid rows are excluded.</p></div><div className="grid grid-cols-2 gap-3 text-center text-sm sm:grid-cols-4"><span><b className="text-emerald-600">{preview.counts.valid}</b><br />Valid</span><span><b className="text-amber-600">{preview.counts.duplicates}</b><br />Duplicates</span><span><b className="text-destructive">{preview.counts.invalid}</b><br />Invalid</span><span><b className="text-sky-600">{preview.counts.warnings}</b><br />Warnings</span></div></div>
      <div className="rounded-xl border p-4 space-y-3"><div><h3 className="font-bold">Store resolution</h3><p className="text-sm text-muted-foreground">Only one-to-one deterministic matches are resolved automatically. A reviewed alias is reused on later imports.</p></div>{(['auto_resolved', 'needs_review', 'unresolved', 'new_store_candidate'] as const).map((status) => { const items = preview.storeResolutions.filter((item) => item.status === status); if (!items.length) return null; return <div key={status} className="space-y-2"><p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{status.replaceAll('_', ' ')} · {items.reduce((total, item) => total + item.rowCount, 0)} rows</p>{items.map((item) => <div className="rounded-lg bg-muted/50 p-3 text-sm" key={item.sourceValue ?? status}><div className="flex flex-wrap items-center justify-between gap-2"><span className="font-medium">{item.sourceValue ?? 'Blank store value'}</span><span className="text-muted-foreground">{item.storeName ? `→ ${item.storeName}` : item.reason}</span></div>{item.status === 'needs_review' && <div className="mt-3 flex flex-wrap gap-2"><select aria-label={`Verified store for ${item.sourceValue}`} className="h-9 rounded-md border bg-background px-2 text-sm" value={reviewTargets[item.sourceValue ?? ''] ?? ''} onChange={(event) => setReviewTargets({ ...reviewTargets, [item.sourceValue ?? '']: event.target.value })}><option value="">Choose verified store</option>{item.candidates.map((candidate) => <option key={candidate.id} value={candidate.id}>{candidate.name}</option>)}</select><Button size="sm" disabled={busy || !(reviewTargets[item.sourceValue ?? ''] ?? '')} onClick={() => reviewAlias(item, 'approve')}>Approve alias</Button><Button size="sm" variant="outline" disabled={busy} onClick={() => reviewAlias(item, 'reject')}>Reject</Button></div>}</div>)}</div>})}</div>
      {(() => { const candidates = preview.storeResolutions.filter((item) => item.status === 'new_store_candidate'); const candidateRows = candidates.reduce((total, item) => total + item.rowCount, 0); return candidates.length ? <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 space-y-3"><div><h3 className="font-bold">New stores need verified URLs</h3><p className="text-sm text-muted-foreground">{candidates.length} catalog stores cover {candidateRows} currently excluded coupon rows. Import a Store CSV with each store’s verified Base URL, then revalidate this coupon file.</p></div><Link href={`/${locale}/admin/stores/import`}><Button variant="outline">Import Store CSV</Button></Link></div> : null; })()}
      <div className="overflow-x-auto rounded-xl border"><table className="w-full min-w-[700px] text-sm"><thead className="bg-muted/60"><tr>{['Row','Code','Store','Title','Discount','Status','Problems'].map((name) => <th className="p-3 text-left" key={name}>{name}</th>)}</tr></thead><tbody>{preview.preview.map((row) => <tr className="border-t" key={row.rowNumber}><td className="p-3">{row.rowNumber}</td><td className="p-3 font-mono">{row.code}</td><td className="p-3">{row.store}</td><td className="p-3">{row.title}</td><td className="p-3">{row.discount}</td><td className="p-3"><span className="rounded-full bg-muted px-2 py-1 text-xs">{row.status.replaceAll('_', ' ')}</span></td><td className="p-3 text-xs text-muted-foreground">{[...row.problems, ...row.warnings].join(' ') || '—'}</td></tr>)}</tbody></table></div><Button disabled={busy || preview.counts.valid === 0} onClick={commit}>{busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}Import {preview.counts.valid.toLocaleString()} Coupons</Button></section>}
  </div>;
}
