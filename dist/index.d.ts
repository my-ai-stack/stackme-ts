/**
 * Stackme SDK - TypeScript/JavaScript Memory Layer for AI Applications
 *
 * A cross-platform SDK providing semantic memory storage and retrieval
 * for AI applications. Works in both browser and Node.js environments.
 *
 * @package @stackme/sdk
 * @version 0.1.0
 *
 * Usage:
 *   import { StackmeClient } from '@stackme/sdk';
 *
 *   const client = new StackmeClient();
 *   await client.addFact("I run a fintech startup");
 *   const context = await client.getRelevant("pricing strategy");
 */
export { StackmeClient } from './client';
export { default } from './client';
export type { MemoryType, MemoryItem, GraphFact, SessionTurn, SearchResult, EmbeddingVector, StackmeClientOptions, EmbeddingProviderType, ExportData, IStorage, IEmbeddingProvider, IKnowledgeGraph, } from './types';
export { SimpleEmbeddingProvider, OpenAIEmbeddingProvider, createEmbeddingProvider, getDefaultProvider, } from './embeddings';
export { createStorage } from './storage';
export { KnowledgeGraph } from './knowledge-graph';
export { SessionMemory } from './session';
//# sourceMappingURL=index.d.ts.map