"use strict";
/**
 * Stackme SDK - TypeScript/JavaScript Memory Layer for AI Applications
 *
 * A cross-platform SDK providing semantic memory storage and retrieval
 * for AI applications. Works in both browser and Node.js environments.
 *
 * @package @stackme/sdk
 * @version 0.1.0
 *
 * Usage:
 *   import { StackmeClient } from '@stackme/sdk';
 *
 *   const client = new StackmeClient();
 *   await client.addFact("I run a fintech startup");
 *   const context = await client.getRelevant("pricing strategy");
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionMemory = exports.KnowledgeGraph = exports.createStorage = exports.getDefaultProvider = exports.createEmbeddingProvider = exports.OpenAIEmbeddingProvider = exports.SimpleEmbeddingProvider = exports.default = exports.StackmeClient = void 0;
// Main client
var client_1 = require("./client");
Object.defineProperty(exports, "StackmeClient", { enumerable: true, get: function () { return client_1.StackmeClient; } });
var client_2 = require("./client");
Object.defineProperty(exports, "default", { enumerable: true, get: function () { return __importDefault(client_2).default; } });
// Embedding providers
var embeddings_1 = require("./embeddings");
Object.defineProperty(exports, "SimpleEmbeddingProvider", { enumerable: true, get: function () { return embeddings_1.SimpleEmbeddingProvider; } });
Object.defineProperty(exports, "OpenAIEmbeddingProvider", { enumerable: true, get: function () { return embeddings_1.OpenAIEmbeddingProvider; } });
Object.defineProperty(exports, "createEmbeddingProvider", { enumerable: true, get: function () { return embeddings_1.createEmbeddingProvider; } });
Object.defineProperty(exports, "getDefaultProvider", { enumerable: true, get: function () { return embeddings_1.getDefaultProvider; } });
// Storage (internal, but exported for advanced usage)
var storage_1 = require("./storage");
Object.defineProperty(exports, "createStorage", { enumerable: true, get: function () { return storage_1.createStorage; } });
// Knowledge Graph (internal, but exported for advanced usage)
var knowledge_graph_1 = require("./knowledge-graph");
Object.defineProperty(exports, "KnowledgeGraph", { enumerable: true, get: function () { return knowledge_graph_1.KnowledgeGraph; } });
// Session Memory (internal, but exported for advanced usage)
var session_1 = require("./session");
Object.defineProperty(exports, "SessionMemory", { enumerable: true, get: function () { return session_1.SessionMemory; } });
//# sourceMappingURL=index.js.map