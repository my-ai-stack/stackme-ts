/**
 * Stackme SDK - Storage Layer
 *
 * Provides storage backends for different environments:
 * - Browser: IndexedDB using idb library
 * - Node.js: JSON file storage
 */
import type { IStorage } from './types';
import type { IEmbeddingProvider } from './types';
export declare function createStorage(embeddingProvider: IEmbeddingProvider, options?: {
    storagePath?: string;
}): IStorage;
//# sourceMappingURL=storage.d.ts.map