import { openContractCall } from '@stacks/connect';
import { STACKS_TESTNET } from '@stacks/network';
import {
    uintCV,
    standardPrincipalCV,
    contractPrincipalCV,
    boolCV,
    PostConditionMode,
    StandardPrincipalCV,
    UIntCV,
    ContractPrincipalCV,
    BooleanCV,
    fetchCallReadOnlyFunction,
    cvToValue,
} from '@stacks/transactions';
import { APP_CONFIG, CONTRACT_ADDRESS, CONTRACT_NAME, SBTC_CONTRACT_ADDRESS, SBTC_CONTRACT_NAME } from './constants';

interface ProjectData {
    freelancerAddress: string;
    totalBudget: number; // In Tokens (e.g. 100 STX)
    tokenType: 'STX' | 'sBTC';
    milestones: { amount: number }[]; // Array of exactly 4 milestone objects with 'amount' in Tokens
}

/* ── Read-only: get current on-chain project count ── */
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

export const createProjectContractCall = async (
    data: ProjectData,
    onFinish: (data: any) => void,
    onCancel: () => void
) => {

    // 1. Calculate Micro-Units
    // STX = 6 decimals (1,000,000)
    // sBTC = 8 decimals (100,000,000)
    const decimals = data.tokenType === 'STX' ? 1000000 : 100000000;

    // Helper to safely convert and round
    const toMicro = (amount: number) => Math.floor(amount * decimals);

    // M1, M2, M3, M4 amounts
    // We assume data.milestones has 4 items. If less, we pad with 0.
    const m1 = data.milestones[0] ? toMicro(data.milestones[0].amount) : 0;
    const m2 = data.milestones[1] ? toMicro(data.milestones[1].amount) : 0;
    const m3 = data.milestones[2] ? toMicro(data.milestones[2].amount) : 0;
    const m4 = data.milestones[3] ? toMicro(data.milestones[3].amount) : 0;

    const functionName = data.tokenType === 'STX'
        ? 'create-project-stx'
        : 'create-project-sbtc';

    const functionArgs: (StandardPrincipalCV | UIntCV | ContractPrincipalCV)[] = [
        standardPrincipalCV(data.freelancerAddress),
        uintCV(m1),
        uintCV(m2),
        uintCV(m3),
        uintCV(m4),
    ];

    // If sBTC, we need to pass the trait reference
    if (data.tokenType === 'sBTC') {
        functionArgs.push(contractPrincipalCV(SBTC_CONTRACT_ADDRESS, SBTC_CONTRACT_NAME));
    }

    await openContractCall({
        network: STACKS_TESTNET,
        contractAddress: CONTRACT_ADDRESS,
        contractName: CONTRACT_NAME,
        functionName,
        functionArgs,
        postConditionMode: PostConditionMode.Allow,
        onFinish,
        onCancel,
        appDetails: {
            name: APP_CONFIG.name,
            icon: window.location.origin + APP_CONFIG.icon,
        },
    });
};

/* ── Complete Milestone (Freelancer) ── */
export const completeMilestoneContractCall = async (
    projectId: number,
    milestoneNum: number,
    onFinish: (data: any) => void,
    onCancel: () => void
) => {
    await openContractCall({
        network: STACKS_TESTNET,
        contractAddress: CONTRACT_ADDRESS,
        contractName: CONTRACT_NAME,
        functionName: 'complete-milestone',
        functionArgs: [uintCV(projectId), uintCV(milestoneNum)],
        postConditionMode: PostConditionMode.Allow,
        onFinish,
        onCancel,
        appDetails: { name: APP_CONFIG.name, icon: window.location.origin + APP_CONFIG.icon },
    });
};

