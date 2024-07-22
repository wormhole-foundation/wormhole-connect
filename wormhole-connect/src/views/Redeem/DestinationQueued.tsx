import InputContainer from 'components/InputContainer';
import React, { useCallback, useContext, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from 'store';
import Header from './Header';
import Button from 'components/Button';
import CircularProgress from '@mui/material/CircularProgress';
import {
  TransferWallet,
  registerWalletSigner,
  switchChain,
} from 'utils/wallet';
import WalletsModal from '../WalletModal';
import AlertBanner from 'components/AlertBanner';
import Spacer from 'components/Spacer';
import { OPACITY } from 'utils/style';
import { useTheme } from '@mui/material';
import config from 'config';
import { RouteContext } from 'contexts/RouteContext';
import { isDestinationQueued, routes } from '@wormhole-foundation/sdk';
import { isEvmChain } from 'utils/sdk';
import { SDKv2Signer } from 'routes/sdkv2/signer';

const DestinationQueued = () => {
  const theme: any = useTheme();
  const wallet = useSelector((state: RootState) => state.wallet.receiving);
  const txData = useSelector((state: RootState) => state.redeem.txData)!;

  const checkConnection = useCallback(() => {
    const addr = wallet.address.toLowerCase();
    const curAddr = wallet.currentAddress.toLowerCase();
    return addr === curAddr;
  }, [wallet]);

  const [inProgress, setInProgress] = useState(false);
  const [sendError, setSendError] = useState('');
  const [isConnected, setIsConnected] = useState(checkConnection());
  const [openWalletModal, setWalletModal] = useState(false);
  const [expired, setExpired] = useState(false);
  const [rateLimitExpiry, setRateLimitExpiry] = useState('');

  const routeContext = useContext(RouteContext);

  useEffect(() => {
    const { receipt } = routeContext;
    if (!receipt || !isDestinationQueued(receipt)) {
      setExpired(true);
      setRateLimitExpiry('');
      return;
    }
    setRateLimitExpiry(receipt.queueReleaseTime.toLocaleString());
    const now = new Date();
    if (now < receipt.queueReleaseTime) {
      setExpired(false);
      const timeout = receipt.queueReleaseTime.getTime() - now.getTime();
      console.log(`rate limit expires in ${timeout} ms`);
      const timeoutId = setTimeout(() => {
        console.log('rate limit expired');
        setExpired(true);
      }, timeout);
      return () => clearTimeout(timeoutId);
    } else {
      setExpired(true);
    }
  }, [routeContext.receipt]);

  const connect = () => {
    setWalletModal(true);
  };

  useEffect(() => {
    setIsConnected(checkConnection());
  }, [wallet, checkConnection]);

  const handleClick = useCallback(async () => {
    const { route, receipt } = routeContext;
    if (
      !route ||
      !receipt ||
      !routes.isFinalizable(route) ||
      !isDestinationQueued(receipt)
    ) {
      return;
    }
    setInProgress(true);
    try {
      const toConfig = config.chains[txData.toChain]!;
      if (isEvmChain(txData.toChain)) {
        await switchChain(toConfig.chainId, TransferWallet.RECEIVING);
        registerWalletSigner(txData.toChain, TransferWallet.RECEIVING);
      }
      const signer = await SDKv2Signer.fromChainV1(
        txData.toChain,
        wallet.address,
        {},
        TransferWallet.RECEIVING,
      );
      await route.finalize(signer, receipt);
    } catch (e) {
      setSendError('Error with transfer, please try again');
      console.error(e);
    }
    setInProgress(false);
  }, [routeContext, wallet]);

  return (
    <>
      <InputContainer bg={theme.palette.warning[500] + OPACITY[25]}>
        <>
          <Header
            chain={txData.toChain}
            address={txData.recipient}
            side="destination"
          />
          {!expired ? (
            <div>
              {`Your transfer to ${
                config.chains[txData.toChain]?.displayName || 'UNKNOWN'
              } is delayed due to rate limits configured by ${
                config.tokens[txData.receivedTokenKey]?.symbol || 'UNKNOWN'
              }. After the delay ends on ${
                rateLimitExpiry || 'UNKNOWN'
              }, you will need to return to submit a new transaction to complete your transfer.`}
            </div>
          ) : (
            <div>
              {`Your transfer to ${
                config.chains[txData.toChain]?.displayName || 'UNKNOWN'
              } was delayed due to rate limits configured by ${
                config.tokens[txData.receivedTokenKey]?.symbol || 'UNKNOWN'
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
          chain={txData.toChain}
          onClose={() => setWalletModal(false)}
        />
      )}
    </>
  );
};

export default DestinationQueued;
