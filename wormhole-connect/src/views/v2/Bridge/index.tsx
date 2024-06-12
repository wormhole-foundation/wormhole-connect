import React, { useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { makeStyles } from 'tss-react/mui';
import { Typography, useTheme } from '@mui/material';
import IconButton from '@mui/material/IconButton';

import HistoryIcon from '@mui/icons-material/History';
import SettingsIcon from '@mui/icons-material/Settings';

import type { ChainName } from '@wormhole-foundation/wormhole-connect-sdk';
import type { RootState } from 'store';

import RouteOperator from 'routes/operator';

import config from 'config';
import { joinClass } from 'utils/style';
import PoweredByIcon from 'icons/PoweredBy';
import PageHeader from 'components/PageHeader';
import Header, { Alignment } from 'components/Header';
import FooterNavBar from 'components/FooterNavBar';
import { TransferWallet } from 'utils/wallet';
import { useComputeDestinationTokens } from 'hooks/useComputeDestinationTokens';
import { useComputeSourceTokens } from 'hooks/useComputeSourceTokens';
import {
  selectFromChain,
  selectToChain,
  setToken,
  setDestToken,
} from 'store/transferInput';
import WalletConnector from './WalletConnector';
import AssetPicker from './AssetPicker';

const useStyles = makeStyles()((theme) => ({
  assetPickerContainer: {
    width: '100%',
  },
  assetPickerTitle: {
    color: theme.palette.text.secondary,
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

  const receivingWallet = useSelector(
    (state: RootState) => state.wallet.receiving,
  );

  const sendingWallet = useSelector((state: RootState) => state.wallet.sending);

  const {
    supportedSourceTokens,
    supportedDestTokens,
    fromChain: sourceChain,
    toChain: destChain,
    token: sourceToken,
    destToken,
    route,
  } = useSelector((state: RootState) => state.transferInput);

  // Compute and set source tokens
  useComputeSourceTokens({
    sourceChain,
    destChain,
    sourceToken,
    destToken,
    route,
  });

  // Compute and set destination tokens
  useComputeDestinationTokens({
    sourceChain,
    destChain,
    sourceToken,
    route,
  });

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
        <Typography className={classes.assetPickerTitle} variant="body2">
          From:
        </Typography>
        <AssetPicker
          chain={sourceChain}
          chainList={supportedSourceChains}
          token={sourceToken}
          tokenList={supportedSourceTokens}
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
  ]);

  // Asset picker for the destination network and token
  const destAssetPicker = useMemo(() => {
    return (
      <div className={classes.assetPickerContainer}>
        <Typography className={classes.assetPickerTitle} variant="body2">
          To:
        </Typography>
        <AssetPicker
          chain={destChain}
          chainList={supportedDestChains}
          token={destToken}
          tokenList={supportedDestTokens}
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
  ]);

  // Header for Bridge view, which includes the title and settings icon.
  const bridgeHeader = useMemo(() => {
    return (
      <div className={classes.bridgeHeader}>
        <Header align="left" text="Bridge assets" size={16} />
        <IconButton>
          <HistoryIcon />
        </IconButton>
        <IconButton>
          <SettingsIcon />
        </IconButton>
      </div>
    );
  }, []);

  return (
    <div className={joinClass([classes.bridgeContent, classes.spacer])}>
      {header}
      {bridgeHeader}
      {sourceAssetPicker}
      {destAssetPicker}
      <WalletConnector
        disabled={!sourceChain}
        side="source"
        type={TransferWallet.SENDING}
      />
      {config.showHamburgerMenu ? null : <FooterNavBar />}
      <div className={classes.poweredBy}>
        <PoweredByIcon color={theme.palette.text.primary} />
      </div>
    </div>
  );
};

export default Bridge;
