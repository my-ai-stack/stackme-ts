"use strict";
/**
 * Stackme SDK - Session Memory
 *
 * In-memory session context for the current conversation window.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionMemory = void 0;
class SessionMemory {
    constructor(maxTurns = 20) {
        this.turns = [];
        this.maxTurns = maxTurns;
    }
    addTurn(role, content, metadata) {
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
    getHistory(lastN) {
        if (lastN === undefined) {
            return [...this.turns];
        }
        return this.turns.slice(-lastN);
    }
    getContextSummary() {
        if (this.turns.length === 0) {
            return '';
        }
        const recentTurns = this.turns.slice(-5);
        const parts = recentTurns.map(t => `[${t.role}]: ${t.content.substring(0, 80)}`);
        return parts.join(' | ');
    }
    clear() {
        this.turns = [];
    }
    get length() {
        return this.turns.length;
    }
}
exports.SessionMemory = SessionMemory;
//# sourceMappingURL=session.js.map