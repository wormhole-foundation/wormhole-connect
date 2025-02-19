import React, { useEffect, useMemo, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { makeStyles } from 'tss-react/mui';
import { useMediaQuery, useTheme } from '@mui/material';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import CopyIcon from '@mui/icons-material/ContentCopy';
import DoneIcon from '@mui/icons-material/Done';
import HistoryIcon from '@mui/icons-material/History';
import { amount as sdkAmount } from '@wormhole-foundation/sdk';
import type { Chain } from '@wormhole-foundation/sdk';

import FooterNavBar from 'components/FooterNavBar';
import Header, { Alignment } from 'components/Header';
import PageHeader from 'components/PageHeader';
import AlertBannerV2 from 'components/v2/AlertBanner';
import Button from 'components/v2/Button';
import config from 'config';
import useFetchSupportedRoutes from 'hooks/useFetchSupportedRoutes';
import useComputeDestinationTokens from 'hooks/useComputeDestinationTokens';
import useComputeSourceTokens from 'hooks/useComputeSourceTokens';
import { useSortedRoutesWithQuotes } from 'hooks/useSortedRoutesWithQuotes';
import { useAmountValidation } from 'hooks/useAmountValidation';
import useConfirmTransaction from 'hooks/useConfirmTransaction';
import useGetTokenBalances from 'hooks/useGetTokenBalances';
import PoweredByIcon from 'icons/PoweredBy';
import type { RootState } from 'store';
import { setRoute as setAppRoute } from 'store/router';
import {
  selectFromChain,
  selectToChain,
  setToken,
  setDestToken,
  setTransferRoute,
} from 'store/transferInput';
import { copyTextToClipboard } from 'utils';
import { joinClass } from 'utils/style';
import { isTransferValid, useValidate } from 'utils/transferValidation';
import { TransferWallet, useConnectToLastUsedWallet } from 'utils/wallet';
import WalletConnector from 'views/v2/Bridge/WalletConnector';
import AssetPicker from 'views/v2/Bridge/AssetPicker';
import WalletController from 'views/v2/Bridge/WalletConnector/Controller';
import AmountInput from 'views/v2/Bridge/AmountInput';
import Routes from 'views/v2/Bridge/Routes';
import SwapInputs from 'views/v2/Bridge/SwapInputs';
import TxHistoryWidget from 'views/v2/TxHistory/Widget';

import { useWalletCompatibility } from 'hooks/useWalletCompatibility';
import { useGetTokens } from 'hooks/useGetTokens';
import { Token } from 'config/tokens';

import { useTokens } from 'contexts/TokensContext';

const useStyles = makeStyles()((theme: any) => ({
  assetPickerContainer: {
    width: '100%',
    position: 'relative',
  },
  assetPickerTitle: {
    color: theme.palette.text.secondary,
    display: 'flex',
    minHeight: '40px',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bridgeContent: {
    margin: 'auto',
    maxWidth: '420px',
  },
  bridgeHeader: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
  },
  doneIcon: {
    fontSize: '14px',
    color: theme.palette.success.main,
  },
  confirmTransaction: {
    padding: '8px 16px',
    borderRadius: '8px',
    height: '48px',
    margin: 'auto',
    maxWidth: '420px',
    width: '100%',
  },
  copyIcon: {
    fontSize: '14px',
  },
  ctaContainer: {
    marginTop: '8px',
    width: '100%',
  },
  spacer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
}));

/**
 * Bridge is the main component for Bridge view
 *
 */
const Bridge = () => {
  const { classes } = useStyles();
  const theme = useTheme();
  const dispatch = useDispatch();

  const { lastTokenCacheUpdate } = useTokens();
  const [errorCopied, setErrorCopied] = useState(false);

  const mobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Connected wallets, if any
  const { sending: sendingWallet, receiving: receivingWallet } = useSelector(
    (state: RootState) => state.wallet,
  );

  const {
    fromChain: sourceChain,
    toChain: destChain,
    route,
    preferredRouteName,
    supportedSourceTokens,
    amount,
    validations,
    isTransactionInProgress,
  } = useSelector((state: RootState) => state.transferInput);

  const { sourceToken, destToken } = useGetTokens();

  const {
    allSupportedRoutes,
    sortedRoutes,
    sortedRoutesWithQuotes,
    quotesMap,
    isFetching: isFetchingQuotes,
  } = useSortedRoutesWithQuotes();

  // Compute and set source tokens
  const { isFetching: isFetchingSupportedSourceTokens } =
    useComputeSourceTokens({
      sourceChain,
      destChain,
      sourceToken,
      destToken,
      route,
    });

  // Compute and set destination tokens
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
  } = useConfirmTransaction({ quotes: quotesMap });

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
  }, [preferredRouteName, route, sortedRoutesWithQuotes]);

  // Pre-fetch available routes
  useFetchSupportedRoutes();

  // Connect to any previously used wallets for the selected networks
  useConnectToLastUsedWallet();

  // Call to initiate transfer inputs validations
  useValidate();

  const sourceTokenArray = useMemo(() => {
    return sourceToken ? [sourceToken] : [];
  }, [sourceToken]);

  const { balances, isFetching: isFetchingBalances } = useGetTokenBalances(
    sendingWallet,
    sourceChain,
    sourceTokenArray,
  );

  const disableValidation =
    !sendingWallet.address ||
    !receivingWallet.address ||
    !sourceChain ||
    !sourceToken ||
    !destChain ||
    !destToken;

  // Validate amount
  const amountValidation = useAmountValidation({
    balance: sourceToken ? balances[sourceToken.key]?.balance : null,
    routes: allSupportedRoutes,
    quotesMap,
    tokenSymbol: sourceToken?.symbol ?? '',
    isLoading: isFetchingBalances || isFetchingQuotes,
    disabled: disableValidation,
  });

  //useFetchTokenPrices(sourceToken ? [sourceToken.tokenId] : []);

  // Get input validation result
  const isValid = useMemo(() => isTransferValid(validations), [validations]);

  // All supported chains from the given configuration and any custom override
  const supportedChains = useMemo(
    () => config.routes.allSupportedChains(),
    [config.chains],
  );

  const sourceTokens = useMemo(() => {
    if (sourceChain) {
      return config.tokens.getAllForChain(sourceChain);
    } else {
      return [];
    }
  }, [sourceChain, lastTokenCacheUpdate]);

  // Supported chains for the source network
  const supportedSourceChains = useMemo(() => {
    return config.chainsArr.filter((chain) => {
      return (
        chain.key !== destChain &&
        !chain.disabledAsSource &&
        supportedChains.includes(chain.key)
      );
    });
  }, [destChain, supportedChains]);

  // Supported chains for the destination network
  const supportedDestChains = useMemo(() => {
    return config.chainsArr.filter(
      (chain) =>
        chain.key !== sourceChain &&
        !chain.disabledAsDestination &&
        supportedChains.includes(chain.key),
    );
  }, [sourceChain, supportedChains]);

  // Connect bridge header, which renders any custom overrides for the header
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

  // Asset picker for the source network and token
  const sourceAssetPicker = useMemo(() => {
    return (
      <div className={classes.assetPickerContainer}>
        <div className={classes.assetPickerTitle}>
          <Typography variant="body2">From</Typography>
          <WalletController type={TransferWallet.SENDING} />
        </div>
        <AssetPicker
          chain={sourceChain}
          chainList={supportedSourceChains}
          token={sourceToken}
          tokenList={sourceTokens}
          isFetching={
            sourceTokens.length === 0 && isFetchingSupportedSourceTokens
          }
          setChain={(value: Chain) => {
            selectFromChain(dispatch, value, sendingWallet);
          }}
          setToken={(value: Token) => {
            dispatch(setToken(value.tuple));
          }}
          wallet={sendingWallet}
          isSource={true}
          isTransactionInProgress={isTransactionInProgress}
        />
        <SwapInputs />
      </div>
    );
  }, [
    classes.assetPickerContainer,
    classes.assetPickerTitle,
    sourceChain,
    supportedSourceChains,
    sourceToken,
    sourceTokens,
    lastTokenCacheUpdate,
    supportedSourceTokens,
    isFetchingSupportedSourceTokens,
    isTransactionInProgress,
    sendingWallet,
    dispatch,
  ]);

  // Asset picker for the destination network and token
  const destAssetPicker = useMemo(() => {
    return (
      <div className={classes.assetPickerContainer}>
        <div className={classes.assetPickerTitle}>
          <Typography variant="body2">To</Typography>
          <WalletController type={TransferWallet.RECEIVING} />
        </div>
        <AssetPicker
          chain={destChain}
          chainList={supportedDestChains}
          token={destToken}
          sourceToken={sourceToken}
          tokenList={supportedDestTokens}
          isFetching={
            supportedDestTokens.length === 0 && isFetchingSupportedDestTokens
          }
          setChain={(value: Chain) => {
            selectToChain(dispatch, value, receivingWallet);
          }}
          setToken={(value: Token) => {
            dispatch(setDestToken(value.tuple));
          }}
          wallet={receivingWallet}
          isSource={false}
          isTransactionInProgress={isTransactionInProgress}
        />
      </div>
    );
  }, [
    classes.assetPickerContainer,
    classes.assetPickerTitle,
    destChain,
    supportedDestChains,
    destToken,
    sourceToken,
    supportedDestTokens,
    isFetchingSupportedDestTokens,
    isTransactionInProgress,
    receivingWallet,
    dispatch,
  ]);

  // Header for Bridge view, which includes the title and settings icon.
  const bridgeHeader = useMemo(() => {
    const isTxHistoryDisabled =
      !sendingWallet?.address || isTransactionInProgress;

    return (
      <div className={classes.bridgeHeader}>
        <Header
          align="left"
          text={config.ui.title ?? 'Wormhole Connect'}
          size={18}
        />
        <Tooltip
          title={!sendingWallet?.address ? 'No connected wallets found' : ''}
        >
          <span>
            <IconButton
              sx={{ padding: 0 }}
              disabled={isTxHistoryDisabled}
              onClick={() => dispatch(setAppRoute('history'))}
            >
              <HistoryIcon />
            </IconButton>
          </span>
        </Tooltip>
      </div>
    );
  }, [
    classes.bridgeHeader,
    dispatch,
    isTransactionInProgress,
    sendingWallet?.address,
  ]);

  const walletConnector = useMemo(() => {
    if (sendingWallet?.address && receivingWallet?.address) {
      return null;
    } else if (sendingWallet?.address && !receivingWallet?.address) {
      return (
        <WalletConnector
          disabled={!destChain}
          side="destination"
          type={TransferWallet.RECEIVING}
        />
      );
    }

    return (
      <WalletConnector
        disabled={!sourceChain}
        side="source"
        type={TransferWallet.SENDING}
      />
    );
  }, [sourceChain, destChain, sendingWallet, receivingWallet]);

  const { isCompatible: isWalletCompatible, warning: walletWarning } =
    useWalletCompatibility({
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
        <AlertBannerV2
          error
          content={txError}
          show={true}
          testId="send-error-message"
        />
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
                <DoneIcon className={classes.doneIcon} />
              ) : (
                <CopyIcon className={classes.copyIcon} />
              )}
            </a>
            {' and '}
            <a href={config.ui.getHelpUrl} target="_blank">
              ask for help
            </a>
            .
          </Typography>
        ) : null}
      </Box>
    );
  }, [
    classes.copyIcon,
    classes.doneIcon,
    errorCopied,
    txError,
    txErrorInternal,
  ]);

  const hasError = !!amountValidation.error;

  const hasEnteredAmount = amount && sdkAmount.whole(amount) > 0;

  const hasConnectedWallets = sendingWallet.address && receivingWallet.address;

  const showRoutes =
    hasConnectedWallets && isWalletCompatible && hasEnteredAmount && !hasError;

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
    hasError;

  // Review transaction button is shown only when everything is ready
  const confirmTransactionButton = useMemo(() => {
    return (
      <Button
        disabled={confirmTransactionDisabled}
        variant="primary"
        className={classes.confirmTransaction}
        onClick={() => onConfirm()}
      >
        {isTransactionInProgress ? (
          <Typography
            display="flex"
            alignItems="center"
            gap={1}
            textTransform="none"
          >
            <CircularProgress
              size={16}
              sx={{ color: theme.palette.primary.contrastText }}
            />
            {mobile ? 'Preparing' : 'Preparing transaction'}
          </Typography>
        ) : !isTransactionInProgress && isFetchingQuotes ? (
          <Typography
            display="flex"
            alignItems="center"
            gap={1}
            textTransform="none"
          >
            <CircularProgress color="secondary" size={16} />
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
    classes.confirmTransaction,
    isTransactionInProgress,
    theme.palette.primary.contrastText,
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

  return (
    <div className={joinClass([classes.bridgeContent, classes.spacer])}>
      {header}
      {config.ui.showInProgressWidget && (
        <TxHistoryWidget disabled={isTransactionInProgress} />
      )}
      {bridgeHeader}
      {sourceAssetPicker}
      {destAssetPicker}
      <AmountInput
        sourceChain={sourceChain}
        supportedSourceTokens={config.tokens.getList(supportedSourceTokens)}
        tokenBalance={sourceToken ? balances[sourceToken.key]?.balance : null}
        isFetchingTokenBalance={isFetchingBalances}
        error={amountValidation.error}
        warning={amountValidation.warning || walletWarning}
      />
      {showRoutes && (
        <Routes
          routes={sortedRoutes}
          selectedRoute={route}
          onRouteChange={(r) => {
            dispatch(setTransferRoute(r));
          }}
          quotes={quotesMap}
          isLoading={isFetchingQuotes || isFetchingBalances}
          hasError={hasError}
        />
      )}
      {transactionError}
      <span className={classes.ctaContainer}>
        {hasConnectedWallets ? (
          <Tooltip title={confirmButtonTooltip}>
            <span>{confirmTransactionButton}</span>
          </Tooltip>
        ) : (
          walletConnector
        )}
      </span>
      <PoweredByIcon color={theme.palette.text.primary} />
      <FooterNavBar />
    </div>
  );
};

export default Bridge;
