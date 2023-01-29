import React from 'react';
import { useSelector } from 'react-redux';
import Button from '../../components/Button';
import { sendTransfer, TOKENS } from '../../utils/sdk';
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
    if (!token) throw new Error('invalid input, specify an asset');
    const tokenConfig = TOKENS[token];
    if (!tokenConfig) throw new Error('invalid token');
    const sendToken = tokenConfig.tokenId;

    await sendTransfer(
      sendToken,
      `${amount}`,
      fromNetwork!,
      sending.address,
      toNetwork!,
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
