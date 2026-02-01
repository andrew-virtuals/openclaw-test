#!/usr/bin/env npx tsx
/**
 * ACP Skill — CLI only.
 *
 * Usage: npx tsx scripts/index.ts <tool> [params...]
 *   browse_agents "<query>"
 *   execute_acp_job "<agentWalletAddress>" "<jobOfferingId>" '<serviceRequirementsJson>'
 *   get_wallet_balance
 *
 * Requires env (or .env): AGENT_WALLET_ADDRESS, SESSION_ENTITY_KEY_ID, WALLET_PRIVATE_KEY
 * Output: single JSON value to stdout. On error: {"error":"message"} and exit 1.
 */
import "dotenv/config";
import AcpClient, {
  FareAmount,
  AcpContractClientV2,
  AcpAgentSort,
  AcpGraduationStatus,
  AcpOnlineStatus,
  AcpJobPhases,
  baseAcpX402ConfigV2,
} from "@virtuals-protocol/acp-node";

type AcpConfig = {
  WALLET_PRIVATE_KEY: string;
  SESSION_ENTITY_KEY_ID: number;
  AGENT_WALLET_ADDRESS: string;
};

type Client = InstanceType<typeof AcpClient>;

function getConfigFromEnv(): AcpConfig {
  const walletKey = process.env.WALLET_PRIVATE_KEY;
  const sessionKeyId = process.env.SESSION_ENTITY_KEY_ID;
  const agentWallet = process.env.AGENT_WALLET_ADDRESS;
  if (!walletKey || !sessionKeyId || !agentWallet) {
    throw new Error(
      "Missing env: set AGENT_WALLET_ADDRESS, SESSION_ENTITY_KEY_ID, WALLET_PRIVATE_KEY"
    );
  }
  return {
    WALLET_PRIVATE_KEY: walletKey,
    SESSION_ENTITY_KEY_ID: Number(sessionKeyId),
    AGENT_WALLET_ADDRESS: agentWallet,
  };
}

async function buildAcpClient(config: AcpConfig): Promise<Client> {
  const acpContractClient = await AcpContractClientV2.build(
    config.WALLET_PRIVATE_KEY as `0x${string}`,
    config.SESSION_ENTITY_KEY_ID,
    config.AGENT_WALLET_ADDRESS as `0x${string}`,
    baseAcpX402ConfigV2
  );
  // @ts-expect-error AcpClient constructor shape
  return new AcpClient.default({
    acpContractClient,
    skipSocketConnection: true,
  });
}

function out(data: unknown): void {
  console.log(JSON.stringify(data));
}

function cliErr(message: string): never {
  out({ error: message });
  process.exit(1);
}

/** Build client from env, run fn(client), output result; on error output JSON error and exit 1. */
async function withClient<T>(
  fn: (client: Client) => Promise<T>
): Promise<void> {
  try {
    const config = getConfigFromEnv();
    const client = await buildAcpClient(config);
    const result = await fn(client);
    out(result ?? {});
  } catch (e) {
    cliErr(e instanceof Error ? e.message : String(e));
  }
}

async function browseAgents(client: Client, query: string) {
  const agents = await client.browseAgents(query, {
    sortBy: [AcpAgentSort.SUCCESSFUL_JOB_COUNT],
    topK: 5,
    graduationStatus: AcpGraduationStatus.ALL,
    onlineStatus: AcpOnlineStatus.ALL,
  });

  if (!agents || agents.length === 0) {
    return cliErr("No agents found");
  }

  return agents.map((agent) => ({
    id: agent.id,
    name: agent.name,
    walletAddress: agent.walletAddress,
    description: agent.description,
    jobOfferings: (agent.jobOfferings || []).map((job) => ({
      name: job.name,
      price: job.price,
      priceType: job.priceType,
      requirement: job.requirement,
    })),
  }));
}

async function runExecuteAcpJob(
  client: Client,
  agentWalletAddress: string,
  serviceRequirements: Record<string, unknown>
): Promise<unknown> {
  const jobId = await client.initiateJob(
    agentWalletAddress as `0x${string}`,
    serviceRequirements,
    new FareAmount(0, baseAcpX402ConfigV2.baseFare)
  );
  for (;;) {
    const job = await client.getJobById(jobId);
    const latestMemo = job?.latestMemo;
    if (
      job?.phase === AcpJobPhases.NEGOTIATION &&
      latestMemo?.nextPhase === AcpJobPhases.TRANSACTION
    ) {
      await job?.payAndAcceptRequirement();
    }
    if (job?.phase === AcpJobPhases.COMPLETED) {
      return job?.deliverable;
    }
    await new Promise((r) => setTimeout(r, 10000));
  }
}

const USAGE =
  "Usage: browse_agents <query> | execute_acp_job <agentWalletAddress> <serviceRequirementsJson> | get_wallet_balance";

type ToolHandler = {
  validate: (args: string[]) => string | null;
  run: (client: Client, args: string[]) => Promise<unknown>;
};

const TOOLS: Record<string, ToolHandler> = {
  browse_agents: {
    validate: (args) =>
      !args[0]?.trim() ? 'Usage: browse_agents "<query>"' : null,
    run: (client, args) => browseAgents(client, args[0]!.trim()),
  },
  execute_acp_job: {
    validate: (args) => {
      if (!args[0]?.trim() || !args[1]?.trim())
        return "Usage: execute_acp_job \"<agentWalletAddress>\" '<serviceRequirementsJson>'";
      if (args[2]) {
        try {
          JSON.parse(args[2]);
        } catch {
          return "Invalid serviceRequirements JSON (third argument)";
        }
      }
      return null;
    },
    run: (client, args) => {
      const serviceRequirements = args[1]
        ? (JSON.parse(args[2]) as Record<string, unknown>)
        : {};
      return runExecuteAcpJob(client, args[0]!.trim(), serviceRequirements);
    },
  },
  get_wallet_balance: {
    validate: () => null,
    run: (client) => client.getTokenBalances(),
  },
};

async function runCli(): Promise<void> {
  const [, , tool = "", ...args] = process.argv;
  const handler = TOOLS[tool];
  if (!handler) {
    cliErr(USAGE);
  }
  const err = handler.validate(args);
  if (err) cliErr(err);
  await withClient((client) => handler.run(client, args));
}

const toolArg = process.argv[2] ?? "";
if (toolArg in TOOLS) {
  runCli().catch((e) => {
    out({ error: e instanceof Error ? e.message : String(e) });
    process.exit(1);
  });
} else {
  cliErr(USAGE);
}
