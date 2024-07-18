import React, { useEffect, useMemo, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { makeStyles } from 'tss-react/mui';
import { styled, useMediaQuery, useTheme } from '@mui/material';
import Button, { ButtonProps } from '@mui/material/Button';
import { deepPurple } from '@mui/material/colors';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';

import HistoryIcon from '@mui/icons-material/History';
import SettingsIcon from '@mui/icons-material/Settings';

import type { Route } from 'config/types';
import type { ChainName } from 'sdklegacy';
import type { RootState } from 'store';

import RouteOperator from 'routes/operator';

import config from 'config';
import { joinClass } from 'utils/style';
import PoweredByIcon from 'icons/PoweredBy';
import PageHeader from 'components/PageHeader';
import Header, { Alignment } from 'components/Header';
import FooterNavBar from 'components/FooterNavBar';
import { TransferWallet } from 'utils/wallet';
import useAvailableRoutes from 'hooks/useAvailableRoutes';
import useComputeDestinationTokensV2 from 'hooks/useComputeDestinationTokensV2';
import useComputeFees from 'hooks/useComputeFees';
import useComputeQuoteV2 from 'hooks/useComputeQuoteV2';
import { useFetchTokenPrices } from 'hooks/useFetchTokenPrices';
import useComputeSourceTokensV2 from 'hooks/useComputeSourceTokensV2';
import {
  selectFromChain,
  selectToChain,
  setToken,
  setTransferRoute,
  setDestToken,
} from 'store/transferInput';
import WalletConnector from 'views/v2/Bridge/WalletConnector';
import AssetPicker from 'views/v2/Bridge/AssetPicker';
import WalletController from 'views/v2/Bridge/WalletConnector/Controller';
import AmountInput from 'views/v2/Bridge/AmountInput';
import Routes from 'views/v2/Bridge/Routes';
import ReviewTransaction from 'views/v2/Bridge/ReviewTransaction';

const useStyles = makeStyles()((theme) => ({
  assetPickerContainer: {
    width: '100%',
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

const StyledButton = styled(Button)<ButtonProps>(({ theme }) => ({
  color: theme.palette.getContrastText(deepPurple[200]),
  backgroundColor: deepPurple[200],
  '&:hover': {
    backgroundColor: deepPurple[300],
  },
  '&:disabled': {
    backgroundColor: deepPurple[100],
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

  const [selectedRoute, setSelectedRoute] = useState<Route>();
  const [willReviewTransaction, setWillReviewTransaction] = useState(false);

  const { toNativeToken } = useSelector((state: RootState) => state.relay);

  const {
    fromChain: sourceChain,
    toChain: destChain,
    token: sourceToken,
    destToken,
    route,
    routeStates,
    amount,
  } = useSelector((state: RootState) => state.transferInput);

  // Set selectedRoute if the route is auto-selected
  // After the auto-selection, we set selectedRoute when user clicks on a route in the list
  useEffect(() => {
    if (route && !selectedRoute) {
      setSelectedRoute(route);
    }
  }, [route, selectedRoute]);

  // Compute and set source tokens
  const {
    supportedTokens: supportedSourceTokens,
    isFetching: isFetchingSupportedSourceTokens,
  } = useComputeSourceTokensV2({
    sourceChain,
    destChain,
    sourceToken,
    destToken,
    route: selectedRoute,
  });

  // Compute and set destination tokens
  const {
    supportedTokens: supportedDestTokens,
    isFetching: isFetchingSupportedDestTokens,
  } = useComputeDestinationTokensV2({
    sourceChain,
    destChain,
    sourceToken,
    route: selectedRoute,
  });

  // Compute the fees for this route
  const { isFetching: isFetchingFees } = useComputeFees({
    sourceChain,
    destChain,
    sourceToken,
    destToken,
    amount,
    route: selectedRoute,
    toNativeToken,
  });

  // Compute the quotes for this route
  const { isFetching: isFetchingQuote } = useComputeQuoteV2({
    sourceChain,
    destChain,
    sourceToken,
    destToken,
    amount,
    route: selectedRoute,
    toNativeToken,
  });

  useAvailableRoutes();
  useFetchTokenPrices();

  // All supported chains from the given configuration and any custom override
  const supportedChains = useMemo(
    () => RouteOperator.allSupportedChains(),
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
          setChain={(value: ChainName) => {
            selectFromChain(dispatch, value, sendingWallet);
          }}
          setToken={(value: string) => {
            dispatch(setToken(value));
          }}
          wallet={sendingWallet}
        />
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
          tokenList={supportedDestTokens}
          isFetching={isFetchingSupportedDestTokens}
          setChain={(value: ChainName) => {
            selectToChain(dispatch, value, receivingWallet);
          }}
          setToken={(value: string) => {
            dispatch(setDestToken(value));
          }}
          wallet={receivingWallet}
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
    return (
      <div className={classes.bridgeHeader}>
        <Header align="left" text="Bridge assets" size={20} />
        <IconButton>
          <HistoryIcon />
        </IconButton>
        <IconButton>
          <SettingsIcon />
        </IconButton>
      </div>
    );
  }, []);

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

  // Review transaction button is shown only when everything is ready
  const reviewTransactionButton = useMemo(() => {
    if (
      !sourceChain ||
      !sourceToken ||
      !destChain ||
      !destToken ||
      !sendingWallet.address ||
      !receivingWallet.address ||
      routeStates?.length === 0 ||
      !(Number(amount) > 0)
    ) {
      return null;
    }

    const isFetching = isFetchingFees || isFetchingQuote;

    return (
      <StyledButton
        variant="contained"
        className={classes.reviewTransaction}
        disabled={isFetching}
        onClick={() => {
          if (
            routeStates &&
            routeStates.some((rs) => rs.name === selectedRoute)
          ) {
            const route = routeStates.find((rs) => rs.name === selectedRoute);

            if (route?.available) {
              dispatch(setTransferRoute(selectedRoute));
              setWillReviewTransaction(true);
            }
          }
        }}
      >
        <Typography textTransform="none">
          {mobile ? 'Review' : 'Review transaction'}
        </Typography>
      </StyledButton>
    );
  }, [
    sourceChain,
    sourceToken,
    destChain,
    destToken,
    selectedRoute,
    amount,
    routeStates,
    isFetchingFees,
    isFetchingQuote,
  ]);

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
      <AmountInput supportedSourceTokens={supportedSourceTokens} />
      <Routes selectedRoute={selectedRoute} onRouteChange={setSelectedRoute} />
      {walletConnector}
      {reviewTransactionButton}
      {config.showHamburgerMenu ? null : <FooterNavBar />}
      <div className={classes.poweredBy}>
        <PoweredByIcon color={theme.palette.text.primary} />
      </div>
    </div>
  );
};

export default Bridge;
