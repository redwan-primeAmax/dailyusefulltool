export type ExportFormat = 'markdown' | 'json' | 'nameParagraphs' | 'markdownNameList' | 'structure' | 'fullPaths';

export interface ZipExportFile {
  name: string;
  content: string;
  selected: boolean;
}

const BINARY_EXTENSIONS = /\.(?:7z|aac|aiff|avi|bin|bmp|bz2|class|db|dmg|dll|doc|docx|dylib|eot|exe|flac|gif|gz|heic|ico|jar|jpeg|jpg|m4a|mkv|mov|mp3|mp4|o|obj|odt|otf|pdf|png|ppt|pptx|rar|so|sqlite|tar|tif|tiff|ttf|wasm|wav|webm|webp|woff2?|xls|xlsx|xz|zip)$/iu;
const CONFIG_EXTENSIONS = /\.(?:bak|cfg|config|conf|crt|ini|key|lock|lockb|log|map|pem|plist|properties|reg|swp|tmp|toml|yaml|yml)$/iu;
const CONFIG_JSON_NAMES = /^(?:package(?:-lock)?|pnpm-lock|tsconfig(?:\.[^.]+)*|jsconfig|manifest|config|settings|composer|bower)\.json$/iu;
const CONFIG_SCRIPT_NAMES = /^(?:vite|webpack|rollup|babel|postcss|eslint|prettier|jest|vitest|next|tailwind|nuxt|astro|angular)\.config\.[^.]+$/iu;
const SYSTEM_DIRECTORIES = new Set([
  '.git', '.svn', '.hg', '.idea', '.vscode', '.next', '.nuxt', '.cache', '.turbo', '.vite',
  '__macosx', 'node_modules', 'coverage', 'dist', 'build', 'target',
]);
const SYSTEM_FILES = new Set(['.ds_store', 'thumbs.db', 'desktop.ini', 'ehthumbs.db']);

export function normalizeZipPath(path: string): string {
  return path
    .replace(/\\/g, '/')
    .replace(/^(?:\.\/)+/, '')
    .replace(/^\/+/, '')
    .replace(/\/{2,}/g, '/');
}

export function isBinaryZipPath(path: string): boolean {
  return BINARY_EXTENSIONS.test(normalizeZipPath(path));
}

/**
 * These entries remain visible and manually selectable, but are unchecked on
 * first load because they are usually binaries, build/system artifacts, or
 * configuration metadata rather than user-facing source/content.
 */
export function isExcludedByDefault(path: string, isBinary = isBinaryZipPath(path)): boolean {
  if (isBinary) return true;
  const normalized = normalizeZipPath(path);
  const segments = normalized.split('/').filter(Boolean);
  const lowerSegments = segments.map((part) => part.toLowerCase());
  if (lowerSegments.some((part) => SYSTEM_DIRECTORIES.has(part))) return true;
  if (segments.some((part) => part.startsWith('.'))) return true;

  const basename = (segments[segments.length - 1] ?? '').toLowerCase();
  if (SYSTEM_FILES.has(basename)) return true;
  if (CONFIG_EXTENSIONS.test(basename) || CONFIG_JSON_NAMES.test(basename) || CONFIG_SCRIPT_NAMES.test(basename)) return true;
  if (/^(?:yarn\.lock|cargo\.lock|gemfile\.lock|pipfile\.lock|poetry\.lock|composer\.lock)$/iu.test(basename)) return true;
  if (/\.(?:svg|webmanifest)$/iu.test(basename)) return true;
  return false;
}

export function shouldSelectByDefault(path: string, isBinary = isBinaryZipPath(path)): boolean {
  return !isExcludedByDefault(path, isBinary);
}

function inlineCode(value: string): string {
  let longestRun = 0;
  let currentRun = 0;
  for (const character of value) {
    if (character === '`') {
      currentRun += 1;
      longestRun = Math.max(longestRun, currentRun);
    } else {
      currentRun = 0;
    }
  }
  const delimiter = '`'.repeat(longestRun + 1);
  const pad = value.startsWith('`') || value.endsWith('`') || /^\s|\s$/u.test(value) ? ' ' : '';
  return `${delimiter}${pad}${value}${pad}${delimiter}`;
}

