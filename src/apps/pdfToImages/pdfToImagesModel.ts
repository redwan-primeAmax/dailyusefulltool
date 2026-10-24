export type PdfImageFormat = 'png' | 'jpeg';

export interface PageImageBlob {
  pageNumber: number;
  filename: string;
  blob: Blob;
}

const MAX_CANVAS_DIMENSION = 4096;
const MAX_CANVAS_PIXELS = 8_000_000;

/** Add leading zeroes only when needed to keep page names alphabetically sorted. */
export function pageImageFilename(pageNumber: number, pageCount: number, format: PdfImageFormat): string {
  if (!Number.isInteger(pageNumber) || pageNumber < 1 || !Number.isInteger(pageCount) || pageCount < pageNumber) {
    throw new RangeError('Page number must be within the document page count.');
  }
  const digits = String(pageCount).length;
  const page = String(pageNumber).padStart(digits, '0');
  return `page_${page}.${format}`;
}

export function sortPageImages<T extends { pageNumber: number; filename: string }>(images: T[]): T[] {
  return [...images].sort((a, b) => a.pageNumber - b.pageNumber || a.filename.localeCompare(b.filename));
}

/** Cap each canvas to about 8 megapixels and a 4096px edge for RAM safety. */
export function getSafeRenderScale(width: number, height: number, requestedScale: number): number {
  if (![width, height, requestedScale].every(Number.isFinite) || width <= 0 || height <= 0 || requestedScale <= 0) {
    throw new RangeError('Page dimensions and render scale must be positive numbers.');
  }
  const dimensionLimit = Math.min(MAX_CANVAS_DIMENSION / width, MAX_CANVAS_DIMENSION / height);
  const pixelLimit = Math.sqrt(MAX_CANVAS_PIXELS / (width * height));
  return Math.min(requestedScale, dimensionLimit, pixelLimit);
}

export function createZipFilename(pdfFilename: string): string {
  const base = pdfFilename
    .replace(/\.pdf$/iu, '')
    .replace(/[<>:"/\\|?*\u0000-\u001f]+/gu, '-')
    .replace(/\s+/gu, '-')
    .replace(/^\.+|\.+$/gu, '')
    .slice(0, 100);
  return `${base || 'pdf-pages'}-images.zip`;
}
