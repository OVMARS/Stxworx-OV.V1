/**
 * Smart contract interaction layer — uses @stacks/connect v8 `request` API.
 *
 * Every function returns Promise<{ txId: string }> on success.
 * If the user cancels the wallet popup, the Promise rejects with an error
 * whose `.message` includes 'cancel' or whose `.code` === 4001.
 * Use `isUserCancellation(err)` to distinguish cancellation from real errors.
 */
import { request } from '@stacks/connect';
import {
    uintCV,
    standardPrincipalCV,
    contractPrincipalCV,
    boolCV,
    Cl,
    fetchCallReadOnlyFunction,
    cvToValue,
    ClarityValue,
} from '@stacks/transactions';
import { STACKS_TESTNET } from '@stacks/network';
import { CONTRACT_ADDRESS, CONTRACT_NAME, SBTC_CONTRACT_ADDRESS, SBTC_CONTRACT_NAME, IS_TESTNET } from './constants';

/* ═══════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════ */

const NETWORK: 'testnet' | 'mainnet' = IS_TESTNET ? 'testnet' : 'mainnet';
const CONTRACT_ID = `${CONTRACT_ADDRESS}.${CONTRACT_NAME}` as const;

/** Check if an error was caused by the user cancelling the wallet popup */
export function isUserCancellation(err: unknown): boolean {
    if (!err) return false;
    const e = err as any;
    if (e?.code === 4001) return true;
    const msg = (e?.message || String(e)).toLowerCase();
    return msg.includes('cancel') || msg.includes('denied') || msg.includes('rejected') || msg.includes('user refused');
}

/** Serialize ClarityValue[] to hex strings for the `request` API */
function serializeArgs(args: ClarityValue[]): string[] {
    return args.map((a) => Cl.serialize(a));
}

/** Core helper: call a read/write contract function via wallet */
async function callContract(
    functionName: string,
    functionArgs: ClarityValue[],
    postConditionMode: 'allow' | 'deny' = 'allow',
): Promise<{ txId: string }> {
    const result = await request('stx_callContract', {
        contract: CONTRACT_ID,
        functionName,
        functionArgs: serializeArgs(functionArgs),
        postConditionMode,
        network: NETWORK,
    });
    return { txId: result.txid || '' };
}

/* ═══════════════════════════════════════════════════════
   READ-ONLY HELPERS
   ═══════════════════════════════════════════════════════ */

interface ProjectData {
    freelancerAddress: string;
    totalBudget: number;
    tokenType: 'STX' | 'sBTC';
    milestones: { amount: number }[];
}

/** Read-only: get current on-chain project count */
export const getOnChainProjectCount = async (): Promise<number> => {
    try {
        const result = await fetchCallReadOnlyFunction({
            contractAddress: CONTRACT_ADDRESS,
            contractName: CONTRACT_NAME,
            functionName: 'get-project-count',
            functionArgs: [],
            senderAddress: CONTRACT_ADDRESS,
            network: STACKS_TESTNET,
        });
        return Number(cvToValue(result));
    } catch (err) {
        console.error('Failed to read project count:', err);
        return 0;
    }
};

/* ═══════════════════════════════════════════════════════
   PROJECT LIFECYCLE
   ═══════════════════════════════════════════════════════ */

/** Create a new escrow project on-chain (client calls this) */
export const createProjectContractCall = async (data: ProjectData): Promise<{ txId: string }> => {
    const decimals = data.tokenType === 'STX' ? 1_000_000 : 100_000_000;
    const toMicro = (amount: number) => Math.floor(amount * decimals);

    const m1 = data.milestones[0] ? toMicro(data.milestones[0].amount) : 0;
    const m2 = data.milestones[1] ? toMicro(data.milestones[1].amount) : 0;
    const m3 = data.milestones[2] ? toMicro(data.milestones[2].amount) : 0;
    const m4 = data.milestones[3] ? toMicro(data.milestones[3].amount) : 0;

    const functionName = data.tokenType === 'STX'
        ? 'create-project-stx'
        : 'create-project-sbtc';

    const functionArgs: ClarityValue[] = [
        standardPrincipalCV(data.freelancerAddress),
        uintCV(m1),
        uintCV(m2),
        uintCV(m3),
        uintCV(m4),
    ];

    if (data.tokenType === 'sBTC') {
        functionArgs.push(contractPrincipalCV(SBTC_CONTRACT_ADDRESS, SBTC_CONTRACT_NAME));
    }

    return callContract(functionName, functionArgs);
};

/** Complete Milestone (Freelancer marks work done) */
export const completeMilestoneContractCall = async (
    projectId: number,
    milestoneNum: number,
): Promise<{ txId: string }> => {
    return callContract('complete-milestone', [uintCV(projectId), uintCV(milestoneNum)]);
};

/** Release Milestone (Client approves & pays freelancer) */
export const releaseMilestoneContractCall = async (
    projectId: number,
    milestoneNum: number,
    tokenType: 'STX' | 'sBTC',
): Promise<{ txId: string }> => {
    const functionName = tokenType === 'STX' ? 'release-milestone-stx' : 'release-milestone-sbtc';
    const functionArgs: ClarityValue[] = [uintCV(projectId), uintCV(milestoneNum)];
    if (tokenType === 'sBTC') {
        functionArgs.push(contractPrincipalCV(SBTC_CONTRACT_ADDRESS, SBTC_CONTRACT_NAME));
    }
    return callContract(functionName, functionArgs);
};

