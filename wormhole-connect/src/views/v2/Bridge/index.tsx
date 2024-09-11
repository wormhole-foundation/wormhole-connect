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
import useSupportedRoutes from 'hooks/useSupportedRoutes';
import useComputeDestinationTokens from 'hooks/useComputeDestinationTokens';
import useRoutesQuotesBulk from 'hooks/useRoutesQuotesBulk';
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
import TokenWarnings from 'views/v2/Bridge/AssetPicker/TokenWarnings';
import WalletController from 'views/v2/Bridge/WalletConnector/Controller';
import AmountInput from 'views/v2/Bridge/AmountInput';
import Routes from 'views/v2/Bridge/Routes';
import ReviewTransaction from 'views/v2/Bridge/ReviewTransaction';
import SwapInputs from 'views/v2/Bridge/SwapInputs';
import { useSortedSupportedRoutes } from 'hooks/useSortedSupportedRoutes';
import { useFetchTokenPrices } from 'hooks/useFetchTokenPrices';

import type { Chain } from '@wormhole-foundation/sdk';

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
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  poweredBy: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
    marginTop: '24px',
  },
  reviewTransaction: {
    padding: '8px 16px',
    backgroundColor: '#C1BBF6',
    borderRadius: '8px',
    margin: 'auto',
    maxWidth: '420px',
    width: '100%',
  },
  spacer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
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

  const mobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Connected wallets, if any
  const { sending: sendingWallet, receiving: receivingWallet } = useSelector(
    (state: RootState) => state.wallet,
  );

  const [selectedRoute, setSelectedRoute] = useState<string>();
  const [willReviewTransaction, setWillReviewTransaction] = useState(false);

  const { toNativeToken } = useSelector((state: RootState) => state.relay);

  const {
    fromChain: sourceChain,
    toChain: destChain,
    token: sourceToken,
    destToken,
    route,
    routeStates,
    supportedDestTokens: supportedDestTokensBase,
    supportedSourceTokens,
    amount,
    validations,
  } = useSelector((state: RootState) => state.transferInput);

  const sortedSupportedRoutes = useSortedSupportedRoutes();

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
  const { isFetching: isFetchingSupportedDestTokens } =
    useComputeDestinationTokens({
      sourceChain,
      destChain,
      sourceToken,
      route: selectedRoute,
    });

  const { quotesMap, isFetching: isFetchingQuotes } = useRoutesQuotesBulk(
    sortedSupportedRoutes.map((r) => r.name),
    {
      amount,
      sourceChain,
      sourceToken,
      destChain,
      destToken,
      nativeGas: toNativeToken,
    },
  );

  // Set selectedRoute if the route is auto-selected
  // After the auto-selection, we set selectedRoute when user clicks on a route in the list
  useEffect(() => {
    const validRoutes = sortedSupportedRoutes.filter((rs) => rs.supported);

    const routesWithSuccessfulQuote = validRoutes.filter(
      (rs) => quotesMap[rs.name]?.success,
    );

    if (routesWithSuccessfulQuote.length === 0) {
      setSelectedRoute('');
    } else {
      const autoselectedRoute = route || routesWithSuccessfulQuote[0]?.name;

      // avoids overwriting selected route
      if (!autoselectedRoute || !!selectedRoute) return;

      const routeState = validRoutes?.find(
        (rs) => rs.name === autoselectedRoute,
      );

      if (routeState) setSelectedRoute(routeState.name);
    }
  }, [route, sortedSupportedRoutes, quotesMap]);

  // Pre-fetch available routes
  useSupportedRoutes();

  // Connect to any previously used wallets for the selected networks
  useConnectToLastUsedWallet();

  // Call to initiate transfer inputs validations
  useValidate();

  // Fetch token prices
  useFetchTokenPrices();

  // Get input validation result
  const isValid = useMemo(() => isTransferValid(validations), [validations]);

  // All supported chains from the given configuration and any custom override
  const supportedChains = useMemo(
    () => config.routes.allSupportedChains(),
    [config.chainsArr],
  );

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

  // Supported tokens for destination chain
  const supportedDestTokens = useMemo(() => {
    if (sourceChain && sourceToken) {
      return supportedDestTokensBase;
    } else {
      return config.tokensArr.filter(
        (tokenConfig) =>
          tokenConfig.nativeChain === destChain ||
          tokenConfig.tokenId?.chain === destChain,
      );
    }
  }, [destChain, sourceChain, sourceToken, supportedDestTokensBase]);

  // Connect bridge header, which renders any custom overrides for the header
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

  // Asset picker for the source network and token
  const sourceAssetPicker = useMemo(() => {
    return (
      <div className={classes.assetPickerContainer}>
        <div className={classes.assetPickerTitle}>
          <Typography variant="body2">From:</Typography>
          <WalletController type={TransferWallet.SENDING} />
        </div>
        <AssetPicker
          chain={sourceChain}
          chainList={supportedSourceChains}
          token={sourceToken}
          tokenList={supportedSourceTokens}
          isFetching={isFetchingSupportedSourceTokens}
          setChain={(value: Chain) => {
            selectFromChain(dispatch, value, sendingWallet);
          }}
          setToken={(value: string) => {
            dispatch(setToken(value));
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
    supportedSourceTokens,
    sendingWallet,
    isFetchingSupportedSourceTokens,
  ]);

  // Asset picker for the destination network and token
  const destAssetPicker = useMemo(() => {
    return (
      <div className={classes.assetPickerContainer}>
        <div className={classes.assetPickerTitle}>
          <Typography variant="body2">To:</Typography>
          <WalletController type={TransferWallet.RECEIVING} />
        </div>
        <AssetPicker
          chain={destChain}
          chainList={supportedDestChains}
          token={destToken}
          sourceToken={sourceToken}
          tokenList={supportedDestTokens}
          isFetching={isFetchingSupportedDestTokens}
          setChain={(value: Chain) => {
            selectToChain(dispatch, value, receivingWallet);
          }}
          setToken={(value: string) => {
            dispatch(setDestToken(value));
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
        <Header align="left" text="Bridge assets" size={20} />
        <Tooltip
          title={isTxHistoryDisabled ? 'No connected wallets found' : ''}
        >
          <div>
            <IconButton
              disabled={isTxHistoryDisabled}
              onClick={() => dispatch(setAppRoute('history'))}
            >
              <HistoryIcon />
            </IconButton>
          </div>
        </Tooltip>
      </div>
    );
  }, [sendingWallet?.address]);

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

  const showReviewTransactionButton =
    sourceChain &&
    sourceToken &&
    destChain &&
    destToken &&
    sendingWallet.address &&
    receivingWallet.address &&
    selectedRoute &&
    Number(amount) > 0;

  const supportedRouteSelected = useMemo(
    () =>
      routeStates?.find?.((rs) => rs.name === selectedRoute && !!rs.supported),
    [routeStates, selectedRoute],
  );

  // Review transaction button is shown only when everything is ready
  const reviewTransactionButton = (
    <Button
      variant="primary"
      className={classes.reviewTransaction}
      disabled={!isValid || isFetchingQuotes || !supportedRouteSelected}
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

  if (willReviewTransaction) {
    return (
      <ReviewTransaction onClose={() => setWillReviewTransaction(false)} />
    );
  }

  return (
    <div className={joinClass([classes.bridgeContent, classes.spacer])}>
      {header}
      {bridgeHeader}
      {sourceAssetPicker}
      {destAssetPicker}
      <TokenWarnings />
      <AmountInput supportedSourceTokens={supportedSourceTokens} />
      <Routes
        sortedSupportedRoutes={sortedSupportedRoutes}
        selectedRoute={selectedRoute}
        onRouteChange={setSelectedRoute}
        quotes={quotesMap}
        isFetchingQuotes={isFetchingQuotes}
      />
      {walletConnector}
      {showReviewTransactionButton ? reviewTransactionButton : null}
      {config.showHamburgerMenu ? null : <FooterNavBar />}
      <div className={classes.poweredBy}>
        <PoweredByIcon color={theme.palette.text.primary} />
      </div>
    </div>
  );
};

export default Bridge;
