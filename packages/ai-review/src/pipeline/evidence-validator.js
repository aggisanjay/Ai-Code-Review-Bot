"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateAndGroundFindings = validateAndGroundFindings;
exports.deduplicateAndRankFindings = deduplicateAndRankFindings;
const SEVERITY_WEIGHT = {
    CRITICAL: 5,
    HIGH: 4,
    MEDIUM: 3,
    LOW: 2,
    INFO: 1,
};
function validateAndGroundFindings(findings, files) {
    const grounded = [];
    const validFilesMap = new Map();
    for (const f of files) {
        validFilesMap.set(f.newPath, f);
    }
    for (const finding of findings) {
        // 1. Check if the file is part of the diff
        const matchedFile = validFilesMap.get(finding.filePath);
        if (!matchedFile) {
            // If the path isn't in changed files, verify if it ends with one of the changed paths
            const fallbackFile = files.find((f) => f.newPath.endsWith(finding.filePath) || finding.filePath.endsWith(f.newPath));
            if (!fallbackFile) {
                // Discard ungrounded file finding
                continue;
            }
            finding.filePath = fallbackFile.newPath;
        }
        grounded.push(finding);
    }
    return grounded;
}
function deduplicateAndRankFindings(findings) {
    const seenMap = new Map();
    for (const finding of findings) {
        // Key by file path and start line
        const key = `${finding.filePath}:${finding.startLine}`;
        const existing = seenMap.get(key);
        if (!existing) {
            seenMap.set(key, finding);
        }
        else {
            // If duplicate on same line, keep the higher severity or higher confidence one
            const existingWeight = SEVERITY_WEIGHT[existing.severity] || 0;
            const newWeight = SEVERITY_WEIGHT[finding.severity] || 0;
            if (newWeight > existingWeight || (newWeight === existingWeight && finding.confidence > existing.confidence)) {
                seenMap.set(key, finding);
            }
        }
    }
    const deduped = Array.from(seenMap.values());
    // Rank by severity descending, then by line number
    deduped.sort((a, b) => {
        const weightDiff = (SEVERITY_WEIGHT[b.severity] || 0) - (SEVERITY_WEIGHT[a.severity] || 0);
        if (weightDiff !== 0)
            return weightDiff;
        return a.startLine - b.startLine;
    });
    return deduped;
}
