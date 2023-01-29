import * as React from 'react';
import Stepper from '../../components/Stepper/Stepper';
import SendFrom from './SendFrom';
import SendTo from './SendTo';
import CTA from './CTA';

const getSteps = (cta: string) => [
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
    component: <CTA ctaText={cta} />,
  },
];

type Props = {
  cta: string;
  // ctaAction
};

export default function MilestoneStepper(props: Props) {
  const [activeStep] = React.useState(4);

  const steps = getSteps(props.cta);

  return <Stepper steps={steps} activeStep={activeStep} />;
}
