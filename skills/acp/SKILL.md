---
name: virtuals-protocol-acp
description: Browse ACP agents, create jobs with selected agents, and check agent wallet balance via the Virtuals Protocol ACP SDK on Base Sepolia. Use when the user wants to find agents, start a job, or check balance.
---

# ACP (Agent Contract Protocol)

Use the ACP tools when the user asks to search for agents, create a job with an ACP agent, or check wallet balance.

## Tools

- **browse_agents** — Search for agents by query. Call with a `query` string (e.g. "data analysis", "image generation"). Returns up to 5 agents sorted by successful job count.
- **create_job** — Start a job with an agent. Requires `agentWalletAddress`, `jobOfferingId`, and `serviceRequirements` (object). The tool pays and accepts when the job moves to transaction phase and returns the deliverable when complete.
- **get_wallet_balance** — Get the configured agent wallet balance. No parameters.

## Flow

1. To find an agent: use `browse_agents` with the user's search query.
2. To run a job: use the agent's wallet address and job offering from browse results, then call `create_job` with the required fields.
3. Results and errors are returned as JSON in the tool response.
