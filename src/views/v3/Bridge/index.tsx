import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useMediaQuery, useTheme } from '@mui/material';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import CopyIcon from '@mui/icons-material/ContentCopy';
import DoneIcon from '@mui/icons-material/Done';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import { amount as sdkAmount } from '@wormhole-foundation/sdk';
import type { Chain } from '@wormhole-foundation/sdk';

import FooterNavBar from 'components/FooterNavBar';
import Header from 'components/Header';
import AlertBannerV3 from 'components/v3/AlertBanner';
import Button from 'components/v3/Button';
import config from 'config';
import type { Token } from 'config/tokens';
import { useTokens } from 'contexts/TokensContext';
import useComputeDestinationTokens from 'hooks/useComputeDestinationTokens';
import { useSortedRoutesWithQuotes } from 'hooks/useSortedRoutesWithQuotes';
import { useAmountValidation } from 'hooks/useAmountValidation';
import useConfirmTransaction from 'hooks/useConfirmTransaction';
import { useGetTokens } from 'hooks/useGetTokens';
import useGetTokenBalances from 'hooks/useGetTokenBalances';
import { useWalletCompatibility } from 'hooks/useWalletCompatibility';
import HistoryIcon from 'icons/History';
import PoweredByIcon from 'icons/PoweredBy';
import type { RootState } from 'store';
import {
  selectFromChain,
  selectToChain,
  setToken,
  setDestToken,
  setTransferRoute,
  clearToken,
  clearDestToken,
} from 'store/transferInput';
import { copyTextToClipboard } from 'utils';
import { OPACITY } from 'utils/style';
import ConfigurablePageHeader from 'components/ConfigurablePageHeader';
import { isTransferValid, useValidate } from 'utils/transferValidation';
import { TransferWallet } from 'utils/wallet';
import { useConnectToLastUsedWallet } from 'hooks/useConnectToLastUsedWallet';
import WalletConnector from 'views/v3/Bridge/WalletConnector';
import AssetPicker from 'views/v3/Bridge/AssetPicker';
import Routes from 'views/v3/Bridge/Routes';
import SwapInputs from 'views/v3/Bridge/SwapInputs';
import TxHistoryWidget from 'views/v3/TxHistory/Widget';
import TxHistory from '../TxHistory';
import AmountValidationError from './AmountValidationError';
import { getFilteredChains } from 'utils/sdkv2';

export type BridgeProps = {
  showHistory?: boolean;
};

