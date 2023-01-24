import * as React from 'react';
import Stepper from '../../components/Stepper/Stepper';
import SendFrom from './SendFrom';
import SendTo from './SendTo';
import CTA from './CTA';
import { ChainName } from '../../sdk/types';
import { RootState } from '../../store';
import { useSelector } from 'react-redux';

const getSteps = (fromNetwork: ChainName, toNetwork: ChainName, fromAddr: string, toAddr: string, amount: string) => [
  {
    label: 'Send from',
    component: (
      <SendFrom
        network={fromNetwork}
        address={fromAddr}
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
        network={toNetwork}
        address={toAddr}
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
  const { fromNetwork, toNetwork, amount } = useSelector((state: RootState) => state.transfer);
  const { sending, receiving } = useSelector((state: RootState) => state.wallet);
  const steps = getSteps(fromNetwork, toNetwork, sending.address, receiving.address, `${amount}`);

  return <Stepper steps={steps} activeStep={activeStep} />;
}
