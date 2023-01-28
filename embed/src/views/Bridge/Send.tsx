import React from 'react';
import { useSelector } from 'react-redux';
import Button from '../../components/Button';
import { sendTransfer } from '../../utils/sdk';
import { RootState } from '../../store';

function Send(props: { valid: boolean }) {
  const { fromNetwork, toNetwork, token, amount, destGasPayment } = useSelector(
    (state: RootState) => state.transfer,
  );
  const { sending, receiving } = useSelector(
    (state: RootState) => state.wallet,
  );
  async function send() {
    // TODO: better validation
    if (!amount) throw new Error('invalid input, specify an amount');
    await sendTransfer(
      token,
      `${amount}`,
      fromNetwork,
      sending.address,
      toNetwork,
      receiving.address,
      destGasPayment,
      '0',
    );
    console.log('sent');
  }
  return (
    <Button
      onClick={send}
      text="Approve and proceed with transaction"
      action={props.valid}
      disabled={!props.valid}
      elevated
    />
  );
}

export default Send;
