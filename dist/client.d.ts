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
import type { StackmeClientOptions, GraphFact, SearchResult, ExportData } from './types';
/**
 * Main Stackme Client
 */
export declare class StackmeClient {
    private _userId;
    private storage;
    private embeddingProvider;
    private session;
    private kg;
    /**
     * Create a new StackmeClient instance.
     *
     * @param options - Configuration options
     */
    constructor(options?: StackmeClientOptions);
    /**
     * Add a structured fact to long-term memory.
     *
     * @param content - The fact content
     * @param metadata - Optional metadata
     * @returns The ID of the added fact
     */
    addFact(content: string, metadata?: Record<string, unknown>): Promise<string>;
    /**
     * Add a user message - stores as prompt AND adds to session.
     *
     * @param content - The message content
     * @returns The ID of the added message
     */
    addMessage(content: string): Promise<string>;
    /**
     * Add an AI response to memory.
     *
     * @param content - The AI response content
     * @returns The ID of the added context
     */
    addAIResponse(content: string): Promise<string>;
    /**
     * Add a context note (result, observation, etc).
     *
     * @param content - The context content
     * @param metadata - Optional metadata
     * @returns The ID of the added context
     */
    addContext(content: string, metadata?: Record<string, unknown>): Promise<string>;
    /**
     * Retrieve most relevant context for a query.
     *
     * @param query - The search query
     * @param topK - Number of results to return (default: 5)
     * @returns Formatted context string
     */
    getRelevant(query: string, topK?: number): Promise<string>;
    /**
     * Full-text semantic search across all memories.
     *
     * @param query - The search query
     * @param topK - Number of results to return (default: 10)
     * @returns Array of search result objects
     */
    search(query: string, topK?: number): Promise<SearchResult[]>;
    /**
     * Get all stored facts.
     *
     * @returns Array of fact content strings
     */
    getFacts(): Promise<string[]>;
    /**
     * Query the knowledge graph.
     *
     * @param subject - Optional subject to filter by
     * @returns Array of graph facts
     */
    getGraph(subject?: string): Promise<GraphFact[]>;
    /**
     * Get session conversation history.
     *
     * @param lastN - Number of recent turns to return
     * @returns Array of session turns
     */
    getSessionHistory(lastN?: number): import("./types").SessionTurn[];
    /**
     * Clear in-session memory only (long-term memory preserved).
     */
    clearSession(): void;
    /**
     * Export all memory data as a JSON-serializable object.
     *
     * @returns Export data object
     */
    export(): Promise<ExportData>;
    /**
     * Get total memory item count for the current user.
     *
     * @returns Number of stored items
     */
    count(): Promise<number>;
    /**
     * Clear all memory for the current user.
     */
    clearAll(): Promise<void>;
    /**
     * Get the current user ID.
     */
    get userId(): string;
    /**
     * Close the client and release resources.
     */
    close(): Promise<void>;
}
export default StackmeClient;
//# sourceMappingURL=client.d.ts.map