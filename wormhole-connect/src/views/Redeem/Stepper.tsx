import * as React from 'react';
import { useSelector } from 'react-redux';

import { RootState } from '../../store';
import { UnsignedMessage } from '../../utils/routes';

import Stepper from '../../components/Stepper/Stepper';
import SendFrom from './SendFrom';
import SendTo from './SendTo';
import BridgeComplete from './BridgeComplete';

export default function MilestoneStepper() {
  const txData: UnsignedMessage | undefined = useSelector(
    (state: RootState) => state.redeem.txData,
  );
  const transferComplete = useSelector(
    (state: RootState) => state.redeem.transferComplete,
  );
  const activeStep = transferComplete ? 4 : !!txData ? 2 : 1;

  const steps = [
    {
      label: 'Send from',
      component: <SendFrom />,
    },
    {
      label: 'Send to',
      component: <SendTo />,
    },
    {
      label: 'Transaction complete',
      component: <BridgeComplete />,
    },
  ];

  return <Stepper steps={steps} activeStep={activeStep} />;
}
