#!/usr/bin/env node

/**
 * generate.mjs - Generate an Astro-compatible markdown blog post template.
 * Usage: node generate.mjs "Topic Title" "https://source-url.com"
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CONTENT_LOG_PATH = path.join(__dirname, 'content-log.json');
const PROJECT_ROOT = path.resolve(__dirname, '..', '..');
const BLOG_DIR = path.join(PROJECT_ROOT, 'src', 'data', 'blog');

function slugify(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

function loadContentLog() {
  try {
    const raw = fs.readFileSync(CONTENT_LOG_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return { posts: [], topics_covered: [], last_research: null, quality_rules: [] };
  }
}

function saveContentLog(log) {
  fs.writeFileSync(CONTENT_LOG_PATH, JSON.stringify(log, null, 2) + '\n');
}

function generateTemplate(title, sourceUrl) {
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const slug = slugify(title);
  const filename = `${dateStr}-${slug}.md`;
  const pubDatetime = now.toISOString().replace(/\.\d{3}Z$/, 'Z');

  const tags = inferTags(title);

  const template = `---
title: "${title}"
description: "<!-- AI_FILL: Write a compelling 150-char meta description -->"
pubDatetime: ${pubDatetime}
tags: ${JSON.stringify(tags)}
featured: false
draft: false
---

## TL;DR

<!-- AI_FILL: Exactly 3 sentences summarizing the key insight, why it matters, and what to do about it -->

## The Problem

<!-- AI_FILL: What pain point or gap does this address? Why should readers care? (2-3 paragraphs) -->

## What's New

<!-- AI_FILL: What changed? Link to the source: ${sourceUrl} -->
<!-- AI_FILL: Include specific details - version numbers, benchmarks, dates -->

## How It Works

<!-- AI_FILL: Technical explanation accessible to a developer audience -->
<!-- AI_FILL: Include a working code example or configuration snippet -->

\`\`\`python
# AI_FILL: Replace with a working, tested code example
\`\`\`

## Why It Matters

<!-- AI_FILL: Broader implications for the AI/automation ecosystem -->
<!-- AI_FILL: Who benefits? What changes? -->

## What To Watch

<!-- AI_FILL: 3-5 bullet points on what to monitor going forward -->
<!-- AI_FILL: Include links to repos, papers, or docs to follow -->

---

*Source: [${title}](${sourceUrl})*
`;

  return { template, filename, slug, dateStr, tags };
}

function inferTags(title) {
  const lower = title.toLowerCase();
  const tags = ['ai'];

  const tagMap = {
    automation: ['automation'],
    llm: ['llm'],
    gpt: ['llm', 'openai'],
    claude: ['llm', 'anthropic'],
    'open source': ['open-source'],
    'open-source': ['open-source'],
    agent: ['agents'],
    rag: ['rag'],
    'fine-tun': ['fine-tuning'],
    diffusion: ['image-gen'],
    'stable diffusion': ['image-gen'],
    midjourney: ['image-gen'],
    vision: ['computer-vision'],
    robot: ['robotics'],
    code: ['coding'],
    python: ['python'],
    rust: ['rust'],
    benchmark: ['benchmarks'],
    paper: ['research'],
  };

  for (const [keyword, addTags] of Object.entries(tagMap)) {
    if (lower.includes(keyword)) {
      for (const t of addTags) {
        if (!tags.includes(t)) tags.push(t);
      }
    }
  }

  return tags.slice(0, 5);
}

function main() {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.error('Usage: node generate.mjs "Topic Title" "source_url"');
    console.error('Example: node generate.mjs "GPT-5 Released" "https://openai.com/blog/gpt5"');
    process.exit(1);
  }

  const [title, sourceUrl] = args;

  console.log(`[generate] Creating post for: "${title}"`);
  console.log(`[generate] Source: ${sourceUrl}`);

  const { template, filename, slug, dateStr, tags } = generateTemplate(title, sourceUrl);

  // Ensure blog directory exists
  fs.mkdirSync(BLOG_DIR, { recursive: true });

  const filePath = path.join(BLOG_DIR, filename);
  fs.writeFileSync(filePath, template);
  console.log(`[generate] Wrote template: ${filePath}`);

  // Update content-log.json
  const log = loadContentLog();
  log.posts.push({
    title,
    slug,
    filename,
    source_url: sourceUrl,
    tags,
    created_at: new Date().toISOString(),
    status: 'template',
    word_count: 0,
  });
  if (!log.topics_covered.includes(title)) {
    log.topics_covered.push(title);
  }
  saveContentLog(log);
  console.log(`[generate] Updated content-log.json`);

  // Output the file path for downstream scripts
  console.log(JSON.stringify({ file: filePath, slug, filename }));
}

main();
