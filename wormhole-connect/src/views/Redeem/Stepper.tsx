import * as React from 'react';
import Stepper from '../../components/Stepper/Stepper';
import SendFrom from './SendFrom';
import SendTo from './SendTo';
import CTA from './CTA';
import { ParsedVaa } from '../../utils/vaa';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { PaymentOption } from '../../store/transfer';

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
  const vaa: ParsedVaa = useSelector((state: RootState) => state.redeem.vaa);
  const paymentOption = useSelector(
    (state: RootState) => state.transfer.destGasPayment,
  );
  const redeemTx = useSelector(
    (state: RootState) => state.transfer.redeemTx,
  );
  const activeStep = redeemTx ? 4 : vaa ? 2 : 1;

  const steps = getSteps(props.cta);

  return <Stepper steps={steps} activeStep={activeStep} />;
}
