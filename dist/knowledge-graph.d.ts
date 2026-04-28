/**
 * Stackme SDK - Knowledge Graph
 *
 * Structured fact extraction and storage using simple rule-based extraction.
 */
import type { GraphFact, IKnowledgeGraph, IStorage } from './types';
export declare class KnowledgeGraph implements IKnowledgeGraph {
    private storage;
    constructor(storage: IStorage);
    addFact(subject: string, predicate: string, value: string): Promise<GraphFact>;
    addFactsFromText(text: string): Promise<GraphFact[]>;
    query(subject?: string, predicate?: string): Promise<GraphFact[]>;
    getAllAsText(): Promise<string>;
}
//# sourceMappingURL=knowledge-graph.d.ts.map