/** File Dispute (Client or Freelancer) */
export const fileDisputeContractCall = async (
    projectId: number,
    milestoneNum: number,
): Promise<{ txId: string }> => {
    return callContract('file-dispute', [uintCV(projectId), uintCV(milestoneNum)]);
};

/** Request Full Refund (Client — no milestone activity) */
export const requestRefundContractCall = async (
    projectId: number,
    tokenType: 'STX' | 'sBTC',
): Promise<{ txId: string }> => {
    const functionName = tokenType === 'STX' ? 'request-full-refund-stx' : 'request-full-refund-sbtc';
    const functionArgs: ClarityValue[] = [uintCV(projectId)];
    if (tokenType === 'sBTC') {
        functionArgs.push(contractPrincipalCV(SBTC_CONTRACT_ADDRESS, SBTC_CONTRACT_NAME));
    }
    return callContract(functionName, functionArgs);
};

/** Emergency Refund (Client — partial refund after ~24h timeout) */
export const emergencyRefundContractCall = async (
    projectId: number,
    tokenType: 'STX' | 'sBTC',
): Promise<{ txId: string }> => {
    const functionName = tokenType === 'STX' ? 'emergency-refund-stx' : 'emergency-refund-sbtc';
    const functionArgs: ClarityValue[] = [uintCV(projectId)];
    if (tokenType === 'sBTC') {
        functionArgs.push(contractPrincipalCV(SBTC_CONTRACT_ADDRESS, SBTC_CONTRACT_NAME));
    }
    return callContract(functionName, functionArgs);
};

/* ═══════════════════════════════════════════════════════
   ADMIN CONTRACT CALLS
   ═══════════════════════════════════════════════════════ */

/** Admin Resolve Dispute — releases disputed milestone funds to either party */
export const adminResolveDisputeContractCall = async (
    projectId: number,
    milestoneNum: number,
    releaseToFreelancer: boolean,
    tokenType: 'STX' | 'sBTC',
): Promise<{ txId: string }> => {
    const functionName = tokenType === 'STX'
        ? 'admin-resolve-dispute-stx'
        : 'admin-resolve-dispute-sbtc';

    const functionArgs: ClarityValue[] = [
        uintCV(projectId),
        uintCV(milestoneNum),
        boolCV(releaseToFreelancer),
    ];
    if (tokenType === 'sBTC') {
        functionArgs.push(contractPrincipalCV(SBTC_CONTRACT_ADDRESS, SBTC_CONTRACT_NAME));
    }
    return callContract(functionName, functionArgs);
};

/** Admin Force Refund — refunds ALL remaining unreleased milestone funds to client */
export const adminForceRefundContractCall = async (
    projectId: number,
    tokenType: 'STX' | 'sBTC',
): Promise<{ txId: string }> => {
    const functionName = tokenType === 'STX'
        ? 'admin-force-refund-stx'
        : 'admin-force-refund-sbtc';

    const functionArgs: ClarityValue[] = [uintCV(projectId)];
    if (tokenType === 'sBTC') {
        functionArgs.push(contractPrincipalCV(SBTC_CONTRACT_ADDRESS, SBTC_CONTRACT_NAME));
    }
    return callContract(functionName, functionArgs);
};

/* ═══════════════════════════════════════════════════════
   CONTRACT OWNERSHIP
   ═══════════════════════════════════════════════════════ */

/** Read-only: get the current contract owner principal */
export const getContractOwner = async (): Promise<string | null> => {
    try {
        const result = await fetchCallReadOnlyFunction({
            contractAddress: CONTRACT_ADDRESS,
            contractName: CONTRACT_NAME,
            functionName: 'get-contract-owner',
            functionArgs: [],
            senderAddress: CONTRACT_ADDRESS,
            network: STACKS_TESTNET,
        });
        const value = cvToValue(result);
        return typeof value === 'string' ? value : value?.value ?? null;
    } catch (e) {
        console.error('Failed to read contract owner:', e);
        return null;
    }
};

/** Read-only: get the currently proposed new owner (or null) */
export const getProposedOwner = async (): Promise<string | null> => {
    try {
        const result = await fetchCallReadOnlyFunction({
            contractAddress: CONTRACT_ADDRESS,
            contractName: CONTRACT_NAME,
            functionName: 'get-proposed-owner',
            functionArgs: [],
            senderAddress: CONTRACT_ADDRESS,
            network: STACKS_TESTNET,
        });
        const value = cvToValue(result);
        if (!value || value === 'none') return null;
        return typeof value === 'string' ? value : value?.value ?? null;
    } catch (e) {
        console.error('Failed to read proposed owner:', e);
        return null;
    }
};

/** Propose ownership transfer — only callable by current contract-owner */
export const proposeOwnershipContractCall = async (
    newOwner: string,
): Promise<{ txId: string }> => {
    return callContract('propose-ownership', [standardPrincipalCV(newOwner)], 'deny');
};

/** Accept ownership — only callable by the proposed-owner principal */
export const acceptOwnershipContractCall = async (): Promise<{ txId: string }> => {
    return callContract('accept-ownership', [], 'deny');
};
