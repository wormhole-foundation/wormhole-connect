import * as React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from 'store';
import Stepper from 'components/Stepper/Stepper';
import SendFrom from './SendFrom';
import SendTo from './SendTo';
import BridgeComplete from './BridgeComplete';
import NTTInboundQueued from './NTTInboundQueued';
import RelayFailed from './RelayFailed';
import { RelayStatus } from 'store/redeem';

const SEND_FROM_STEP = 1;
const SEND_TO_STEP = 2;
const TRANSACTION_COMPLETE_STEP = 4;

export default function NTTStepper() {
  const signedMessage = useSelector(
    (state: RootState) => state.redeem.signedMessage,
  );
  const relayStatus = useSelector(
    (state: RootState) => state.redeem.relayStatus,
  );
  const transferComplete = useSelector(
    (state: RootState) => state.redeem.transferComplete,
  );
  const inboundQueuedTransfer = useSelector(
    (state: RootState) => state.ntt.inboundQueuedTransfer,
  );

  const relayFailed = relayStatus === RelayStatus.Failed;
  const isInboundQueued = !!inboundQueuedTransfer.data;
  const showWarning = isInboundQueued || relayFailed;

  const activeStep = transferComplete
    ? TRANSACTION_COMPLETE_STEP
    : signedMessage || relayFailed
    ? SEND_TO_STEP
    : SEND_FROM_STEP;

  const steps = [
    {
      label: 'Send from',
      component: <SendFrom />,
      warningLine: showWarning,
    },
    {
      label: 'Send to',
      component: relayFailed ? (
        <RelayFailed />
      ) : isInboundQueued ? (
        <NTTInboundQueued />
      ) : (
        <SendTo />
      ),
      warningLabel: showWarning,
    },
    {
      label: 'Transaction complete',
      component: <BridgeComplete />,
    },
  ];
  return <Stepper steps={steps} activeStep={activeStep} />;
}
