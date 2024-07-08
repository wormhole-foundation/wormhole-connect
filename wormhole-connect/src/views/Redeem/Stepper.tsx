import * as React from 'react';
import { useSelector } from 'react-redux';

import { RootState } from 'store';

import Stepper from 'components/Stepper/Stepper';
import SendFrom from './SendFrom';
import SendTo from './SendTo';
import BridgeComplete from './BridgeComplete';
//import { isPorticoTransferDestInfo } from 'routes/porticoBridge/utils';

import { isAttested } from '@wormhole-foundation/sdk';
import { RouteContext } from 'contexts/RouteContext';

export default function MilestoneStepper() {
  const routeContext = React.useContext(RouteContext);
  const attested = routeContext.receipt
    ? isAttested(routeContext.receipt)
    : false;
  const transferComplete = useSelector(
    (state: RootState) => state.redeem.transferComplete,
  );
  //const transferDestInfo = useSelector(
  //  (state: RootState) => state.redeem.transferDestInfo,
  //);
  const showWarning = false;
  //if (isPorticoTransferDestInfo(transferDestInfo)) {
  //  showWarning = !!transferDestInfo.destTxInfo.swapFailed;
  //}
  const activeStep = transferComplete ? 4 : attested ? 2 : 1;

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
