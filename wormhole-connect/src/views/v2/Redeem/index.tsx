import React, { ReactNode, useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTimer } from 'react-timer-hook';
import { useTheme } from '@mui/material';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import ArrowCircleLeftOutlinedIcon from '@mui/icons-material/ArrowCircleLeftOutlined';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { isRedeemed, routes, TransferState } from '@wormhole-foundation/sdk';
import { getTokenDetails } from 'telemetry';
import { makeStyles } from 'tss-react/mui';
import { Context } from 'sdklegacy';

import AlertBannerV2 from 'components/v2/AlertBanner';
import PageHeader from 'components/PageHeader';
import { Alignment } from 'components/Header';
import Button from 'components/v2/Button';
import config from 'config';
import { RouteContext } from 'contexts/RouteContext';
import useTrackTransfer from 'hooks/useTrackTransfer';
import PoweredByIcon from 'icons/PoweredBy';
import { SDKv2Signer } from 'routes/sdkv2/signer';
import { setRedeemTx, setTransferComplete } from 'store/redeem';
import { setRoute } from 'store/router';
import { displayAddress, millisToHumanString } from 'utils';
import { interpretTransferError } from 'utils/errors';
import { joinClass } from 'utils/style';
import { minutesAndSecondsWithPadding } from 'utils/transferValidation';
import {
  TransferWallet,
  registerWalletSigner,
  switchChain,
} from 'utils/wallet';
import TransactionDetails from 'views/v2/Redeem/TransactionDetails';
import WalletSidebar from 'views/v2/Bridge/WalletConnector/Sidebar';

import type { RootState } from 'store';
import TxCompleteIcon from 'icons/TxComplete';
import { getAssociatedTokenAddressSync } from '@solana/spl-token';
import { PublicKey } from '@solana/web3.js';

const useStyles = makeStyles()((_theme) => ({
  spacer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  container: {
    margin: 'auto',
    maxWidth: '650px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  actionButton: {
    padding: '8px 16px',
    backgroundColor: '#C1BBF6',
    borderRadius: '8px',
    margin: 'auto',
    maxWidth: '420px',
    width: '100%',
  },
  poweredBy: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
    marginTop: '24px',
  },
}));

