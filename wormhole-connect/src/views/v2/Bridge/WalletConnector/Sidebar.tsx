import React, { useCallback, useMemo, useState } from 'react';
import { makeStyles } from 'tss-react/mui';
import { useTheme } from '@mui/material/styles';
import CircularProgress from '@mui/material/CircularProgress';
import Drawer from '@mui/material/Drawer';
import { useDispatch, useSelector } from 'react-redux';

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
import { TransferWallet, WalletData, connectWallet } from 'utils/wallet';

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
}));

type Props = {
  type: TransferWallet;
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

  const selectedChain = useMemo(
    () => (props.type === TransferWallet.SENDING ? sourceChain : destChain),
    [props.type, sourceChain, destChain],
  );

  const { walletOptionsResult } = useAvailableWallets({
    chain: selectedChain,
    supportedChains,
  });

  const connect = useCallback(async (walletInfo: WalletData) => {
    if (props.onClose) {
      props.onClose();
    }

    await connectWallet(props.type, selectedChain!, walletInfo, dispatch);
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
            key={wallet.name}
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
            <List>
              <ListItem>
                <Typography component={'div'} fontSize={16}>
                  Connect a wallet
                </Typography>
              </ListItem>
              <ListItem>
                <TextField
                  fullWidth
                  placeholder="Search for a network"
                  size="small"
                  variant="outlined"
                  onChange={(e) => {
                    setSearch(e.target.value?.toLowerCase());
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
              {renderWalletOptions(walletOptionsResult.options)}
            </List>
          </>
        );

      default:
        return (
          <div>
            <div>No wallets detected</div>
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
      <div className={classes.drawer}>{sidebarContent}</div>
    </Drawer>
  );
};

export default WalletSidebar;
