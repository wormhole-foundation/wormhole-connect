import React, { ReactNode, useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTimer } from 'react-timer-hook';
import { useTheme } from '@mui/material';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import {
  isAttested,
  isDestinationQueued,
  isRefunded,
  isFailed,
  routes,
  FailedTransferReceipt,
} from '@wormhole-foundation/sdk';
import { getTokenDetails, getTransferDetails } from 'telemetry';
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
import { setRoute } from 'store/router';
import { useUSDamountGetter } from 'hooks/useUSDamountGetter';
import { interpretTransferError } from 'utils/errors';
import { joinClass } from 'utils/style';
import {
  millisToMinutesAndSeconds,
  minutesAndSecondsWithPadding,
} from 'utils/transferValidation';
import {
  TransferWallet,
  registerWalletSigner,
  switchChain,
} from 'utils/wallet';
import TransactionDetails from 'views/v2/Redeem/TransactionDetails';
import WalletSidebar from 'views/v2/Bridge/WalletConnector/Sidebar';

import type { RootState } from 'store';
import TxCompleteIcon from 'icons/TxComplete';
import TxWarningIcon from 'icons/TxWarning';
import TxFailedIcon from 'icons/TxFailed';
import { getAssociatedTokenAddressSync } from '@solana/spl-token';
import { PublicKey } from '@solana/web3.js';
import TxReadyForClaim from 'icons/TxReadyForClaim';

type StyleProps = {
  transitionDuration?: string;
};

const useStyles = makeStyles<StyleProps>()((theme, { transitionDuration }) => ({
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
    padding: '12px 16px',
    backgroundColor: theme.palette.primary.main,
    borderRadius: '8px',
    margin: 'auto',
    maxWidth: '420px',
    width: '100%',
  },
  claimButton: {
    backgroundColor: theme.palette.warning.light,
    color:
      theme.palette.warning.contrastText ?? theme.palette.background.default,
    '&:hover': {
      backgroundColor: theme.palette.warning.main,
    },
  },
  circularProgressCircleIndeterminite: {
    stroke: 'url(#circularGradient)',
    strokeDasharray: '100px, 200px',
    strokeLinecap: 'round',
  },
  circularProgressCircleDeterminite: {
    strokeLinecap: 'round',
    transitionDuration,
    transitionProperty: 'all',
  },
  circularProgressRoot: {
    animationDuration: '1s',
  },
  errorBox: {
    maxWidth: '420px',
  },
  txStatusIcon: {
    color: theme.palette.primary.light,
    width: '105px',
    height: '105px',
  },
  poweredBy: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
    marginTop: '24px',
  },
  delayText: {
    maxWidth: '420px',
  },
}));

