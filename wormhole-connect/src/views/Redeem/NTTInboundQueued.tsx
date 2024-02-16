import InputContainer from 'components/InputContainer';
import React, { useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from 'store';
import { isSignedNTTMessage } from 'routes';
import { NTTManual, NTTRelay } from 'routes/ntt';
import Header from './Header';
import { useDispatch } from 'react-redux';
import Button from 'components/Button';
import CircularProgress from '@mui/material/CircularProgress';
import { setInboundQueuedTransfer } from 'store/ntt';
import {
  TransferWallet,
  registerWalletSigner,
  switchChain,
} from 'utils/wallet';
import { CHAINS } from 'config';
import { Context } from '@wormhole-foundation/wormhole-connect-sdk';
import WalletsModal from '../WalletModal';
import AlertBanner from 'components/AlertBanner';
import Spacer from 'components/Spacer';
import { Route } from 'config/types';
import {
  InboundQueuedTransferNotFoundError,
  InboundQueuedTransferStillQueuedError,
  RequireContractIsNotPausedError,
} from 'routes/ntt/errors';
import { setRedeemTx } from 'store/redeem';

const NTTInboundQueued = () => {
  const dispatch = useDispatch();
  const route = useSelector((state: RootState) => state.redeem.route);
  const wallet = useSelector((state: RootState) => state.wallet.receiving);
  const signedMessage = useSelector(
    (state: RootState) => state.redeem.signedMessage,
  )!;

  const checkConnection = useCallback(() => {
    if (!isSignedNTTMessage(signedMessage)) return;
    const addr = wallet.address.toLowerCase();
    const curAddr = wallet.currentAddress.toLowerCase();
    const reqAddr = signedMessage.sender.toLowerCase();
    return addr === curAddr && addr === reqAddr;
  }, [wallet, signedMessage]);

  const [inProgress, setInProgress] = useState(false);
  const [sendError, setSendError] = useState('');
  const [isConnected, setIsConnected] = useState(checkConnection());
  const [openWalletModal, setWalletModal] = useState(false);

  const connect = () => {
    setWalletModal(true);
  };

  useEffect(() => {
    setIsConnected(checkConnection());
  }, [wallet, checkConnection]);

  const handleClick = useCallback(async () => {
    if (!isSignedNTTMessage(signedMessage)) return;
    const { toChain, recipient, messageDigest } = signedMessage;
    setInProgress(true);
    try {
      const toConfig = CHAINS[toChain];
      if (toConfig?.context === Context.ETH) {
        registerWalletSigner(toChain, TransferWallet.RECEIVING);
        await switchChain(toConfig.chainId, TransferWallet.RECEIVING);
      }
      const ntt = route === Route.NTTManual ? new NTTManual() : new NTTRelay();
      const tx = await ntt.completeInboundQueuedTransfer(
        toChain,
        recipient,
        messageDigest,
      );
      dispatch(setInboundQueuedTransfer(undefined));
      dispatch(setRedeemTx(tx));
    } catch (e: any) {
      if (e.message === InboundQueuedTransferNotFoundError.MESSAGE) {
        setSendError('Transfer not found');
      } else if (e.message === InboundQueuedTransferStillQueuedError.MESSAGE) {
        setSendError('Transfer is still queued');
      } else if (e.message === RequireContractIsNotPausedError.MESSAGE) {
        setSendError('Contract is paused');
      } else {
        setSendError('Error with transfer, please try again');
      }
      console.error(e);
    }
    setInProgress(false);
  }, [signedMessage, wallet, route]);

  return (
    <>
      <InputContainer>
        <Header
          chain={signedMessage.fromChain}
          address={signedMessage.sender}
          txHash={signedMessage.sendTx}
        />
        <div>
          {`WARNING: This transfer has been queued due to rate limits on ${
            CHAINS[signedMessage.fromChain]?.displayName || 'UNKNOWN'
          }. You will need to submit a new transaction to resume this transfer after the rate limits expire.`}
        </div>
      </InputContainer>
      <Spacer height={8} />
      <AlertBanner
        show={!!sendError}
        content={sendError}
        error
        margin="0 0 12px 0"
      />
      {wallet.address ? (
        isConnected ? (
          <Button onClick={handleClick} action disabled={inProgress}>
            {inProgress ? <CircularProgress size={22} /> : 'Resume transfer'}
          </Button>
        ) : (
          <Button onClick={connect} elevated>
            Connect wallet
          </Button>
        )
      ) : (
        <Button onClick={connect} action>
          Connect wallet
        </Button>
      )}
      {openWalletModal && (
        <WalletsModal
          type={TransferWallet.RECEIVING}
          chain={signedMessage.toChain}
          onClose={() => setWalletModal(false)}
        />
      )}
    </>
  );
};

export default NTTInboundQueued;
