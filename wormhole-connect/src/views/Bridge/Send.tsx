import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Context } from '@wormhole-foundation/wormhole-connect-sdk';

import { CHAINS, TOKENS } from '../../config';
import {
  estimateClaimGasFee,
  estimateGasFee,
  parseMessageFromTx,
  PaymentOption,
  sendTransfer,
} from '../../sdk';
import { RootState, store } from '../../store';
import { setRoute } from '../../store/router';
import { setTxDetails, setSendTx } from '../../store/redeem';
import { displayWalletAddress } from '../../utils';
import {
  registerWalletSigner,
  switchNetwork,
  TransferWallet,
} from '../../utils/wallet';
import { isTransferValid } from '../../utils/transferValidation';
import {
  touchValidations,
  validateTransfer,
  setManualGasEst,
  setAutomaticGasEst,
  setClaimGasEst,
  setIsTransactionInProgress,
} from '../../store/transfer';

import Button from '../../components/Button';
import CircularProgress from '@mui/material/CircularProgress';
import AlertBanner from '../../components/AlertBanner';

function Send(props: { valid: boolean }) {
  const dispatch = useDispatch();
  const wallets = useSelector((state: RootState) => state.wallet);
  const { sending, receiving } = wallets;
  const transfer = useSelector((state: RootState) => state.transfer);
  const {
    validate: showErrors,
    validations,
    fromNetwork,
    toNetwork,
    token,
    amount,
    destGasPayment,
    toNativeToken,
    relayerFee,
    automaticRelayAvail,
    isTransactionInProgress,
  } = transfer;
  const [isConnected, setIsConnected] = useState(
    sending.currentAddress.toLowerCase() === sending.address.toLowerCase(),
  );
  const [sendError, setSendError] = useState('');

  async function send() {
    setSendError('');
    dispatch(touchValidations());
    const state = store.getState();
    dispatch(validateTransfer(state.wallet));
    const valid = isTransferValid(validations);
    if (!valid) return;
    dispatch(setIsTransactionInProgress(true));
    try {
      const fromConfig = CHAINS[fromNetwork!];
      if (fromConfig?.context === Context.ETH) {
        registerWalletSigner(fromNetwork!, TransferWallet.SENDING);
        const { chainId } = CHAINS[fromNetwork!]!;
        await switchNetwork(chainId, TransferWallet.SENDING);
      }

      const tokenConfig = TOKENS[token]!;
      const sendToken = tokenConfig.tokenId;

      const receipt: any = await sendTransfer(
        sendToken || 'native',
        `${amount}`,
        fromNetwork!,
        sending.address,
        toNetwork!,
        receiving.address,
        destGasPayment,
        `${toNativeToken}`,
      );
      const txId = receipt.transactionHash;
      console.log('sent', txId, receipt);

      let message;
      const toRedeem = setInterval(async () => {
        if (message) {
          clearInterval(toRedeem);
          dispatch(setIsTransactionInProgress(false));
          dispatch(setSendTx(txId));
          dispatch(setTxDetails(message));
          dispatch(setRoute('redeem'));
          setSendError('');
        } else {
          message = await parseMessageFromTx(txId, fromNetwork!);
        }
      }, 1000);
    } catch (e) {
      dispatch(setIsTransactionInProgress(false));
      setSendError('Error sending transfer, please try again');
      console.error(e);
    }
  }

  const setSendingGas = async (gasPayment: PaymentOption) => {
    const tokenConfig = TOKENS[token]!;
    if (!tokenConfig) return;
    const sendToken = tokenConfig.tokenId;

    const gasFee = await estimateGasFee(
      sendToken || 'native',
      `${amount}`,
      fromNetwork!,
      sending.address,
      toNetwork!,
      receiving.address,
      gasPayment,
      `${toNativeToken}`,
    );
    if (gasPayment === PaymentOption.MANUAL) {
      dispatch(setManualGasEst(gasFee));
    } else {
      dispatch(setAutomaticGasEst(gasFee));
    }
  };

  // TODO: mock vaa?
  const setDestGas = async () => {
    if (!toNetwork) return;
    const gasFee = await estimateClaimGasFee(toNetwork!);
    dispatch(setClaimGasEst(gasFee));
  };

  useEffect(() => {
    const valid = isTransferValid(validations);
    if (!valid) return;

    if (automaticRelayAvail) {
      setSendingGas(PaymentOption.AUTOMATIC);
    }
    setSendingGas(PaymentOption.MANUAL);
    setDestGas();
  }, [
    validations,
    sending,
    receiving,
    fromNetwork,
    toNetwork,
    token,
    destGasPayment,
    toNativeToken,
    relayerFee,
  ]);

  useEffect(() => {
    setIsConnected(
      sending.currentAddress.toLowerCase() === sending.address.toLowerCase(),
    );
  }, [sending]);

  return (
    <div style={{ width: '100%' }}>
      {!!props.valid && (
        <AlertBanner
          show={!!props.valid && destGasPayment === PaymentOption.MANUAL}
          text="This transfer will require two transactions - one on the source chain and one on the destination chain."
          warning
          margin="0 0 16px 0"
        />
      )}

      <AlertBanner
        show={!!sendError}
        text={sendError}
        error
        margin="0 0 16px 0"
      />
      {props.valid && !isConnected ? (
        <Button disabled elevated>
          Connect to {displayWalletAddress(sending.type, sending.address)}
        </Button>
      ) : (
        <Button
          onClick={send}
          action={props.valid}
          disabled={isTransactionInProgress}
          elevated
        >
          {isTransactionInProgress ? (
            <CircularProgress size={22} />
          ) : (
            'Approve and proceed with transaction'
          )}
        </Button>
      )}
    </div>
  );
}

export default Send;
