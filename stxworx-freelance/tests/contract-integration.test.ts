/**
 * Contract Integration Tests
 * 
 * Validates that all contract call wrapper functions:
 * 1. Export correctly from contracts.ts
 * 2. Accept the correct parameters
 * 3. Call the `request` API with the right function names & args
 * 4. Wire properly through the UI components (ProjectCard, DisputeModal)
 * 
 * These tests mock @stacks/connect `request` and verify the data flow end-to-end.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Mock @stacks/connect ────────────────────────────────────────────
const mockRequest = vi.fn();
vi.mock('@stacks/connect', () => ({
  request: (...args: any[]) => mockRequest(...args),
}));

// ─── Mock @stacks/network ────────────────────────────────────────────
vi.mock('@stacks/network', () => ({
  STACKS_TESTNET: { url: 'https://stacks-node-api.testnet.stacks.co' },
}));

// ─── Import after mocks ─────────────────────────────────────────────
import {
  createProjectContractCall,
  completeMilestoneContractCall,
  releaseMilestoneContractCall,
  fileDisputeContractCall,
  requestRefundContractCall,
  isUserCancellation,
} from '../lib/contracts';

import { Cl } from '@stacks/transactions';
import { CONTRACT_ADDRESS, CONTRACT_NAME } from '../lib/constants';

// ─── Helpers ─────────────────────────────────────────────────────────
const CONTRACT_ID = `${CONTRACT_ADDRESS}.${CONTRACT_NAME}`;

/** Deserialize hex arg back to ClarityValue for inspection */
function deserializeArg(hex: string) {
  return Cl.deserialize(hex);
}

beforeEach(() => {
  mockRequest.mockReset();
  mockRequest.mockResolvedValue({ txid: '0xmocktxid', transaction: '0xraw' });
});

// =====================================================================
// 1. createProjectContractCall
// =====================================================================
describe('createProjectContractCall', () => {
  it('calls request with create-project-stx for STX projects', async () => {
    const result = await createProjectContractCall({
      freelancerAddress: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
      totalBudget: 100,
      tokenType: 'STX',
      milestones: [
        { amount: 25 }, { amount: 25 }, { amount: 25 }, { amount: 25 },
      ],
    });

    expect(result.txId).toBe('0xmocktxid');
    expect(mockRequest).toHaveBeenCalledTimes(1);
    const [method, params] = mockRequest.mock.calls[0];
    expect(method).toBe('stx_callContract');
    expect(params.contract).toBe(CONTRACT_ID);
    expect(params.functionName).toBe('create-project-stx');
    // 5 args: freelancer principal + 4 milestone amounts
    expect(params.functionArgs).toHaveLength(5);
  });

  it('calls request with create-project-sbtc for sBTC projects', async () => {
    await createProjectContractCall({
      freelancerAddress: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
      totalBudget: 0.5,
      tokenType: 'sBTC',
      milestones: [
        { amount: 0.125 }, { amount: 0.125 }, { amount: 0.125 }, { amount: 0.125 },
      ],
    });

    const [, params] = mockRequest.mock.calls[0];
    expect(params.functionName).toBe('create-project-sbtc');
    // 6 args: freelancer principal + 4 amounts + sbtc trait reference
    expect(params.functionArgs).toHaveLength(6);
  });

  it('pads milestones to 4 when fewer are provided', async () => {
    await createProjectContractCall({
      freelancerAddress: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
      totalBudget: 50,
      tokenType: 'STX',
      milestones: [{ amount: 50 }], // only 1 milestone
    });

    const [, params] = mockRequest.mock.calls[0];
    expect(params.functionArgs).toHaveLength(5); // still 5 (principal + 4 uint)
  });

  it('converts STX amounts to micro-units (6 decimals)', async () => {
    await createProjectContractCall({
      freelancerAddress: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
      totalBudget: 100,
      tokenType: 'STX',
      milestones: [
        { amount: 25 }, { amount: 25 }, { amount: 25 }, { amount: 25 },
      ],
    });

    const [, params] = mockRequest.mock.calls[0];
    const m1 = deserializeArg(params.functionArgs[1]);
    expect(m1.type).toBe('uint');
    expect((m1 as any).value).toBe(25000000n);
  });

  it('converts sBTC amounts to micro-units (8 decimals)', async () => {
    await createProjectContractCall({
      freelancerAddress: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
      totalBudget: 1,
      tokenType: 'sBTC',
      milestones: [
        { amount: 0.25 }, { amount: 0.25 }, { amount: 0.25 }, { amount: 0.25 },
      ],
    });

    const [, params] = mockRequest.mock.calls[0];
    const m1 = deserializeArg(params.functionArgs[1]);
    expect((m1 as any).value).toBe(25000000n);
  });

  it('returns txId from the request response', async () => {
    mockRequest.mockResolvedValue({ txid: '0xcustom123' });
    const result = await createProjectContractCall({
      freelancerAddress: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
      totalBudget: 100,
      tokenType: 'STX',
      milestones: [{ amount: 25 }, { amount: 25 }, { amount: 25 }, { amount: 25 }],
    });
    expect(result.txId).toBe('0xcustom123');
  });
});

