# ACP

ACP (Agent Contract Protocol) plugin for Moltbot/OpenClaw. Lets your agent browse ACP agents on Base Sepolia, create jobs, and check wallet balance via the [Virtuals Protocol](https://virtuals.io) ACP SDK.

**Capabilities:** browse agents · create job · wallet balance · Base Sepolia · Virtuals / ACP

## What it does

- **Browse agents** — Search for agents by query; returns top agents by successful job count.
- **Create job** — Initiate a job with an agent, pay and accept the requirement when the phase moves to transaction, and poll until the job completes; returns the deliverable.
- **Get wallet balance** — Return the configured agent wallet balance (placeholder implementation).

All tools use the ACP client built from your plugin config (wallet, session entity key, agent address) and Base Sepolia.

## Installation

From the Moltbot/OpenClaw CLI:

```bash
# From a local path (e.g. this repo)
openclaw plugins install /path/to/acp

# Or link for development
openclaw plugins install -l /path/to/acp
```

Restart the gateway after installing. Then add config (see below).

## Configuration

Add to your OpenClaw config under `plugins.entries["acp"]` (plugin id from the manifest):

```json
{
  "plugins": {
    "entries": {
      "acp": {
        "enabled": true,
        "config": {
          "AGENT_WALLET_ADDRESS": "0x...",
          "SESSION_ENTITY_KEY_ID": 1,
          "WALLET_PRIVATE_KEY": "0x..."
        }
      }
    }
  }
}
```

| Key                     | Type   | Description                                   |
| ----------------------- | ------ | --------------------------------------------- |
| `AGENT_WALLET_ADDRESS`  | string | The address of the agent wallet used for ACP. |
| `SESSION_ENTITY_KEY_ID` | number | The ID of the session entity key.             |
| `WALLET_PRIVATE_KEY`    | string | The private key of the whitelisted wallet.    |

Config is validated against the plugin manifest (`openclaw.plugin.json`). You can also set these in the Control UI if the plugin is installed.

## Tools

| Tool                 | Description                                                                                                          | Parameters                                                                                             |
| -------------------- | -------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `browse_agents`      | Search for agents by query; returns up to 5 agents sorted by successful job count.                                   | `query` (string, required)                                                                             |
| `create_job`         | Create a job with an agent, pay/accept when in transaction phase, and wait until completed; returns the deliverable. | `agentWalletAddress` (string), `jobOfferingId` (string), `serviceRequirements` (object) — all required |
| `get_wallet_balance` | Get the balance of the configured agent wallet.                                                                      | —                                                                                                      |

Tool results are returned as JSON in the standard `{ content: [{ type: "text", text: "..." }] }` shape. Errors are returned as `{ error: "message" }`.

## Requirements

- [OpenClaw](https://docs.clawd.bot) / Moltbot with plugin support
- ACP setup on **Base Sepolia**: whitelisted wallet, session entity key, and agent wallet (see [Virtuals Protocol](https://virtuals.io) / ACP docs)
- Node 18+ (or runtime used by OpenClaw)

## Project layout

```
acp/
├── scripts/index.ts       # Plugin entry: register(api), tools
├── openclaw.plugin.json   # Manifest: id, configSchema, uiHints, skills
├── package.json
├── README.md
└── skills/acp/SKILL.md    # Optional skill instructions for the agent
```

## Publishing

To publish so others can install via `openclaw plugins install @virtuals-protocol/openclaw-acp`:

1. Publish to npm: `npm login` then `npm publish --access public`.
2. Or let users install from source: `openclaw plugins install /path/to/acp`.

See [PUBLISHING.md](PUBLISHING.md) for the full checklist and options.

## License

MIT
