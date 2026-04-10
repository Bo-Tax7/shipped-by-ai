#!/usr/bin/env node

/**
 * publish.mjs - Commit, push, and send newsletter for the latest blog post.
 * Usage: node publish.mjs "Post Title"
 *
 * Requires:
 *   - RESEND_API_KEY env var for newsletter sending
 *   - Git configured with push access to origin
 */

import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..', '..');
const SUBSCRIBERS_PATH = path.join(__dirname, 'subscribers.json');
const BLOG_DIR = path.join(PROJECT_ROOT, 'src', 'data', 'blog');

function exec(cmd, options = {}) {
  console.log(`[publish] $ ${cmd}`);
  try {
    const output = execSync(cmd, {
      cwd: PROJECT_ROOT,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
      ...options,
    });
    if (output.trim()) console.log(output.trim());
    return output.trim();
  } catch (err) {
    console.error(`[publish] Command failed: ${err.message}`);
    if (err.stderr) console.error(err.stderr);
    throw err;
  }
}

function loadSubscribers() {
  try {
    const raw = fs.readFileSync(SUBSCRIBERS_PATH, 'utf-8');
    return JSON.parse(raw).subscribers || [];
  } catch {
    return [];
  }
}

function findLatestPost() {
  if (!fs.existsSync(BLOG_DIR)) return null;
  const files = fs.readdirSync(BLOG_DIR).filter((f) => f.endsWith('.md')).sort().reverse();
  if (files.length === 0) return null;
  return {
    filename: files[0],
    path: path.join(BLOG_DIR, files[0]),
    content: fs.readFileSync(path.join(BLOG_DIR, files[0]), 'utf-8'),
  };
}

function markdownToSimpleHtml(markdown) {
  // Strip frontmatter
  const content = markdown.replace(/^---[\s\S]*?---\n*/m, '');

  return content
    // Headers
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    // Bold and italic
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Code blocks
    .replace(/```[\w]*\n([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
    // Inline code
    .replace(/`(.+?)`/g, '<code>$1</code>')
    // Links
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>')
    // Line breaks into paragraphs
    .replace(/\n\n/g, '</p><p>')
    // Comments (strip them)
    .replace(/<!--[\s\S]*?-->/g, '')
    // Wrap in paragraph tags
    .replace(/^/, '<p>')
    .replace(/$/, '</p>');
}

async function sendNewsletter(title, htmlContent, subscribers) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.log('[publish] RESEND_API_KEY not set - skipping newsletter');
    return;
  }

  if (subscribers.length === 0) {
    console.log('[publish] No subscribers - skipping newsletter');
    return;
  }

  console.log(`[publish] Sending newsletter to ${subscribers.length} subscriber(s)...`);

  const emailHtml = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h1 style="color: #1a1a1a;">Shipped by AI</h1>
  <h2>${title}</h2>
  <div>${htmlContent}</div>
  <hr style="margin-top: 40px; border: none; border-top: 1px solid #e5e5e5;">
  <p style="color: #666; font-size: 12px;">
    You're receiving this because you subscribed to Shipped by AI.
    This blog is 100% written, edited, and published by AI.
  </p>
</body>
</html>`;

  for (const email of subscribers) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Shipped by AI <blog@shipped-by-ai.com>',
          to: email,
          subject: `New post: ${title}`,
          html: emailHtml,
        }),
      });

      if (!res.ok) {
        const err = await res.text();
        console.error(`[publish] Failed to send to ${email}: ${err}`);
      } else {
        console.log(`[publish] Sent to ${email}`);
      }
    } catch (err) {
      console.error(`[publish] Error sending to ${email}: ${err.message}`);
    }
  }
}

async function main() {
  const title = process.argv[2] || 'New post';

  console.log(`[publish] Starting publish for: "${title}"`);
  console.log(`[publish] Project root: ${PROJECT_ROOT}`);

  // Step 1: Git add, commit, push
  try {
    exec('git add src/data/blog/');
    exec(`git commit -m "post: ${title.replace(/"/g, '\\"')}"`);
    exec('git push origin main');
    console.log('[publish] Git push complete');
  } catch (err) {
    console.error(`[publish] Git operations failed: ${err.message}`);
    console.error('[publish] Continuing to newsletter step...');
  }

  // Step 2: Send newsletter
  const latestPost = findLatestPost();
  if (!latestPost) {
    console.log('[publish] No blog posts found - skipping newsletter');
    return;
  }

  const subscribers = loadSubscribers();
  const htmlContent = markdownToSimpleHtml(latestPost.content);
  await sendNewsletter(title, htmlContent, subscribers);

  console.log('[publish] Done');
}

main().catch((err) => {
  console.error(`[publish] Fatal error: ${err.message}`);
  process.exit(1);
});
