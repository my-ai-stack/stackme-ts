"use strict";
/**
 * Stackme SDK - Embedding Providers
 *
 * Provides multiple embedding backends:
 * - simple: Hash-based pseudo-embeddings (no dependencies)
 * - openai: OpenAI text-embedding-3-small (requires API key)
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenAIEmbeddingProvider = exports.SimpleEmbeddingProvider = void 0;
exports.createEmbeddingProvider = createEmbeddingProvider;
exports.getDefaultProvider = getDefaultProvider;
const crypto_1 = __importDefault(require("crypto"));
// Simple hash-based embeddings for demos
class SimpleEmbeddingProvider {
    constructor(dimension = 128) {
        this.name = 'simple';
        this.dimension = dimension;
    }
    async encode(text) {
        const hash = crypto_1.default.createHash('sha256').update(text).digest();
        const vec = [];
        for (let i = 0; i < this.dimension; i++) {
            const byteVal = hash[i % hash.length];
            vec.push((byteVal / 255.0) * 2.0 - 1.0);
        }
        // Normalize the vector
        const norm = Math.sqrt(vec.reduce((sum, v) => sum + v * v, 0));
        return vec.map(v => v / (norm + 1e-8));
    }
    async encodeBatch(texts) {
        return Promise.all(texts.map(text => this.encode(text)));
    }
}
exports.SimpleEmbeddingProvider = SimpleEmbeddingProvider;
// OpenAI embeddings provider
class OpenAIEmbeddingProvider {
    constructor(model = 'text-embedding-3-small', apiKey) {
        this.dimension = 1536; // text-embedding-3-small
        this.model = model;
        this.name = `openai:${model}`;
        this.apiKey = apiKey || process.env.OPENAI_API_KEY || '';
        if (!this.apiKey) {
            console.warn('Stackme: OpenAI API key not provided. Set OPENAI_API_KEY environment variable or pass apiKey to constructor.');
        }
    }
    async encode(text) {
        if (!this.apiKey) {
            throw new Error('OpenAI API key not configured');
        }
        const response = await fetch('https://api.openai.com/v1/embeddings', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`,
            },
            body: JSON.stringify({
                model: this.model,
                input: text,
            }),
        });
        if (!response.ok) {
            const error = await response.text();
            throw new Error(`OpenAI API error: ${error}`);
        }
        const data = await response.json();
        return data.data[0].embedding;
    }
    async encodeBatch(texts) {
        if (!this.apiKey) {
            throw new Error('OpenAI API key not configured');
        }
        const response = await fetch('https://api.openai.com/v1/embeddings', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`,
            },
            body: JSON.stringify({
                model: this.model,
                input: texts,
            }),
        });
        if (!response.ok) {
            const error = await response.text();
            throw new Error(`OpenAI API error: ${error}`);
        }
        const data = await response.json();
        return data.data.map(item => item.embedding);
    }
}
exports.OpenAIEmbeddingProvider = OpenAIEmbeddingProvider;
// Factory function to create embedding providers
function createEmbeddingProvider(provider = 'simple', options) {
    switch (provider) {
        case 'simple':
            return new SimpleEmbeddingProvider(options?.dimension || 128);
        case 'openai':
            return new OpenAIEmbeddingProvider(options?.model || 'text-embedding-3-small', options?.apiKey);
        case 'custom':
            throw new Error('Custom embedding provider must be implemented by the user');
        default:
            throw new Error(`Unknown embedding provider: ${provider}`);
    }
}
// Get the default embedding provider
function getDefaultProvider() {
    // Default to simple embeddings (works everywhere)
    return new SimpleEmbeddingProvider();
}
//# sourceMappingURL=embeddings.js.map