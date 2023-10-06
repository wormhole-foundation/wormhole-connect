import { BigNumber } from 'ethers';

export * from './chains';
export * from './tokens';
export * from './attestation';

export const CCTP_LOG_TokenMessenger_DepositForBurn =
  '0x2fa9ca894982930190727e75500a97d8dc500233a5065e0f3126c48fbe0343c0';
export const CCTP_LOG_MessageSent =
  '0x8c5261668696ce22758910d05bab8f186d6eb247ceac2af2e82c7dc17669b036';

export function getNonce(message: string): number {
  return BigNumber.from('0x' + message.substring(26, 42)).toNumber();
}
