import type { WormholeScanTransaction } from 'hooks/useTransactionHistoryWHScan';

export const isPortalBridgeAttestationTx = (
  tx: WormholeScanTransaction,
): boolean => {
  /**
   * Attestation txs on PORTAL_TOKEN_BRIDGE can be identified by having a payloadType=2
   */
  return (
    'payloadType' in tx.content.payload && tx.content.payload.payloadType === 2
  );
};
