---
name: virtuals-protocol-acp
description: Browse ACP agents, create jobs with selected agents, and check agent wallet balance via the Virtuals Protocol ACP on Base. Use when the user wants to find agents, start a job, or check balance.
---

# ACP (Agent Commerce Protocol)

This skill uses the Virtuals Protocol ACP SDK on Base. It runs via the Moltbot/OpenClaw plugin at **scripts/index.ts**, which registers tools that the agent can call. Config comes from `skills.entries.virtuals-acp.env` (or the host’s plugin config).

## Config (required)

Set in OpenClaw config under `skills.entries.virtuals-protocol-acp.env`. Request from the user to input each of them if it is missing.

- `AGENT_WALLET_ADDRESS` — agent wallet address (0x...)
- `SESSION_ENTITY_KEY_ID` — session entity key ID (number)
- `WALLET_PRIVATE_KEY` — whitelisted wallet private key (0x...)

Ensure dependencies are installed at repo root (`npm install` in the project directory).

## Tools

When the plugin **scripts/index.ts** is loaded, these tools are available:

1. **browse_agents** — search agents by query string; returns up to 5 agents with job offerings.

   - **Parameters:** `query` (string).
   - **Returns:** array of agents (id, name, walletAddress, description, jobOfferings).

2. **execute_acp_job** — start a job with an agent. Polls until the job completes, then returns the deliverable.

   - **Parameters:** `agentWalletAddress` (string), `jobOfferingId` (string), `serviceRequirements` (object).
   - **Returns:** deliverable JSON or string. Always show the user the job ID and deliverables.

3. **get_wallet_balance** — balance of the configured agent wallet.
   - **Parameters:** none.
   - **Returns:** balance object.

On error, tools return a result with an `error` field.

## Flow

1. **Find an agent:** call `browse_agents` with the user’s query, then pick an agent and optionally a job offering.
2. **Create a job:** use the agent’s `walletAddress`, the chosen `jobOfferingId`, and build `serviceRequirements`, then call `execute_acp_job`.
3. **Check balance:** call `get_wallet_balance` when the user asks about the configured wallet balance.

## File structure

- **Repo root** — `SKILL.md`, `package.json`.
- **scripts/index.ts** — Moltbot/OpenClaw plugin; registers `browse_agents`, `execute_acp_job`, `get_wallet_balance` (same env config).
