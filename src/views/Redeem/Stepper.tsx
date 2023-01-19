import * as React from 'react';
import Stepper from '../../components/Stepper/Stepper';
import SendFrom from './SendFrom';
import SendTo from './SendTo';
import CTA from './CTA';

const steps = [
  {
    label: 'Send from',
    component: (
      <SendFrom
        fromNetwork="polygon"
        senderAddress="0x1234...5678"
        amount="20.4 MATIC"
        relayerFee="- 1.2 MATIC"
        nativeGas="≈ 0.3 MATIC --> FTM"
        showConfirmations={false}
      />
    ),
  },
  {
    label: 'Send to',
    component: (
      <SendTo
        toNetwork="polygon"
        senderAddress="0x1234...5678"
        amount="20.4 MATIC"
        relayerFee="- 1.2 MATIC"
        nativeGas="≈ 0.3 MATIC --> FTM"
        showConfirmations={true}
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

  return <Stepper steps={steps} activeStep={activeStep} />;
}
