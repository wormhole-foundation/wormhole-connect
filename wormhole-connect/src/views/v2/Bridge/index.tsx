import React, { useEffect, useMemo, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { makeStyles } from 'tss-react/mui';
import { useMediaQuery, useTheme } from '@mui/material';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

import HistoryIcon from '@mui/icons-material/History';

import type { RootState } from 'store';

import Button from 'components/v2/Button';
import config from 'config';
import { joinClass } from 'utils/style';
import PoweredByIcon from 'icons/PoweredBy';
import PageHeader from 'components/PageHeader';
import Header, { Alignment } from 'components/Header';
import FooterNavBar from 'components/FooterNavBar';
import useFetchSupportedRoutes from 'hooks/useFetchSupportedRoutes';
import useComputeDestinationTokens from 'hooks/useComputeDestinationTokens';
import useComputeSourceTokens from 'hooks/useComputeSourceTokens';
import { setRoute as setAppRoute } from 'store/router';
import {
  selectFromChain,
  selectToChain,
  setToken,
  setTransferRoute,
  setDestToken,
} from 'store/transferInput';
import { isTransferValid, useValidate } from 'utils/transferValidation';
import { TransferWallet, useConnectToLastUsedWallet } from 'utils/wallet';
import WalletConnector from 'views/v2/Bridge/WalletConnector';
import AssetPicker from 'views/v2/Bridge/AssetPicker';
import WalletController from 'views/v2/Bridge/WalletConnector/Controller';
import AmountInput from 'views/v2/Bridge/AmountInput';
import Routes from 'views/v2/Bridge/Routes';
import ReviewTransaction from 'views/v2/Bridge/ReviewTransaction';
import SwapInputs from 'views/v2/Bridge/SwapInputs';
import TxHistoryWidget from 'views/v2/TxHistory/Widget';
import { useSortedRoutesWithQuotes } from 'hooks/useSortedRoutesWithQuotes';
//import { useFetchTokenPrices } from 'hooks/useFetchTokenPrices';

import type { Chain } from '@wormhole-foundation/sdk';
import { amount as sdkAmount } from '@wormhole-foundation/sdk';
import { useAmountValidation } from 'hooks/useAmountValidation';
import { useWalletCompatibility } from 'hooks/useWalletCompatibility';
import useGetTokenBalances from 'hooks/useGetTokenBalances';
import { useGetTokens } from 'hooks/useGetTokens';
import { Token } from 'config/tokens';

import { useTokens } from 'contexts/TokensContext';

const useStyles = makeStyles()((theme) => ({
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
  ctaContainer: {
    marginTop: '8px',
    width: '100%',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  reviewTransaction: {
    padding: '8px 16px',
    borderRadius: '8px',
    height: '48px',
    margin: 'auto',
    maxWidth: '420px',
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

  const mobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Connected wallets, if any
  const { sending: sendingWallet, receiving: receivingWallet } = useSelector(
    (state: RootState) => state.wallet,
  );

  const [selectedRoute, setSelectedRoute] = useState<string>();
  const [willReviewTransaction, setWillReviewTransaction] = useState(false);

  const {
    fromChain: sourceChain,
    toChain: destChain,
    route,
    preferredRouteName,
    supportedSourceTokens,
    amount,
    validations,
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
      route: selectedRoute,
    });

  // Compute and set destination tokens
  const { isFetching: isFetchingSupportedDestTokens, supportedDestTokens } =
    useComputeDestinationTokens({
      sourceChain,
      destChain,
      sourceToken,
      route: selectedRoute,
    });

  // Set selectedRoute if the route is auto-selected
  // After the auto-selection, we set selectedRoute when user clicks on a route in the list
  useEffect(() => {
    if (sortedRoutesWithQuotes.length === 0) {
      setSelectedRoute('');
    } else {
      const preferredRoute = sortedRoutesWithQuotes.find(
        (route) => route.route === preferredRouteName,
      );
      const autoselectedRoute =
        route ?? preferredRoute?.route ?? sortedRoutesWithQuotes[0].route;
      const isSelectedRouteValid =
        sortedRoutesWithQuotes.findIndex((r) => r.route === selectedRoute) > -1;

      if (!isSelectedRouteValid) {
        setSelectedRoute('');
      }

      // If no route is autoselected or we already have a valid selected route,
      // we should avoid overwriting it
      if (!autoselectedRoute || (selectedRoute && isSelectedRouteValid)) {
        return;
      }

      const routeData = sortedRoutesWithQuotes?.find(
        (rs) => rs.route === autoselectedRoute,
      );

      if (routeData) setSelectedRoute(routeData.route);
    }
  }, [route, sortedRoutesWithQuotes]);

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
    [config.chainsArr],
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
  }, [config.chainsArr, destChain, supportedChains]);

  // Supported chains for the destination network
  const supportedDestChains = useMemo(() => {
    return config.chainsArr.filter(
      (chain) =>
        chain.key !== sourceChain &&
        !chain.disabledAsDestination &&
        supportedChains.includes(chain.key),
    );
  }, [config.chainsArr, sourceChain, supportedChains]);

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
  }, [config.ui]);

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
        />
        <SwapInputs />
      </div>
    );
  }, [
    sourceChain,
    supportedSourceChains,
    sourceToken,
    sourceTokens,
    lastTokenCacheUpdate,
    supportedSourceTokens,
    sendingWallet,
    isFetchingSupportedSourceTokens,
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
        />
      </div>
    );
  }, [
    destChain,
    supportedDestChains,
    destToken,
    supportedDestTokens,
    receivingWallet,
    isFetchingSupportedDestTokens,
  ]);

  // Header for Bridge view, which includes the title and settings icon.
  const bridgeHeader = useMemo(() => {
    const isTxHistoryDisabled = !sendingWallet?.address;
    return (
      <div className={classes.bridgeHeader}>
        <Header
          align="left"
          text={config.ui.title ?? 'Wormhole Connect'}
          size={18}
        />
        <Tooltip
          title={isTxHistoryDisabled ? 'No connected wallets found' : ''}
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
  }, [sendingWallet?.address, config.ui]);

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

  const hasError = !!amountValidation.error;

  const hasEnteredAmount = amount && sdkAmount.whole(amount) > 0;

  const hasConnectedWallets = sendingWallet.address && receivingWallet.address;

  const showRoutes =
    hasConnectedWallets && isWalletCompatible && hasEnteredAmount && !hasError;

  const reviewTransactionDisabled =
    !sourceChain ||
    !sourceToken ||
    !destChain ||
    !destToken ||
    !hasConnectedWallets ||
    !isWalletCompatible ||
    !selectedRoute ||
    !isValid ||
    isFetchingQuotes ||
    !hasEnteredAmount ||
    hasError;

  // Review transaction button is shown only when everything is ready
  const reviewTransactionButton = (
    <Button
      variant="primary"
      className={classes.reviewTransaction}
      disabled={reviewTransactionDisabled}
      onClick={() => {
        dispatch(setTransferRoute(selectedRoute));
        setWillReviewTransaction(true);
      }}
    >
      <Typography textTransform="none">
        {mobile ? 'Review' : 'Review transaction'}
      </Typography>
    </Button>
  );

  const reviewButtonTooltip =
    !sourceChain || !sourceToken
      ? 'Please select a source asset'
      : !destChain || !destToken
      ? 'Please select a destination asset'
      : !hasEnteredAmount
      ? 'Please enter an amount'
      : isFetchingQuotes
      ? 'Loading quotes...'
      : !selectedRoute
      ? 'Please select a quote'
      : '';

  if (willReviewTransaction) {
    return (
      <ReviewTransaction
        quotes={quotesMap}
        isFetchingQuotes={isFetchingQuotes}
        onClose={() => setWillReviewTransaction(false)}
      />
    );
  }

  return (
    <div className={joinClass([classes.bridgeContent, classes.spacer])}>
      {header}
      {config.ui.showInProgressWidget && <TxHistoryWidget />}
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
          selectedRoute={selectedRoute}
          onRouteChange={setSelectedRoute}
          quotes={quotesMap}
          isLoading={isFetchingQuotes || isFetchingBalances}
          hasError={hasError}
        />
      )}
      <span className={classes.ctaContainer}>
        {hasConnectedWallets ? (
          <Tooltip title={reviewButtonTooltip}>
            <span>{reviewTransactionButton}</span>
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
