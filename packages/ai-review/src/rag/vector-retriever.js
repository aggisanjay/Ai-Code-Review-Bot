"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.retrieveCodeContext = retrieveCodeContext;
const database_1 = require("@reviewflow/database");
const provider_adapter_1 = require("../providers/provider-adapter");
async function retrieveCodeContext(params) {
    const { repositoryId, query, limit = 6, pathFilter, embeddingProvider } = params;
    // 1. Generate query embedding
    const [queryEmbedding] = await embeddingProvider.generateEmbeddings([query]);
    // 2. Load code chunks from database for the repository
    const chunks = await database_1.prisma.codeChunk.findMany({
        where: {
            repositoryId,
            ...(pathFilter ? { filePath: { contains: pathFilter } } : {}),
        },
        take: 300, // Top candidate pool
    });
    if (chunks.length === 0) {
        return [];
    }
    const rawTerms = query
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, ' ')
        .split(/\s+/)
        .filter((w) => w.length > 2);
    const queryTerms = new Set(rawTerms);
    for (const term of rawTerms) {
        if (term.startsWith('auth'))
            queryTerms.add('auth');
        if (term.startsWith('token'))
            queryTerms.add('token');
        if (term.startsWith('route'))
            queryTerms.add('route');
        if (term.startsWith('model'))
            queryTerms.add('model');
        if (term.startsWith('config'))
            queryTerms.add('config');
        if (term.startsWith('test'))
            queryTerms.add('test');
        if (term.endsWith('tion') && term.length > 5)
            queryTerms.add(term.slice(0, -4));
        if (term.endsWith('ing') && term.length > 5)
            queryTerms.add(term.slice(0, -3));
        if (term.endsWith('s') && term.length > 3)
            queryTerms.add(term.slice(0, -1));
    }
    const termList = Array.from(queryTerms);
    // 3. Score chunks using hybrid retrieval (Vector Cosine + Lexical / Path Matching)
    const scored = chunks.map((chunk) => {
        let vectorSim = 0;
        if (queryEmbedding && chunk.embeddingJson) {
            try {
                const chunkEmbedding = JSON.parse(chunk.embeddingJson);
                vectorSim = (0, provider_adapter_1.cosineSimilarity)(queryEmbedding, chunkEmbedding);
            }
            catch {
                vectorSim = 0;
            }
        }
        // Keyword, Path & Symbol matching
        const contentLower = chunk.content.toLowerCase();
        const pathLower = chunk.filePath.toLowerCase();
        const symbolLower = (chunk.symbolContext || '').toLowerCase();
        let keywordHits = 0;
        let pathHits = 0;
        for (const term of termList) {
            if (contentLower.includes(term))
                keywordHits += 1;
            if (pathLower.includes(term)) {
                keywordHits += 3;
                pathHits += 1;
            }
            if (symbolLower.includes(term))
                keywordHits += 2;
        }
        const keywordScore = Math.min(1.0, keywordHits / (rawTerms.length * 2 || 1));
        const pathBoost = pathHits > 0 ? 0.25 : 0;
        // Hybrid score: 50% semantic vector, 50% lexical keywords + path boost
        const hybridScore = (vectorSim > 0 ? vectorSim * 0.5 : 0) + (keywordScore * 0.5) + pathBoost;
        return {
            chunkId: chunk.id,
            filePath: chunk.filePath,
            startLine: chunk.startLine,
            endLine: chunk.endLine,
            content: chunk.content,
            symbolContext: chunk.symbolContext || undefined,
            similarity: parseFloat(hybridScore.toFixed(4)),
            commitSha: chunk.commitSha,
        };
    });
    // 4. Sort descending by score
    scored.sort((a, b) => b.similarity - a.similarity);
    return scored.slice(0, limit);
}
