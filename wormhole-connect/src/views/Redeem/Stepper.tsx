import * as React from 'react';
import { useSelector } from 'react-redux';

import { RootState } from 'store';
import { UnsignedMessage } from 'routes';

import Stepper from 'components/Stepper/Stepper';
import SendFrom from './SendFrom';
import SendTo from './SendTo';
import BridgeComplete from './BridgeComplete';
import { isPorticoTransferDestInfo } from 'routes/porticoBridge/utils';

export default function MilestoneStepper() {
  const signedMessage: UnsignedMessage | undefined = useSelector(
    (state: RootState) => state.redeem.signedMessage,
  );
  const transferComplete = useSelector(
    (state: RootState) => state.redeem.transferComplete,
  );
  const transferDestInfo = useSelector(
    (state: RootState) => state.redeem.transferDestInfo,
  );
  let showWarning = false;
  if (isPorticoTransferDestInfo(transferDestInfo)) {
    showWarning = !!transferDestInfo.destTxInfo.swapFailed;
  }
  const activeStep = transferComplete ? 4 : signedMessage ? 2 : 1;

  const steps = [
    {
      label: 'Send from',
      component: <SendFrom />,
    },
    {
      label: 'Send to',
      component: <SendTo />,
      warningLine: showWarning,
    },
    {
      label: 'Transaction complete',
      component: <BridgeComplete />,
      warningLabel: showWarning,
    },
  ];

  return <Stepper steps={steps} activeStep={activeStep} />;
}
