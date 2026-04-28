/**
 * Stackme SDK - Main Client
 *
 * The main interface for the Stackme memory layer.
 *
 * Usage:
 *   import { StackmeClient } from '@stackme/sdk';
 *
 *   // Initialize with default settings
 *   const client = new StackmeClient();
 *
 *   // Add facts and messages
 *   await client.addFact("I run a fintech startup");
 *   await client.addMessage("User asked about Q3 pricing");
 *
 *   // Get relevant context for a query
 *   const context = await client.getRelevant("What should we price at?");
 *
 *   // Search memories
 *   const results = await client.search("fintech");
 *
 *   // Get all facts
 *   const facts = await client.getFacts();
 *
 *   // Get knowledge graph
 *   const graph = await client.getGraph();
 *
 *   // Export all data
 *   const data = await client.export();
 */

import { v4 as uuidv4 } from 'uuid';
import type {
  StackmeClientOptions,
  MemoryItem,
  GraphFact,
  SearchResult,
  ExportData,
  IStorage,
  IEmbeddingProvider,
} from './types';
import { createEmbeddingProvider, getDefaultProvider } from './embeddings';
import { createStorage } from './storage';
import { KnowledgeGraph } from './knowledge-graph';
import { SessionMemory } from './session';

/**
 * Main Stackme Client
 */
export class StackmeClient {
  private _userId: string;
  private storage: IStorage;
  private embeddingProvider: IEmbeddingProvider;
  private session: SessionMemory;
  private kg: KnowledgeGraph;

  /**
   * Create a new StackmeClient instance.
   *
   * @param options - Configuration options
   */
  constructor(options: StackmeClientOptions = {}) {
    this._userId = options.userId || 'default';

    // Create embedding provider
    if (options.embedding) {
      this.embeddingProvider = createEmbeddingProvider(options.embedding, {
        apiKey: options.apiKey,
        dimension: options.dimension,
      });
    } else {
      this.embeddingProvider = getDefaultProvider();
    }

    // Create storage
    this.storage = createStorage(this.embeddingProvider, {
      storagePath: options.storagePath,
    });

    // Create session and knowledge graph
    this.session = new SessionMemory();
    this.kg = new KnowledgeGraph(this.storage);
  }

  // ─── Core API ─────────────────────────────────────────────────────────────

  /**
   * Add a structured fact to long-term memory.
   *
   * @param content - The fact content
   * @param metadata - Optional metadata
   * @returns The ID of the added fact
   */
  async addFact(content: string, metadata?: Record<string, unknown>): Promise<string> {
    const item: MemoryItem = {
      id: uuidv4(),
      type: 'fact',
      content: content.trim(),
      metadata: metadata || {},
      embedding: null,
      createdAt: new Date().toISOString(),
      lastAccessed: new Date().toISOString(),
      accessCount: 0,
      userId: this._userId,
    };

    const id = await this.storage.add(item);

    // Try to extract structured facts from natural language
    try {
      await this.kg.addFactsFromText(content);
    } catch (e) {
      // Ignore extraction errors
    }

    return id;
  }

  /**
   * Add a user message - stores as prompt AND adds to session.
   *
   * @param content - The message content
   * @returns The ID of the added message
   */
  async addMessage(content: string): Promise<string> {
    const item: MemoryItem = {
      id: uuidv4(),
      type: 'prompt',
      content: content.trim(),
      metadata: { source: 'user_message' },
      embedding: null,
      createdAt: new Date().toISOString(),
      lastAccessed: new Date().toISOString(),
      accessCount: 0,
      userId: this._userId,
    };

    const id = await this.storage.add(item);

    // Add to session memory
    this.session.addTurn('user', content);

    // Extract facts from the message
    try {
      await this.kg.addFactsFromText(content);
    } catch (e) {
      // Ignore extraction errors
    }

    return id;
  }

  /**
   * Add an AI response to memory.
   *
   * @param content - The AI response content
   * @returns The ID of the added context
   */
  async addAIResponse(content: string): Promise<string> {
    const item: MemoryItem = {
      id: uuidv4(),
      type: 'context',
      content: content.trim(),
      metadata: { source: 'ai_response' },
      embedding: null,
      createdAt: new Date().toISOString(),
      lastAccessed: new Date().toISOString(),
      accessCount: 0,
      userId: this._userId,
    };

    const id = await this.storage.add(item);

    // Add to session memory
    this.session.addTurn('assistant', content);

    return id;
  }

