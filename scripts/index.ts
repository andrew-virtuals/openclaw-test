#!/usr/bin/env npx tsx
/**
 * ACP Skill — CLI only.
 *
 * Usage: npx tsx scripts/index.ts <tool> [params...]
 *   browse_agents "<query>"
 *   execute_acp_job "<agentWalletAddress>" "<jobOfferingId>" '<serviceRequirementsJson>'
 *   get_wallet_balance
 *
 * Requires env: AGENT_WALLET_ADDRESS, SESSION_ENTITY_KEY_ID, WALLET_PRIVATE_KEY
 * Output: single JSON value to stdout. On error: {"error":"message"} and exit 1.
 */
import AcpClient, {
  baseSepoliaAcpConfigV2,
  FareAmount,
  AcpContractClientV2,
  AcpAgentSort,
  AcpGraduationStatus,
  AcpOnlineStatus,
  AcpJobPhases,
} from "@virtuals-protocol/acp-node";

type AcpConfig = {
  WALLET_PRIVATE_KEY: string;
  SESSION_ENTITY_KEY_ID: number;
  AGENT_WALLET_ADDRESS: string;
};

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

async function buildAcpClient(
  config: AcpConfig
): Promise<InstanceType<typeof AcpClient>> {
  const acpContractClient = await AcpContractClientV2.build(
    config.WALLET_PRIVATE_KEY as `0x${string}`,
    config.SESSION_ENTITY_KEY_ID,
    config.AGENT_WALLET_ADDRESS as `0x${string}`,
    baseSepoliaAcpConfigV2
  );
  // @ts-expect-error AcpClient constructor shape
  return new AcpClient.default({
    acpContractClient,
    skipSocketConnection: true,
  });
}

async function browseAgents(
  acpClient: InstanceType<typeof AcpClient>,
  query: string
) {
  const relevantAgents = await acpClient.browseAgents(query, {
    sortBy: [AcpAgentSort.SUCCESSFUL_JOB_COUNT],
    topK: 5,
    graduationStatus: AcpGraduationStatus.ALL,
    onlineStatus: AcpOnlineStatus.ALL,
  });

  return (relevantAgents || []).map((agent) => ({
    id: agent.id,
    name: agent.name,
    walletAddress: agent.walletAddress,
    description: agent.description,
    jobOfferings: (agent.jobOfferings || []).map((jobOffering) => ({
      name: jobOffering.name,
      price: jobOffering.price,
      priceType: jobOffering.priceType,
      requirement: jobOffering.requirement,
    })),
  }));
}

function out(data: unknown): void {
  console.log(JSON.stringify(data));
}

function cliErr(message: string): void {
  out({ error: message });
  process.exitCode = 1;
}

async function runCli(): Promise<void> {
  const [, , tool = "", ...args] = process.argv;

  if (tool === "browse_agents") {
    const query = args[0]?.trim();
    if (!query) {
      cliErr('Usage: npx tsx scripts/index.ts browse_agents "<query>"');
      return;
    }
    try {
      const config = getConfigFromEnv();
      const client = await buildAcpClient(config);
      const result = await browseAgents(client, query);
      out(result);
    } catch (e) {
      cliErr(e instanceof Error ? e.message : String(e));
    }
    return;
  }

  if (tool === "execute_acp_job") {
    const agentWalletAddress = args[0]?.trim();
    const jobOfferingId = args[1]?.trim();
    let serviceRequirements: Record<string, unknown> = {};
    try {
      serviceRequirements = args[2]
        ? (JSON.parse(args[2]) as Record<string, unknown>)
        : {};
    } catch {
      cliErr("Invalid serviceRequirements JSON (third argument)");
      return;
    }
    if (!agentWalletAddress || !jobOfferingId) {
      cliErr(
        'Usage: npx tsx scripts/index.ts execute_acp_job "<agentWalletAddress>" "<jobOfferingId>" \'<serviceRequirementsJson>\''
      );
      return;
    }
    try {
      const config = getConfigFromEnv();
      const client = await buildAcpClient(config);
      const jobId = await client.initiateJob(
        agentWalletAddress as `0x${string}`,
        serviceRequirements,
        new FareAmount(0, baseSepoliaAcpConfigV2.baseFare)
      );
      let deliverable: unknown;
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
          deliverable = job?.deliverable;
          break;
        }
        await new Promise((r) => setTimeout(r, 10000));
      }
      out(deliverable ?? {});
    } catch (e) {
      cliErr(e instanceof Error ? e.message : String(e));
    }
    return;
  }

  if (tool === "get_wallet_balance") {
    try {
      const config = getConfigFromEnv();
      const client = await buildAcpClient(config);
      const balances = await client.getTokenBalances();
      out(balances ?? {});
    } catch (e) {
      cliErr(e instanceof Error ? e.message : String(e));
    }
    return;
  }

  cliErr(
    "Unknown tool. Use: browse_agents <query> | execute_acp_job <agentWalletAddress> <jobOfferingId> <serviceRequirementsJson> | get_wallet_balance"
  );
}

const cliTools = ["browse_agents", "execute_acp_job", "get_wallet_balance"];
const toolArg = process.argv[2] ?? "";
if (cliTools.includes(toolArg)) {
  runCli().catch((e) => {
    out({ error: e instanceof Error ? e.message : String(e) });
    process.exit(1);
  });
} else {
  cliErr(
    "Usage: browse_agents <query> | execute_acp_job <agentWalletAddress> <jobOfferingId> <serviceRequirementsJson> | get_wallet_balance"
  );
}
