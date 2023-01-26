import * as React from 'react';
import Stepper from '../../components/Stepper/Stepper';
import SendFrom from './SendFrom';
import SendTo from './SendTo';
import CTA from './CTA';

const getSteps = (amount: string) => [
  {
    label: 'Send from',
    component: (
      <SendFrom
        amount={amount}
        relayerFee="- 1.2 MATIC"
        nativeGas="≈ 0.3 MATIC --> FTM"
        showConfirmations={true}
      />
    ),
  },
  {
    label: 'Send to',
    component: (
      <SendTo
        amount={amount}
        relayerFee="- 1.2 MATIC"
        nativeGas="≈ 0.3 MATIC --> FTM"
        showConfirmations={false}
      />
    ),
  },
  {
    label: 'Transaction complete',
    component: <CTA ctaText="Some CTA" />,
  },
];

export default function MilestoneStepper() {
  const [activeStep] = React.useState(1);
  // const amount = useSelector(
  //   (state: RootState) => state.transfer.amount,
  // );
  const amount = '1';
  const steps = getSteps(amount);

  return <Stepper steps={steps} activeStep={activeStep} />;
}
