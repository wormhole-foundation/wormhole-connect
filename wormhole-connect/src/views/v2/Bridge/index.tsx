import React, { useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { makeStyles } from 'tss-react/mui';
import { useTheme } from '@mui/material';

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

const useStyles = makeStyles()((_theme) => ({
  spacer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  bridgeContent: {
    margin: 'auto',
    maxWidth: '420px',
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
}));

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

  const supportedChains = useMemo(
    () => RouteOperator.allSupportedChains(),
    [config.chainsArr],
  );

  const supportedSourceChains = useMemo(() => {
    return config.chainsArr.filter((chain) => {
      return (
        chain.key !== destChain &&
        !chain.disabledAsSource &&
        supportedChains.includes(chain.key)
      );
    });
  }, [config.chainsArr, destChain, supportedChains]);

  const supportedDestChains = useMemo(() => {
    return config.chainsArr.filter(
      (chain) =>
        chain.key !== sourceChain &&
        !chain.disabledAsDestination &&
        supportedChains.includes(chain.key),
    );
  }, [config.chainsArr, sourceChain, supportedChains]);

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

  const sourceAssetPicker = useMemo(() => {
    return (
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
    );
  }, [
    sourceChain,
    supportedSourceChains,
    sourceToken,
    supportedSourceTokens,
    sendingWallet,
  ]);

  const destAssetPicker = useMemo(() => {
    return (
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
    );
  }, [
    destChain,
    supportedDestChains,
    destToken,
    supportedDestTokens,
    receivingWallet,
  ]);

  const bridgeHeader = useMemo(() => {
    return (
      <div>
        <Header align="left" text="Bridge assets" size={16} />
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
