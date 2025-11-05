import { describe, it, expect } from 'vitest';
import {
  interpretTransferError,
  INSUFFICIENT_ALLOWANCE_REGEX,
  INSUFFICIENT_LAMPORTS_REGEX,
  SIMULATION_ACCOUNT_NOT_FOUND_REGEX,
  USER_REJECTED_REGEX,
  AMOUNT_IN_TOO_SMALL,
  INSUFFICIENT_FUNDS_FOR_GAS_REGEX,
  INSUFFICIENT_FUNDS_REGEX,
} from './errors';
import type { TransferDetails } from 'telemetry/types';
import {
  ERR_INSUFFICIENT_ALLOWANCE,
  ERR_INSUFFICIENT_GAS,
  ERR_USER_REJECTED,
  ERR_AMOUNT_TOO_SMALL,
  ERR_TIMEOUT,
  ERR_UNKNOWN,
} from 'telemetry/types';
import { amount as sdkAmount } from '@wormhole-foundation/sdk';

describe('Error regex patterns', () => {
  const regexTestCases = [
    {
      name: 'INSUFFICIENT_FUNDS_FOR_GAS_REGEX',
      regex: INSUFFICIENT_FUNDS_FOR_GAS_REGEX,
      shouldMatch: [
        'insufficient funds for gas',
        'Insufficient funds for gas',
        'insufficient gas',
        'Error: insufficient funds for gas fees',
        'INSUFFICIENT GAS',
      ],
      shouldNotMatch: ['insufficient funds', 'not enough balance'],
    },
    {
      name: 'INSUFFICIENT_FUNDS_REGEX',
      regex: INSUFFICIENT_FUNDS_REGEX,
      shouldMatch: [
        'insufficient funds',
        'Insufficient funds',
        'Error: insufficient funds for transfer',
        'insufficient funds for gas', // Matches but gas check comes first
      ],
      shouldNotMatch: ['not enough balance', 'low balance'],
    },
    {
      name: 'INSUFFICIENT_ALLOWANCE_REGEX',
      regex: INSUFFICIENT_ALLOWANCE_REGEX,
      shouldMatch: [
        'insufficient token allowance',
        'Insufficient Token Allowance',
        'Error: insufficient token allowance',
      ],
      shouldNotMatch: ['insufficient funds', 'not approved'],
    },
    {
      name: 'INSUFFICIENT_LAMPORTS_REGEX',
      regex: INSUFFICIENT_LAMPORTS_REGEX,
      shouldMatch: [
        'insufficient lamports 1000 required 5000',
        'Insufficient lamports 100 required 200',
      ],
      shouldNotMatch: ['insufficient funds', 'low lamports'],
    },
    {
      name: 'SIMULATION_ACCOUNT_NOT_FOUND_REGEX',
      regex: SIMULATION_ACCOUNT_NOT_FOUND_REGEX,
      shouldMatch: [
        'simulation failed: AccountNotFound',
        'Simulation Failed: accountnotfound',
        'simulation failed: ACCOUNTNOTFOUND',
      ],
      shouldNotMatch: ['account not found', 'simulation error'],
    },
    {
      name: 'USER_REJECTED_REGEX',
      regex: USER_REJECTED_REGEX,
      shouldMatch: [
        'user rejected',
        'User Rejected',
        'rejected the request',
        'rejected from user',
        'user cancel',
        'aborted by user',
        'plugin closed',
        'denied request signature',
        'user denied',
        'action_rejected',
        'ethers-user-denied',
        'approval denied',
      ],
      shouldNotMatch: ['transaction failed', 'error occurred'],
    },
    {
      name: 'AMOUNT_IN_TOO_SMALL',
      regex: AMOUNT_IN_TOO_SMALL,
      shouldMatch: [
        'AmountInTooSmall',
        'Error: AmountInTooSmall - amount below minimum',
      ],
      shouldNotMatch: ['amount too small', 'minimum amount required'],
    },
  ];

  regexTestCases.forEach(({ name, regex, shouldMatch, shouldNotMatch }) => {
    describe(name, () => {
      shouldMatch.forEach((testCase) => {
        it(`should match: "${testCase}"`, () => {
          // Reset regex state for global regexes
          regex.lastIndex = 0;
          expect(regex.test(testCase)).toBe(true);
        });
      });

      shouldNotMatch.forEach((testCase) => {
        it(`should NOT match: "${testCase}"`, () => {
          // Reset regex state for global regexes
          regex.lastIndex = 0;
          expect(regex.test(testCase)).toBe(false);
        });
      });
    });
  });
});

