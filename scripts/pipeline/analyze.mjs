#!/usr/bin/env node

/**
 * analyze.mjs - Analyze content pipeline metrics.
 * Usage: node analyze.mjs
 * Outputs a summary of posting activity to stdout.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CONTENT_LOG_PATH = path.join(__dirname, 'content-log.json');

function loadContentLog() {
  try {
    const raw = fs.readFileSync(CONTENT_LOG_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return { posts: [], topics_covered: [], last_research: null, quality_rules: [] };
  }
}

function daysBetween(dateStr) {
  const then = new Date(dateStr);
  const now = new Date();
  return Math.floor((now - then) / (1000 * 60 * 60 * 24));
}

function main() {
  const log = loadContentLog();
  const posts = log.posts || [];

  console.log('=== Shipped by AI - Content Analytics ===\n');

  if (posts.length === 0) {
    console.log('No posts yet. Run the pipeline to generate your first post.');
    console.log(`Last research: ${log.last_research || 'never'}`);
    return;
  }

  // Basic stats
  console.log(`Total posts: ${posts.length}`);
  console.log(`Topics covered: ${(log.topics_covered || []).length}`);
  console.log(`Last research: ${log.last_research || 'never'}`);

  // Post age breakdown
  const ages = posts
    .filter((p) => p.created_at)
    .map((p) => ({
      title: p.title,
      age_days: daysBetween(p.created_at),
      status: p.status || 'unknown',
      word_count: p.word_count || 0,
    }));

  if (ages.length > 0) {
    console.log('\n--- Post Details ---');
    for (const p of ages) {
      console.log(`  [${p.status}] "${p.title}" - ${p.age_days}d ago, ${p.word_count} words`);
    }

    // Average word count (only count posts with content)
    const withWords = ages.filter((p) => p.word_count > 0);
    if (withWords.length > 0) {
      const avgWords = Math.round(
        withWords.reduce((sum, p) => sum + p.word_count, 0) / withWords.length
      );
      console.log(`\nAvg word count: ${avgWords}`);
    }

    // Posting frequency
    if (ages.length >= 2) {
      const sorted = ages.sort((a, b) => a.age_days - b.age_days);
      const spanDays = sorted[sorted.length - 1].age_days - sorted[0].age_days;
      if (spanDays > 0) {
        const freq = (ages.length / spanDays).toFixed(2);
        console.log(`Posting frequency: ${freq} posts/day (over ${spanDays} days)`);
      }
    }
  }

  // Tag distribution
  const tagCounts = {};
  for (const p of posts) {
    for (const tag of p.tags || []) {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    }
  }
  if (Object.keys(tagCounts).length > 0) {
    console.log('\n--- Tag Distribution ---');
    const sorted = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]);
    for (const [tag, count] of sorted) {
      console.log(`  ${tag}: ${count}`);
    }
  }

  // Status breakdown
  const statusCounts = {};
  for (const p of posts) {
    const s = p.status || 'unknown';
    statusCounts[s] = (statusCounts[s] || 0) + 1;
  }
  console.log('\n--- Status Breakdown ---');
  for (const [status, count] of Object.entries(statusCounts)) {
    console.log(`  ${status}: ${count}`);
  }

  console.log('\n--- Placeholder: Analytics integration coming soon ---');
  console.log('Future: page views, read time, subscriber growth, social shares');
}

main();
