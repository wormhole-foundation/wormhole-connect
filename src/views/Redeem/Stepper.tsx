import * as React from 'react';
import Stepper from '../../components/Stepper/Stepper';
import { Button } from '@mui/material';
import SendFrom from './SendFrom';

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
      />
    ),
  },
  {
    label: 'Send to',
    component: <Button>2</Button>,
  },
  {
    label: 'Transaction complete',
    component: <Button>3</Button>,
  },
];

export default function MilestoneStepper() {
  const [activeStep] = React.useState(1);

  return <Stepper steps={steps} activeStep={activeStep} />;
}
