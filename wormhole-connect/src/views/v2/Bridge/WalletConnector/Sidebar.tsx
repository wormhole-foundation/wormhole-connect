import React, { useCallback, useMemo, useState } from 'react';
import { makeStyles } from 'tss-react/mui';
import { useTheme } from '@mui/material/styles';
import CircularProgress from '@mui/material/CircularProgress';
import Drawer from '@mui/material/Drawer';
import { useDispatch, useSelector } from 'react-redux';
import type { ChainName } from '@wormhole-foundation/wormhole-connect-sdk';

import InputAdornment from '@mui/material/InputAdornment';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import SearchIcon from '@mui/icons-material/Search';

import config from 'config';
import { RootState } from 'store';
import { setWalletModal } from 'store/router';
import { TransferWallet, WalletData, connectWallet } from 'utils/wallet';
import { CENTER } from 'utils/style';

import Header from 'components/Header';
import WalletIcon from 'icons/WalletIcons';
import AlertBanner from 'components/AlertBanner';
import { useAvailableWallets } from 'hooks/useAvailableWallets';

const useStyles = makeStyles()((theme: any) => ({
  drawer: {
    width: '360px',
  },
  context: {
    opacity: '0.6',
  },
  notInstalled: {
    opacity: '60%',
  },
  noResults: {
    ...CENTER,
    minHeight: '72px',
    maxWidth: '350px',
    margin: 'auto',
    flexDirection: 'column',
    marginBottom: '10px',
    gap: '8px',
  },
  noResultsTitle: {
    fontSize: '20px',
    fontWeight: '600',
  },
}));

type Props = {
  type: TransferWallet;
  chain?: ChainName;
  open: boolean;
  onClose?: () => any;
};

const WalletSidebar = (props: Props) => {
  const dispatch = useDispatch();
  const theme: any = useTheme();
  const { classes } = useStyles(theme);

  const { fromChain: sourceChain, toChain: destChain } = useSelector(
    (state: RootState) => state.transferInput,
  );

  const [search, setSearch] = useState('');

  const supportedChains = useMemo(() => {
    const networkContext = config.chainsArr.map((chain) => chain.context);
    return new Set(networkContext);
  }, []);

  const chain = useMemo(
    () =>
      props.chain ||
      (props.type === TransferWallet.SENDING ? sourceChain : destChain),
    [props.chain, props.type],
  );

  const { walletOptionsResult } = useAvailableWallets({
    chain,
    supportedChains,
  });

  const connect = useCallback(async (walletInfo: WalletData) => {
    dispatch(setWalletModal(false));

    if (props.onClose) {
      props.onClose();
    }

    await connectWallet(props.type, chain!, walletInfo, dispatch);
  }, []);

  const renderWalletOptions = useCallback(
    (wallets: WalletData[]): JSX.Element[] => {
      const sorted = wallets.sort((w) => (w.isReady ? -1 : 1));

      const predicate = ({ name, type }: WalletData) =>
        name.toLowerCase().includes(search) ||
        type.toLowerCase().includes(search);

      const filtered = !search ? sorted : sorted.filter(predicate);

      return filtered.map((wallet, i) => {
        const ready = wallet.isReady;
        const select = ready
          ? () => connect(wallet)
          : () => window.open(wallet.wallet.getUrl());
        return (
          <ListItemButton
            dense
            sx={{
              display: 'flex',
              flexDirection: 'row',
            }}
            onClick={select}
          >
            <ListItemIcon>
              <WalletIcon name={wallet.name} icon={wallet.icon} height={32} />
            </ListItemIcon>
            <Typography fontSize={14}>
              <div className={`${!ready && classes.notInstalled}`}>
                {!ready && 'Install'} {wallet.name}
              </div>
              <div className={classes.context}>{wallet.type.toUpperCase()}</div>
            </Typography>
          </ListItemButton>
        );
      });
    },
    [],
  );

  const closeSidebar = useCallback(() => {
    if (props.onClose) {
      props.onClose();
    } else {
      dispatch(setWalletModal(false));
    }
  }, [props.onClose]);

  const sidebarContent = useMemo((): JSX.Element => {
    switch (walletOptionsResult.state) {
      case 'loading':
        return <CircularProgress />;
      case 'error':
        return (
          <AlertBanner show={true} content={walletOptionsResult.error} error />
        );
      case 'result':
        if (walletOptionsResult.options.length === 0) {
          return <></>;
        }
        return (
          <>
            <ListItem>
              <TextField
                fullWidth
                inputProps={{
                  style: {
                    fontSize: 12,
                  },
                }}
                placeholder="Search for a network"
                size="small"
                variant="outlined"
                onChange={(e) => {
                  const lowercase = e.target.value.toLowerCase();
                  setSearch(lowercase);
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </ListItem>
            <List>
              <div>{renderWalletOptions(walletOptionsResult.options)}</div>
            </List>
          </>
        );

      default:
        return (
          <div className={classes.noResults}>
            <div className={classes.noResultsTitle}>No wallets detected</div>
            <div>Install a wallet extension to continue</div>
          </div>
        );
    }
  }, [walletOptionsResult]);

  return (
    <Drawer
      anchor="right"
      open={props.type && props.open}
      onClose={closeSidebar}
    >
      <div className={classes.drawer}>
        <Header text="Connect a wallet" size={16} />
        {sidebarContent}
      </div>
    </Drawer>
  );
};

export default WalletSidebar;