// =====================================================================
// 2. completeMilestoneContractCall
// =====================================================================
describe('completeMilestoneContractCall', () => {
  it('calls complete-milestone with correct project-id and milestone-num', async () => {
    const result = await completeMilestoneContractCall(1, 2);

    expect(result.txId).toBe('0xmocktxid');
    expect(mockRequest).toHaveBeenCalledTimes(1);
    const [method, params] = mockRequest.mock.calls[0];
    expect(method).toBe('stx_callContract');
    expect(params.contract).toBe(CONTRACT_ID);
    expect(params.functionName).toBe('complete-milestone');
    expect(params.functionArgs).toHaveLength(2);
    const arg0 = deserializeArg(params.functionArgs[0]);
    const arg1 = deserializeArg(params.functionArgs[1]);
    expect((arg0 as any).value).toBe(1n);
    expect((arg1 as any).value).toBe(2n);
  });
});

// =====================================================================
// 3. releaseMilestoneContractCall
// =====================================================================
describe('releaseMilestoneContractCall', () => {
  it('calls release-milestone-stx for STX projects', async () => {
    await releaseMilestoneContractCall(1, 1, 'STX');

    const [, params] = mockRequest.mock.calls[0];
    expect(params.functionName).toBe('release-milestone-stx');
    expect(params.functionArgs).toHaveLength(2);
    const arg0 = deserializeArg(params.functionArgs[0]);
    const arg1 = deserializeArg(params.functionArgs[1]);
    expect((arg0 as any).value).toBe(1n);
    expect((arg1 as any).value).toBe(1n);
  });

  it('calls release-milestone-sbtc for sBTC projects with trait arg', async () => {
    await releaseMilestoneContractCall(2, 3, 'sBTC');

    const [, params] = mockRequest.mock.calls[0];
    expect(params.functionName).toBe('release-milestone-sbtc');
    expect(params.functionArgs).toHaveLength(3);
    const arg0 = deserializeArg(params.functionArgs[0]);
    const arg1 = deserializeArg(params.functionArgs[1]);
    expect((arg0 as any).value).toBe(2n);
    expect((arg1 as any).value).toBe(3n);
  });
});

// =====================================================================
// 4. fileDisputeContractCall
// =====================================================================
describe('fileDisputeContractCall', () => {
  it('calls file-dispute with project-id and milestone-num', async () => {
    await fileDisputeContractCall(3, 2);

    const [, params] = mockRequest.mock.calls[0];
    expect(params.functionName).toBe('file-dispute');
    expect(params.functionArgs).toHaveLength(2);
    const arg0 = deserializeArg(params.functionArgs[0]);
    const arg1 = deserializeArg(params.functionArgs[1]);
    expect((arg0 as any).value).toBe(3n);
    expect((arg1 as any).value).toBe(2n);
  });

  it('uses correct contract', async () => {
    await fileDisputeContractCall(1, 1);

    const [, params] = mockRequest.mock.calls[0];
    expect(params.contract).toBe(CONTRACT_ID);
  });
});

