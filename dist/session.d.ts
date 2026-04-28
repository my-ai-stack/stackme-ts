/**
 * Stackme SDK - Session Memory
 *
 * In-memory session context for the current conversation window.
 */
import type { SessionTurn } from './types';
export declare class SessionMemory {
    private turns;
    private maxTurns;
    constructor(maxTurns?: number);
    addTurn(role: 'user' | 'assistant' | 'system', content: string, metadata?: Record<string, unknown>): void;
    getHistory(lastN?: number): SessionTurn[];
    getContextSummary(): string;
    clear(): void;
    get length(): number;
}
//# sourceMappingURL=session.d.ts.map