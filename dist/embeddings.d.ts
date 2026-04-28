/**
 * Stackme SDK - Embedding Providers
 *
 * Provides multiple embedding backends:
 * - simple: Hash-based pseudo-embeddings (no dependencies)
 * - openai: OpenAI text-embedding-3-small (requires API key)
 */
import type { EmbeddingVector, IEmbeddingProvider, EmbeddingProviderType } from './types';
export declare class SimpleEmbeddingProvider implements IEmbeddingProvider {
    readonly name = "simple";
    readonly dimension: number;
    constructor(dimension?: number);
    encode(text: string): Promise<EmbeddingVector>;
    encodeBatch(texts: string[]): Promise<EmbeddingVector[]>;
}
export declare class OpenAIEmbeddingProvider implements IEmbeddingProvider {
    readonly name: string;
    readonly dimension = 1536;
    private apiKey;
    private model;
    constructor(model?: string, apiKey?: string);
    encode(text: string): Promise<EmbeddingVector>;
    encodeBatch(texts: string[]): Promise<EmbeddingVector[]>;
}
export declare function createEmbeddingProvider(provider?: EmbeddingProviderType, options?: {
    apiKey?: string;
    dimension?: number;
    model?: string;
}): IEmbeddingProvider;
export declare function getDefaultProvider(): IEmbeddingProvider;
//# sourceMappingURL=embeddings.d.ts.map