describe('interpretTransferError', () => {
  const mockTransferDetails: TransferDetails = {
    fromChain: 'Ethereum',
    toChain: 'Solana',
    fromToken: {
      symbol: 'USDC',
      tokenId: { address: '0x123', chain: 'Ethereum' },
    },
    toToken: {
      symbol: 'USDC',
      tokenId: { address: '0x456', chain: 'Solana' },
    },
    route: 'Bridge',
    amount: sdkAmount.fromBaseUnits(1000000n, 6), // 1 USDC (6 decimals)
  };

  const errorTestCases = [
    {
      name: 'unknown error for generic errors',
      error: new Error('Something went wrong'),
      expectedMessage: 'Error with transfer, please try again',
      expectedType: ERR_UNKNOWN,
    },
    {
      name: 'insufficient funds for gas',
      error: new Error('insufficient funds for gas'),
      expectedMessage:
        'Insufficient funds for network fees. Please add more funds and try again',
      expectedType: ERR_INSUFFICIENT_GAS,
    },
    {
      name: 'generic insufficient funds',
      error: new Error('insufficient funds'),
      expectedMessage:
        'Insufficient funds for this transfer. Please add more funds and try again',
      expectedType: ERR_INSUFFICIENT_GAS,
    },
    {
      name: 'insufficient allowance',
      error: new Error('insufficient token allowance'),
      expectedMessage: 'Error with transfer, please try again',
      expectedType: ERR_INSUFFICIENT_ALLOWANCE,
    },
    {
      name: 'user rejection',
      error: new Error('user rejected'),
      expectedMessage: 'Wallet request declined. Transfer not started.',
      expectedType: ERR_USER_REJECTED,
    },
    {
      name: 'amount too small',
      error: new Error('AmountInTooSmall'),
      expectedMessage: 'Amount is too small for the selected route',
      expectedType: ERR_AMOUNT_TOO_SMALL,
    },
  ];

  errorTestCases.forEach(({ name, error, expectedMessage, expectedType }) => {
    it(`should detect ${name}`, () => {
      const [message, errorObj] = interpretTransferError(
        error,
        mockTransferDetails,
      );

      expect(message).toBe(expectedMessage);
      expect(errorObj.type).toBe(expectedType);
      expect(errorObj.original).toBe(error);
    });
  });

  it('should detect Solana timeout errors', () => {
    const error = new Error('Transaction failed');
    error.name = 'TransactionExpiredTimeoutError';
    const [message, errorObj] = interpretTransferError(
      error,
      mockTransferDetails,
    );

    expect(message).toBe('Transfer timed out, please try again');
    expect(errorObj.type).toBe(ERR_TIMEOUT);
  });

  it('should detect Solana blockheight timeout errors', () => {
    const error = new Error('Transaction failed');
    error.name = 'TransactionExpiredBlockheightExceededError';
    const [message, errorObj] = interpretTransferError(
      error,
      mockTransferDetails,
    );

    expect(message).toBe('Transfer timed out, please try again');
    expect(errorObj.type).toBe(ERR_TIMEOUT);
  });

  it('should detect Solana insufficient lamports errors', () => {
    const error = new Error('insufficient lamports 1000 required 5000');
    const [message, errorObj] = interpretTransferError(
      error,
      mockTransferDetails,
    );

    expect(message).toContain('Insufficient');
    expect(message).toContain('for fees');
    expect(errorObj.type).toBe(ERR_INSUFFICIENT_GAS);
  });

  it('should detect Solana simulation account not found errors', () => {
    const error = new Error('simulation failed: AccountNotFound');
    const [message, errorObj] = interpretTransferError(
      error,
      mockTransferDetails,
    );

    expect(message).toContain('Insufficient');
    expect(message).toContain('for fees');
    expect(errorObj.type).toBe(ERR_INSUFFICIENT_GAS);
  });

  it('should prioritize gas error over generic funds error', () => {
    const error = new Error('insufficient funds for gas');
    const [message] = interpretTransferError(error, mockTransferDetails);

    // Should match gas error, not generic funds error
    expect(message).toBe(
      'Insufficient funds for network fees. Please add more funds and try again',
    );
  });
});
