#!/usr/bin/env node

/**
 * orchestrator.mjs - Main pipeline entry point.
 * Runs the full research -> generate -> publish pipeline.
 * Usage: node orchestrator.mjs [--dry-run]
 */

import { execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DRY_RUN = process.argv.includes('--dry-run');

function timestamp() {
  return new Date().toISOString().replace('T', ' ').slice(0, 19);
}

function log(step, msg) {
  console.log(`[${timestamp()}] [${step}] ${msg}`);
}

function runScript(scriptName, args = '') {
  const scriptPath = path.join(__dirname, scriptName);
  const cmd = `node "${scriptPath}" ${args}`;
  log('exec', `Running: ${cmd}`);
  return execSync(cmd, {
    encoding: 'utf-8',
    cwd: __dirname,
    stdio: ['pipe', 'pipe', 'inherit'],
    timeout: 60000,
  });
}

async function main() {
  log('orchestrator', '=== Shipped by AI - Content Pipeline ===');
  log('orchestrator', DRY_RUN ? 'MODE: Dry run (no publish)' : 'MODE: Full pipeline');

  // Step 1: Research
  log('step-1', 'Running research...');
  let topics;
  try {
    const output = runScript('research.mjs');
    topics = JSON.parse(output);
    log('step-1', `Found ${topics.length} topic candidates`);
  } catch (err) {
    log('step-1', `Research failed: ${err.message}`);
    log('orchestrator', 'Aborting pipeline - no topics available');
    process.exit(1);
  }

  if (topics.length === 0) {
    log('orchestrator', 'No suitable topics found. Try again later.');
    process.exit(0);
  }

  // Step 2: Pick the best topic
  const best = topics[0];
  log('step-2', `Selected topic: "${best.title}"`);
  log('step-2', `Source: ${best.url}`);
  log('step-2', `Score: ${best.rank_score} | Source: ${best.source}`);

  // Step 3: Generate post template
  log('step-3', 'Generating post template...');
  try {
    const titleArg = `"${best.title.replace(/"/g, '\\"')}"`;
    const urlArg = `"${best.url}"`;
    const output = runScript('generate.mjs', `${titleArg} ${urlArg}`);
    // Last line of output is JSON with file info
    const lines = output.trim().split('\n');
    const lastLine = lines[lines.length - 1];
    try {
      const result = JSON.parse(lastLine);
      log('step-3', `Template created: ${result.filename}`);
    } catch {
      log('step-3', 'Template created (could not parse output)');
    }
  } catch (err) {
    log('step-3', `Generate failed: ${err.message}`);
    process.exit(1);
  }

  // Step 4: Content log is updated by generate.mjs
  log('step-4', 'Content log updated by generate step');

  // Step 5: Publish
  if (DRY_RUN) {
    log('step-5', 'SKIPPED (dry run) - would commit, push, and send newsletter');
    log('orchestrator', '=== Dry run complete ===');
    return;
  }

  log('step-5', 'Publishing...');
  try {
    const titleArg = `"${best.title.replace(/"/g, '\\"')}"`;
    runScript('publish.mjs', titleArg);
    log('step-5', 'Published successfully');
  } catch (err) {
    log('step-5', `Publish failed: ${err.message}`);
    process.exit(1);
  }

  log('orchestrator', '=== Pipeline complete ===');
}

main().catch((err) => {
  log('orchestrator', `Fatal error: ${err.message}`);
  process.exit(1);
});
