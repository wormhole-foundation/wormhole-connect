import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { TOKENS } from '../../sdk/config';
import { sendTransfer } from '../../sdk/sdk';
import { RootState } from '../../store';
import { useDispatch } from 'react-redux';
import { setTxHash } from '../../store/transfer';
import { setRoute } from '../../store/router';
import { registerWalletSigner, Wallet } from '../../store/wallet';
import { displayEvmAddress } from '../../utils';
import Button from '../../components/Button';
import CircularProgress from '@mui/material/CircularProgress';

function Send(props: { valid: boolean }) {
  const dispatch = useDispatch();
  const [inProgress, setInProgress] = useState(false);
  const { fromNetwork, toNetwork, token, amount, destGasPayment } = useSelector(
    (state: RootState) => state.transfer,
  );
  const { sending, receiving } = useSelector(
    (state: RootState) => state.wallet,
  );
  const [isConnected, setIsConnected] = useState(sending.currentAddress.toLowerCase() === sending.address.toLowerCase());

  async function send() {
    setInProgress(true);
    try {
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
      setInProgress(false);
    } catch(e) {
      setInProgress(false);
      console.error(e);
    }
  }

  useEffect(() => {
    setIsConnected(sending.currentAddress.toLowerCase() === sending.address.toLowerCase());
  }, [sending])

  return props.valid && !isConnected ? (
      <Button
        onClick={send}
        disabled
        elevated
      >
        Connect to {displayEvmAddress(sending.address)}
      </Button>
    ) : (
      <Button
        onClick={send}
        action={props.valid}
        disabled={!props.valid || inProgress}
        elevated
      >
        {inProgress ? (
          <CircularProgress size={18} />
        ) : 'Approve and proceed with transaction'}
      </Button>
  );
}

export default Send;
