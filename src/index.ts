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

// Main client
export { StackmeClient } from './client';
export { default } from './client';

// Types
export type {
  MemoryType,
  MemoryItem,
  GraphFact,
  SessionTurn,
  SearchResult,
  EmbeddingVector,
  StackmeClientOptions,
  EmbeddingProviderType,
  ExportData,
  IStorage,
  IEmbeddingProvider,
  IKnowledgeGraph,
} from './types';

// Embedding providers
export {
  SimpleEmbeddingProvider,
  OpenAIEmbeddingProvider,
  createEmbeddingProvider,
  getDefaultProvider,
} from './embeddings';

// Storage (internal, but exported for advanced usage)
export { createStorage } from './storage';

// Knowledge Graph (internal, but exported for advanced usage)
export { KnowledgeGraph } from './knowledge-graph';

// Session Memory (internal, but exported for advanced usage)
export { SessionMemory } from './session';