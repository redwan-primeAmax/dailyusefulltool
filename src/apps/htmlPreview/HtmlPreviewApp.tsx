import { useEffect, useRef, useState, type ChangeEvent, type DragEvent, type KeyboardEvent, type SyntheticEvent } from 'react';
import JSZip from 'jszip';
import {
  AlertTriangle,
  CheckCircle2,
  Code2,
  FileArchive,
  FileCode2,
  FileImage,
  FileVideo2,
  Globe2,
  LoaderCircle,
  RefreshCw,
  ShieldCheck,
  Upload,
  X,
} from 'lucide-react';
import { CustomButton } from '../../components/CustomButton';
import { ScreenShell } from '../../components/ui/ScreenShell';
import { useOS } from '../../context/OSContext';
import { cn } from '../../utils/cn';
import { createAssetBridgeScript, createPreviewHydrationShell } from './assetBridge';
import {
  chooseDefaultEntrypoint,
  formatPreviewSize,
  MAX_ARCHIVE_ENTRIES,
  MAX_UNCOMPRESSED_SIZE_BYTES,
  MAX_ZIP_SIZE_BYTES,
  mimeTypeForPath,
  normalizeArchivePath,
  resolveArchivePath,
} from './htmlPreviewModel';

interface ArchiveEntry {
  path: string;
  zipFile: JSZip.JSZipObject;
  size: number;
}

interface PreviewArchive {
  name: string;
  entries: Map<string, ArchiveEntry>;
  htmlPaths: string[];
  totalSize: number;
}

interface PreviewAssetBundle {
  nonce: string;
  assets: Array<[string, Blob]>;
}

function getUncompressedSize(file: JSZip.JSZipObject): number {
  const size = (file as unknown as { _data?: { uncompressedSize?: number } })._data?.uncompressedSize;
  return typeof size === 'number' && Number.isFinite(size) && size > 0 ? size : 0;
}

function isExternalReference(reference: string): boolean {
  return /^(?:[a-z][a-z\d+.-]*:|\/\/)/iu.test(reference.trim());
}

function getSuffix(reference: string): string {
  const hashIndex = reference.indexOf('#');
  return hashIndex >= 0 ? reference.slice(hashIndex) : '';
}

function mapReference(
  reference: string,
  fromPath: string,
  rawUrls: Map<string, string>,
  cssUrlForPath: (path: string, ancestors?: Set<string>) => string | undefined,
  cssAncestors?: Set<string>,
): string | null {
  const trimmed = reference.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith('#') || isExternalReference(trimmed)) return trimmed;

  const path = resolveArchivePath(trimmed, fromPath);
  if (!path) return null;
  const url = /\.css$/iu.test(path) ? cssUrlForPath(path, cssAncestors) : rawUrls.get(path);
  return url ? `${url}${getSuffix(trimmed)}` : null;
}

