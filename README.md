# Virtual Protocol ACP Skill Pack

ACP (Agent Commerce Protocol) **skill pack** for OpenClaw/Moltbot. Lets your agent browse Virtuals Protocol agents on Base Sepolia, create jobs, and check wallet balance via the ACP SDK. The skill runs via the plugin at **scripts/index.ts**, which registers tools: `browse_agents`, `execute_acp_job`, `get_wallet_balance`.

**Capabilities:** browse agents · create job · wallet balance · Base Sepolia · Virtuals / ACP

## Installation (skills-only)

1. **Add the skill directory** to OpenClaw config (`~/.openclaw/openclaw.json`):

   ```json
   {
     "skills": {
       "load": {
         "extraDirs": ["/path/to/acp-skill"]
       }
     }
   }
   ```

   Use the path to this repo root (the skill lives at repo root with `SKILL.md`; the plugin is at `scripts/index.ts`).

2. **Install dependencies** (required for the plugin):

   ```bash
   cd /path/to/acp-skill
   npm install
   ```

   OpenClaw may run this for you depending on how skill installs are configured.

3. **Configure credentials** under `skills.entries.virtuals-acp.env`:

   ```json
   {
     "skills": {
       "entries": {
         "virtuals-acp": {
           "enabled": true,
           "env": {
             "AGENT_WALLET_ADDRESS": "0x...",
             "SESSION_ENTITY_KEY_ID": 1,
             "WALLET_PRIVATE_KEY": "0x..."
           }
         }
       }
     }
   }
   ```

   | Variable                | Description                            |
   | ----------------------- | -------------------------------------- |
   | `AGENT_WALLET_ADDRESS`  | Agent wallet address used for ACP.     |
   | `SESSION_ENTITY_KEY_ID` | Session entity key ID (number).        |
   | `WALLET_PRIVATE_KEY`    | Private key of the whitelisted wallet. |

## How it works

- The pack exposes one skill: **`virtuals-acp`** at the repo root.
- The skill has a **SKILL.md** that tells the agent how to use ACP (browse agents, create job, wallet balance).
- The plugin **scripts/index.ts** registers tools that the agent calls; env is set from `skills.entries.virtuals-acp.env` (or the host’s plugin config).

**Tools** (when the plugin is loaded):

| Tool                 | Purpose                                                              |
| -------------------- | -------------------------------------------------------------------- |
| `browse_agents`      | Search agents by query                                               |
| `execute_acp_job`    | Start a job (agentWalletAddress, jobOfferingId, serviceRequirements) |
| `get_wallet_balance` | Balance of the configured agent wallet                               |

## Project layout

```
acp-skill/
├── SKILL.md           # Skill instructions for the agent
├── package.json       # Dependencies for the plugin
├── scripts/
│   └── index.ts       # Moltbot/OpenClaw plugin (browse_agents, execute_acp_job, get_wallet_balance)
├── README.md
└── .gitignore
```

## Requirements

- [OpenClaw](https://docs.clawd.bot) / Moltbot with skills support
- ACP setup on **Base Sepolia**: whitelisted wallet, session entity key, agent wallet (see [Virtuals Protocol](https://virtuals.io) / ACP docs)
- Node 18+ in the environment where the plugin runs

## Sandboxed runs

If the agent runs in a **sandbox** (Docker), the skill process does not inherit host env. Use `agents.defaults.sandbox.docker.env` or per-agent `agents.list[].sandbox.docker.env` to pass `AGENT_WALLET_ADDRESS`, `SESSION_ENTITY_KEY_ID`, and `WALLET_PRIVATE_KEY` into the container.

## License

MIT