function Bridge(props: BridgeProps) {
  const theme: any = useTheme();
  const dispatch = useDispatch();

  const [showHistory, setShowHistory] = useState(props.showHistory ?? false);

  const { lastTokenCacheUpdate } = useTokens();
  const [errorCopied, setErrorCopied] = useState(false);

  const mobile = useMediaQuery(theme.breakpoints.down('sm'));

  const popoverAnchorRef = useRef<HTMLElement>(null);

  const styles = useMemo(
    () => ({
      assetPickerTitle: {
        color: theme.palette.text.secondary,
        display: 'flex',
        minHeight: '40px',
        alignItems: 'center',
        justifyContent: 'space-between',
      },
      bridgeContent: {
        margin: 'auto',
        maxWidth: '452px',
      },
      bridgeHeader: {
        width: '100%',
        minHeight: '28px',
        display: 'flex',
        alignItems: 'center',
        padding: '20px 0',
      },
      doneIcon: {
        fontSize: '14px',
        color: theme.palette.success.main,
      },
      confirmTransaction: {
        padding: '8px 16px',
        height: '48px',
        margin: 'auto',
        maxWidth: '420px',
        width: '100%',
      },
      copyIcon: {
        fontSize: '14px',
      },
      ctaContainer: {
        width: '100%',
      },
      formContent: {
        backgroundColor: theme.palette.background.form + OPACITY[20],
        borderRadius: '8px',
        padding: '20px 16px',
        display: 'flex',
        flexDirection: 'column',
        width: '452px',
        gap: '16px',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)', // Safari support
      },
      formContentMobile: {
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
      },
      titleContent: {
        maxWidth: mobile ? '420px' : '452px',
      },
    }),
    [
      mobile,
      theme.palette.background.form,
      theme.palette.success.main,
      theme.palette.text.secondary,
    ],
  );

  // --- pipeline state gathering ---
  // Connected wallets, if any
  const { sending: sendingWallet, receiving: receivingWallet } = useSelector(
    (state: RootState) => state.wallet,
  );

  const {
    fromChain: sourceChain,
    toChain: destChain,
    route,
    preferredRouteName,
    amount,
    toNativeToken,
    isTransactionInProgress,
    validations,
  } = useSelector((state: RootState) => ({
    ...state.transferInput,
    ...state.relay,
  }));

  const { sourceToken, destToken } = useGetTokens();
  const isSameChainSwap = sourceChain === destChain;

  // --- pipeline usage ---
  const {
    allSupportedRoutes,
    sortedRoutes,
    sortedRoutesWithQuotes,
    quotes,
    failedQuotes,
    isFetching: isFetchingQuotes,
  } = useSortedRoutesWithQuotes({
    amount,
    fromChain: sourceChain,
    toChain: destChain,
    preferredRouteName,
    sourceToken,
    destToken,
    toNativeToken,
    receivingWallet,
  });

  const { isFetching: isFetchingSupportedDestTokens, supportedDestTokens } =
    useComputeDestinationTokens({
      sourceChain,
      destChain,
      sourceToken,
      route,
    });

  const {
    error: txError,
    errorInternal: txErrorInternal,
    onConfirm,
  } = useConfirmTransaction({ quotes });

  // Set selectedRoute if the route is auto-selected
  // After the auto-selection, we set selectedRoute when user clicks on a route in the list
  useEffect(() => {
    if (sortedRoutesWithQuotes.length === 0) {
      dispatch(setTransferRoute(''));
    } else {
      const preferredRoute = sortedRoutesWithQuotes.find(
        (route) => route.route === preferredRouteName,
      );
      const autoselectedRoute =
        route ?? preferredRoute?.route ?? sortedRoutesWithQuotes[0].route;

      const isSelectedRouteValid =
        sortedRoutesWithQuotes.findIndex((r) => r.route === autoselectedRoute) >
        -1;

      if (!isSelectedRouteValid) {
        dispatch(setTransferRoute(''));
      }

      // If no route is autoselected or we already have a valid selected route,
      // we should avoid overwriting it
      if (!autoselectedRoute || (route && isSelectedRouteValid)) {
        return;
      }

      const routeData = sortedRoutesWithQuotes?.find(
        (rs) => rs.route === autoselectedRoute,
      );

      if (routeData) dispatch(setTransferRoute(routeData.route));
    }
  }, [preferredRouteName, route, sortedRoutesWithQuotes, dispatch]);

  // Connect to any previously used wallets for the selected networks
  const { isConnecting: isConnectingWallet } = useConnectToLastUsedWallet(
    sourceChain,
    destChain,
  );

  // Call to initiate transfer inputs validations
  useValidate();

  // Get input validation result
  const isValid = useMemo(() => isTransferValid(validations), [validations]);

  // All supported chains from the given configuration and any custom override
  const supportedChains = useMemo(
    () => config.routes.allSupportedChains(),
    // Disabled because we're using the global cache and we have to monitor values that aren't directly used in this hook
    // Include config.routes to ensure updates when routes change dynamically (e.g., NTT config loading)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [config.chains, config.routes],
  );

  const sourceTokens = useMemo(() => {
    if (sourceChain) {
      return config.tokens.getAllForChain(sourceChain);
    } else {
      return [];
    }
    // Disabled because we're using the global cache and we have to monitor values that aren't directly used in this hook
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sourceChain, lastTokenCacheUpdate]);

  // Supported chains for the source network
  const supportedSourceChains = useMemo(() => {
    return getFilteredChains(supportedChains, destChain);
  }, [destChain, supportedChains]);

  // Supported chains for the destination network
  const supportedDestChains = useMemo(() => {
    return getFilteredChains(supportedChains, sourceChain);
  }, [sourceChain, supportedChains]);

  // Build balance requests for source and destination
  const sourceBalanceRequest = useMemo(() => {
    if (sourceChain && sendingWallet?.address) {
      return {
        chain: sourceChain,
        wallet: sendingWallet,
        tokens: sourceTokens,
      };
    }
    return undefined;
  }, [sourceChain, sendingWallet, sourceTokens]);

  const destBalanceRequest = useMemo(() => {
    if (destChain && receivingWallet?.address) {
      return {
        chain: destChain,
        wallet: receivingWallet,
        tokens: config.tokens.getAllForChain(destChain),
      };
    }
    return undefined;
  }, [destChain, receivingWallet]);

  const balances = useGetTokenBalances({
    source: sourceBalanceRequest,
    destination: destBalanceRequest,
  });

  // Validate amount
  const amountValidation = useAmountValidation({
    balance: sourceToken
      ? balances.source.balances[sourceToken.key]?.balance
      : null,
    routes: allSupportedRoutes,
    quotes,
    failedQuotes,
    tokenSymbol: sourceToken?.symbol ?? '',
    isLoading: balances.isFetching || isFetchingQuotes,
    disabled: !sourceChain || !sourceToken,
  });

  // Handlers for source asset picker
  const handleSourceChainChange = useCallback(
    (value: Chain) => {
      selectFromChain(dispatch, value, sendingWallet);
      dispatch(clearToken());
    },
    [dispatch, sendingWallet],
  );

  const handleSourceTokenChange = useCallback(
    (value: Token) => {
      dispatch(setToken(value.tuple));
    },
    [dispatch],
  );

  // Handlers for destination asset picker
  const handleDestChainChange = useCallback(
    (value: Chain) => {
      selectToChain(dispatch, value, receivingWallet);
      dispatch(clearDestToken());
    },
    [dispatch, receivingWallet],
  );

  const handleDestTokenChange = useCallback(
    (value: Token) => {
      dispatch(setDestToken(value.tuple));
    },
    [dispatch],
  );

  // Quote result for destination picker
  const destQuoteResult = quotes && route ? quotes[route] : undefined;

  // Handler for history toggle
  const handleHistoryToggle = useCallback(() => {
    setShowHistory((value) => !value);
    config.triggerEvent({
      type: 'history.load',
      details: {
        wallet: sendingWallet?.address,
      },
    });
  }, [sendingWallet?.address]);

  const isTxHistoryDisabled =
    !sendingWallet?.address || isTransactionInProgress;

  // Handler for route change
  const handleRouteChange = useCallback(
    (r: string) => {
      dispatch(setTransferRoute(r));
    },
    [dispatch],
  );

  // Determine which wallet connector to show
  const walletConnectorProps = useMemo(() => {
    if (sendingWallet?.address && receivingWallet?.address) {
      return null;
    }
    if (sendingWallet?.address && !receivingWallet?.address) {
      return {
        disabled: !destChain,
        side: 'destination' as const,
        type: TransferWallet.RECEIVING,
      };
    }
    return {
      disabled: !sourceChain,
      side: 'source' as const,
      type: TransferWallet.SENDING,
    };
  }, [
    sendingWallet?.address,
    receivingWallet?.address,
    destChain,
    sourceChain,
  ]);

  const { isCompatible: isWalletCompatible } = useWalletCompatibility({
    sendingWallet,
    receivingWallet,
    sourceChain,
    destChain,
    routes: sortedRoutes,
  });

  const transactionError = useMemo(() => {
    if (!txError) {
      return null;
    }

    return (
      <Box sx={{ marginBottom: 2 }}>
        <AlertBannerV3 error testId="send-error-message">
          {txError}
        </AlertBannerV3>
        {txErrorInternal && txErrorInternal.message && config.ui.getHelpUrl ? (
          <Typography fontSize={14} sx={{ marginTop: 1 }}>
            Having trouble?{' '}
            <a
              href="#"
              onClick={() => {
                copyTextToClipboard(txErrorInternal.message);
                setErrorCopied(true);
                setTimeout(() => setErrorCopied(false), 3000);
              }}
            >
              Copy the error logs{' '}
              {errorCopied ? (
                <DoneIcon sx={styles.doneIcon} />
              ) : (
                <CopyIcon sx={styles.copyIcon} />
              )}
            </a>
            {' and '}
            <a href={config.ui.getHelpUrl} target="_blank" rel="noreferrer">
              ask for help
            </a>
            .
          </Typography>
        ) : null}
      </Box>
    );
  }, [styles.copyIcon, styles.doneIcon, errorCopied, txError, txErrorInternal]);

  const hasEnteredAmount = amount && sdkAmount.whole(amount) > 0;

  const hasConnectedWallets = sendingWallet.address && receivingWallet.address;

  const confirmTransactionDisabled =
    !sourceChain ||
    !sourceToken ||
    !destChain ||
    !destToken ||
    !hasConnectedWallets ||
    !isWalletCompatible ||
    !route ||
    !isValid ||
    isFetchingQuotes ||
    !hasEnteredAmount ||
    isTransactionInProgress ||
    !!amountValidation.error;

  // Review transaction button is shown only when everything is ready
  const confirmTransactionButton = useMemo(() => {
    return (
      <Button
        disabled={confirmTransactionDisabled}
        data-testid="confirm-transaction-button"
        variant="primary"
        styleOverrides={styles.confirmTransaction}
        onClick={() => onConfirm()}
      >
        {isTransactionInProgress ? (
          <Typography
            display="flex"
            alignItems="center"
            gap={1}
            textTransform="none"
          >
            {mobile ? 'Preparing' : 'Preparing transaction'}
          </Typography>
        ) : !isTransactionInProgress && isFetchingQuotes ? (
          <Typography
            display="flex"
            alignItems="center"
            gap={1}
            textTransform="none"
          >
            {mobile ? 'Refreshing' : 'Refreshing quote'}
          </Typography>
        ) : (
          <Typography textTransform="none">
            {mobile ? 'Confirm' : 'Confirm transaction'}
          </Typography>
        )}
      </Button>
    );
  }, [
    confirmTransactionDisabled,
    styles.confirmTransaction,
    isTransactionInProgress,
    mobile,
    isFetchingQuotes,
    onConfirm,
  ]);

  const confirmButtonTooltip =
    !sourceChain || !sourceToken
      ? 'Please select a source asset'
      : !destChain || !destToken
      ? 'Please select a destination asset'
      : !hasEnteredAmount
      ? 'Please enter an amount'
      : isFetchingQuotes
      ? 'Loading quotes...'
      : !route
      ? 'Please select a quote'
      : '';

  const bridgeContent = (
    <>
      <Stack sx={{ gap: '4px', position: 'relative' }}>
        {/* Source asset picker */}
        <Box ref={popoverAnchorRef}>
          <AssetPicker
            chain={sourceChain}
            chainList={supportedSourceChains}
            token={sourceToken}
            tokenList={sourceTokens}
            setChain={handleSourceChainChange}
            setToken={handleSourceTokenChange}
            wallet={sendingWallet}
            isSameChainSwap={isSameChainSwap}
            isSource={true}
            isTransactionInProgress={isTransactionInProgress}
            dataTestId="source-asset-picker"
            isConnectingWallet={isConnectingWallet}
            balances={balances.source.balances}
            isFetchingBalances={balances.isFetching}
            anchorEl={popoverAnchorRef.current}
            amountValidation={amountValidation}
          />
        </Box>
        {/* Swap source/destination assets button */}
        <SwapInputs />
        {/* Destination asset picker */}
        <AssetPicker
          chain={destChain}
          chainList={supportedDestChains}
          token={destToken}
          sourceToken={sourceToken}
          tokenList={supportedDestTokens}
          isFetchingQuotes={isFetchingQuotes}
          isFetchingTokens={
            supportedDestTokens.length === 0 && isFetchingSupportedDestTokens
          }
          setChain={handleDestChainChange}
          setToken={handleDestTokenChange}
          wallet={receivingWallet}
          isSameChainSwap={isSameChainSwap}
          isSource={false}
          isTransactionInProgress={isTransactionInProgress}
          dataTestId="dest-asset-picker"
          isConnectingWallet={isConnectingWallet}
          balances={balances.destination.balances}
          isFetchingBalances={balances.isFetching}
          quote={destQuoteResult?.success ? destQuoteResult : undefined}
          anchorEl={popoverAnchorRef.current}
        />
      </Stack>
      <Box component="span" sx={styles.ctaContainer}>
        {hasConnectedWallets ? (
          <Tooltip title={confirmButtonTooltip}>
            <span>{confirmTransactionButton}</span>
          </Tooltip>
        ) : walletConnectorProps ? (
          <WalletConnector {...walletConnectorProps} />
        ) : null}
      </Box>
      {transactionError}
      <AmountValidationError validation={amountValidation} />
    </>
  );

  const iconTooltip =
    (!sendingWallet?.address && 'No connected wallets found') ||
    (showHistory ? 'Show bridge' : 'Show history');

  return (
    <Box sx={{ ...styles.bridgeContent }} data-testid="bridge-view">
      <Box sx={styles.titleContent}>
        <ConfigurablePageHeader />
        {config.ui.showInProgressWidget && (
          <TxHistoryWidget disabled={isTransactionInProgress} />
        )}
        <Box sx={styles.bridgeHeader}>
          <Header
            align="left"
            text={config.ui.title ?? 'Wormhole Connect'}
            size={18}
            testId="bridge-view-header"
          />
          <Tooltip title={iconTooltip}>
            <span>
              <IconButton
                data-testid="history-button"
                aria-label={showHistory ? 'Show bridge' : 'Show history'}
                sx={{
                  backgroundColor: theme.palette.background.form + OPACITY[20],
                  padding: '12px',
                  width: '40px',
                  height: '40px',
                  border: `1px solid ${theme.palette.input.border}`,
                  borderRadius: '40px',
                }}
                disabled={isTxHistoryDisabled}
                onClick={handleHistoryToggle}
              >
                {showHistory ? (
                  <SwapHorizIcon sx={{ fontSize: '16px' }} />
                ) : (
                  <HistoryIcon sx={{ fontSize: '16px' }} />
                )}
              </IconButton>
            </span>
          </Tooltip>
        </Box>
      </Box>

      <Box
        sx={
          mobile ? { ...styles.formContentMobile } : { ...styles.formContent }
        }
      >
        {showHistory ? <TxHistory /> : bridgeContent}
      </Box>
      {hasEnteredAmount && !showHistory && (
        <Box sx={{ marginTop: '12px', width: '100%' }}>
          <Routes
            routes={sortedRoutes}
            selectedRoute={route}
            onRouteChange={handleRouteChange}
            quotes={quotes}
            isLoading={isFetchingQuotes}
          />
        </Box>
      )}
      {config.ui.showFooter && (
        <>
          <PoweredByIcon color={theme.palette.text.primary} />
          <FooterNavBar />
        </>
      )}
    </Box>
  );
}

export default React.memo(Bridge);
