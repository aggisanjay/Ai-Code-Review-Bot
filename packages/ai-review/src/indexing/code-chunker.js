"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MAX_INDEXABLE_LINE_COUNT = exports.MAX_INDEXABLE_FILE_SIZE = void 0;
exports.isFileEligibleForIndexing = isFileEligibleForIndexing;
exports.detectLanguage = detectLanguage;
exports.chunkSourceCode = chunkSourceCode;
const path_1 = __importDefault(require("path"));
const EXCLUDED_DIR_PATTERNS = [
    'node_modules',
    '.git',
    '.next',
    'dist',
    'build',
    'out',
    'coverage',
    '.turbo',
    'vendor',
    '__pycache__',
    '.venv',
    'venv',
];
const EXCLUDED_FILENAMES = [
    'package-lock.json',
    'pnpm-lock.yaml',
    'yarn.lock',
    'Cargo.lock',
    'poetry.lock',
    'composer.lock',
    'Gemfile.lock',
];
const BINARY_EXTENSIONS = new Set([
    '.png',
    '.jpg',
    '.jpeg',
    '.gif',
    '.webp',
    '.ico',
    '.svg',
    '.pdf',
    '.zip',
    '.tar',
    '.gz',
    '.exe',
    '.bin',
    '.woff',
    '.woff2',
    '.ttf',
    '.eot',
    '.mp4',
    '.mp3',
    '.wasm',
    '.pyc',
]);
const EXTENSION_LANGUAGE_MAP = {
    '.ts': 'typescript',
    '.tsx': 'typescriptreact',
    '.js': 'javascript',
    '.jsx': 'javascriptreact',
    '.py': 'python',
    '.go': 'go',
    '.rs': 'rust',
    '.java': 'java',
    '.c': 'c',
    '.cpp': 'cpp',
    '.cs': 'csharp',
    '.rb': 'ruby',
    '.php': 'php',
    '.sql': 'sql',
    '.sh': 'shell',
    '.bash': 'shell',
    '.zsh': 'shell',
    '.yaml': 'yaml',
    '.yml': 'yaml',
    '.json': 'json',
    '.md': 'markdown',
    '.html': 'html',
    '.css': 'css',
    '.scss': 'scss',
};
exports.MAX_INDEXABLE_FILE_SIZE = 512 * 1024; // 500 KB limit
exports.MAX_INDEXABLE_LINE_COUNT = 3000;
function isFileEligibleForIndexing(filePath, sizeBytes) {
    const normalized = filePath.replace(/\\/g, '/');
    const segments = normalized.split('/');
    // Directory filter
    for (const segment of segments) {
        if (EXCLUDED_DIR_PATTERNS.includes(segment)) {
            return false;
        }
    }
    const basename = path_1.default.basename(normalized);
    if (EXCLUDED_FILENAMES.includes(basename)) {
        return false;
    }
    const ext = path_1.default.extname(normalized).toLowerCase();
    if (BINARY_EXTENSIONS.has(ext)) {
        return false;
    }
    // Size limit
    if (sizeBytes !== undefined && sizeBytes > exports.MAX_INDEXABLE_FILE_SIZE) {
        return false;
    }
    return true;
}
function detectLanguage(filePath) {
    const ext = path_1.default.extname(filePath).toLowerCase();
    return EXTENSION_LANGUAGE_MAP[ext] || 'plaintext';
}
function extractSymbolScope(line) {
    const trimmed = line.trim();
    // Match common function / class / interface / type declarations
    const classMatch = trimmed.match(/(?:export\s+)?(?:default\s+)?class\s+([A-Za-z0-9_]+)/);
    if (classMatch)
        return `class ${classMatch[1]}`;
    const funcMatch = trimmed.match(/(?:export\s+)?(?:async\s+)?function\s+([A-Za-z0-9_]+)/);
    if (funcMatch)
        return `function ${funcMatch[1]}`;
    const constFuncMatch = trimmed.match(/(?:export\s+)?const\s+([A-Za-z0-9_]+)\s*=\s*(?:async\s*)?\(/);
    if (constFuncMatch)
        return `function ${constFuncMatch[1]}`;
    const ifaceMatch = trimmed.match(/(?:export\s+)?(?:interface|type)\s+([A-Za-z0-9_]+)/);
    if (ifaceMatch)
        return `type ${ifaceMatch[1]}`;
    const pyFuncMatch = trimmed.match(/def\s+([A-Za-z0-9_]+)\s*\(/);
    if (pyFuncMatch)
        return `def ${pyFuncMatch[1]}`;
    const pyClassMatch = trimmed.match(/class\s+([A-Za-z0-9_]+)/);
    if (pyClassMatch)
        return `class ${pyClassMatch[1]}`;
    return undefined;
}
function chunkSourceCode(filePath, content, targetChunkLines = 50, overlapLines = 10) {
    const language = detectLanguage(filePath);
    const lines = content.split(/\r?\n/);
    if (lines.length === 0)
        return [];
    // For small files under target chunk size, return single chunk
    if (lines.length <= targetChunkLines) {
        const chunkContent = lines.join('\n');
        return [
            {
                filePath,
                startLine: 1,
                endLine: lines.length,
                content: chunkContent,
                tokenCount: Math.ceil(chunkContent.length / 4),
                symbolContext: lines[0]?.trim() || undefined,
                language,
            },
        ];
    }
    const chunks = [];
    let currentStart = 0;
    let activeSymbol;
    while (currentStart < lines.length) {
        let currentEnd = Math.min(currentStart + targetChunkLines, lines.length);
        // Look for boundary break (empty line or closing brace) within last 5 lines if not at EOF
        if (currentEnd < lines.length) {
            for (let i = currentEnd; i > Math.max(currentStart + 20, currentEnd - 8); i--) {
                const line = lines[i - 1].trim();
                if (line === '' || line === '}' || line === ');') {
                    currentEnd = i;
                    break;
                }
            }
        }
        const chunkLines = lines.slice(currentStart, currentEnd);
        const chunkText = chunkLines.join('\n');
        // Scan for top symbol in this chunk
        for (const line of chunkLines) {
            const scope = extractSymbolScope(line);
            if (scope) {
                activeSymbol = scope;
                break;
            }
        }
        chunks.push({
            filePath,
            startLine: currentStart + 1,
            endLine: currentEnd,
            content: chunkText,
            tokenCount: Math.ceil(chunkText.length / 4),
            symbolContext: activeSymbol,
            language,
        });
        if (currentEnd >= lines.length) {
            break;
        }
        // Advance with overlap
        currentStart = Math.max(currentStart + 1, currentEnd - overlapLines);
    }
    return chunks;
}
