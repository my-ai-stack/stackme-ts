/**
 * Stackme SDK - TypeScript/JavaScript type definitions
 */
export type MemoryType = 'fact' | 'prompt' | 'context' | 'session';
export interface MemoryItem {
    id: string;
    type: MemoryType;
    content: string;
    metadata: Record<string, unknown>;
    embedding: number[] | null;
    createdAt: string;
    lastAccessed: string;
    accessCount: number;
    userId: string;
}
export interface GraphFact {
    id: string;
    subject: string;
    predicate: string;
    value: string;
    createdAt: string;
}
export interface SessionTurn {
    role: 'user' | 'assistant' | 'system';
    content: string;
    metadata: Record<string, unknown>;
    timestamp: string;
}
export interface SearchResult {
    id: string;
    content: string;
    type: MemoryType;
    score: number;
    metadata: Record<string, unknown>;
}
export type EmbeddingVector = number[];
export interface StackmeClientOptions {
    userId?: string;
    embedding?: EmbeddingProviderType;
    apiKey?: string;
    dimension?: number;
    storagePath?: string;
}
export type EmbeddingProviderType = 'simple' | 'openai' | 'custom';
export interface ExportData {
    memory: Omit<MemoryItem, 'embedding'>[];
    graph: GraphFact[];
    exportedAt: string;
}
export interface IStorage {
    add(item: MemoryItem): Promise<string>;
    search(query: string, topK: number, userId: string): Promise<MemoryItem[]>;
    updateAccess(itemId: string): Promise<void>;
    addGraph(fact: GraphFact): Promise<void>;
    queryGraph(subject?: string, predicate?: string): Promise<GraphFact[]>;
    getAll(userId: string): Promise<MemoryItem[]>;
    exportAll(): Promise<ExportData>;
    count(userId: string): Promise<number>;
    clearUser(userId: string): Promise<void>;
    close(): Promise<void>;
}
export interface IEmbeddingProvider {
    readonly name: string;
    readonly dimension: number;
    encode(text: string): Promise<EmbeddingVector>;
    encodeBatch(texts: string[]): Promise<EmbeddingVector[]>;
}
export interface IKnowledgeGraph {
    addFact(subject: string, predicate: string, value: string): Promise<GraphFact>;
    addFactsFromText(text: string): Promise<GraphFact[]>;
    query(subject?: string): Promise<GraphFact[]>;
    getAllAsText(): Promise<string>;
}
//# sourceMappingURL=types.d.ts.map