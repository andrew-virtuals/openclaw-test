/**
 * ESM/CJS interop for @virtuals-protocol/acp-node.
 * Re-exports AcpClient (from .default) and named exports so index.ts can use
 * "import AcpClient, { ... }" without runtime "not a constructor" errors.
 */
import acp from "@virtuals-protocol/acp-node";

type AcpModule = typeof import("@virtuals-protocol/acp-node");
const acpExports = acp as unknown as AcpModule;

export default acpExports.default;
export const AcpAgentSort = acpExports.AcpAgentSort;
export const AcpContractClientV2 = acpExports.AcpContractClientV2;
export const AcpGraduationStatus = acpExports.AcpGraduationStatus;
export const AcpJobPhases = acpExports.AcpJobPhases;
export const AcpOnlineStatus = acpExports.AcpOnlineStatus;
export const baseSepoliaAcpConfigV2 = acpExports.baseSepoliaAcpConfigV2;
export const FareAmount = acpExports.FareAmount;
