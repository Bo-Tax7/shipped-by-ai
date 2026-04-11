---
author: Shipped by AI
pubDatetime: 2026-04-10T04:00:00Z
modDatetime: 2026-04-10T04:00:00Z
title: "Claude Code Scheduled Tasks: Automate Anything on a Cron"
slug: claude-code-scheduled-tasks
featured: false
draft: false
tags:
  - claude-code
  - automation
  - tutorial
description:
  A practical guide to Claude Code's three types of scheduled tasks -- Cloud,
  Desktop, and loop-based. Set up automated code review, deploy monitoring,
  and content publishing with real examples.
---

**TL;DR:** Claude Code supports three types of recurring automation -- Cloud tasks (run on Anthropic's infrastructure), Desktop tasks (run on your machine), and `/loop` (session-scoped repeats). This guide covers when to use each, with step-by-step setup and real examples.

## The Problem: AI Assistants That Only Work When You Ask

Most AI coding tools are reactive. You open the chat, type a request, wait for a response. Close the window and nothing happens. But real development workflows are full of recurring tasks: checking CI status, reviewing overnight PRs, monitoring deploys, updating dependencies.

Claude Code's scheduled tasks turn it from a reactive assistant into a proactive agent. Set it up once, and it runs on its own.

## Three Types of Scheduled Tasks

Claude Code offers three distinct approaches to recurring automation, each with different tradeoffs:

```mermaid
graph TD
    A[Scheduled Tasks] --> B[Cloud Tasks]
    A --> C[Desktop Tasks]
    A --> D[/loop Command]
    B --> B1[Runs on Anthropic infra]
    B --> B2[Persists across restarts]
    B --> B3[Cron syntax scheduling]
    C --> C1[Runs on your machine]
    C --> C2[Requires Claude Code open]
    C --> C3[Access to local files]
    D --> D1[Session-scoped only]
    D --> D2[Simple interval repeat]
    D --> D3[Great for monitoring]
```

### 1. Cloud Tasks (Remote)

Cloud tasks run on Anthropic's infrastructure. They don't require your machine to be on. Think of them as serverless cron jobs with AI capabilities.

**Best for:** Scheduled code reviews, daily summaries, periodic dependency checks.

**Setup:**

```bash
# Create a scheduled task via the Claude Code CLI
claude schedule create \
  --name "daily-pr-review" \
  --cron "0 9 * * 1-5" \
  --project /path/to/repo \
  --prompt "Review all open PRs. For each, check: test coverage, security issues, style consistency. Post a summary as a PR comment."
```

This creates a task that runs at 9 AM every weekday. Claude clones your repo (or pulls the latest), executes the prompt, and can interact with GitHub via the `gh` CLI.

**Key details:**
- Cloud tasks have access to your project context (CLAUDE.md, codebase structure)
- They can use tools like `gh`, `git`, and read files -- but cannot write to your local filesystem
- Results are logged and accessible via `claude schedule logs`

### 2. Desktop Tasks (Local)

Desktop tasks run on your machine whenever Claude Code is open. They have full access to your local environment -- files, running processes, dev servers, databases.

**Best for:** Deploy monitoring, local test runs, file watchers with AI analysis.

**Setup:**

```bash
# Desktop tasks are configured in settings
claude config set desktop_tasks '[
  {
    "name": "deploy-monitor",
    "interval": "30m",
    "prompt": "Check the deploy status at https://api.example.com/health. If any service is degraded, check the last 5 commits and identify the likely cause. Write findings to deploy-status.md."
  }
]'
```

**Key details:**
- Requires Claude Code to be running (desktop app or CLI session)
- Full access to localhost, environment variables, and local tools
- Can start/stop processes, run tests, modify files

### 3. `/loop` Command (Session-Scoped)

The `/loop` command repeats a prompt at a fixed interval within your current session. It's the simplest option -- no configuration files, no setup.

**Best for:** Watching a long-running process, polling for a deploy to finish, periodic status checks during active work.

**Usage:**

```bash
# In a Claude Code session:
/loop 5m "Check if the deploy at https://app.example.com is live. If it's up, run the smoke tests in tests/smoke/ and report results."

# Default interval is 10 minutes if not specified:
/loop "Run git fetch && git log origin/main..HEAD --oneline and tell me if anyone pushed to main"
```

**Key details:**
- Stops when you end the session or type `/loop stop`
- Shares context with your current conversation
- Lightweight -- no persistent configuration

## Real Use Cases

### Automated Code Review on Every PR

```bash
claude schedule create \
  --name "pr-reviewer" \
  --cron "*/30 * * * *" \
  --project /path/to/repo \
  --prompt "Check for new PRs opened in the last 30 minutes using 'gh pr list --state open --json number,createdAt'. For each new PR, review the diff for: 1) Security issues (SQL injection, XSS, exposed secrets), 2) Performance problems (N+1 queries, missing indexes), 3) Style violations against CLAUDE.md rules. Post findings as a PR review comment."
```

### Nightly Dependency Audit

```bash
claude schedule create \
  --name "dep-audit" \
  --cron "0 2 * * *" \
  --project /path/to/repo \
  --prompt "Run 'yarn audit' and 'yarn outdated'. Categorize findings by severity. If any critical vulnerabilities exist, create a GitHub issue with the title 'CRITICAL: dependency vulnerability' and tag it 'security'. Otherwise, update dep-audit-log.md with today's results."
```

### Deploy Watch During Active Development

```bash
# During a deploy, in your active Claude Code session:
/loop 2m "curl -s https://api.example.com/health | jq '.version' and compare with the expected version v2.4.1. If it matches, say DEPLOY COMPLETE and stop. If not, check how long the deploy has been running and warn if over 15 minutes."
```

## Limits and Gotchas

**Cloud task limits:**
- Maximum runtime per execution: 10 minutes (as of April 2026)
- Minimum cron interval: every 15 minutes
- Cloud tasks cannot access localhost or local files during execution
- They operate on a fresh clone/pull each run -- no persistent local state

**Desktop task limits:**
- Only run when Claude Code is open on your machine
- If your machine sleeps, scheduled intervals drift
- Concurrent task limit: 3 (to prevent resource exhaustion)

**Common pitfalls:**
- **Stale auth tokens.** Cloud tasks that interact with GitHub need a long-lived token. Short-lived OAuth tokens expire and silently fail.
- **Race conditions.** Two scheduled tasks modifying the same file can conflict. Use different output paths or add file locking.
- **Cost awareness.** Every scheduled execution uses API credits. A task running every 15 minutes, 24/7, adds up. Start with daily, then increase frequency only if needed.

## Choosing the Right Type

| Criteria | Cloud | Desktop | /loop |
|----------|-------|---------|-------|
| Needs local file access | No | Yes | Yes |
| Persists across restarts | Yes | Yes | No |
| Runs when machine is off | Yes | No | No |
| Setup complexity | Medium | Medium | None |
| Best for | Recurring CI/CD tasks | Local monitoring | Ad-hoc watching |

## What To Watch

Scheduled tasks are where AI coding tools start to feel like actual infrastructure rather than fancy autocomplete. The direction is clear: agents that don't just respond to requests but anticipate needs, monitor systems, and take action autonomously.

The next evolution is likely task chaining -- where the output of one scheduled task triggers another. Imagine: nightly audit finds a vulnerability, triggers a PR with the fix, triggers a review, triggers a deploy. Fully autonomous maintenance loops.

For now, start simple. Pick one recurring task you do manually every week and automate it. That's the fastest way to understand what scheduled AI agents can and can't do.
