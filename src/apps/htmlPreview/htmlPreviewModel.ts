export const MAX_ZIP_SIZE_BYTES = 30 * 1024 * 1024;
export const MAX_UNCOMPRESSED_SIZE_BYTES = 80 * 1024 * 1024;
export const MAX_ARCHIVE_ENTRIES = 3000;

/** Normalize ZIP paths while refusing paths that would escape the archive root. */
export function normalizeArchivePath(path: string): string | null {
  const parts: string[] = [];
  const normalized = path.replace(/\\/gu, '/').replace(/^\/+/, '');

  for (const part of normalized.split('/')) {
    if (!part || part === '.') continue;
    if (part === '..') {
      if (parts.length === 0) return null;
      parts.pop();
      continue;
    }
    parts.push(part);
  }

  return parts.join('/');
}

/** Resolve a relative HTML/CSS/module URL to a normalized path in a ZIP. */
export function resolveArchivePath(reference: string, fromPath: string): string | null {
  const trimmed = reference.trim();
  if (!trimmed || trimmed.startsWith('#') || /^(?:[a-z][a-z\d+.-]*:|\/\/)/iu.test(trimmed)) return null;

  const pathOnly = trimmed.split(/[?#]/u, 1)[0];
  if (!pathOnly) return null;

  let decodedPath: string;
  try {
    decodedPath = decodeURIComponent(pathOnly).replace(/\\/gu, '/');
  } catch {
    return null;
  }

  const parts = decodedPath.startsWith('/')
    ? []
    : fromPath.split('/').slice(0, -1).filter(Boolean);

  for (const part of decodedPath.split('/')) {
    if (!part || part === '.') continue;
    if (part === '..') {
      if (parts.length === 0) return null;
      parts.pop();
      continue;
    }
    parts.push(part);
  }

  return parts.join('/');
}

export function chooseDefaultEntrypoint(htmlPaths: string[]): string {
  const sorted = [...htmlPaths].sort((a, b) => a.localeCompare(b));
  return sorted.find((path) => path.toLowerCase() === 'index.html')
    ?? sorted.find((path) => path.toLowerCase() === 'index.htm')
    ?? sorted.find((path) => path.split('/').pop()?.toLowerCase() === 'index.html')
    ?? sorted.find((path) => path.split('/').pop()?.toLowerCase() === 'index.htm')
    ?? sorted[0]
    ?? '';
}

const MIME_TYPES: Record<string, string> = {
  html: 'text/html; charset=utf-8',
  htm: 'text/html; charset=utf-8',
  css: 'text/css; charset=utf-8',
  js: 'text/javascript; charset=utf-8',
  mjs: 'text/javascript; charset=utf-8',
  cjs: 'text/javascript; charset=utf-8',
  json: 'application/json; charset=utf-8',
  webmanifest: 'application/manifest+json; charset=utf-8',
  xml: 'application/xml; charset=utf-8',
  txt: 'text/plain; charset=utf-8',
  svg: 'image/svg+xml',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  webp: 'image/webp',
  avif: 'image/avif',
  ico: 'image/x-icon',
  bmp: 'image/bmp',
  mp3: 'audio/mpeg',
  wav: 'audio/wav',
  ogg: 'audio/ogg',
  oga: 'audio/ogg',
  m4a: 'audio/mp4',
  aac: 'audio/aac',
  flac: 'audio/flac',
  mp4: 'video/mp4',
  m4v: 'video/mp4',
  webm: 'video/webm',
  ogv: 'video/ogg',
  mov: 'video/quicktime',
  woff: 'font/woff',
  woff2: 'font/woff2',
  ttf: 'font/ttf',
  otf: 'font/otf',
  wasm: 'application/wasm',
  pdf: 'application/pdf',
};

export function mimeTypeForPath(path: string): string {
  const extension = path.split('.').pop()?.toLowerCase() ?? '';
  return MIME_TYPES[extension] ?? 'application/octet-stream';
}

export function formatPreviewSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
