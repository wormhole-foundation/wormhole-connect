import * as React from 'react';
import Stepper from '../../components/Stepper/Stepper';
import SendFrom from './SendFrom';
import SendTo from './SendTo';
import BridgeComplete from './BridgeComplete';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';

export default function MilestoneStepper() {
  const readyForRedeem: boolean = useSelector(
    (state: RootState) => state.redeem.readyForRedeem,
  );
  const transferComplete = useSelector(
    (state: RootState) => state.redeem.transferComplete,
  );
  const activeStep = transferComplete ? 4 : readyForRedeem ? 2 : 1;

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
