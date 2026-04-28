/**
 * Stackme SDK - Knowledge Graph
 *
 * Structured fact extraction and storage using simple rule-based extraction.
 */

import { v4 as uuidv4 } from 'uuid';
import type { GraphFact, IKnowledgeGraph, IStorage } from './types';

// Patterns for extracting facts from natural language
const FACT_PATTERNS = [
  // "I am a X" → user type
  { regex: /\bi\s+am\s+(?:a\s+)?([^\.]+)/i, subject: 'User', predicate: 'is_a' },
  // "I work at X"
  { regex: /\bi\s+work\s+at\s+([^\.]+)/i, subject: 'User', predicate: 'works_at' },
  // "I run X"
  { regex: /\bi\s+run\s+(?:a\s+)?([^\.]+)/i, subject: 'User', predicate: 'runs' },
  // "My goal is X"
  { regex: /\bmy\s+goal\s+(?:is|was)\s+([^\.]+)/i, subject: 'User', predicate: 'goal' },
  // "We are building X"
  { regex: /\bwe(?:'re|\s+are)\s+building\s+([^\.]+)/i, subject: 'Team', predicate: 'building' },
  // "Q3 goal: X"
  { regex: /\bq\d+\s+goal[^\w]*([^\.]+)/i, subject: 'Team', predicate: 'goal' },
  // "Team: X" or "team is X"
  { regex: /\bteam\s+(?:is\s+)?([^\.]+)/i, subject: 'Team', predicate: 'description' },
  // "My name is X"
  { regex: /\bmy\s+name\s+is\s+([^\.]+)/i, subject: 'User', predicate: 'name' },
  // "I live in X"
  { regex: /\bi\s+live\s+in\s+([^\.]+)/i, subject: 'User', predicate: 'lives_in' },
  // "I like X"
  { regex: /\bi\s+like\s+([^\.]+)/i, subject: 'User', predicate: 'likes' },
  // "I prefer X"
  { regex: /\bi\s+prefer\s+([^\.]+)/i, subject: 'User', predicate: 'prefers' },
];

export class KnowledgeGraph implements IKnowledgeGraph {
  private storage: IStorage;

  constructor(storage: IStorage) {
    this.storage = storage;
  }

  async addFact(subject: string, predicate: string, value: string): Promise<GraphFact> {
    const fact: GraphFact = {
      id: uuidv4(),
      subject: subject.trim(),
      predicate: predicate.trim(),
      value: value.trim(),
      createdAt: new Date().toISOString(),
    };

    await this.storage.addGraph(fact);
    return fact;
  }

  async addFactsFromText(text: string): Promise<GraphFact[]> {
    const facts: GraphFact[] = [];

    for (const pattern of FACT_PATTERNS) {
      const match = text.match(pattern.regex);
      if (match) {
        try {
          const fact = await this.addFact(
            pattern.subject,
            pattern.predicate,
            match[1].trim()
          );
          facts.push(fact);
        } catch (e) {
          // Skip if fact already exists or other error
          console.warn('Stackme: Failed to extract fact', e);
        }
      }
    }

    return facts;
  }

  async query(subject?: string, predicate?: string): Promise<GraphFact[]> {
    return this.storage.queryGraph(subject, predicate);
  }

  async getAllAsText(): Promise<string> {
    const facts = await this.storage.queryGraph();

    if (facts.length === 0) {
      return '';
    }

    return facts
      .map(f => `${f.subject} — ${f.predicate}: ${f.value}`)
      .join('\n');
  }
}