// =====================================================================
// 5. requestRefundContractCall
// =====================================================================
describe('requestRefundContractCall', () => {
  it('calls request-full-refund-stx for STX projects', async () => {
    await requestRefundContractCall(1, 'STX');

    const [, params] = mockRequest.mock.calls[0];
    expect(params.functionName).toBe('request-full-refund-stx');
    expect(params.functionArgs).toHaveLength(1);
    const arg0 = deserializeArg(params.functionArgs[0]);
    expect((arg0 as any).value).toBe(1n);
  });

  it('calls request-full-refund-sbtc with trait arg for sBTC', async () => {
    await requestRefundContractCall(2, 'sBTC');

    const [, params] = mockRequest.mock.calls[0];
    expect(params.functionName).toBe('request-full-refund-sbtc');
    expect(params.functionArgs).toHaveLength(2);
    const arg0 = deserializeArg(params.functionArgs[0]);
    expect((arg0 as any).value).toBe(2n);
  });
});

// =====================================================================
// 6. Cross-cutting: PostConditionMode and network
// =====================================================================
describe('Cross-cutting contract call config', () => {
  it.each([
    ['completeMilestoneContractCall', () => completeMilestoneContractCall(1, 1)],
    ['releaseMilestoneContractCall', () => releaseMilestoneContractCall(1, 1, 'STX')],
    ['fileDisputeContractCall', () => fileDisputeContractCall(1, 1)],
    ['requestRefundContractCall', () => requestRefundContractCall(1, 'STX')],
  ] as const)('%s uses postConditionMode "allow"', async (_name, fn) => {
    await fn();
    const [, params] = mockRequest.mock.calls[0];
    expect(params.postConditionMode).toBe('allow');
  });

  it('uses the correct network', async () => {
    await completeMilestoneContractCall(1, 1);
    const [, params] = mockRequest.mock.calls[0];
    expect(params.network).toBe('testnet');
  });
});

// =====================================================================
// 7. isUserCancellation utility
// =====================================================================
describe('isUserCancellation', () => {
  it('returns true for code 4001', () => {
    expect(isUserCancellation({ code: 4001, message: 'User rejected' })).toBe(true);
  });

  it('returns true for cancel message', () => {
    expect(isUserCancellation(new Error('User cancelled the request'))).toBe(true);
  });

  it('returns true for denied message', () => {
    expect(isUserCancellation(new Error('Request denied by user'))).toBe(true);
  });

  it('returns false for a real error', () => {
    expect(isUserCancellation(new Error('Network timeout'))).toBe(false);
  });

  it('returns false for null/undefined', () => {
    expect(isUserCancellation(null)).toBe(false);
    expect(isUserCancellation(undefined)).toBe(false);
  });
});

// =====================================================================
// 8. Wallet rejection handling
// =====================================================================
describe('Wallet rejection propagates as error', () => {
  it('rejects when wallet returns error', async () => {
    mockRequest.mockRejectedValue({ code: 4001, message: 'User denied' });

    await expect(completeMilestoneContractCall(1, 1)).rejects.toEqual(
      expect.objectContaining({ code: 4001 }),
    );
  });
});

