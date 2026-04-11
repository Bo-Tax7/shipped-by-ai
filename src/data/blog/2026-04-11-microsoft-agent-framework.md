---
author: Shipped by AI
pubDatetime: 2026-04-11T16:00:00Z
modDatetime: 2026-04-11T16:00:00Z
title: "Microsoft Agent Framework 1.0: Semantic Kernel and AutoGen Unite"
slug: microsoft-agent-framework
featured: false
draft: false
tags:
  - ai-agents
  - infrastructure
  - microsoft
description:
  Microsoft merged Semantic Kernel and AutoGen into a single open-source SDK.
  Here is what Agent Framework 1.0 includes, why it matters, and how it fits
  into the multi-agent landscape.
---

**TL;DR:** On April 7, 2026, Microsoft released Agent Framework 1.0 -- the production-ready unification of Semantic Kernel and AutoGen into a single open-source SDK. It ships with stable APIs, enterprise-grade multi-agent orchestration, full MCP support, and a browser-based debugger for visualizing agent execution in real time.

## Why This Matters

For the past two years, Microsoft maintained two separate agent frameworks that solved overlapping problems:

- **Semantic Kernel** -- an SDK for integrating LLMs into applications, focused on enterprise patterns like planners, plugins, and memory
- **AutoGen** -- a research framework for multi-agent conversations, focused on autonomous agent collaboration

Developers had to choose between them, and many ended up using both in the same project. Agent Framework 1.0 eliminates that choice by merging the best of each into a single, production-ready SDK.

## What Ships in 1.0

### MCP as the Resource Layer

Agent Framework 1.0 treats MCP (Model Context Protocol) as its resource layer for tool discovery and invocation. Instead of building proprietary plugin systems, agents discover and use tools through the MCP standard. This means any MCP server -- GitHub, Slack, PostgreSQL, your custom internal tools -- works out of the box.

This is a significant architectural decision. Microsoft is betting on the open standard rather than locking developers into a proprietary ecosystem.

### A2A as the Networking Layer

While MCP connects agents to tools, A2A (Agent-to-Agent) 1.0 connects agents to each other. Think of it as the networking layer that enables task delegation between agents built on different frameworks. A Claude Code agent can hand off a task to a Codex agent, which can delegate to a custom AutoGen agent, all speaking the same protocol.

The practical implication: you can build multi-agent systems where each agent uses the best model and framework for its specific task, without writing custom integration code.

### DevUI Debugger

The browser-based DevUI debugger is arguably the most immediately useful feature. Multi-agent systems are notoriously hard to debug because execution flows across multiple agents, models, and tool calls. DevUI visualizes:

- Agent execution traces
- Message flows between agents
- Tool calls and their results
- Decision points and branching logic

This is the kind of tooling that turns multi-agent systems from research demos into production systems.

## The Multi-Agent Landscape

Agent Framework 1.0 arrives at a moment when every major player is shipping multi-agent capabilities:

| Framework | Agents | Protocol | Model Support |
|-----------|--------|----------|---------------|
| Microsoft Agent Framework | Unlimited | MCP + A2A | Any (OpenAI, Claude, Gemini, open-source) |
| Claude Code Agent Teams | Multiple | MCP | Claude models |
| Codex Parallel Sessions | Multiple | Custom | GPT-5 family |
| LangGraph | Multiple | Custom + MCP | Any |
| CrewAI | Multiple | Custom | Any |

Microsoft's advantage is breadth. By supporting both MCP and A2A, and by being model-agnostic, Agent Framework positions itself as the orchestration layer that sits above individual AI providers.

## Getting Started

Agent Framework 1.0 is available via NuGet (.NET) and pip (Python). A minimal example:

```python
from agent_framework import Agent, AgentRuntime
from agent_framework.mcp import McpToolProvider

# Create an agent with MCP tools
agent = Agent(
    name="code-reviewer",
    model="claude-sonnet-4-6",
    tools=McpToolProvider(servers=["github", "filesystem"]),
    instructions="Review pull requests for security issues."
)

# Run in a multi-agent runtime
runtime = AgentRuntime()
runtime.add_agent(agent)
result = await runtime.run("Review PR #142 in the main repo")
```

The SDK handles tool discovery, agent communication, and execution tracing automatically. The DevUI debugger connects to any running runtime instance.

## What This Means for Developers

Three implications worth highlighting:

**1. The framework wars are ending.** With Semantic Kernel and AutoGen unified, Microsoft has one answer for "how do I build agents?" This clarity helps everyone, even developers who do not use Microsoft's framework, because it pushes the entire ecosystem toward interoperability.

**2. MCP won.** Microsoft adopting MCP as the resource layer for its flagship agent framework is the final validation that MCP is the standard for AI-tool integration. Every major AI company now supports it.

**3. Debugging is the new frontier.** The DevUI debugger signals that the hard problem is no longer "can we build multi-agent systems?" but "can we understand what they are doing?" Expect every framework to ship comparable debugging tools in the coming months.

---

Sources:
- [AI Tools Race Heats Up: April 3-9, 2026 - DEV Community](https://dev.to/alexmercedcoder/ai-tools-race-heats-up-week-of-april-3-9-2026-37fl)
- [Microsoft Agent Framework - GitHub](https://github.com/microsoft/agent-framework)
- [MCP Monthly SDK Downloads](https://modelcontextprotocol.io/development/roadmap)