function rewriteCss(
  source: string,
  fromPath: string,
  rawUrls: Map<string, string>,
  cssUrlForPath: (path: string, ancestors?: Set<string>) => string | undefined,
  ancestors: Set<string>,
): string {
  const rewriteImport = (match: string, _quote: string, quotedPath: string, media: string) => {
    const url = mapReference(quotedPath, fromPath, rawUrls, cssUrlForPath, ancestors);
    return url ? `@import url("${url}")${media};` : match;
  };

  let result = source.replace(
    /@import\s+(?:url\(\s*)?(["'])([^"']+)\1\s*\)?([^;]*);/giu,
    rewriteImport,
  );
  result = result.replace(/@import\s+url\(\s*([^'"\s)]+)\s*\)([^;]*);/giu, (match, urlPath: string, media: string) => {
    const url = mapReference(urlPath, fromPath, rawUrls, cssUrlForPath, ancestors);
    return url ? `@import url("${url}")${media};` : match;
  });
  return result.replace(/url\(\s*(?:(["'])(.*?)\1|([^)]*?))\s*\)/giu, (match, _quote: string, quoted: string, bare: string) => {
    const reference = (quoted ?? bare ?? '').trim();
    const url = mapReference(reference, fromPath, rawUrls, cssUrlForPath, ancestors);
    return url ? `url("${url}")` : match;
  });
}

function findModulePath(path: string, entries: Map<string, ArchiveEntry>): string | null {
  const candidates = /\.[a-z\d]+$/iu.test(path)
    ? [path]
    : [path, `${path}.js`, `${path}.mjs`, `${path}/index.js`, `${path}/index.mjs`];
  return candidates.find((candidate) => entries.has(candidate)) ?? null;
}

function buildCsp(allowNetwork: boolean): string {
  const network = allowNetwork ? ' https:' : '';
  return [
    "default-src 'none'",
    `script-src 'unsafe-inline' 'unsafe-eval' blob: data:${network}`,
    `style-src 'unsafe-inline' blob: data:${network}`,
    `img-src blob: data:${network}`,
    `media-src blob: data:${network}`,
    `font-src blob: data:${network}`,
    `connect-src blob: data:${network}`,
    `frame-src blob: data:${network}`,
    `worker-src blob: data:${network}`,
    `form-action 'self' blob: data:${network}`,
    "object-src 'none'",
    "base-uri 'none'",
  ].join('; ');
}

export function HtmlPreviewApp() {
  const { notify } = useOS();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewFrameRef = useRef<HTMLIFrameElement>(null);
  const previewBundleRef = useRef<PreviewAssetBundle | null>(null);
  const lastSentBundleRef = useRef('');
  const mounted = useRef(true);
  const [archive, setArchive] = useState<PreviewArchive | null>(null);
  const [entryPath, setEntryPath] = useState('');
  const [previewDocument, setPreviewDocument] = useState('');
  const [previewVersion, setPreviewVersion] = useState(0);
  const [allowNetwork, setAllowNetwork] = useState(false);
  const [loading, setLoading] = useState(false);
  const [building, setBuilding] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      previewBundleRef.current = null;
    };
  }, []);

  const handlePreviewFrameLoad = (event?: SyntheticEvent<HTMLIFrameElement>) => {
    const bundle = previewBundleRef.current;
    const target = event?.currentTarget.contentWindow ?? previewFrameRef.current?.contentWindow;
    if (!bundle || !target) return;

    const deliveryKey = `${bundle.nonce}:${previewVersion}`;
    if (lastSentBundleRef.current === deliveryKey) return;

    try {
      target.postMessage({ type: 'zip-preview-assets', nonce: bundle.nonce, assets: bundle.assets }, '*');
      lastSentBundleRef.current = deliveryKey;
    } catch {
      setError('The browser could not pass the local ZIP files into the isolated preview. Reload the preview or try a smaller ZIP.');
      notify({ title: 'Could not start preview', description: 'The browser could not pass the local ZIP files into the isolated preview.', tone: 'danger' });
    }
  };

  const loadArchive = async (file: File) => {
    if (loading || building) return;
    previewBundleRef.current = null;
    setPreviewDocument('');
    setArchive(null);
    setEntryPath('');
    setError('');

    if (!/\.zip$/iu.test(file.name)) {
      setError('Choose a .zip archive to preview.');
      return;
    }
    if (file.size > MAX_ZIP_SIZE_BYTES) {
      setError(`This ZIP is larger than the ${formatPreviewSize(MAX_ZIP_SIZE_BYTES)} upload limit.`);
      return;
    }

    setLoading(true);
    try {
      const zip = await new JSZip().loadAsync(file);
      if (!mounted.current) return;
      const allEntries = Object.values(zip.files).filter((zipFile) => !zipFile.dir);
      if (allEntries.length > MAX_ARCHIVE_ENTRIES) {
        throw new Error(`This archive has more than ${MAX_ARCHIVE_ENTRIES.toLocaleString()} files.`);
      }

      const entries = new Map<string, ArchiveEntry>();
      let totalSize = 0;
      for (const zipFile of allEntries) {
        const path = normalizeArchivePath(zipFile.name);
        if (!path || entries.has(path)) continue;
        const size = getUncompressedSize(zipFile);
        totalSize += size;
        if (totalSize > MAX_UNCOMPRESSED_SIZE_BYTES) {
          throw new Error(`The uncompressed ZIP contents exceed ${formatPreviewSize(MAX_UNCOMPRESSED_SIZE_BYTES)}.`);
        }
        entries.set(path, { path, zipFile, size });
      }

      const htmlPaths = [...entries.keys()]
        .filter((path) => /\.html?$/iu.test(path))
        .sort((a, b) => a.localeCompare(b));
      if (htmlPaths.length === 0) {
        throw new Error('No .html or .htm entry page was found in this ZIP.');
      }

      setArchive({ name: file.name, entries, htmlPaths, totalSize });
      setEntryPath(chooseDefaultEntrypoint(htmlPaths));
      notify({
        title: 'ZIP app ready',
        description: `${entries.size.toLocaleString()} files · ${htmlPaths.length} HTML page${htmlPaths.length === 1 ? '' : 's'} · ${formatPreviewSize(totalSize)} uncompressed`,
        tone: 'success',
      });
    } catch (loadError) {
      if (!mounted.current) return;
      const message = loadError instanceof Error ? loadError.message : 'The ZIP could not be read.';
      setError(message);
      notify({ title: 'Could not open ZIP', description: message, tone: 'danger' });
    } finally {
      if (mounted.current) setLoading(false);
    }
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    const file = input.files?.[0];
    input.value = '';
    if (file) void loadArchive(file);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) void loadArchive(file);
  };

  const buildPreview = async () => {
    if (!archive || !entryPath || building) return;
    const previewArchive = archive;
    previewBundleRef.current = null;
    setError('');
    setBuilding(true);

    try {
      const bundleNonce = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
      const assetBlobs = new Map<string, Blob>();
      let assetIndex = 0;
      const registerAsset = (blob: Blob): string => {
        const token = `zipasset://preview-${bundleNonce}/asset/${String(++assetIndex).padStart(8, '0')}/`;
        assetBlobs.set(token, blob);
        return token;
      };
      const rawUrls = new Map<string, string>();
      let actualSize = 0;
      for (const file of previewArchive.entries.values()) {
        const content = await file.zipFile.async('blob');
        if (!mounted.current) return;
        actualSize += content.size;
        if (actualSize > MAX_UNCOMPRESSED_SIZE_BYTES) {
          throw new Error(`The extracted app is larger than the ${formatPreviewSize(MAX_UNCOMPRESSED_SIZE_BYTES)} preview limit.`);
        }
        const typedContent = content.slice(0, content.size, mimeTypeForPath(file.path));
        rawUrls.set(file.path, registerAsset(typedContent));
      }

      // Only retain source text for code and stylesheets. Binary assets (including
      // large audio collections) stay as Blobs instead of duplicating every byte
      // in a second Uint8Array map while the preview is being prepared.
      const textSources = new Map<string, string>();
      for (const file of previewArchive.entries.values()) {
        if (!/\.(?:html?|css|m?js|cjs)$/iu.test(file.path)) continue;
        textSources.set(file.path, await file.zipFile.async('string'));
        if (!mounted.current) return;
      }

      const processedCssUrls = new Map<string, string>();
      function cssUrlForPath(path: string, ancestors = new Set<string>()): string | undefined {
        const existing = processedCssUrls.get(path);
        if (existing) return existing;
        if (ancestors.has(path)) return rawUrls.get(path);
        const source = textSources.get(path);
        if (source === undefined) return undefined;

        const nextAncestors = new Set(ancestors);
        nextAncestors.add(path);
        const css = rewriteCss(source, path, rawUrls, cssUrlForPath, nextAncestors);
        const url = registerAsset(new Blob([css], { type: 'text/css; charset=utf-8' }));
        processedCssUrls.set(path, url);
        return url;
      }

      const processedModuleUrls = new Map<string, string>();
      function rewriteModuleSource(source: string, fromPath: string, ancestors: Set<string>): string {
        const rewriteImport = (specifier: string): string => {
          if (isExternalReference(specifier) || !/^(?:\.\.?\/|\/)/u.test(specifier)) return specifier;
          const resolvedPath = resolveArchivePath(specifier, fromPath);
          if (!resolvedPath) return specifier;
          const targetPath = findModulePath(resolvedPath, previewArchive.entries);
          if (!targetPath) return specifier;
          if (/\.(?:m?js|cjs)$/iu.test(targetPath)) return moduleUrlForPath(targetPath, ancestors);
          return rawUrls.get(targetPath) ?? specifier;
        };

        let rewritten = source.replace(
          /(\b(?:import|export)\s+(?:[^'"]*?\s+from\s*)?)(["'])([^'"]+)\2/gu,
          (_match, before: string, quote: string, specifier: string) => `${before}${quote}${rewriteImport(specifier)}${quote}`,
        );
        rewritten = rewritten.replace(
          /(\bimport\s*\(\s*)(["'])([^'"]+)\2(\s*\))/gu,
          (_match, before: string, quote: string, specifier: string, after: string) => `${before}${quote}${rewriteImport(specifier)}${quote}${after}`,
        );
        return rewritten;
      }

      function moduleUrlForPath(path: string, ancestors = new Set<string>()): string {
        const existing = processedModuleUrls.get(path);
        if (existing) return existing;
        if (ancestors.has(path)) return rawUrls.get(path) ?? '';
        const source = textSources.get(path);
        if (source === undefined) return rawUrls.get(path) ?? '';

        const nextAncestors = new Set(ancestors);
        nextAncestors.add(path);
        const rewritten = rewriteModuleSource(source, path, nextAncestors);
        const url = registerAsset(new Blob([rewritten], { type: 'text/javascript; charset=utf-8' }));
        processedModuleUrls.set(path, url);
        return url;
      }

      const htmlSource = textSources.get(entryPath);
      if (htmlSource === undefined) throw new Error('The selected HTML page could not be read.');
      const parsed = new DOMParser().parseFromString(htmlSource, 'text/html');
      parsed.querySelectorAll('base').forEach((base) => base.remove());
      parsed.querySelectorAll('meta[http-equiv]').forEach((meta) => {
        const policy = meta.getAttribute('http-equiv')?.trim().toLowerCase();
        if (policy === 'content-security-policy' || policy === 'content-security-policy-report-only') meta.remove();
      });

      parsed.querySelectorAll('script[type="importmap"]').forEach((script) => {
        try {
          const importMap = JSON.parse(script.textContent ?? '') as { imports?: Record<string, string> };
          if (importMap.imports) {
            for (const [specifier, target] of Object.entries(importMap.imports)) {
              if (!target.endsWith('/')) {
                const mapped = mapReference(target, entryPath, rawUrls, cssUrlForPath);
                if (mapped) importMap.imports[specifier] = mapped;
              }
            }
            script.textContent = JSON.stringify(importMap);
          }
        } catch {
          // The browser will report malformed import maps inside the sandbox.
        }
      });

      parsed.querySelectorAll('script[src]').forEach((script) => {
        const source = script.getAttribute('src') ?? '';
        if (isExternalReference(source)) return;
        const path = resolveArchivePath(source, entryPath);
        if (!path || !previewArchive.entries.has(path)) {
          script.removeAttribute('src');
          script.textContent = '';
          return;
        }
        const isModule = script.getAttribute('type')?.trim().toLowerCase() === 'module';
        script.setAttribute('src', isModule ? moduleUrlForPath(path) : (rawUrls.get(path) ?? ''));
        script.removeAttribute('crossorigin');
        script.removeAttribute('integrity');
      });

      parsed.querySelectorAll('script[type="module"]:not([src])').forEach((script) => {
        const source = script.textContent ?? '';
        if (!source.trim()) return;
        const rewritten = rewriteModuleSource(source, entryPath, new Set([entryPath]));
        script.setAttribute('src', registerAsset(new Blob([rewritten], { type: 'text/javascript; charset=utf-8' })));
        script.textContent = '';
      });

      parsed.querySelectorAll('link[href]').forEach((link) => {
        const href = link.getAttribute('href') ?? '';
        if (isExternalReference(href) || href.startsWith('#')) return;
        const path = resolveArchivePath(href, entryPath);
        if (!path) {
          link.removeAttribute('href');
          return;
        }
        const isStylesheet = (link.getAttribute('rel') ?? '').toLowerCase().split(/\s+/u).includes('stylesheet');
        const url = isStylesheet ? cssUrlForPath(path) : rawUrls.get(path);
        if (url) {
          link.setAttribute('href', `${url}${getSuffix(href)}`);
          link.removeAttribute('crossorigin');
          link.removeAttribute('integrity');
        } else link.removeAttribute('href');
      });

      parsed.querySelectorAll('img[src], audio[src], video[src], source[src], track[src], embed[src], iframe[src], input[src], a[href], form[action], video[poster], object[data]').forEach((element) => {
        for (const attribute of ['src', 'href', 'action', 'poster', 'data']) {
          const current = element.getAttribute(attribute);
          if (current === null || (attribute === 'href' && element.tagName === 'LINK')) continue;
          if (isExternalReference(current) || current.startsWith('#')) continue;
          const url = mapReference(current, entryPath, rawUrls, cssUrlForPath);
          if (url) {
            element.setAttribute(attribute, url);
            element.removeAttribute('crossorigin');
            element.removeAttribute('integrity');
          } else element.removeAttribute(attribute);
        }
      });

      parsed.querySelectorAll('[srcset]').forEach((element) => {
        const srcset = element.getAttribute('srcset') ?? '';
        if (/^data:/iu.test(srcset.trim())) return;
        const rewritten = srcset.split(',').map((candidate) => {
          const [reference, ...descriptor] = candidate.trim().split(/\s+/u);
          if (!reference) return candidate;
          const url = mapReference(reference, entryPath, rawUrls, cssUrlForPath);
          return url ? [url, ...descriptor].join(' ') : '';
        }).filter(Boolean).join(', ');
        if (rewritten) element.setAttribute('srcset', rewritten);
        else element.removeAttribute('srcset');
      });

      parsed.querySelectorAll('style').forEach((style) => {
        style.textContent = rewriteCss(style.textContent ?? '', entryPath, rawUrls, cssUrlForPath, new Set());
      });
      parsed.querySelectorAll('[style]').forEach((element) => {
        const style = element.getAttribute('style');
        if (style) element.setAttribute('style', rewriteCss(style, entryPath, rawUrls, cssUrlForPath, new Set()));
      });

      const csp = parsed.createElement('meta');
      csp.httpEquiv = 'Content-Security-Policy';
      csp.content = buildCsp(allowNetwork);
      parsed.head.prepend(csp);

      const referrer = parsed.createElement('meta');
      referrer.name = 'referrer';
      referrer.content = 'no-referrer';
      parsed.head.append(referrer);

      if (!parsed.querySelector('meta[name="viewport"]')) {
        const viewport = parsed.createElement('meta');
        viewport.name = 'viewport';
        viewport.content = 'width=device-width, initial-scale=1';
        parsed.head.append(viewport);
      }
      // The runtime bridge must also map dynamically-created stylesheet links to
      // the rewritten CSS Blobs, not to the unprocessed archive bytes.
      for (const path of textSources.keys()) {
        if (/\.css$/iu.test(path)) cssUrlForPath(path);
      }
      const runtimeAssetUrls = new Map(rawUrls);
      processedCssUrls.forEach((url, path) => runtimeAssetUrls.set(path, url));

      const assetBridge = parsed.createElement('script');
      assetBridge.textContent = createAssetBridgeScript(runtimeAssetUrls, entryPath);
      const firstPageScript = parsed.head.querySelector('script');
      if (firstPageScript) firstPageScript.before(assetBridge);
      else parsed.head.append(assetBridge);

      if (!parsed.title) parsed.title = entryPath.split('/').pop() ?? previewArchive.name;

      const appDocument = `<!doctype html>\n${parsed.documentElement.outerHTML}`;
      previewBundleRef.current = { nonce: bundleNonce, assets: [...assetBlobs.entries()] };
      setPreviewDocument(createPreviewHydrationShell(appDocument, bundleNonce, csp.content));
      notify({
        title: 'Preview ready',
        description: `${entryPath} · ${allowNetwork ? 'HTTPS network enabled' : 'offline sandbox'}`,
        tone: 'success',
      });
    } catch (previewError) {
      previewBundleRef.current = null;
      if (!mounted.current) return;
      const message = previewError instanceof Error ? previewError.message : 'The app preview could not be built.';
      setError(message);
      notify({ title: 'Preview failed', description: message, tone: 'danger' });
    } finally {
      if (mounted.current) setBuilding(false);
    }
  };

  const resetArchive = () => {
    previewBundleRef.current = null;
    setArchive(null);
    setEntryPath('');
    setPreviewDocument('');
    setError('');
    setAllowNetwork(false);
    fileInputRef.current?.focus();
  };

  const leavePreview = () => {
    previewBundleRef.current = null;
    setPreviewDocument('');
  };

  const handleDropzoneKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      fileInputRef.current?.click();
    }
  };

  const htmlEntryLabel = entryPath || 'Choose an HTML page';

  return (
    <ScreenShell
      title="HTML App Previewer"
      subtitle="Preview zipped web apps in an isolated browser sandbox"
      icon={<Code2 className="size-[19px]" />}
      contentClassName="!space-y-4"
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".zip,application/zip"
        aria-label="Choose a web app ZIP file"
        className="sr-only"
        onChange={handleFileChange}
      />

      {previewDocument ? (
        <section className="space-y-3">
          <div className="card flex flex-wrap items-center gap-3 p-3">
            <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-emerald-500/15 text-emerald-400">
              <CheckCircle2 className="size-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-bold text-ink">{archive?.name}</p>
              <p className="truncate text-[11px] text-ink3">{htmlEntryLabel} · {allowNetwork ? 'HTTPS access enabled' : 'offline sandbox'}</p>
            </div>
            <button
              type="button"
              onClick={() => setPreviewVersion((version) => version + 1)}
              aria-label="Reload preview"
              className="grid size-9 shrink-0 place-items-center rounded-xl bg-surface2 text-ink2 hover:text-accent"
            >
              <RefreshCw className="size-4" />
            </button>
            <button
              type="button"
              onClick={leavePreview}
              aria-label="Return to ZIP settings"
              className="grid size-9 shrink-0 place-items-center rounded-xl bg-surface2 text-ink2 hover:text-accent"
            >
              <X className="size-4" />
            </button>
          </div>

          {error && (
            <div role="alert" className="rounded-xl border border-red-400/25 bg-red-500/10 p-3 text-[12px] leading-5 text-red-200">
              {error}
            </div>
          )}

          <div className="overflow-hidden rounded-2xl border border-hairline bg-white shadow-2xl shadow-black/20">
            <iframe
              key={previewVersion}
              ref={previewFrameRef}
              title={`Preview of ${htmlEntryLabel}`}
              sandbox="allow-scripts allow-forms"
              referrerPolicy="no-referrer"
              srcDoc={previewDocument}
              onLoad={handlePreviewFrameLoad}
              className="block h-[68vh] min-h-[420px] w-full bg-white"
            />
          </div>
          <p className="flex items-center justify-center gap-1.5 text-center text-[10.5px] leading-4 text-ink3">
            <ShieldCheck className="size-3.5 shrink-0 text-emerald-400" />
            Sandboxed preview — it cannot access this app’s storage or parent page.
          </p>
        </section>
      ) : (
        <>
          <section className="relative overflow-hidden rounded-[26px] border border-cyan-300/15 bg-gradient-to-br from-cyan-500/15 via-slate-900/95 to-slate-950 p-5">
            <div className="pointer-events-none absolute -right-12 -top-14 size-40 rounded-full bg-cyan-400/10 blur-3xl" />
            <div className="relative flex items-start gap-3">
              <div className="grid size-11 shrink-0 place-items-center rounded-2xl border border-cyan-300/20 bg-cyan-400/10 text-cyan-200">
                <FileCode2 className="size-5" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.17em] text-cyan-200/70">Local web app runner</p>
                <h2 className="mt-1 text-xl font-black text-white">Drop in a ZIP. Preview the app.</h2>
                <p className="mt-1 text-sm leading-5 text-slate-400">HTML, CSS, JavaScript, and local media paths—including audio URLs created by JavaScript—are resolved from the archive.</p>
              </div>
            </div>
            <div className="relative mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-white/[0.07] pt-3 text-xs text-slate-400">
              <span className="flex items-center gap-1.5"><ShieldCheck className="size-3.5 text-emerald-300" /> Isolated sandbox</span>
              <span>ZIP stays on this device</span>
            </div>
          </section>

          {!archive ? (
            <div
              role="button"
              tabIndex={0}
              onClick={() => fileInputRef.current?.click()}
              onKeyDown={handleDropzoneKeyDown}
              onDragOver={(event) => event.preventDefault()}
              onDrop={handleDrop}
              aria-label="Choose or drop a web app ZIP file"
              className={cn(
                'group flex min-h-52 cursor-pointer flex-col items-center justify-center rounded-[24px] border-2 border-dashed border-hairline bg-surface2/50 p-6 text-center transition',
                'hover:border-accent/50 hover:bg-accent/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
                loading && 'pointer-events-none opacity-70',
              )}
            >
              <span className="grid size-14 place-items-center rounded-2xl bg-accent/10 text-accent transition group-hover:scale-105">
                {loading ? <LoaderCircle className="size-7 animate-spin" /> : <Upload className="size-7" />}
              </span>
              <h3 className="mt-4 text-[16px] font-bold text-ink">{loading ? 'Reading your ZIP…' : 'Choose or drop your app ZIP'}</h3>
              <p className="mt-1 max-w-sm text-[12px] leading-5 text-ink3">We look for an index.html page and keep everything local. ZIP limit: {formatPreviewSize(MAX_ZIP_SIZE_BYTES)}.</p>
              <span className="mt-4 rounded-xl bg-accent px-4 py-2 text-[12px] font-bold text-white">Select ZIP file</span>
            </div>
          ) : (
            <section className="card space-y-4 p-4">
              <div className="flex items-start gap-3">
                <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-accent/15 text-accent"><FileArchive className="size-5" /></div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-500">ZIP ready</p>
                  <h3 className="mt-1 break-all text-[14px] font-bold text-ink">{archive.name}</h3>
                  <p className="mt-1 text-[11px] text-ink3">
                    {archive.entries.size.toLocaleString()} files · {archive.htmlPaths.length} HTML page{archive.htmlPaths.length === 1 ? '' : 's'} · {formatPreviewSize(archive.totalSize)} expanded
                  </p>
                </div>
                <button type="button" onClick={resetArchive} disabled={building} aria-label="Choose a different ZIP" className="grid size-9 shrink-0 place-items-center rounded-xl bg-surface2 text-ink3 hover:text-red-400 disabled:opacity-40">
                  <X className="size-4" />
                </button>
              </div>

              <label className="block space-y-1.5 text-[12px] font-semibold text-ink2">
                <span>HTML page to open</span>
                <select
                  value={entryPath}
                  onChange={(event) => setEntryPath(event.target.value)}
                  className="h-11 w-full rounded-xl border border-hairline bg-surface px-3 text-[13px] text-ink outline-none focus:border-accent"
                >
                  {archive.htmlPaths.map((path) => <option key={path} value={path}>{path}</option>)}
                </select>
              </label>

              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-hairline bg-surface2/60 p-3">
                <input
                  type="checkbox"
                  checked={allowNetwork}
                  onChange={(event) => setAllowNetwork(event.target.checked)}
                  className="mt-0.5 size-4 accent-cyan-500"
                />
                <span>
                  <span className="block text-[12px] font-bold text-ink">Allow HTTPS libraries and network requests</span>
                  <span className="mt-0.5 block text-[11px] leading-4 text-ink3">Off by default. Turn on only if this app needs a CDN or online API; local ZIP files work either way.</span>
                </span>
              </label>

              <div className="flex items-start gap-2 rounded-xl border border-amber-400/20 bg-amber-400/5 p-3 text-[11px] leading-4 text-ink3">
                <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-400" />
                <p>Preview runs the ZIP’s JavaScript. Keep the sandbox enabled and only open archives you trust.</p>
              </div>

              <CustomButton
                fullWidth
                size="lg"
                onClick={() => void buildPreview()}
                disabled={!entryPath || building}
                leadingIcon={building ? <LoaderCircle className="size-4 animate-spin" /> : <Globe2 className="size-4" />}
              >
                {building ? 'Preparing preview…' : 'Done · Preview app'}
              </CustomButton>
            </section>
          )}

          {error && (
            <div role="alert" className="flex items-start gap-2.5 rounded-xl border border-red-400/25 bg-red-500/10 p-3 text-[12px] leading-5 text-red-200">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          <section className="grid grid-cols-3 gap-2">
            <div className="rounded-xl border border-hairline bg-surface2/50 p-3 text-center">
              <Code2 className="mx-auto size-4 text-accent" /><p className="mt-1 text-[10px] font-semibold text-ink3">HTML · JS · CSS</p>
            </div>
            <div className="rounded-xl border border-hairline bg-surface2/50 p-3 text-center">
              <FileImage className="mx-auto size-4 text-emerald-400" /><p className="mt-1 text-[10px] font-semibold text-ink3">Images · fonts</p>
            </div>
            <div className="rounded-xl border border-hairline bg-surface2/50 p-3 text-center">
              <FileVideo2 className="mx-auto size-4 text-violet-400" /><p className="mt-1 text-[10px] font-semibold text-ink3">Audio · video</p>
            </div>
          </section>
        </>
      )}
    </ScreenShell>
  );
}