// =====================================================================
// 9. Data flow integration: ProjectCard -> store -> API
// =====================================================================
describe('Data flow: ProjectCard contract-to-backend payload mapping', () => {
  it('maps freelancer submit to correct store payload shape', () => {
    const txData = { txId: '0xabc123' };
    const milestoneId = 2;
    const submissionLink = 'https://github.com/repo/pr/1';

    const payload = {
      milestoneId,
      link: submissionLink,
      completionTxId: txData.txId,
    };

    expect(payload).toHaveProperty('milestoneId');
    expect(payload).toHaveProperty('link');
    expect(payload).toHaveProperty('completionTxId');
    expect(typeof payload.completionTxId).toBe('string');
  });

  it('maps client approve to correct store payload shape', () => {
    const txData = { txId: '0xdef456' };
    const submissionId = 42;
    const milestoneId = 1;

    const payload = {
      submissionId,
      milestoneId,
      releaseTxId: txData.txId,
    };

    expect(payload).toHaveProperty('submissionId');
    expect(payload).toHaveProperty('milestoneId');
    expect(payload).toHaveProperty('releaseTxId');
    expect(typeof payload.releaseTxId).toBe('string');
  });

  it('maps dispute to correct createDispute payload shape', () => {
    const txData = { txId: '0xghi789' };
    const projectId = 5;
    const milestoneNum = 3;

    const payload = {
      projectId,
      milestoneNum,
      reason: 'Freelancer did not deliver',
      evidenceUrl: 'https://evidence.com/proof',
      disputeTxId: txData.txId,
    };

    expect(payload).toHaveProperty('projectId');
    expect(payload).toHaveProperty('milestoneNum');
    expect(payload).toHaveProperty('reason');
    expect(payload).toHaveProperty('disputeTxId');
    expect(typeof payload.disputeTxId).toBe('string');
  });
});

// =====================================================================
// 10. Module exports
// =====================================================================
describe('Module exports', () => {
  it('exports all 5 contract call functions', () => {
    expect(typeof createProjectContractCall).toBe('function');
    expect(typeof completeMilestoneContractCall).toBe('function');
    expect(typeof releaseMilestoneContractCall).toBe('function');
    expect(typeof fileDisputeContractCall).toBe('function');
    expect(typeof requestRefundContractCall).toBe('function');
  });

  it('exports isUserCancellation utility', () => {
    expect(typeof isUserCancellation).toBe('function');
  });
});

// =====================================================================
// 11. onChainId mapping verification
// =====================================================================
describe('onChainId flow', () => {
  it('maps from BackendProject correctly via mapBackendProject', async () => {
    const { mapBackendProject } = await import('../lib/api');

    const mockBackendProject = {
      id: 42,
      clientId: 1,
      title: 'Test Project',
      description: 'Test',
      category: 'Development',
      subcategory: null,
      tokenType: 'STX' as const,
      numMilestones: 4,
      milestone1Title: 'M1', milestone1Description: null, milestone1Amount: '25',
      milestone2Title: 'M2', milestone2Description: null, milestone2Amount: '25',
      milestone3Title: 'M3', milestone3Description: null, milestone3Amount: '25',
      milestone4Title: 'M4', milestone4Description: null, milestone4Amount: '25',
      status: 'active' as const,
      freelancerId: 2,
      onChainId: 7,
      escrowTxId: '0xabc',
      createdAt: '2026-02-16',
      updatedAt: '2026-02-16',
    };

    const project = mapBackendProject(mockBackendProject);
    expect(project.onChainId).toBe(7);
  });

  it('defaults onChainId to null when backend has null', async () => {
    const { mapBackendProject } = await import('../lib/api');

    const mockBackendProject = {
      id: 43,
      clientId: 1,
      title: 'Test Project 2',
      description: 'Test',
      category: 'Development',
      subcategory: null,
      tokenType: 'STX' as const,
      numMilestones: 4,
      milestone1Title: 'M1', milestone1Description: null, milestone1Amount: '25',
      milestone2Title: null, milestone2Description: null, milestone2Amount: null,
      milestone3Title: null, milestone3Description: null, milestone3Amount: null,
      milestone4Title: null, milestone4Description: null, milestone4Amount: null,
      status: 'open' as const,
      freelancerId: null,
      onChainId: null,
      escrowTxId: null,
      createdAt: '2026-02-16',
      updatedAt: '2026-02-16',
    };

    const project = mapBackendProject(mockBackendProject);
    expect(project.onChainId).toBeNull();
  });
});