function codeFence(content: string): string {
  let longestRun = 0;
  let currentRun = 0;
  for (const character of content) {
    if (character === '`') {
      currentRun += 1;
      longestRun = Math.max(longestRun, currentRun);
    } else {
      currentRun = 0;
    }
  }
  const fence = '`'.repeat(Math.max(3, longestRun + 1));
  const body = content.endsWith('\n') ? content : `${content}\n`;
  return `${fence}\n${body}${fence}`;
}

interface TreeNode {
  directories: Map<string, TreeNode>;
  files: Set<string>;
}

function newTreeNode(): TreeNode {
  return { directories: new Map(), files: new Set() };
}

function zipTree(paths: string[], archiveName: string): string {
  const root = newTreeNode();
  for (const rawPath of paths) {
    const normalized = normalizeZipPath(rawPath);
    const isDirectory = rawPath.endsWith('/') || rawPath.endsWith('\\');
    const parts = normalized.split('/').filter((part) => part.length > 0);
    if (parts.length === 0) continue;

    const directoryCount = isDirectory ? parts.length : parts.length - 1;
    let node = root;
    for (const part of parts.slice(0, directoryCount)) {
      let child = node.directories.get(part);
      if (!child) {
        child = newTreeNode();
        node.directories.set(part, child);
      }
      node = child;
    }
    if (!isDirectory) node.files.add(parts[parts.length - 1]);
  }

  const rootLabel = normalizeZipPath(archiveName).replace(/\/+$/u, '') || 'archive';
  const lines = [`${rootLabel}/`];
  const appendChildren = (node: TreeNode, prefix: string) => {
    const children = [
      ...Array.from(node.directories.entries(), ([name, child]) => ({ name, directory: true, child })),
      ...Array.from(node.files, (name) => ({ name, directory: false, child: null })),
    ].sort((a, b) => a.name.localeCompare(b.name) || Number(b.directory) - Number(a.directory));

    children.forEach((entry, index) => {
      const isLast = index === children.length - 1;
      lines.push(`${prefix}${isLast ? '└── ' : '├── '}${entry.name}${entry.directory ? '/' : ''}`);
      if (entry.child) appendChildren(entry.child, `${prefix}${isLast ? '    ' : '│   '}`);
    });
  };
  appendChildren(root, '');
  if (lines.length === 1) lines.push('└── (empty archive)');
  return lines.join('\n');
}

function fileBasename(path: string): string {
  const parts = normalizeZipPath(path).split('/');
  return parts[parts.length - 1] ?? '';
}

export function buildZipOutput(
  files: ZipExportFile[],
  format: ExportFormat,
  archivePaths: string[] = [],
  archiveName = 'archive.zip',
): string {
  if (format === 'structure') return zipTree(archivePaths, archiveName);
  const selectedFiles = files.filter((file) => file.selected);
  if (selectedFiles.length === 0) return '';

  switch (format) {
    case 'markdown':
      return selectedFiles.map((file) => `## File: ${inlineCode(normalizeZipPath(file.name))}\n\n${codeFence(file.content)}`).join('\n\n---\n\n');
    case 'json': {
      const json: Record<string, string> = {};
      for (const file of selectedFiles) json[normalizeZipPath(file.name)] = file.content;
      return JSON.stringify(json, null, 2);
    }
    case 'nameParagraphs':
      return selectedFiles.map((file) => fileBasename(file.name)).join('\n\n');
    case 'markdownNameList':
      return `# ZIP file names\n\n${selectedFiles.map((file) => `- ${inlineCode(fileBasename(file.name))}`).join('\n')}`;
    case 'fullPaths':
      return selectedFiles.map((file) => {
        const relativePath = normalizeZipPath(file.name);
        return `File: ${fileBasename(file.name)}\nRelative path: ${relativePath}`;
      }).join('\n\n');
    default: {
      const exhaustive: never = format;
      return exhaustive;
    }
  }
}

export function outputExtension(format: ExportFormat): 'md' | 'json' | 'txt' {
  if (format === 'markdown' || format === 'markdownNameList') return 'md';
  if (format === 'json') return 'json';
  return 'txt';
}
