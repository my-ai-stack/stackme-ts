/**
 * Stackme SDK - Storage Layer
 *
 * Provides storage backends for different environments:
 * - Browser: IndexedDB using idb library
 * - Node.js: JSON file storage
 */

import { openDB, type IDBPDatabase } from 'idb';
import * as fs from 'fs';
import * as path from 'path';
import type { IStorage, MemoryItem, GraphFact, ExportData } from './types';
import type { IEmbeddingProvider } from './types';

// ─── Cosine Similarity ─────────────────────────────────────────────────────────

function cosineSimilarity(a: number[], b: number[]): number {
  const dot = a.reduce((sum, x, i) => sum + x * b[i], 0);
  const normA = Math.sqrt(a.reduce((sum, x) => sum + x * x, 0));
  const normB = Math.sqrt(b.reduce((sum, x) => sum + x * x, 0));
  return dot / (normA * normB + 1e-8);
}

// ─── Database Schema ──────────────────────────────────────────────────────────

const DB_NAME = 'stackme';
const DB_VERSION = 1;

interface StackmeDB {
  memory: MemoryItem;
  graph: GraphFact;
  shortTerm: { id: string; content: string; expiresAt: string };
}

// ─── IndexedDB Storage (Browser) ─────────────────────────────────────────────

class IndexedDBStorage implements IStorage {
  private db: IDBPDatabase<StackmeDB> | null = null;
  private embeddingProvider: IEmbeddingProvider;

  constructor(embeddingProvider: IEmbeddingProvider) {
    this.embeddingProvider = embeddingProvider;
  }

