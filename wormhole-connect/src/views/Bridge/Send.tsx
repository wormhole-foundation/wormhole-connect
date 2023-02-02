import React from 'react';
import { useSelector } from 'react-redux';
import Button from '../../components/Button';
import { TOKENS } from '../../sdk/config';
import { sendTransfer } from '../../sdk/sdk';
import { RootState } from '../../store';
import { useDispatch } from 'react-redux';
import { setTxHash } from '../../store/transfer';
import { setRoute } from '../../store/router';
import { registerWalletSigner, Wallet } from '../../store/wallet';

function Send(props: { valid: boolean }) {
  const dispatch = useDispatch();
  const { fromNetwork, toNetwork, token, amount, destGasPayment } = useSelector(
    (state: RootState) => state.transfer,
  );
  const { sending, receiving } = useSelector(
    (state: RootState) => state.wallet,
  );
  async function send() {
    await registerWalletSigner(Wallet.SENDING);
    // TODO: better validation
    if (!amount) throw new Error('invalid input, specify an amount');
    if (!token) throw new Error('invalid input, specify an asset');
    const tokenConfig = TOKENS[token];
    if (!tokenConfig) throw new Error('invalid token');
    const sendToken = tokenConfig.tokenId;

    const receipt = await sendTransfer(
      sendToken || 'native',
      `${amount}`,
      fromNetwork!,
      sending.address,
      toNetwork!,
      receiving.address,
      destGasPayment,
      '0',
    );
    console.log('sent', receipt);
    dispatch(setTxHash(receipt.transactionHash));
    dispatch(setRoute('redeem'));
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