/* ── Release Milestone (Client pays freelancer) ── */
export const releaseMilestoneContractCall = async (
    projectId: number,
    milestoneNum: number,
    tokenType: 'STX' | 'sBTC',
    onFinish: (data: any) => void,
    onCancel: () => void
) => {
    const functionName = tokenType === 'STX' ? 'release-milestone-stx' : 'release-milestone-sbtc';
    const functionArgs: (UIntCV | ContractPrincipalCV)[] = [
        uintCV(projectId),
        uintCV(milestoneNum),
    ];
    if (tokenType === 'sBTC') {
        functionArgs.push(contractPrincipalCV(SBTC_CONTRACT_ADDRESS, SBTC_CONTRACT_NAME));
    }
    await openContractCall({
        network: STACKS_TESTNET,
        contractAddress: CONTRACT_ADDRESS,
        contractName: CONTRACT_NAME,
        functionName,
        functionArgs,
        postConditionMode: PostConditionMode.Allow,
        onFinish,
        onCancel,
        appDetails: { name: APP_CONFIG.name, icon: window.location.origin + APP_CONFIG.icon },
    });
};

/* ── File Dispute (Client or Freelancer) ── */
export const fileDisputeContractCall = async (
    projectId: number,
    milestoneNum: number,
    onFinish: (data: any) => void,
    onCancel: () => void
) => {
    await openContractCall({
        network: STACKS_TESTNET,
        contractAddress: CONTRACT_ADDRESS,
        contractName: CONTRACT_NAME,
        functionName: 'file-dispute',
        functionArgs: [uintCV(projectId), uintCV(milestoneNum)],
        postConditionMode: PostConditionMode.Allow,
        onFinish,
        onCancel,
        appDetails: { name: APP_CONFIG.name, icon: window.location.origin + APP_CONFIG.icon },
    });
};

/* ── Request Full Refund (Client — no milestone activity) ── */
export const requestRefundContractCall = async (
    projectId: number,
    tokenType: 'STX' | 'sBTC',
    onFinish: (data: any) => void,
    onCancel: () => void
) => {
    const functionName = tokenType === 'STX' ? 'request-full-refund-stx' : 'request-full-refund-sbtc';
    const functionArgs: (UIntCV | ContractPrincipalCV)[] = [uintCV(projectId)];
    if (tokenType === 'sBTC') {
        functionArgs.push(contractPrincipalCV(SBTC_CONTRACT_ADDRESS, SBTC_CONTRACT_NAME));
    }
    await openContractCall({
        network: STACKS_TESTNET,
        contractAddress: CONTRACT_ADDRESS,
        contractName: CONTRACT_NAME,
        functionName,
        functionArgs,
        postConditionMode: PostConditionMode.Allow,
        onFinish,
        onCancel,
        appDetails: { name: APP_CONFIG.name, icon: window.location.origin + APP_CONFIG.icon },
    });
};

/* ── Emergency Refund (Client — partial refund after ~24h timeout) ── */
export const emergencyRefundContractCall = async (
    projectId: number,
    tokenType: 'STX' | 'sBTC',
    onFinish: (data: any) => void,
    onCancel: () => void
) => {
    const functionName = tokenType === 'STX' ? 'emergency-refund-stx' : 'emergency-refund-sbtc';
    const functionArgs: (UIntCV | ContractPrincipalCV)[] = [uintCV(projectId)];
    if (tokenType === 'sBTC') {
        functionArgs.push(contractPrincipalCV(SBTC_CONTRACT_ADDRESS, SBTC_CONTRACT_NAME));
    }
    await openContractCall({
        network: STACKS_TESTNET,
        contractAddress: CONTRACT_ADDRESS,
        contractName: CONTRACT_NAME,
        functionName,
        functionArgs,
        postConditionMode: PostConditionMode.Allow,
        onFinish,
        onCancel,
        appDetails: { name: APP_CONFIG.name, icon: window.location.origin + APP_CONFIG.icon },
    });
};

/* ══════════════════════════════════════════════════════════════
   ADMIN CONTRACT CALLS — require admin wallet to be connected
   ══════════════════════════════════════════════════════════════ */

/**
 * Admin Resolve Dispute — releases disputed milestone funds
 * to either the freelancer or client based on admin decision.
 * Contract: admin-resolve-dispute-stx / admin-resolve-dispute-sbtc
 * Params: (project-id uint, milestone-num uint, release-to-freelancer bool [, sbtc-token trait])
 */
