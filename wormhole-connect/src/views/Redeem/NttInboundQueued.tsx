import InputContainer from 'components/InputContainer';
import React, { useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from 'store';
import { isSignedNttMessage as isSignedNttMessage } from 'routes';
import { NttManual, NttRelay } from 'routes/ntt';
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
import { Context } from '@wormhole-foundation/wormhole-connect-sdk';
import WalletsModal from '../WalletModal';
import AlertBanner from 'components/AlertBanner';
import Spacer from 'components/Spacer';
import { Route } from 'config/types';
import {
  InboundQueuedTransferNotFoundError,
  InboundQueuedTransferStillQueuedError,
  ContractIsPausedError,
} from 'routes/ntt/errors';
import { setRedeemTx, setTransferComplete } from 'store/redeem';
import { OPACITY } from 'utils/style';
import { useTheme } from '@mui/material';
import config from 'config';

const NttInboundQueued = () => {
  const dispatch = useDispatch();
  const theme: any = useTheme();
  const route = useSelector((state: RootState) => state.redeem.route);
  const wallet = useSelector((state: RootState) => state.wallet.receiving);
  const signedMessage = useSelector(
    (state: RootState) => state.redeem.signedMessage,
  )!;
  const inboundQueuedTransfer = useSelector(
    (state: RootState) => state.ntt.inboundQueuedTransfer,
  );

  const checkConnection = useCallback(() => {
    if (!isSignedNttMessage(signedMessage)) return;
    const addr = wallet.address.toLowerCase();
    const curAddr = wallet.currentAddress.toLowerCase();
    return addr === curAddr;
  }, [wallet, signedMessage]);

  const [inProgress, setInProgress] = useState(false);
  const [sendError, setSendError] = useState('');
  const [isConnected, setIsConnected] = useState(checkConnection());
  const [openWalletModal, setWalletModal] = useState(false);
  const [expired, setExpired] = useState(false);
  const [rateLimitExpiry, setRateLimitExpiry] = useState('');

  useEffect(() => {
    if (!inboundQueuedTransfer.data) {
      setExpired(true);
      setRateLimitExpiry('');
      return;
    }
    const expiry = new Date(
      inboundQueuedTransfer.data.rateLimitExpiryTimestamp * 1000,
    );
    setRateLimitExpiry(expiry.toLocaleString());
    const now = new Date();
    if (now < expiry) {
      setExpired(false);
      const timeoutId = setTimeout(
        () => setExpired(true),
        expiry.getTime() - now.getTime(),
      );
      return () => clearTimeout(timeoutId);
    } else {
      setExpired(true);
    }
  }, [inboundQueuedTransfer]);

  const connect = () => {
    setWalletModal(true);
  };

  useEffect(() => {
    setIsConnected(checkConnection());
  }, [wallet, checkConnection]);

  const handleClick = useCallback(async () => {
    if (!isSignedNttMessage(signedMessage)) return;
    const { toChain, recipientNttManager, messageDigest, recipient } =
      signedMessage;
    setInProgress(true);
    const nttRoute =
      route === Route.NttManual ? new NttManual() : new NttRelay();
    let tx: string | undefined;
    try {
      const toConfig = config.chains[toChain]!;
      if (toConfig?.context === Context.ETH) {
        await switchChain(toConfig.chainId, TransferWallet.RECEIVING);
        registerWalletSigner(toChain, TransferWallet.RECEIVING);
      }
      tx = await nttRoute.completeInboundQueuedTransfer(
        toChain,
        recipientNttManager,
        messageDigest,
        recipient,
        wallet.address,
      );
    } catch (e: any) {
      switch (e.message) {
        case InboundQueuedTransferNotFoundError.MESSAGE:
        case InboundQueuedTransferStillQueuedError.MESSAGE:
        case ContractIsPausedError.MESSAGE:
          setSendError(e.message);
          break;
        default:
          setSendError('Error with transfer, please try again');
          break;
      }
      console.error(e);
    }
    if (tx !== undefined) {
      try {
        // Check that the transfer is not still queued
        const inboundQueuedTransfer = await nttRoute.getInboundQueuedTransfer(
          toChain,
          recipientNttManager,
          messageDigest,
        );
        if (!inboundQueuedTransfer) {
          dispatch(setInboundQueuedTransfer(undefined));
          dispatch(setRedeemTx(tx));
          const isTransferCompleted = await nttRoute.isTransferCompleted(
            toChain,
            signedMessage,
          );
          dispatch(setTransferComplete(isTransferCompleted));
        }
      } catch (e) {
        console.error(e);
      }
    }
    setInProgress(false);
  }, [signedMessage, wallet, route]);

  return (
    <>
      <InputContainer bg={theme.palette.warning[500] + OPACITY[25]}>
        <>
          <Header
            chain={signedMessage.toChain}
            address={signedMessage.recipient}
          />
          {!expired ? (
            <div>
              {`Your transfer to ${
                config.chains[signedMessage.toChain]?.displayName || 'UNKNOWN'
              } is delayed due to rate limits configured by ${
                config.tokens[signedMessage.receivedTokenKey]?.symbol ||
                'UNKNOWN'
              }. After the delay ends on ${
                rateLimitExpiry || 'UNKNOWN'
              }, you will need to return to submit a new transaction to complete your transfer.`}
            </div>
          ) : (
            <div>
              {`Your transfer to ${
                config.chains[signedMessage.toChain]?.displayName || 'UNKNOWN'
              } was delayed due to rate limits configured by ${
                config.tokens[signedMessage.receivedTokenKey]?.symbol ||
                'UNKNOWN'
              }. You will need to submit a new transaction to complete your transfer.`}
            </div>
          )}
        </>
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
          <Button
            onClick={handleClick}
            action
            disabled={inProgress || !expired}
          >
            {inProgress ? <CircularProgress size={22} /> : 'Complete transfer'}
          </Button>
        ) : (
          <Button onClick={connect} elevated disabled={!expired}>
            Connect wallet
          </Button>
        )
      ) : (
        <Button onClick={connect} action disabled={!expired}>
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

export default NttInboundQueued;
