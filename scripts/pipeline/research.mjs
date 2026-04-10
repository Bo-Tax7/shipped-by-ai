#!/usr/bin/env node

/**
 * research.mjs - Fetch and rank AI/ML topic candidates from HN and Reddit.
 * Outputs a JSON array of ranked topics to stdout.
 * Usage: node research.mjs
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CONTENT_LOG_PATH = path.join(__dirname, 'content-log.json');

const AI_KEYWORDS = [
  'ai', 'artificial intelligence', 'machine learning', 'ml', 'deep learning',
  'llm', 'gpt', 'claude', 'openai', 'anthropic', 'gemini', 'mistral',
  'transformer', 'neural', 'automation', 'copilot', 'agent', 'rag',
  'fine-tune', 'fine-tuning', 'diffusion', 'stable diffusion', 'midjourney',
  'langchain', 'vector', 'embedding', 'prompt', 'chatbot', 'nlp',
  'computer vision', 'robotics', 'reinforcement learning', 'model',
];

function isAIRelated(title) {
  const lower = title.toLowerCase();
  return AI_KEYWORDS.some((kw) => lower.includes(kw));
}

function loadContentLog() {
  try {
    const raw = fs.readFileSync(CONTENT_LOG_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return { posts: [], topics_covered: [], last_research: null, quality_rules: [] };
  }
}

function isAlreadyCovered(title, topicsCovered) {
  const lower = title.toLowerCase();
  return topicsCovered.some((t) => {
    const tLower = t.toLowerCase();
    // Simple overlap check - if >60% of words match, consider it covered
    const words = tLower.split(/\s+/);
    const matchCount = words.filter((w) => w.length > 3 && lower.includes(w)).length;
    return words.length > 0 && matchCount / words.length > 0.6;
  });
}

async function fetchHackerNews() {
  console.error('[research] Fetching Hacker News top stories...');
  try {
    const res = await fetch('https://hacker-news.firebaseio.com/v0/topstories.json');
    if (!res.ok) throw new Error(`HN API returned ${res.status}`);
    const ids = await res.json();

    // Fetch top 50 stories in parallel
    const top50 = ids.slice(0, 50);
    const stories = await Promise.all(
      top50.map(async (id) => {
        try {
          const r = await fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`);
          if (!r.ok) return null;
          return await r.json();
        } catch {
          return null;
        }
      })
    );

    return stories
      .filter((s) => s && s.title && isAIRelated(s.title))
      .map((s) => ({
        title: s.title,
        url: s.url || `https://news.ycombinator.com/item?id=${s.id}`,
        source: 'hackernews',
        score: s.score || 0,
        comments: s.descendants || 0,
        time: s.time,
      }));
  } catch (err) {
    console.error(`[research] HN fetch failed: ${err.message}`);
    return [];
  }
}

async function fetchReddit() {
  console.error('[research] Fetching Reddit r/artificial + r/MachineLearning...');
  try {
    const res = await fetch(
      'https://www.reddit.com/r/artificial+MachineLearning/top.json?t=week&limit=50',
      {
        headers: {
          'User-Agent': 'shipped-by-ai-research/1.0',
        },
      }
    );
    if (!res.ok) throw new Error(`Reddit API returned ${res.status}`);
    const data = await res.json();

    const posts = data?.data?.children || [];
    return posts
      .filter((p) => p.data && p.data.title && isAIRelated(p.data.title))
      .map((p) => ({
        title: p.data.title,
        url: p.data.url || `https://reddit.com${p.data.permalink}`,
        source: 'reddit',
        score: p.data.score || 0,
        comments: p.data.num_comments || 0,
        time: p.data.created_utc,
      }));
  } catch (err) {
    console.error(`[research] Reddit fetch failed: ${err.message}`);
    return [];
  }
}

function rankTopics(topics) {
  // Normalize scores per source, then combine
  const maxHN = Math.max(1, ...topics.filter((t) => t.source === 'hackernews').map((t) => t.score));
  const maxReddit = Math.max(1, ...topics.filter((t) => t.source === 'reddit').map((t) => t.score));

  return topics
    .map((t) => {
      const normalizedScore =
        t.source === 'hackernews' ? t.score / maxHN : t.score / maxReddit;
      const commentBoost = Math.min(t.comments / 100, 1) * 0.3;
      const recencyBoost =
        t.time ? Math.max(0, 1 - (Date.now() / 1000 - t.time) / (7 * 86400)) * 0.2 : 0;
      return {
        ...t,
        rank_score: parseFloat((normalizedScore + commentBoost + recencyBoost).toFixed(3)),
      };
    })
    .sort((a, b) => b.rank_score - a.rank_score);
}

async function main() {
  const contentLog = loadContentLog();
  const topicsCovered = contentLog.topics_covered || [];

  // Fetch from all sources in parallel
  const [hnTopics, redditTopics] = await Promise.all([
    fetchHackerNews(),
    fetchReddit(),
  ]);

  console.error(`[research] Found ${hnTopics.length} HN + ${redditTopics.length} Reddit AI topics`);

  const allTopics = [...hnTopics, ...redditTopics];

  // Filter out already covered topics
  const fresh = allTopics.filter((t) => !isAlreadyCovered(t.title, topicsCovered));
  console.error(`[research] ${fresh.length} topics after filtering covered ones`);

  const ranked = rankTopics(fresh);

  // Update last_research timestamp
  contentLog.last_research = new Date().toISOString();
  fs.writeFileSync(CONTENT_LOG_PATH, JSON.stringify(contentLog, null, 2) + '\n');

  // Output ranked topics as JSON to stdout
  console.log(JSON.stringify(ranked, null, 2));
}

main().catch((err) => {
  console.error(`[research] Fatal error: ${err.message}`);
  process.exit(1);
});
