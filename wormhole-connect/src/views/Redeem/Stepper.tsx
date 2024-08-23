import * as React from 'react';
import { useSelector } from 'react-redux';

import { RootState } from 'store';

import Stepper from 'components/Stepper/Stepper';
import SendFrom from './SendFrom';
import SendTo from './SendTo';
import BridgeComplete from './BridgeComplete';

import { isDestinationQueued, TransferState } from '@wormhole-foundation/sdk';
import { RouteContext } from 'contexts/RouteContext';
import DestinationQueued from './DestinationQueued';

export default function MilestoneStepper() {
  const routeContext = React.useContext(RouteContext);
  const attested =
    routeContext.receipt &&
    routeContext.receipt.state >= TransferState.Attested;
  const destinationQueued =
    routeContext.receipt && isDestinationQueued(routeContext.receipt);
  const transferComplete = useSelector(
    (state: RootState) => state.redeem.transferComplete,
  );
  const showWarning = false;
  const activeStep = transferComplete ? 4 : attested ? 2 : 1;

  const steps = [
    {
      label: 'Send from',
      component: <SendFrom />,
    },
    {
      label: 'Send to',
      component: destinationQueued ? <DestinationQueued /> : <SendTo />,
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