const Redeem = () => {
  const dispatch = useDispatch();
  const theme = useTheme();

  const [claimError, setClaimError] = useState('');
  const [isClaimInProgress, setIsClaimInProgress] = useState(false);
  const [transferSuccessEventFired, setTransferSuccessEventFired] =
    useState(false);
  const [etaExpired, setEtaExpired] = useState(false);

  const [isWalletSidebarOpen, setIsWalletSidebarOpen] = useState(false);

  // Start tracking changes in the transaction
  useTrackTransfer();

  const routeContext = React.useContext(RouteContext);

  const {
    transferComplete: isTxComplete,
    route: routeName,
    timestamp: txTimestamp,
    isResumeTx,
    txData,
  } = useSelector((state: RootState) => state.redeem);

  const [unhandledManualClaimError, setUnhandledManualClaimError] =
    useState<any>(undefined);

  const { receipt } = routeContext;
  const isTxAttested = receipt && isAttested(receipt);
  const isTxRefunded = receipt && isRefunded(receipt);
  const isTxFailed =
    (receipt && isFailed(receipt)) || !!unhandledManualClaimError;
  const isTxDestQueued = receipt && isDestinationQueued(receipt);

  const {
    recipient,
    toChain,
    fromChain,
    tokenKey,
    receivedTokenKey,
    amount,
    receiveAmount,
    eta = 0,
  } = txData!;

  const getUSDAmount = useUSDamountGetter();

  const details = getTransferDetails(
    routeName!,
    tokenKey,
    receivedTokenKey,
    fromChain,
    toChain,
    amount,
    getUSDAmount,
  );

  const { classes } = useStyles({ transitionDuration: `${eta}ms` });

  // Handle changes to receiptState as well as uncaught errors when initiating manual redeems
  // There are four cases this handles, in this order:
  //
  // - receipt.state === DestinationFinalized
  // - receipt.state === Refunded
  // - receipt.state === Failed
  // - Unhandled error when manually redeeming
  //
  // Because the unhandled manual redeem error is at the end, we ignore it if
  // we already saw one of the first three cases.
  useEffect(() => {
    const { receipt } = routeContext;

    if (!receipt) return;

    if (isTxComplete) {
      if (!transferSuccessEventFired) {
        // When we see the transfer was complete for the first time,
        // fire a transfer.success telemetry event.
        setTransferSuccessEventFired(true);

        config.triggerEvent({
          type: 'transfer.success',
          details,
        });

        if (!isAutomaticRoute) {
          // Manual routes also fire a second success event specific to manual redeems
          config.triggerEvent({
            type: 'transfer.redeem.success',
            details,
          });
        }

        setIsClaimInProgress(false);
        setClaimError('');
      }
    } else if (isTxRefunded) {
      config.triggerEvent({
        type: 'transfer.refunded',
        details,
      });
    } else if (isTxFailed) {
      const failedReceipt = receipt as FailedTransferReceipt<any>;

      const [uiError, transferError] = interpretTransferError(
        failedReceipt.error,
        toChain,
      );
      setClaimError(uiError);

      config.triggerEvent({
        type: 'transfer.error',
        details,
        error: transferError,
      });

      console.error(
        `Transfer failed with error ${transferError}: ${failedReceipt.error}`,
      );
    } else if (unhandledManualClaimError) {
      const [uiError, transferError] = interpretTransferError(
        unhandledManualClaimError,
        toChain,
      );

      setClaimError(uiError);

      config.triggerEvent({
        type: 'transfer.redeem.error',
        details,
        error: transferError,
      });

      console.error(
        `Caught unhandled error while manually redeeming: ${transferError}: ${unhandledManualClaimError}`,
      );

      // Don't handle error more than once
      setUnhandledManualClaimError(undefined);
    }
  }, [receipt?.state, unhandledManualClaimError]);

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

    if (typeof config.ui.pageHeader === 'string') {
      headerConfig = { ...defaults, text: config.ui.pageHeader };
    } else {
      headerConfig = { ...defaults, ...config.ui.pageHeader };
    }

    return (
      <PageHeader
        title={headerConfig.text}
        align={headerConfig.align}
        showHamburgerMenu={config.ui.showHamburgerMenu}
      />
    );
  }, []);

  // Header showing the status of the transaction
  const statusHeader = useMemo(() => {
    let statusText = 'Transaction submitted';
    if (isTxComplete) {
      statusText = 'Transaction complete';
    } else if (isTxRefunded) {
      statusText = 'Transaction was refunded';
    } else if (isTxFailed) {
      statusText = 'Transaction failed';
    } else if (isTxDestQueued) {
      statusText = 'Transaction delayed';
    } else if (isTxAttested && !isAutomaticRoute) {
      statusText = `Ready to claim on ${toChain}`;
    }

    return (
      <Stack>
        <Typography fontSize={18}>{statusText}</Typography>
      </Stack>
    );
  }, [
    isTxAttested,
    isTxComplete,
    isTxRefunded,
    isTxFailed,
    isTxDestQueued,
    receiveAmount,
    receivedTokenKey,
    recipient,
    toChain,
    config,
  ]);

  // Displays the ETA value and the countdown within the ETA circle
  const etaDisplay = useMemo(() => {
    if (etaExpired) {
      return (
        <Stack>
          <Typography color={theme.palette.text.secondary} fontSize={14}>
            Wrapping up...
          </Typography>
        </Stack>
      );
    }

    const counter = isRunning
      ? minutesAndSecondsWithPadding(minutes, seconds)
      : null;

    let etaElement: string | ReactNode = <CircularProgress size={14} />;

    if (eta) {
      etaElement = millisToMinutesAndSeconds(eta);
    }

    return (
      <Stack alignItems="center" justifyContent="center">
        <Typography color={theme.palette.text.secondary} fontSize={14}>
          ETA {etaElement}
        </Typography>
        <Typography fontSize={28}>{counter}</Typography>
      </Stack>
    );
  }, [eta, etaExpired, isRunning, minutes, seconds]);

  // Value for determinate circular progress bar
  const etaProgressValue = useMemo(() => {
    if (eta && txTimestamp && isRunning) {
      // We return the full bar value when the ETA timer is running
      // and simulate the progress by setting transitionDuration the eta (see useStyles above)
      return 100;
    }

    return 0;
  }, [eta, txTimestamp, isRunning]);

  // In-progress circular progress bar
  const etaCircularProgress = useMemo(() => {
    return (
      <>
        <svg width={0} height={0}>
          <defs>
            <linearGradient
              id="circularGradient"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              <stop
                offset="0%"
                stopColor={theme.palette.primary.main}
                stopOpacity="1"
              />
              <stop
                offset="100%"
                stopColor={theme.palette.background.default}
                stopOpacity="0.1"
              />
            </linearGradient>
          </defs>
        </svg>
        <Box sx={{ position: 'relative' }}>
          <CircularProgress
            variant="determinate"
            sx={(theme) => ({
              color: theme.palette.primary.main,
              opacity: 0.2,
              position: 'absolute',
            })}
            size={140}
            thickness={2}
            value={100}
          />
          <CircularProgress
            variant={etaExpired ? 'indeterminate' : 'determinate'}
            classes={{
              root: classes.circularProgressRoot,
              circle: etaExpired
                ? classes.circularProgressCircleIndeterminite
                : classes.circularProgressCircleDeterminite,
            }}
            disableShrink
            size={140}
            thickness={2}
            value={etaProgressValue}
          />
        </Box>
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
    );
  }, [etaDisplay, etaExpired, etaProgressValue]);

  // Circular progress indicator component for ETA countdown
  const etaCircle = useMemo(() => {
    if (isTxComplete) {
      return <TxCompleteIcon className={classes.txStatusIcon} />;
    } else if (isTxRefunded || isTxDestQueued) {
      return (
        <TxWarningIcon
          className={classes.txStatusIcon}
          sx={{
            color: theme.palette.warning.main,
          }}
        />
      );
    } else if (isTxFailed) {
      return (
        <TxFailedIcon
          className={classes.txStatusIcon}
          sx={{
            color: theme.palette.error.light,
          }}
        />
      );
    } else if (!isAutomaticRoute && isTxAttested) {
      // Waiting for manual redeem
      return (
        <TxReadyForClaim
          className={classes.txStatusIcon}
          sx={{
            color: theme.palette.warning.light,
          }}
        />
      );
    } else {
      // In progress
      return etaCircularProgress;
    }
  }, [
    etaCircularProgress,
    isTxComplete,
    isTxRefunded,
    isTxFailed,
    isTxDestQueued,
    isTxAttested,
  ]);

  useEffect(() => {
    let timer: NodeJS.Timeout | undefined;

    if (routeContext.receipt && isDestinationQueued(routeContext.receipt)) {
      setIsClaimInProgress(true);

      const releaseTime = routeContext.receipt.queueReleaseTime.getTime();
      const delay = releaseTime - Date.now();

      timer = setTimeout(() => {
        setIsClaimInProgress(false);
      }, delay);
    }

    return () => {
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [routeContext.receipt]);

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
    // This will be set back to false by a hook above which looks out for isTxComplete=true
    setIsClaimInProgress(true);
    setClaimError('');

    if (!routeName) {
      throw new Error('Unknown route, can not claim');
    }

    if (!routeContext.receipt) {
      throw new Error('No receipt found, can not claim');
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

    try {
      if (
        chainConfig!.context === Context.ETH &&
        typeof chainConfig.chainId === 'number'
      ) {
        await switchChain(chainConfig.chainId, TransferWallet.RECEIVING);
        await registerWalletSigner(toChain, TransferWallet.RECEIVING);
      }

      if (!routes.isManual(route) && !routes.isFinalizable(route)) {
        throw new Error('Route is not manual or finalizable');
      }

      const signer = await SDKv2Signer.fromChain(
        toChain,
        receivingWallet.address,
        {},
        TransferWallet.RECEIVING,
      );

      const finishPromise = (() => {
        if (isTxDestQueued && routes.isFinalizable(route)) {
          return route.finalize(signer, routeContext.receipt);
        } else if (!isTxDestQueued && routes.isManual(route)) {
          return route.complete(signer, routeContext.receipt);
        } else {
          // Should be unreachable
          return undefined;
        }
      })();

      if (finishPromise) {
        config.triggerEvent({
          type: 'transfer.redeem.start',
          details,
        });

        // Await this promise just so that we catch any errors thrown by it and handle them below
        await finishPromise;
      }
    } catch (e: any) {
      // This could be all kinds of unexpected errors
      // Kick it up to the main useEffect where we handle receipt state changes
      setUnhandledManualClaimError(e);
      setIsClaimInProgress(false);
    }
  };

  // Main CTA button which has separate states for automatic and manual claims
  const actionButton = useMemo(() => {
    if (
      !isTxComplete &&
      !isTxRefunded &&
      !isTxFailed &&
      (isTxDestQueued || !isAutomaticRoute)
    ) {
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
          className={joinClass([classes.actionButton, classes.claimButton])}
          disabled={isClaimInProgress || !isTxAttested}
          variant={claimError ? 'error' : 'primary'}
          onClick={handleManualClaim}
        >
          {isClaimInProgress || !isTxAttested ? (
            <Stack direction="row" alignItems="center">
              <CircularProgress size={24} />
              <Typography textTransform="none">Transfer in progress</Typography>
            </Stack>
          ) : (
            <Typography textTransform="none">
              Claim tokens to complete transfer
            </Typography>
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
    isTxRefunded,
    isTxFailed,
    isTxDestQueued,
    isConnectedToReceivingWallet,
  ]);

  const txDelayedText = useMemo(() => {
    if (!routeContext.receipt || !isDestinationQueued(routeContext.receipt)) {
      return null;
    }

    const { to, queueReleaseTime } = routeContext.receipt;
    const symbol = config.tokens[receivedTokenKey]?.symbol || '';
    const releaseTime = queueReleaseTime.toLocaleString();

    return (
      <Typography
        color={theme.palette.text.secondary}
        fontSize={14}
        className={classes.delayText}
      >
        {`Your transfer to ${to} is delayed due to rate limits configured by ${symbol}. After
        the delay ends on ${releaseTime}, you will need to tap "Claim" to
        complete your transfer.`}
      </Typography>
    );
  }, [routeContext.receipt, config, receivedTokenKey]);

  return (
    <div className={joinClass([classes.container, classes.spacer])}>
      {header}
      {statusHeader}
      <Box
        sx={{
          position: 'relative',
          display: 'inline-flex',
          alignItems: 'center',
          marginBottom: '24px',
          height: '140px',
        }}
      >
        {etaCircle}
      </Box>
      <TransactionDetails />
      {actionButton}
      {txDelayedText}
      <AlertBannerV2
        error
        content={claimError}
        show={!!claimError}
        className={classes.errorBox}
      />
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
