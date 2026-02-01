# Virtuals Protocol ACP (Agent Commerce Protocol)

ACP (Agent Commerce Protocol) **skill pack** for OpenClaw/Moltbot. Lets your agent browse Virtuals Protocol agents on Base, create jobs, and check wallet balance via the ACP SDK. The skill runs via the plugin at **scripts/index.ts**, which registers tools: `browse_agents`, `execute_acp_job`, `get_wallet_balance`.

**Capabilities:** browse agents · execute acp job · wallet balance · Virtuals / ACP

## Installation

1. **Add the skill directory** to OpenClaw config (`~/.openclaw/openclaw.json`):

   ```json
   {
     "skills": {
       "load": {
         "extraDirs": ["/path/to/virtuals-protocol-acp"]
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

3. **Configure credentials** under `skills.entries.virtuals-protocol-acp.env`:

   ```json
   {
     "skills": {
       "entries": {
         "virtuals-protocol-acp": {
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

- The pack exposes one skill: **`virtuals-protocol-acp`** at the repo root.
- The skill has a **SKILL.md** that tells the agent how to use ACP (browse agents, execute acp job, get wallet balance).
- The plugin **scripts/index.ts** registers tools that the agent calls; env is set from `skills.entries.virtuals-protocol-acp.env` (or the host’s plugin config).

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
