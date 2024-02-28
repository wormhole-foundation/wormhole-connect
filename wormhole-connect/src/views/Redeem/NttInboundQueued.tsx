import InputContainer from 'components/InputContainer';
import React, { useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from 'store';
import { isSignedNttMessage as isSignedNttMessage } from 'routes';
import {
  NttManual,
  NttRelay,
  parseWormholeTransceiverMessage,
} from 'routes/ntt';
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
import { CHAINS, TOKENS } from 'config';
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
import { setRedeemTx } from 'store/redeem';
import { OPACITY } from 'utils/style';
import { useTheme } from '@mui/material';

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
    const {
      toChain,
      fromChain,
      wormholeTransceiverMessage,
      recipientNttManager,
    } = signedMessage;
    const { nttManagerPayload } = parseWormholeTransceiverMessage(
      wormholeTransceiverMessage,
    );
    setInProgress(true);
    try {
      const toConfig = CHAINS[toChain];
      if (toConfig?.context === Context.ETH) {
        registerWalletSigner(toChain, TransferWallet.RECEIVING);
        await switchChain(toConfig.chainId, TransferWallet.RECEIVING);
      }
      const nttRoute =
        route === Route.NttManual ? new NttManual() : new NttRelay();
      const tx = await nttRoute.completeInboundQueuedTransfer(
        toChain,
        recipientNttManager,
        nttManagerPayload,
        fromChain,
        wallet.address,
      );
      if (toChain === 'solana') {
        // Solana will not throw an error if the transfer is still queued
        // so we need to check if the transfer is still queued
        const inboundQueuedTransfer = await nttRoute.getInboundQueuedTransfer(
          toChain,
          recipientNttManager,
          nttManagerPayload,
          fromChain,
        );
        dispatch(setInboundQueuedTransfer(inboundQueuedTransfer));
        if (inboundQueuedTransfer) {
          setSendError('Transfer still queued');
        } else {
          dispatch(setRedeemTx(tx));
        }
      } else {
        dispatch(setInboundQueuedTransfer(undefined));
        dispatch(setRedeemTx(tx));
      }
    } catch (e: any) {
      if (
        e.message === InboundQueuedTransferNotFoundError.MESSAGE ||
        e.message === InboundQueuedTransferStillQueuedError.MESSAGE ||
        e.message === ContractIsPausedError.MESSAGE
      ) {
        setSendError(e.message);
      } else {
        setSendError('Error with transfer, please try again');
      }
      console.error(e);
    }
    setInProgress(false);
  }, [signedMessage, wallet, route]);

  return (
    <>
      <InputContainer
        bg={!expired ? theme.palette.warning[500] + OPACITY[25] : ''}
      >
        <>
          <Header
            chain={signedMessage.toChain}
            address={signedMessage.recipient}
            txHash={signedMessage.sendTx}
          />
          {!expired && (
            <div>
              {`Your transfer to ${
                CHAINS[signedMessage.toChain]?.displayName || 'UNKNOWN'
              } is delayed due to rate limits that were configured by the ${
                TOKENS[signedMessage.receivedTokenKey]?.symbol || 'UNKNOWN'
              } token DAO. After the delay ends on ${
                rateLimitExpiry || 'N/A'
              }, you will need to return to submit another transaction to complete the transfer and receive your tokens.`}
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
