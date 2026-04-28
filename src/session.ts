/**
 * Stackme SDK - Session Memory
 *
 * In-memory session context for the current conversation window.
 */

import type { SessionTurn } from './types';

export class SessionMemory {
  private turns: SessionTurn[] = [];
  private maxTurns: number;

  constructor(maxTurns: number = 20) {
    this.maxTurns = maxTurns;
  }

  addTurn(role: 'user' | 'assistant' | 'system', content: string, metadata?: Record<string, unknown>): void {
    this.turns.push({
      role,
      content,
      metadata: metadata || {},
      timestamp: new Date().toISOString(),
    });

    // Keep only the last maxTurns
    if (this.turns.length > this.maxTurns) {
      this.turns = this.turns.slice(-this.maxTurns);
    }
  }

  getHistory(lastN?: number): SessionTurn[] {
    if (lastN === undefined) {
      return [...this.turns];
    }
    return this.turns.slice(-lastN);
  }

  getContextSummary(): string {
    if (this.turns.length === 0) {
      return '';
    }

    const recentTurns = this.turns.slice(-5);
    const parts = recentTurns.map(t => `[${t.role}]: ${t.content.substring(0, 80)}`);
    return parts.join(' | ');
  }

  clear(): void {
    this.turns = [];
  }

  get length(): number {
    return this.turns.length;
  }
}