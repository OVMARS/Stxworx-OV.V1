import { openContractCall } from '@stacks/connect';
import { STACKS_TESTNET } from '@stacks/network';
import {
    uintCV,
    standardPrincipalCV,
    contractPrincipalCV,
    PostConditionMode,
    StandardPrincipalCV,
    UIntCV,
    ContractPrincipalCV
} from '@stacks/transactions';
import { APP_CONFIG, CONTRACT_ADDRESS, CONTRACT_NAME, SBTC_CONTRACT_ADDRESS, SBTC_CONTRACT_NAME } from './constants';

interface ProjectData {
    freelancerAddress: string;
    totalBudget: number; // In Tokens (e.g. 100 STX)
    tokenType: 'STX' | 'sBTC';
    milestones: { amount: number }[]; // Array of exactly 4 milestone objects with 'amount' in Tokens
}

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

/* ── Request Full Refund (Client) ── */
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