  /**
   * Add a context note (result, observation, etc).
   *
   * @param content - The context content
   * @param metadata - Optional metadata
   * @returns The ID of the added context
   */
  async addContext(content: string, metadata?: Record<string, unknown>): Promise<string> {
    const item: MemoryItem = {
      id: uuidv4(),
      type: 'context',
      content: content.trim(),
      metadata: metadata || {},
      embedding: null,
      createdAt: new Date().toISOString(),
      lastAccessed: new Date().toISOString(),
      accessCount: 0,
      userId: this._userId,
    };

    return this.storage.add(item);
  }

  /**
   * Retrieve most relevant context for a query.
   *
   * @param query - The search query
   * @param topK - Number of results to return (default: 5)
   * @returns Formatted context string
   */
  async getRelevant(query: string, topK: number = 5): Promise<string> {
    const items = await this.storage.search(query, topK, this._userId);

    // Update access counts
    for (const item of items) {
      await this.storage.updateAccess(item.id);
    }

    if (items.length === 0) {
      return '';
    }

    // Build readable context string
    const factItems = items.filter(i => i.type === 'fact');
    const promptItems = items.filter(i => i.type === 'prompt');
    const contextItems = items.filter(i => i.type === 'context');

    const lines: string[] = [];

    if (factItems.length > 0) {
      lines.push('## Facts');
      for (const item of factItems.slice(0, 3)) {
        lines.push(`- ${item.content}`);
      }
    }

    if (promptItems.length > 0) {
      lines.push('## Past queries');
      for (const item of promptItems.slice(0, 2)) {
        lines.push(`- ${item.content.substring(0, 100)}`);
      }
    }

    if (contextItems.length > 0) {
      lines.push('## Context');
      for (const item of contextItems.slice(0, 2)) {
        lines.push(`- ${item.content.substring(0, 100)}`);
      }
    }

    // Add knowledge graph facts
    const graphText = await this.kg.getAllAsText();
    if (graphText) {
      lines.push('## Knowledge Graph');
      lines.push(graphText);
    }

    return lines.join('\n');
  }

  /**
   * Full-text semantic search across all memories.
   *
   * @param query - The search query
   * @param topK - Number of results to return (default: 10)
   * @returns Array of search result objects
   */
  async search(query: string, topK: number = 10): Promise<SearchResult[]> {
    const items = await this.storage.search(query, topK, this._userId);

    // Generate query embedding for scoring
    const queryEmbedding = await this.embeddingProvider.encode(query);

    return items.map(item => {
      let score = 0;
      if (item.embedding && queryEmbedding) {
        // Simple cosine similarity
        const dot = item.embedding.reduce((s, v, i) => s + v * queryEmbedding[i], 0);
        const norm1 = Math.sqrt(item.embedding.reduce((s, v) => s + v * v, 0));
        const norm2 = Math.sqrt(queryEmbedding.reduce((s, v) => s + v * v, 0));
        score = dot / (norm1 * norm2 + 1e-8);
      }

      return {
        id: item.id,
        content: item.content,
        type: item.type,
        score,
        metadata: item.metadata,
      };
    });
  }

  /**
   * Get all stored facts.
   *
   * @returns Array of fact content strings
   */
  async getFacts(): Promise<string[]> {
    const items = await this.storage.getAll(this._userId);
    return items
      .filter(i => i.type === 'fact')
      .map(i => i.content);
  }

  /**
   * Query the knowledge graph.
   *
   * @param subject - Optional subject to filter by
   * @returns Array of graph facts
   */
  async getGraph(subject?: string): Promise<GraphFact[]> {
    return this.kg.query(subject);
  }

  // ─── Session API ─────────────────────────────────────────────────────────

  /**
   * Get session conversation history.
   *
   * @param lastN - Number of recent turns to return
   * @returns Array of session turns
   */
  getSessionHistory(lastN?: number) {
    return this.session.getHistory(lastN);
  }

  /**
   * Clear in-session memory only (long-term memory preserved).
   */
  clearSession(): void {
    this.session.clear();
  }

  // ─── Utility API ─────────────────────────────────────────────────────────

  /**
   * Export all memory data as a JSON-serializable object.
   *
   * @returns Export data object
   */
  async export(): Promise<ExportData> {
    return this.storage.exportAll();
  }

  /**
   * Get total memory item count for the current user.
   *
   * @returns Number of stored items
   */
  async count(): Promise<number> {
    return this.storage.count(this._userId);
  }

  /**
   * Clear all memory for the current user.
   */
  async clearAll(): Promise<void> {
    await this.storage.clearUser(this._userId);
    this.session.clear();
  }

  /**
   * Get the current user ID.
   */
  get userId(): string {
    return this._userId;
  }

  /**
   * Close the client and release resources.
   */
  async close(): Promise<void> {
    await this.storage.close();
  }
}

// ─── Default Export ─────────────────────────────────────────────────────────

export default StackmeClient;