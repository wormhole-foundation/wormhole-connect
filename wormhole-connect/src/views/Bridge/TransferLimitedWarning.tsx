import React from 'react';
import useIsTransferLimited from '../../hooks/useIsTransferLimited';
import AlertBanner from '../../components/AlertBanner';
import { wh } from '../../sdk';

const TransferLimitedWarning = () => {
  // const isTransferLimited = { isLimited: true, reason: "EXCEEDS_MAX_NOTIONAL", limits: {chainNotionalLimit: 5, chainId: 1, chainBigTransactionSize: 5, chainRemainingAvailableNotional: 5}};
  const isTransferLimited = useIsTransferLimited();
  if (
    isTransferLimited.isLimited &&
    isTransferLimited.reason &&
    isTransferLimited.limits
  ) {
    const chainName = wh.toChainName(isTransferLimited.limits.chainId);
    const message =
      isTransferLimited.reason === 'EXCEEDS_MAX_NOTIONAL'
        ? `This transfer's estimated notional value would exceed the notional value limit for transfers on ${chainName} (${isTransferLimited.limits.chainNotionalLimit}) and may be subject to a 24 hour delay.`
        : isTransferLimited.reason === 'EXCEEDS_LARGE_TRANSFER_LIMIT'
        ? `This transfer's estimated notional value may exceed the notional value for large transfers on ${chainName} (${isTransferLimited.limits.chainBigTransactionSize}) and may be subject to a 24 hour delay.`
        : isTransferLimited.reason === 'EXCEEDS_REMAINING_NOTIONAL'
        ? `This transfer's estimated notional value may exceed the remaining notional value available for transfers on ${chainName} (${isTransferLimited.limits.chainRemainingAvailableNotional}) and may be subject to a delay.`
        : '';
    return <AlertBanner show={!!message} content={message} warning />;
  }
  return null;
};

export default TransferLimitedWarning;
