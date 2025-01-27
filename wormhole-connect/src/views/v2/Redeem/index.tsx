import React, {
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTimer } from 'react-timer-hook';
import { useTheme } from '@mui/material';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import ChevronLeft from '@mui/icons-material/ChevronLeft';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import {
  isAttested,
  isCompleted,
  isDestinationQueued,
  isRefunded,
  isFailed,
  routes,
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
import {
  removeTxFromLocalStorage,
  updateTxInLocalStorage,
} from 'utils/inProgressTxCache';
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
import { useConnectToLastUsedWallet } from 'utils/wallet';

import type { RootState } from 'store';
import TxCompleteIcon from 'icons/TxComplete';
import TxWarningIcon from 'icons/TxWarning';
import TxFailedIcon from 'icons/TxFailed';
import { getAssociatedTokenAddressSync } from '@solana/spl-token';
import { PublicKey } from '@solana/web3.js';
import TxReadyForClaim from 'icons/TxReadyForClaim';
import { useGetRedeemTokens } from 'hooks/useGetTokens';
import { tokenIdFromTuple } from 'config/tokens';

type StyleProps = {
  transitionDuration?: string | undefined;
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
  backButton: {
    alignItems: 'start',
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
    transitionTimingFunction: 'linear',
  },
  circularProgressRoot: {
    animationDuration: '1s',
  },
  errorBox: {
    maxWidth: '420px',
  },
  txStatusIcon: {
    width: '105px',
    height: '105px',
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

  const routeContext = React.useContext(RouteContext);

  const { sourceToken, destToken } = useGetRedeemTokens();

  if (!sourceToken) {
    // TODO
  }
  if (!destToken) {
    // TODO
  }

  useConnectToLastUsedWallet();

  const {
    route: routeName,
    timestamp: txTimestamp,
    isResumeTx,
    txData,
  } = useSelector((state: RootState) => state.redeem);

  const [unhandledManualClaimError, setUnhandledManualClaimError] =
    useState<any>(undefined);

  const { receipt, route } = routeContext;
  const isTxAttested = receipt && isAttested(receipt);
  const isTxRefunded = receipt && isRefunded(receipt);
  const isTxFailed =
    (receipt && isFailed(receipt)) || !!unhandledManualClaimError;
  const isTxDestQueued = receipt && isDestinationQueued(receipt);

  const {
    recipient,
    toChain,
    fromChain,
    token,
    receivedToken,
    amount,
    eta = 0,
  } = txData!;

  const getUSDAmount = useUSDamountGetter();

  const etaDate: Date | undefined = useMemo(() => {
    if (eta && txTimestamp) {
      return new Date(txTimestamp + eta);
    } else {
      return undefined;
    }
  }, [eta, txTimestamp]);

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
  }, [eta, isRunning, restart, txTimestamp]);

  // Start tracking changes in the transaction
  const txTrackingResult = useTrackTransfer({
    receipt,
    routeName,
    sdkRoute: route,
    eta: etaDate,
  });

  // We need check the initial receipt state and tracking result together
  // for the latest status on transaction completion
  const isTxCompleted =
    (receipt && isCompleted(receipt)) || txTrackingResult.isCompleted;

  // Set latest receipt from useTrackTransfer in RouteContext
  useEffect(() => {
    if (txTrackingResult.receipt) {
      routeContext.setReceipt(txTrackingResult.receipt);
    }
  }, [routeContext, txTrackingResult.receipt]);

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

  const details = getTransferDetails(
    routeName!,
    sourceToken!,
    destToken!,
    fromChain,
    toChain,
    amount,
    getUSDAmount,
  );

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

    if (isTxCompleted) {
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

        if (txData?.sendTx) {
          removeTxFromLocalStorage(txData?.sendTx);
        }
      }
    } else if (isTxRefunded) {
      config.triggerEvent({
        type: 'transfer.refunded',
        details,
      });
    } else if (isFailed(receipt)) {
      const [uiError, transferError] = interpretTransferError(
        receipt.error,
        details,
      );
      setClaimError(uiError);

      config.triggerEvent({
        type: 'transfer.error',
        details,
        error: transferError,
      });

      console.error(
        `Transfer failed with error ${transferError}: ${receipt.error}`,
      );

      setIsClaimInProgress(false);
    } else if (unhandledManualClaimError) {
      const [uiError, transferError] = interpretTransferError(
        unhandledManualClaimError,
        details,
      );

      setClaimError(uiError);

      config.triggerEvent({
        type: 'transfer.redeem.error',
        details,
        error: transferError,
      });

      console.error(
        `Error while manually redeeming: ${transferError.type} - ${unhandledManualClaimError}`,
      );

      setIsClaimInProgress(false);
    } else if (isTxAttested && !isAutomaticRoute && txData?.sendTx) {
      // If this is a manual transaction in attested state,
      // we will mark the local storage item as readyToClaim
      updateTxInLocalStorage(txData?.sendTx, 'isReadyToClaim', true);
    }
    // We should run this side-effect only when tx/receipt status changes or we receive an error.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    receipt?.state,
    isTxCompleted,
    isTxRefunded,
    isTxAttested,
    unhandledManualClaimError,
    transferSuccessEventFired,
  ]);

  const receivingWallet = useSelector(
    (state: RootState) => state.wallet.receiving,
  );

  // Time remaining to reach the estimated completion of the transaction
  const remainingEta = useMemo(() => {
    const etaCompletion = txTimestamp + eta;
    const now = Date.now();
    if (etaCompletion > now) {
      return etaCompletion - now;
    }

    return 0;
  }, [txTimestamp, eta]);

  const { classes } = useStyles({
    transitionDuration: `${remainingEta}ms`,
  });

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

    return <PageHeader title={headerConfig.text} align={headerConfig.align} />;
  }, []);

  // Header showing the status of the transaction
  const statusHeader = useMemo(() => {
    let statusText = 'Transaction submitted';
    if (isTxCompleted) {
      statusText = 'Transaction complete';
    } else if (isTxRefunded) {
      statusText = 'Transaction was refunded';
    } else if (isTxFailed) {
      statusText = 'Transaction failed';
    } else if (isTxDestQueued) {
      statusText = 'Transaction delayed';
    } else if (isTxAttested && !isAutomaticRoute) {
      if (routeName === 'HyperliquidRoute') {
        statusText = `Complete transfer below`;
      } else {
        statusText = `Ready to claim on ${toChain}`;
      }
    }

    return (
      <Stack>
        <Typography fontSize={18}>{statusText}</Typography>
      </Stack>
    );
  }, [
    isTxCompleted,
    isTxRefunded,
    isTxFailed,
    isTxDestQueued,
    isTxAttested,
    isAutomaticRoute,
    routeName,
    toChain,
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
  }, [
    eta,
    etaExpired,
    isRunning,
    minutes,
    seconds,
    theme.palette.text.secondary,
  ]);

  // Value for determinate circular progress bar
  const etaProgressValue = useMemo(() => {
    if (eta) {
      if (isRunning || remainingEta === 0) {
        // We return the full bar value when the ETA timer is running
        // and simulate the progress by setting transitionDuration (see useStyles above)
        return 100;
      }

      // This happens during Redeem view's initial loading before the ETA timer starts
      // We calculate progress bar's initial value from completed eta
      // This value should be between 0-100
      const completedEta = eta - remainingEta;
      const percentRatio = completedEta / eta;
      return Math.floor(percentRatio * 100);
    }

    // Set initial value to zero if we don't have an ETA
    return 0;
  }, [eta, remainingEta, isRunning]);

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
            disableShrink={etaExpired} // Disable shrinking for indeterminate progress, which is when eta expires
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
  }, [
    classes.circularProgressCircleDeterminite,
    classes.circularProgressCircleIndeterminite,
    classes.circularProgressRoot,
    etaDisplay,
    etaExpired,
    etaProgressValue,
    theme.palette.background.default,
    theme.palette.primary.main,
  ]);

  // Circular progress indicator component for ETA countdown
  const etaCircle = useMemo(() => {
    if (isTxCompleted) {
      return (
        <TxCompleteIcon
          className={classes.txStatusIcon}
          sx={{ color: theme.palette.primary.light }}
        />
      );
    } else if (isTxRefunded || isTxDestQueued) {
      return (
        <TxWarningIcon
          className={classes.txStatusIcon}
          sx={{ color: theme.palette.warning.main }}
        />
      );
    } else if (isTxFailed) {
      return (
        <TxFailedIcon
          className={classes.txStatusIcon}
          sx={{ color: theme.palette.error.light }}
        />
      );
    } else if (!isAutomaticRoute && isTxAttested) {
      // Waiting for manual redeem
      return (
        <TxReadyForClaim
          className={classes.txStatusIcon}
          sx={{ color: theme.palette.warning.light }}
        />
      );
    } else {
      // In progress
      return etaCircularProgress;
    }
  }, [
    classes.txStatusIcon,
    etaCircularProgress,
    isAutomaticRoute,
    isTxCompleted,
    isTxRefunded,
    isTxDestQueued,
    isTxFailed,
    isTxAttested,
    theme.palette.primary.light,
    theme.palette.warning.main,
    theme.palette.warning.light,
    theme.palette.error.light,
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
      const { address: receiveTokenAddress } = tokenIdFromTuple(receivedToken);

      const ata = getAssociatedTokenAddressSync(
        new PublicKey(receiveTokenAddress.toString()),
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
    receivedToken,
  ]);

  // Callback for claim action in Manual route transactions
  const handleManualClaim = useCallback(async () => {
    // This will be set back to false by a hook above which looks out for isTxComplete=true
    setIsClaimInProgress(true);
    setClaimError('');
    setUnhandledManualClaimError(undefined);

    if (!routeName) {
      throw new Error('Unknown route, can not claim');
    }

    if (!routeContext.receipt) {
      throw new Error('No receipt found, can not claim');
    }

    const transferDetails = {
      route: routeName,
      fromToken: getTokenDetails(config.tokens.mustGet(token)),
      toToken: getTokenDetails(config.tokens.mustGet(receivedToken)),
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
  }, [
    details,
    fromChain,
    isConnectedToReceivingWallet,
    isTxDestQueued,
    receivingWallet.address,
    token,
    routeContext.receipt,
    routeContext.route,
    routeName,
    toChain,
    receivedToken,
  ]);

  // Main CTA button which has separate states for automatic and manual claims
  const actionButton = useMemo(() => {
    if (isClaimInProgress) {
      return (
        <Button disabled variant="primary" className={classes.actionButton}>
          <Typography
            display="flex"
            alignItems="center"
            gap={1}
            textTransform="none"
          >
            <CircularProgress
              size={16}
              sx={{
                color: theme.palette.primary.contrastText,
              }}
            />
            Transfer in progress
          </Typography>
        </Button>
      );
    }

    // Checking if transaction can be manually claimed
    if (isTxDestQueued || (!isAutomaticRoute && isTxAttested)) {
      if (!isConnectedToReceivingWallet) {
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
      } else {
        return (
          <Button
            className={joinClass([classes.actionButton, classes.claimButton])}
            variant={claimError ? 'error' : 'primary'}
            onClick={handleManualClaim}
          >
            <Typography textTransform="none">
              {routeName === 'HyperliquidRoute'
                ? 'Approve deposit to Hyperliquid'
                : 'Claim tokens to complete transfer'}
            </Typography>
          </Button>
        );
      }
    }

    return (
      <>
        <Button
          variant="primary"
          className={classes.actionButton}
          onClick={() => {
            dispatch(setRoute('bridge'));
          }}
        >
          <Typography textTransform="none">Start a new transaction</Typography>
        </Button>
        {!isTxCompleted && (
          <Typography fontSize="12px" sx={{ margin: 'auto', opacity: 0.6 }}>
            Your current transaction will continue to process in the background.
          </Typography>
        )}
      </>
    );
  }, [
    claimError,
    classes.actionButton,
    classes.claimButton,
    dispatch,
    handleManualClaim,
    isAutomaticRoute,
    isClaimInProgress,
    isConnectedToReceivingWallet,
    isTxAttested,
    isTxCompleted,
    isTxDestQueued,
    routeName,
    theme.palette.primary.contrastText,
  ]);

  const txDelayedText = useMemo(() => {
    if (!routeContext.receipt || !isDestinationQueued(routeContext.receipt)) {
      return null;
    }

    const { to, queueReleaseTime } = routeContext.receipt;
    const symbol = config.tokens.get(receivedToken)?.symbol || '';
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
  }, [
    classes.delayText,
    receivedToken,
    routeContext.receipt,
    theme.palette.text.secondary,
  ]);

  return (
    <div className={joinClass([classes.container, classes.spacer])}>
      {header}
      <Stack className={classes.backButton}>
        <IconButton
          sx={{ padding: 0 }}
          onClick={() => dispatch(setRoute('bridge'))}
        >
          <ChevronLeft sx={{ fontSize: '32px' }} />
        </IconButton>
      </Stack>
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
      <PoweredByIcon color={theme.palette.text.primary} />
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