  private async getDB(): Promise<IDBPDatabase<StackmeDB>> {
    if (this.db) return this.db;

    this.db = await openDB<StackmeDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Memory store
        if (!db.objectStoreNames.contains('memory')) {
          const memoryStore = db.createObjectStore('memory', { keyPath: 'id' });
          memoryStore.createIndex('type', 'type');
          memoryStore.createIndex('userId', 'userId');
          memoryStore.createIndex('createdAt', 'createdAt');
        }

        // Graph store
        if (!db.objectStoreNames.contains('graph')) {
          const graphStore = db.createObjectStore('graph', { keyPath: 'id' });
          graphStore.createIndex('subject', 'subject');
          graphStore.createIndex('createdAt', 'createdAt');
        }

        // Short-term store (expires after 24h)
        if (!db.objectStoreNames.contains('shortTerm')) {
          db.createObjectStore('shortTerm', { keyPath: 'id' });
        }
      },
    });

    return this.db;
  }

  async add(item: MemoryItem): Promise<string> {
    const db = await this.getDB();

    // Generate embedding if not provided
    if (!item.embedding) {
      item.embedding = await this.embeddingProvider.encode(item.content);
    }

    await db.put('memory', item);
    return item.id;
  }

  async search(query: string, topK: number, userId: string): Promise<MemoryItem[]> {
    const db = await this.getDB();

    // Generate query embedding
    const queryEmbedding = await this.embeddingProvider.encode(query);

    // Get all items for user
    const tx = db.transaction('memory', 'readonly');
    const index = tx.store.index('userId');
    const items = await index.getAll(userId);

    // Score and sort by similarity
    const scored = items.map(item => {
      let sim = 0;
      if (item.embedding && queryEmbedding) {
        sim = cosineSimilarity(item.embedding, queryEmbedding);
      }
      // Boost by access count
      const boost = 1.0 + (item.accessCount / 100.0);
      return { item, score: sim * boost };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, topK).map(s => s.item);
  }

  async updateAccess(itemId: string): Promise<void> {
    const db = await this.getDB();
    const item = await db.get('memory', itemId);
    if (item) {
      item.accessCount += 1;
      item.lastAccessed = new Date().toISOString();
      await db.put('memory', item);
    }
  }

  async addGraph(fact: GraphFact): Promise<void> {
    const db = await this.getDB();
    await db.put('graph', fact);
  }

  async queryGraph(subject?: string, predicate?: string): Promise<GraphFact[]> {
    const db = await this.getDB();
    let facts = await db.getAll('graph');

    if (subject) {
      facts = facts.filter(f => f.subject === subject);
    }
    if (predicate) {
      facts = facts.filter(f => f.predicate === predicate);
    }

    return facts;
  }

  async getAll(userId: string): Promise<MemoryItem[]> {
    const db = await this.getDB();
    const tx = db.transaction('memory', 'readonly');
    const index = tx.store.index('userId');
    return index.getAll(userId);
  }

  async exportAll(): Promise<ExportData> {
    const db = await this.getDB();

    const memory = await db.getAll('memory');
    const graph = await db.getAll('graph');

    // Remove embeddings from export (they're large)
    const memoryWithoutEmbeddings = memory.map(({ embedding, ...rest }) => rest);

    return {
      memory: memoryWithoutEmbeddings,
      graph,
      exportedAt: new Date().toISOString(),
    };
  }

  async count(userId: string): Promise<number> {
    const db = await this.getDB();
    const tx = db.transaction('memory', 'readonly');
    const index = tx.store.index('userId');
    return (await index.getAll(userId)).length;
  }

  async clearUser(userId: string): Promise<void> {
    const db = await this.getDB();
    const tx = db.transaction('memory', 'readwrite');
    const index = tx.store.index('userId');
    const items = await index.getAll(userId);

    for (const item of items) {
      await tx.store.delete(item.id);
    }

    await tx.done;
  }

  async close(): Promise<void> {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}

// ─── JSON File Storage (Node.js) ─────────────────────────────────────────────

interface StorageData {
  memory: MemoryItem[];
  graph: GraphFact[];
  shortTerm: { id: string; content: string; expiresAt: string }[];
}

class JSONFileStorage implements IStorage {
  private filePath: string;
  private data: StorageData;
  private embeddingProvider: IEmbeddingProvider;

  constructor(embeddingProvider: IEmbeddingProvider, storagePath?: string) {
    this.filePath = storagePath || path.join(process.cwd(), '.stackme', 'memory.json');
    this.embeddingProvider = embeddingProvider;

    // Ensure directory exists
    const dir = path.dirname(this.filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Load or initialize data
    this.data = this.loadData();
  }

  private loadData(): StorageData {
    try {
      if (fs.existsSync(this.filePath)) {
        const content = fs.readFileSync(this.filePath, 'utf-8');
        return JSON.parse(content);
      }
    } catch (e) {
      console.warn('Stackme: Failed to load storage file, creating new one');
    }

    return { memory: [], graph: [], shortTerm: [] };
  }

  private saveData(): void {
    fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2), 'utf-8');
  }

  async add(item: MemoryItem): Promise<string> {
    // Generate embedding if not provided
    if (!item.embedding) {
      item.embedding = await this.embeddingProvider.encode(item.content);
    }

    // Remove existing item with same ID
    this.data.memory = this.data.memory.filter(m => m.id !== item.id);
    this.data.memory.push(item);
    this.saveData();

    return item.id;
  }

  async search(query: string, topK: number, userId: string): Promise<MemoryItem[]> {
    // Generate query embedding
    const queryEmbedding = await this.embeddingProvider.encode(query);

    // Filter by user and score
    const userItems = this.data.memory.filter(m => m.userId === userId);

    const scored = userItems.map(item => {
      let sim = 0;
      if (item.embedding && queryEmbedding) {
        sim = cosineSimilarity(item.embedding, queryEmbedding);
      }
      const boost = 1.0 + (item.accessCount / 100.0);
      return { item, score: sim * boost };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, topK).map(s => s.item);
  }

  async updateAccess(itemId: string): Promise<void> {
    const item = this.data.memory.find(m => m.id === itemId);
    if (item) {
      item.accessCount += 1;
      item.lastAccessed = new Date().toISOString();
      this.saveData();
    }
  }

  async addGraph(fact: GraphFact): Promise<void> {
    this.data.graph = this.data.graph.filter(g => g.id !== fact.id);
    this.data.graph.push(fact);
    this.saveData();
  }

  async queryGraph(subject?: string, predicate?: string): Promise<GraphFact[]> {
    let facts = [...this.data.graph];

    if (subject) {
      facts = facts.filter(f => f.subject === subject);
    }
    if (predicate) {
      facts = facts.filter(f => f.predicate === predicate);
    }

    return facts;
  }

  async getAll(userId: string): Promise<MemoryItem[]> {
    return this.data.memory.filter(m => m.userId === userId);
  }

  async exportAll(): Promise<ExportData> {
    const memoryWithoutEmbeddings = this.data.memory.map(({ embedding, ...rest }) => rest);

    return {
      memory: memoryWithoutEmbeddings,
      graph: [...this.data.graph],
      exportedAt: new Date().toISOString(),
    };
  }

  async count(userId: string): Promise<number> {
    return this.data.memory.filter(m => m.userId === userId).length;
  }

  async clearUser(userId: string): Promise<void> {
    this.data.memory = this.data.memory.filter(m => m.userId !== userId);
    this.saveData();
  }

  async close(): Promise<void> {
    // No-op for file storage
  }
}

// ─── Factory ────────────────────────────────────────────────────────────────

export function createStorage(
  embeddingProvider: IEmbeddingProvider,
  options?: { storagePath?: string }
): IStorage {
  // Detect environment
  if (typeof window !== 'undefined' || typeof indexedDB !== 'undefined') {
    // Browser environment
    return new IndexedDBStorage(embeddingProvider);
  } else {
    // Node.js environment
    return new JSONFileStorage(embeddingProvider, options?.storagePath);
  }
}