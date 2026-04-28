/**
 * Stackme SDK - Usage Examples
 *
 * This file demonstrates how to use the StackmeClient in various scenarios.
 */

import { StackmeClient } from './src/index';

async function main() {
  console.log('=== Stackme SDK Usage Examples ===\n');

  // ─── Basic Usage ───────────────────────────────────────────────────────────

  console.log('1. Basic Usage');
  console.log('---------------');

  const client = new StackmeClient({ userId: 'example-user' });

  // Add facts
  await client.addFact('I run a fintech startup');
  await client.addFact('Q3 goal: 10K paying customers');
  await client.addFact('My name is John');

  // Add user message
  await client.addMessage('What should we price our product at?');

  // Get relevant context
  const context = await client.getRelevant('pricing strategy');
  console.log('Relevant context:');
  console.log(context);
  console.log();

  // ─── Search ───────────────────────────────────────────────────────────────

  console.log('2. Search');
  console.log('---------');

  const results = await client.search('fintech');
  console.log('Search results:');
  results.forEach((r, i) => {
    console.log(`  ${i + 1}. [${r.type}] ${r.content} (score: ${r.score.toFixed(3)})`);
  });
  console.log();

  // ─── Knowledge Graph ─────────────────────────────────────────────────────

  console.log('3. Knowledge Graph');
  console.log('------------------');

  const graph = await client.getGraph();
  console.log('Graph facts:');
  graph.forEach(f => {
    console.log(`  ${f.subject} — ${f.predicate}: ${f.value}`);
  });
  console.log();

  // ─── Get Facts ────────────────────────────────────────────────────────────

  console.log('4. Get All Facts');
  console.log('-----------------');

  const facts = await client.getFacts();
  console.log('All facts:');
  facts.forEach(f => console.log(`  - ${f}`));
  console.log();

  // ─── Session History ──────────────────────────────────────────────────────

  console.log('5. Session History');
  console.log('------------------');

  const history = client.getSessionHistory();
  console.log('Session history:');
  history.forEach(h => {
    console.log(`  [${h.role}]: ${h.content.substring(0, 50)}...`);
  });
  console.log();

  // ─── Count ────────────────────────────────────────────────────────────────

  console.log('6. Memory Count');
  console.log('---------------');

  const count = await client.count();
  console.log(`Total memories: ${count}`);
  console.log();

  // ─── Export ──────────────────────────────────────────────────────────────

  console.log('7. Export Data');
  console.log('--------------');

  const exportData = await client.export();
  console.log(`Exported at: ${exportData.exportedAt}`);
  console.log(`Memory items: ${exportData.memory.length}`);
  console.log(`Graph facts: ${exportData.graph.length}`);
  console.log();

  // ─── Cleanup ──────────────────────────────────────────────────────────────

  await client.close();

  console.log('=== Examples Complete ===');
}

// Run if executed directly
main().catch(console.error);