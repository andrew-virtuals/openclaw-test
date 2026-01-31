/**
 * ACP Skill — Moltbot/OpenClaw plugin
 *
 */
import acp, {
  AcpAgentSort,
  AcpContractClientV2,
  AcpGraduationStatus,
  AcpJobPhases,
  AcpOnlineStatus,
  baseSepoliaAcpConfigV2,
  FareAmount,
} from "@virtuals-protocol/acp-node";

type AcpModule = typeof import("@virtuals-protocol/acp-node");
const acpExports = acp as unknown as AcpModule;
const AcpClient = acpExports.default;

function textResult(data: unknown): {
  content: { type: string; text: string }[];
} {
  return { content: [{ type: "text", text: JSON.stringify(data) }] };
}

async function getAcpClient(api) {
  const config = api.pluginConfig ?? {};
  return new AcpClient({
    acpContractClient: await AcpContractClientV2.build(
      config.WALLET_PRIVATE_KEY,
      config.SESSION_ENTITY_KEY_ID,
      config.AGENT_WALLET_ADDRESS,
      baseSepoliaAcpConfigV2
    ),
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

  return relevantAgents;
}

export default function register(api) {
  api.registerTool({
    name: "browse_agents",
    description: "Browse agents",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string" },
      },
      required: ["query"],
    },
    execute: async (params) => {
      try {
        const acpClient = await getAcpClient(api);
        const relevantAgents = await browseAgents(acpClient, params.query);
        return textResult(relevantAgents);
      } catch (error) {
        return textResult({ error: error.message });
      }
    },
  });

  api.registerTool({
    name: "create_job",
    description: "Create a job",
    parameters: {
      type: "object",
      properties: {
        agentWalletAddress: { type: "string" },
        jobOfferingId: { type: "string" },
        serviceRequirements: { type: "object" },
      },
      required: ["agentWalletAddress", "jobOfferingId", "serviceRequirements"],
    },
    execute: async (params) => {
      try {
        const acpClient = await getAcpClient(api);
        const jobId = await acpClient.initiateJob(
          params.agentWalletAddress,
          params.serviceRequirements,
          new FareAmount(0, baseSepoliaAcpConfigV2.baseFare)
        );

        let deliverable;

        while (true) {
          const job = await acpClient.getJobById(jobId);
          const latestMemo = job?.latestMemo;

          if (
            job?.phase === AcpJobPhases.NEGOTIATION &&
            latestMemo?.nextPhase === AcpJobPhases.TRANSACTION
          ) {
            await job.payAndAcceptRequirement();
          }

          if (job?.phase === AcpJobPhases.COMPLETED) {
            deliverable = job?.deliverable;
            break;
          }

          await new Promise((resolve) => setTimeout(resolve, 10000));
        }

        return textResult(deliverable);
      } catch (error) {
        return textResult({ error: error.message });
      }
    },
  });
}
