# @stackme/sdk

Stackme - Memory layer for AI applications (TypeScript/JavaScript SDK)

A cross-platform SDK providing semantic memory storage and retrieval for AI applications. Works in both browser and Node.js environments.

## Features

- **Semantic Search**: Store and retrieve memories using embeddings
- **Knowledge Graph**: Automatic fact extraction from natural language
- **Session Memory**: In-memory conversation history
- **Multi-user Support**: Isolate memories by user ID
- **Cross-Platform**: Works in browser (IndexedDB) and Node.js (JSON file)
- **Multiple Embedding Providers**: Simple hash-based or OpenAI embeddings

## Installation

```bash
npm install @stackme/sdk
```

## Quick Start

```typescript
import { StackmeClient } from '@stackme/sdk';

// Create a client (uses simple embeddings by default)
const client = new StackmeClient({ userId: 'user-123' });

// Add facts to memory
await client.addFact("I run a fintech startup");
await client.addFact("Q3 goal: 10K paying customers");

// Add user messages
await client.addMessage("What should we price our product at?");

// Get relevant context for a query
const context = await client.getRelevant("pricing strategy");
// Returns formatted context with facts, past queries, and knowledge graph

// Search memories
const results = await client.search("fintech");

// Get all facts
const facts = await client.getFacts();

// Get knowledge graph
const graph = await client.getGraph();

// Export all data
const data = await client.export();

// Clean up
await client.close();
```

## API Reference

### StackmeClient

The main interface for the Stackme memory layer.

#### Constructor

```typescript
new StackmeClient(options?: StackmeClientOptions)
```

**Options:**
- `userId` (string): User identifier for isolating memories (default: 'default')
- `embedding` (EmbeddingProviderType): Embedding provider - 'simple' or 'openai' (default: 'simple')
- `apiKey` (string): OpenAI API key (only if using 'openai' embeddings)
- `dimension` (number): Embedding dimension for simple embeddings (default: 128)
- `storagePath` (string): Path to storage file (Node.js only)

#### Methods

##### addFact(content, metadata?)

Add a structured fact to long-term memory.

```typescript
const factId = await client.addFact("I run a fintech startup", { source: "user_profile" });
```

##### addMessage(content)

Add a user message - stores as prompt AND adds to session history.

```typescript
const messageId = await client.addMessage("I'm looking for pricing strategy advice");
```

##### addAIResponse(content)

Add an AI response to memory.

```typescript
const responseId = await client.addAIResponse("Based on your goals, I recommend...")
```

##### addContext(content, metadata?)

Add a context note (result, observation, etc).

```typescript
const contextId = await client.addContext("User prefers email communication", { type: "preference" });
```

##### getRelevant(query, topK?)

Retrieve most relevant context for a query, as a formatted string.

```typescript
const context = await client.getRelevant("pricing", 5);
```

##### search(query, topK?)

Full-text semantic search. Returns array of search results.

```typescript
const results = await client.search("fintech", 10);
// Returns: [{ id, content, type, score, metadata }]
```

##### getFacts()

Get all stored facts.

```typescript
const facts = await client.getFacts();
// Returns: ["I run a fintech startup", "Q3 goal: 10K customers"]
```

##### getGraph(subject?)

Query the knowledge graph.

```typescript
const graph = await client.getGraph("User");
// Returns: [{ id, subject, predicate, value, createdAt }]
```

##### getSessionHistory(lastN?)

Get session conversation history.

```typescript
const history = client.getSessionHistory(10);
// Returns: [{ role: "user", content: "...", timestamp: "..." }]
```

##### clearSession()

Clear in-session memory only (long-term memory preserved).

```typescript
client.clearSession();
```

##### export()

Export all memory data as JSON.

```typescript
const data = await client.export();
// Returns: { memory: [...], graph: [...], exportedAt: "..." }
```

##### count()

Get total memory item count.

```typescript
const count = await client.count();
```

##### clearAll()

Clear all memory for the current user.

```typescript
await client.clearAll();
```

## Embedding Providers

### Simple Embedding Provider (Default)

Hash-based pseudo-embeddings. Works without external dependencies.

```typescript
import { SimpleEmbeddingProvider, StackmeClient } from '@stackme/sdk';

const provider = new SimpleEmbeddingProvider(128); // dimension
const client = new StackmeClient({
  embedding: 'simple',
  dimension: 256
});
```

### OpenAI Embedding Provider

Uses OpenAI's text-embedding-3-small model. Requires API key.

```typescript
import { StackmeClient } from '@stackme/sdk';

const client = new StackmeClient({
  embedding: 'openai',
  apiKey: process.env.OPENAI_API_KEY
});
```

## Browser Usage

The SDK works in browser environments using IndexedDB for storage.

```html
<script type="module">
  import { StackmeClient } from 'https://cdn.example.com/stackme-sdk.js';

  const client = new StackmeClient({ userId: 'browser-user' });
  await client.addFact("I'm building a B2B SaaS");
  const context = await client.getRelevant("pricing");
</script>
```

## Browser Extension Usage

The SDK is designed to work well in browser extensions:

```typescript
// In a Chrome extension background script
import { StackmeClient } from '@stackme/sdk';

const client = new StackmeClient({ userId: 'extension-user' });

// Store user preferences
await client.addFact("User prefers dark mode");
await client.addFact("User works in fintech");

// Retrieve context when needed
const relevantContext = await client.getRelevant("What colors should I use?");
```

## Data Storage

- **Browser**: Uses IndexedDB (via idb library)
- **Node.js**: Uses JSON file at `.stackme/memory.json` or custom path

## Compatibility with Python stackme

The SDK stores data in a format compatible with the Python stackme library:

- Memory items have similar schema (id, type, content, metadata, user_id)
- Knowledge graph uses (subject, predicate, value) triplets
- Embeddings can be shared if using the same provider

To share data between Python and TypeScript:

1. Export from one SDK: `await client.export()`
2. Import in the other: Use the export format directly with storage

## TypeScript Support

Full TypeScript support with type definitions included.

```typescript
import type { MemoryItem, SearchResult, GraphFact } from '@stackme/sdk';
```

## License

Apache 2.0

## See Also

- [Python stackme](https://github.com/stackai/stackme) - Original Python library
- [Stackme Browser Extension](https://github.com/stackai/stackme-extension) - Browser extension