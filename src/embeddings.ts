/**
 * Stackme SDK - Embedding Providers
 *
 * Provides multiple embedding backends:
 * - simple: Hash-based pseudo-embeddings (no dependencies)
 * - openai: OpenAI text-embedding-3-small (requires API key)
 */

import crypto from 'crypto';
import type { EmbeddingVector, IEmbeddingProvider, EmbeddingProviderType } from './types';

// Simple hash-based embeddings for demos
export class SimpleEmbeddingProvider implements IEmbeddingProvider {
  readonly name = 'simple';
  readonly dimension: number;

  constructor(dimension: number = 128) {
    this.dimension = dimension;
  }

  async encode(text: string): Promise<EmbeddingVector> {
    const hash = crypto.createHash('sha256').update(text).digest();
    const vec: number[] = [];

    for (let i = 0; i < this.dimension; i++) {
      const byteVal = hash[i % hash.length];
      vec.push((byteVal / 255.0) * 2.0 - 1.0);
    }

    // Normalize the vector
    const norm = Math.sqrt(vec.reduce((sum, v) => sum + v * v, 0));
    return vec.map(v => v / (norm + 1e-8));
  }

  async encodeBatch(texts: string[]): Promise<EmbeddingVector[]> {
    return Promise.all(texts.map(text => this.encode(text)));
  }
}

// OpenAI embeddings provider
export class OpenAIEmbeddingProvider implements IEmbeddingProvider {
  readonly name: string;
  readonly dimension = 1536; // text-embedding-3-small

  private apiKey: string;
  private model: string;

  constructor(model: string = 'text-embedding-3-small', apiKey?: string) {
    this.model = model;
    this.name = `openai:${model}`;
    this.apiKey = apiKey || process.env.OPENAI_API_KEY || '';

    if (!this.apiKey) {
      console.warn('Stackme: OpenAI API key not provided. Set OPENAI_API_KEY environment variable or pass apiKey to constructor.');
    }
  }

  async encode(text: string): Promise<EmbeddingVector> {
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

    const data = await response.json() as { data: { embedding: number[] }[] };
    return data.data[0].embedding;
  }

  async encodeBatch(texts: string[]): Promise<EmbeddingVector[]> {
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

    const data = await response.json() as { data: { embedding: number[] }[] };
    return data.data.map(item => item.embedding);
  }
}

// Factory function to create embedding providers
export function createEmbeddingProvider(
  provider: EmbeddingProviderType = 'simple',
  options?: { apiKey?: string; dimension?: number; model?: string }
): IEmbeddingProvider {
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
export function getDefaultProvider(): IEmbeddingProvider {
  // Default to simple embeddings (works everywhere)
  return new SimpleEmbeddingProvider();
}