const Redeem = () => {
  const dispatch = useDispatch();
  const { classes } = useStyles();
  const theme = useTheme();

  const [claimError, setClaimError] = useState('');
  const [isClaimInProgress, setIsClaimInProgress] = useState(false);
  const [etaExpired, setEtaExpired] = useState(false);

  const [isWalletSidebarOpen, setIsWalletSidebarOpen] = useState(false);

  // Start tracking changes in the transaction
  useTrackTransfer();

  const routeContext = React.useContext(RouteContext);

  const isTxAttested = useMemo(
    () =>
      routeContext.receipt &&
      routeContext.receipt.state >= TransferState.Attested,
    [routeContext.receipt],
  );

  const {
    transferComplete: isTxComplete,
    route: routeName,
    timestamp: txTimestamp,
    isResumeTx,
  } = useSelector((state: RootState) => state.redeem);

  const { txData } = useSelector((state: RootState) => state.redeem);

  const isTxRefunded = routeContext.receipt?.state === TransferState.Refunded;
  const isTxFailed = routeContext.receipt?.state === TransferState.Failed;

  const {
    recipient,
    toChain,
    fromChain,
    tokenKey,
    receivedTokenKey,
    receiveAmount,
    eta = 0,
  } = txData!;

  const receivingWallet = useSelector(
    (state: RootState) => state.wallet.receiving,
  );

  // Initialize the countdown with 0, 0 as we might not have eta or txTimestamp yet
  const { seconds, minutes, isRunning, restart } = useTimer({
    expiryTimestamp: new Date(),
    autoStart: false,
    onExpire: () => setEtaExpired(true),
  });

  // Side-effect to start the ETA timer when we have the ETA and tx timestamp
  useEffect(() => {
    // Only start when we have the required values and if the timer hasn't been started yet
    if (!txTimestamp || !eta || isRunning) {
      return;
    }

    restart(new Date(txTimestamp + eta), true);
  }, [eta, txTimestamp]);

  const isAutomaticRoute = useMemo(() => {
    if (!routeName) {
      return false;
    }

    const route = config.routes.get(routeName);

    if (!route) {
      return false;
    }

    return route.AUTOMATIC_DEPOSIT;
  }, [routeName]);

  const header = useMemo(() => {
    const defaults: { text: string; align: Alignment } = {
      text: '',
      align: 'left',
    };

    let headerConfig;

    if (typeof config.pageHeader === 'string') {
      headerConfig = { ...defaults, text: config.pageHeader };
    } else {
      headerConfig = { ...defaults, ...config.pageHeader };
    }

    return (
      <PageHeader
        title={headerConfig.text}
        align={headerConfig.align}
        showHamburgerMenu={config.showHamburgerMenu}
      />
    );
  }, []);

  // Header showing the status of the transaction
  const statusHeader = useMemo(() => {
    if (isTxComplete) {
      return <Stack>Transaction complete</Stack>;
    } else if (isTxRefunded) {
      return <Stack>Transaction was refunded</Stack>;
    } else if (isTxFailed) {
      return <Stack>Transaction failed</Stack>;
    } else if (isTxAttested) {
      return (
        <Stack>{`${receiveAmount} ${receivedTokenKey} received at ${displayAddress(
          toChain,
          recipient,
        )}`}</Stack>
      );
    }

    return <Stack>Transaction submitted</Stack>;
  }, [
    isTxAttested,
    isTxComplete,
    isTxRefunded,
    isTxFailed,
    receiveAmount,
    receivedTokenKey,
    recipient,
    toChain,
  ]);

  // Displays the ETA value and the countdown within the ETA circle
  const etaDisplay = useMemo(() => {
    if (etaExpired) {
      return (
        <Stack>
          <Typography color={theme.palette.text.secondary} fontSize={14}>
            Any time now!
          </Typography>
        </Stack>
      );
    }

    const counter = isRunning
      ? minutesAndSecondsWithPadding(minutes, seconds)
      : null;

    let etaElement: string | ReactNode = <CircularProgress size={14} />;

    if (eta) {
      etaElement = millisToHumanString(eta);
    }

    return (
      <Stack alignItems="center" justifyContent="center">
        <Typography color={theme.palette.text.secondary} fontSize={14}>
          ETA {etaElement}
        </Typography>
        <Typography fontSize={24}>{counter}</Typography>
      </Stack>
    );
  }, [eta, etaExpired, isRunning, minutes, seconds]);

  // Circular progress indicator component for ETA countdown
  const etaCircle = useMemo(() => {
    return (
      <>
        <Box sx={{ position: 'relative', display: 'inline-flex' }}>
          {isTxComplete ? (
            <TxCompleteIcon
              sx={{
                width: 105,
                height: 105,
                marginTop: 1,
                marginBottom: 2,
              }}
            />
          ) : isTxRefunded ? (
            <ArrowCircleLeftOutlinedIcon
              htmlColor="#f3bb2b"
              sx={{ width: '120px', height: '120px' }}
            />
          ) : isTxFailed ? (
            <ErrorOutlineIcon
              htmlColor="#e11a1a"
              sx={{ width: '120px', height: '120px' }}
            />
          ) : (
            <>
              <CircularProgress
                size={120}
                sx={{
                  color: '#C1BBF6',
                }}
                thickness={2}
              />
              <Box
                sx={{
                  top: 0,
                  left: 0,
                  bottom: 0,
                  right: 0,
                  position: 'absolute',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {etaDisplay}
              </Box>
            </>
          )}
        </Box>
      </>
    );
  }, [etaDisplay, isTxComplete]);

  // Checks whether the receiving wallet is currently connected
  const isConnectedToReceivingWallet = useMemo(() => {
    if (!recipient) {
      return false;
    }

    // For Solana transfers, the associated token account (ATA) might not exist,
    // preventing us from retrieving the recipient wallet address.
    // In such cases, when resuming transfers, we allow the user to connect a wallet
    // to claim the transfer, which will create the ATA.
    if (
      isResumeTx &&
      toChain === 'Solana' &&
      receivingWallet.address &&
      receivingWallet.address !== recipient &&
      routeName &&
      // These routes set the recipient address to the associated token address
      ['ManualTokenBridge', 'ManualCCTP'].includes(routeName)
    ) {
      const receivedToken = config.sdkConverter.toTokenIdV2(
        config.tokens[receivedTokenKey],
        'Solana',
      );
      const ata = getAssociatedTokenAddressSync(
        new PublicKey(receivedToken.address.toString()),
        new PublicKey(receivingWallet.address),
      );
      if (!ata.equals(new PublicKey(recipient))) {
        setClaimError('Not connected to the receiving wallet');
        return false;
      }
      setClaimError('');
      return true;
    }

    const walletAddress = receivingWallet.address.toLowerCase();
    const walletCurrentAddress = receivingWallet.currentAddress.toLowerCase();
    const recipientAddress = recipient.toLowerCase();

    // Connected wallet should be the current recipient wallet
    return (
      walletAddress === walletCurrentAddress &&
      walletAddress === recipientAddress
    );
  }, [
    receivingWallet,
    recipient,
    toChain,
    isResumeTx,
    routeName,
    config,
    receivedTokenKey,
  ]);

  // Callback for claim action in Manual route transactions
  const handleManualClaim = async () => {
    setIsClaimInProgress(true);
    setClaimError('');

    if (!routeName) {
      throw new Error('Unknown route, can not claim');
    }

    const transferDetails = {
      route: routeName,
      fromToken: getTokenDetails(tokenKey),
      toToken: getTokenDetails(receivedTokenKey),
      fromChain: fromChain,
      toChain: toChain,
    };

    config.triggerEvent({
      type: 'transfer.redeem.initiate',
      details: transferDetails,
    });

    if (!isConnectedToReceivingWallet) {
      setClaimError('Not connected to the receiving wallet');
      throw new Error('Not connected to the receiving wallet');
    }

    const chainConfig = config.chains[toChain]!;

    if (!chainConfig) {
      setClaimError('Your claim has failed, please try again');
      throw new Error('invalid destination chain');
    }

    const route = routeContext.route!;

    let txId: string | undefined;

    try {
      if (
        chainConfig!.context === Context.ETH &&
        typeof chainConfig.chainId === 'number'
      ) {
        await switchChain(chainConfig.chainId, TransferWallet.RECEIVING);
        await registerWalletSigner(toChain, TransferWallet.RECEIVING);
      }

      if (!routes.isManual(route)) {
        throw new Error('Route is not manual');
      }

      const signer = await SDKv2Signer.fromChain(
        toChain,
        receivingWallet.address,
        {},
        TransferWallet.RECEIVING,
      );

      const receipt = await route.complete(signer, routeContext.receipt!);

      if (!isRedeemed(receipt)) {
        throw new Error('Transfer not redeemed');
      }

      if (receipt.destinationTxs && receipt.destinationTxs.length > 0) {
        txId = receipt.destinationTxs[receipt.destinationTxs.length - 1].txid;
      }

      config.triggerEvent({
        type: 'transfer.redeem.start',
        details: transferDetails,
      });

      setIsClaimInProgress(false);
      setClaimError('');
    } catch (e: any) {
      const [uiError, transferError] = interpretTransferError(e, toChain);

      setClaimError(uiError);

      config.triggerEvent({
        type: 'transfer.redeem.error',
        details: transferDetails,
        error: transferError,
      });

      setIsClaimInProgress(false);
      console.error(e);
    }
    if (txId !== undefined) {
      dispatch(setRedeemTx(txId));

      // Transfer may require an additional step if this is a finalizable route
      if (!routes.isFinalizable(route)) {
        dispatch(setTransferComplete(true));
      }

      config.triggerEvent({
        type: 'transfer.redeem.success',
        details: transferDetails,
      });
    }
  };

  // Main CTA button which has separate states for automatic and manual claims
  const actionButton = useMemo(() => {
    if (!isTxComplete && !isTxRefunded && !isTxFailed && !isAutomaticRoute) {
      if (isTxAttested && !isConnectedToReceivingWallet) {
        return (
          <Button
            variant="primary"
            className={classes.actionButton}
            onClick={() => setIsWalletSidebarOpen(true)}
          >
            <Typography textTransform="none">
              Connect receiving wallet
            </Typography>
          </Button>
        );
      }

      return (
        <Button
          className={classes.actionButton}
          disabled={isClaimInProgress || !isTxAttested}
          variant={claimError ? 'error' : 'primary'}
          onClick={handleManualClaim}
        >
          {isClaimInProgress || !isTxAttested ? (
            <Stack direction="row" alignItems="center">
              <CircularProgress size={24} />
              <Typography marginLeft="4px" textTransform="none">
                Transfer in progress
              </Typography>
            </Stack>
          ) : (
            <Typography textTransform="none">Claim</Typography>
          )}
        </Button>
      );
    }

    return (
      <Button
        variant="primary"
        className={classes.actionButton}
        onClick={() => {
          dispatch(setRoute('bridge'));
        }}
      >
        <Typography textTransform="none">Start a new transaction</Typography>
      </Button>
    );
  }, [
    isAutomaticRoute,
    isClaimInProgress,
    isTxAttested,
    isTxComplete,
    isConnectedToReceivingWallet,
  ]);

  return (
    <div className={joinClass([classes.container, classes.spacer])}>
      {header}
      {statusHeader}
      {etaCircle}
      <TransactionDetails />
      {actionButton}
      <AlertBannerV2 error content={claimError} show={!!claimError} />
      <div className={classes.poweredBy}>
        <PoweredByIcon color={theme.palette.text.primary} />
      </div>
      <WalletSidebar
        open={isWalletSidebarOpen}
        type={TransferWallet.RECEIVING}
        onClose={() => {
          setIsWalletSidebarOpen(false);
        }}
      />
    </div>
  );
};

export default Redeem;
