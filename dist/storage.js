"use strict";
/**
 * Stackme SDK - Storage Layer
 *
 * Provides storage backends for different environments:
 * - Browser: IndexedDB using idb library
 * - Node.js: JSON file storage
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.createStorage = createStorage;
const idb_1 = require("idb");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
// ─── Cosine Similarity ─────────────────────────────────────────────────────────
function cosineSimilarity(a, b) {
    const dot = a.reduce((sum, x, i) => sum + x * b[i], 0);
    const normA = Math.sqrt(a.reduce((sum, x) => sum + x * x, 0));
    const normB = Math.sqrt(b.reduce((sum, x) => sum + x * x, 0));
    return dot / (normA * normB + 1e-8);
}
// ─── Database Schema ──────────────────────────────────────────────────────────
const DB_NAME = 'stackme';
const DB_VERSION = 1;
// ─── IndexedDB Storage (Browser) ─────────────────────────────────────────────
class IndexedDBStorage {
    constructor(embeddingProvider) {
        this.db = null;
        this.embeddingProvider = embeddingProvider;
    }
    async getDB() {
        if (this.db)
            return this.db;
        this.db = await (0, idb_1.openDB)(DB_NAME, DB_VERSION, {
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
    async add(item) {
        const db = await this.getDB();
        // Generate embedding if not provided
        if (!item.embedding) {
            item.embedding = await this.embeddingProvider.encode(item.content);
        }
        await db.put('memory', item);
        return item.id;
    }
    async search(query, topK, userId) {
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
    async updateAccess(itemId) {
        const db = await this.getDB();
        const item = await db.get('memory', itemId);
        if (item) {
            item.accessCount += 1;
            item.lastAccessed = new Date().toISOString();
            await db.put('memory', item);
        }
    }
    async addGraph(fact) {
        const db = await this.getDB();
        await db.put('graph', fact);
    }
    async queryGraph(subject, predicate) {
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
    async getAll(userId) {
        const db = await this.getDB();
        const tx = db.transaction('memory', 'readonly');
        const index = tx.store.index('userId');
        return index.getAll(userId);
    }
    async exportAll() {
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
    async count(userId) {
        const db = await this.getDB();
        const tx = db.transaction('memory', 'readonly');
        const index = tx.store.index('userId');
        return (await index.getAll(userId)).length;
    }
    async clearUser(userId) {
        const db = await this.getDB();
        const tx = db.transaction('memory', 'readwrite');
        const index = tx.store.index('userId');
        const items = await index.getAll(userId);
        for (const item of items) {
            await tx.store.delete(item.id);
        }
        await tx.done;
    }
    async close() {
        if (this.db) {
            this.db.close();
            this.db = null;
        }
    }
}
class JSONFileStorage {
    constructor(embeddingProvider, storagePath) {
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
    loadData() {
        try {
            if (fs.existsSync(this.filePath)) {
                const content = fs.readFileSync(this.filePath, 'utf-8');
                return JSON.parse(content);
            }
        }
        catch (e) {
            console.warn('Stackme: Failed to load storage file, creating new one');
        }
        return { memory: [], graph: [], shortTerm: [] };
    }
    saveData() {
        fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2), 'utf-8');
    }
    async add(item) {
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
    async search(query, topK, userId) {
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
    async updateAccess(itemId) {
        const item = this.data.memory.find(m => m.id === itemId);
        if (item) {
            item.accessCount += 1;
            item.lastAccessed = new Date().toISOString();
            this.saveData();
        }
    }
    async addGraph(fact) {
        this.data.graph = this.data.graph.filter(g => g.id !== fact.id);
        this.data.graph.push(fact);
        this.saveData();
    }
    async queryGraph(subject, predicate) {
        let facts = [...this.data.graph];
        if (subject) {
            facts = facts.filter(f => f.subject === subject);
        }
        if (predicate) {
            facts = facts.filter(f => f.predicate === predicate);
        }
        return facts;
    }
    async getAll(userId) {
        return this.data.memory.filter(m => m.userId === userId);
    }
    async exportAll() {
        const memoryWithoutEmbeddings = this.data.memory.map(({ embedding, ...rest }) => rest);
        return {
            memory: memoryWithoutEmbeddings,
            graph: [...this.data.graph],
            exportedAt: new Date().toISOString(),
        };
    }
    async count(userId) {
        return this.data.memory.filter(m => m.userId === userId).length;
    }
    async clearUser(userId) {
        this.data.memory = this.data.memory.filter(m => m.userId !== userId);
        this.saveData();
    }
    async close() {
        // No-op for file storage
    }
}
// ─── Factory ────────────────────────────────────────────────────────────────
function createStorage(embeddingProvider, options) {
    // Detect environment
    if (typeof window !== 'undefined' || typeof indexedDB !== 'undefined') {
        // Browser environment
        return new IndexedDBStorage(embeddingProvider);
    }
    else {
        // Node.js environment
        return new JSONFileStorage(embeddingProvider, options?.storagePath);
    }
}
//# sourceMappingURL=storage.js.map