export const adminResolveDisputeContractCall = async (
    projectId: number,
    milestoneNum: number,
    releaseToFreelancer: boolean,
    tokenType: 'STX' | 'sBTC',
    onFinish: (data: any) => void,
    onCancel: () => void
) => {
    const functionName = tokenType === 'STX'
        ? 'admin-resolve-dispute-stx'
        : 'admin-resolve-dispute-sbtc';

    const functionArgs: (UIntCV | BooleanCV | ContractPrincipalCV)[] = [
        uintCV(projectId),
        uintCV(milestoneNum),
        boolCV(releaseToFreelancer),
    ];

    if (tokenType === 'sBTC') {
        functionArgs.push(contractPrincipalCV(SBTC_CONTRACT_ADDRESS, SBTC_CONTRACT_NAME));
    }

    await openContractCall({
        network: STACKS_TESTNET,
        contractAddress: CONTRACT_ADDRESS,
        contractName: CONTRACT_NAME,
        functionName,
        functionArgs,
        postConditionMode: PostConditionMode.Allow,
        onFinish,
        onCancel,
        appDetails: { name: APP_CONFIG.name, icon: window.location.origin + APP_CONFIG.icon },
    });
};

/**
 * Admin Force Refund — refunds ALL remaining unreleased milestone funds
 * back to the client. Used for abandoned projects.
 * Contract: admin-force-refund-stx / admin-force-refund-sbtc
 * Params: (project-id uint [, sbtc-token trait])
 */
export const adminForceRefundContractCall = async (
    projectId: number,
    tokenType: 'STX' | 'sBTC',
    onFinish: (data: any) => void,
    onCancel: () => void
) => {
    const functionName = tokenType === 'STX'
        ? 'admin-force-refund-stx'
        : 'admin-force-refund-sbtc';

    const functionArgs: (UIntCV | ContractPrincipalCV)[] = [uintCV(projectId)];
    if (tokenType === 'sBTC') {
        functionArgs.push(contractPrincipalCV(SBTC_CONTRACT_ADDRESS, SBTC_CONTRACT_NAME));
    }

    await openContractCall({
        network: STACKS_TESTNET,
        contractAddress: CONTRACT_ADDRESS,
        contractName: CONTRACT_NAME,
        functionName,
        functionArgs,
        postConditionMode: PostConditionMode.Allow,
        onFinish,
        onCancel,
        appDetails: { name: APP_CONFIG.name, icon: window.location.origin + APP_CONFIG.icon },
    });
};

/* ══════════════════════════════════════════════════════════════
   CONTRACT OWNERSHIP — Propose / Accept transfer + read-only
   ══════════════════════════════════════════════════════════════ */

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

/** Read-only: get the currently proposed new owner (or null if none) */
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

/**
 * Propose ownership transfer — only callable by current contract-owner
 * Contract: propose-ownership(new-owner principal)
 */
export const proposeOwnershipContractCall = async (
    newOwner: string,
    onFinish: (data: any) => void,
    onCancel: () => void
) => {
    await openContractCall({
        network: STACKS_TESTNET,
        contractAddress: CONTRACT_ADDRESS,
        contractName: CONTRACT_NAME,
        functionName: 'propose-ownership',
        functionArgs: [standardPrincipalCV(newOwner)],
        postConditionMode: PostConditionMode.Deny,
        onFinish,
        onCancel,
        appDetails: { name: APP_CONFIG.name, icon: window.location.origin + APP_CONFIG.icon },
    });
};

/**
 * Accept ownership — only callable by the proposed-owner principal
 * Contract: accept-ownership()
 */
export const acceptOwnershipContractCall = async (
    onFinish: (data: any) => void,
    onCancel: () => void
) => {
    await openContractCall({
        network: STACKS_TESTNET,
        contractAddress: CONTRACT_ADDRESS,
        contractName: CONTRACT_NAME,
        functionName: 'accept-ownership',
        functionArgs: [],
        postConditionMode: PostConditionMode.Deny,
        onFinish,
        onCancel,
        appDetails: { name: APP_CONFIG.name, icon: window.location.origin + APP_CONFIG.icon },
    });
};
