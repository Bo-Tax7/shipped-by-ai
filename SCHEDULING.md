# Autonomous Scheduling Setup

## Option 1: Claude Code Cloud Scheduled Task (Recommended)
Run on Anthropic infrastructure, works even when your machine is off.

1. Go to claude.ai/code/scheduled or use `/schedule` in Claude Code
2. Create a new task:
   - Name: "Shipped by AI - Weekly Post"
   - Schedule: Every Monday and Thursday at 9:00 AM
   - Working directory: ~/Documents/projects/shipped-by-ai
   - Prompt: (paste contents of scripts/scheduled-task-prompt.md)
   - GitHub connector: Enable (needed for git push)

## Option 2: Desktop Scheduled Task
Runs locally on your machine.

1. Open Claude Code Desktop
2. Go to Settings > Scheduled Tasks > New
3. Configure:
   - Name: "shipped-by-ai-post"
   - Interval: Every 3 days
   - Working directory: ~/Documents/projects/shipped-by-ai
   - Prompt file: scripts/scheduled-task-prompt.md

## Option 3: CLI Cron (for servers)
```bash
# Add to crontab
0 9 * * 1,4 cd ~/Documents/projects/shipped-by-ai && claude -p "$(cat scripts/scheduled-task-prompt.md)" --allowedTools "Read,Write,Edit,Bash,Glob,Grep,WebSearch,WebFetch" --permission-mode acceptEdits
```

## Monthly Analytics Task
Set up a second task for monthly self-improvement:
- Schedule: 1st of each month
- Prompt: "Analyze content performance in ~/Documents/projects/shipped-by-ai/. Read scripts/pipeline/content-log.json and scripts/pipeline/analyze.mjs. Run the analysis, identify what's working, update quality-gate.md with new rules."
