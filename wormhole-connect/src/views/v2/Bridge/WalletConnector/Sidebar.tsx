import React, { useCallback, useMemo, useState } from 'react';
import { makeStyles } from 'tss-react/mui';
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
import AlertBannerV2 from 'components/v2/AlertBanner';
import { useAvailableWallets } from 'hooks/useAvailableWallets';

const useStyles = makeStyles()(() => ({
  drawer: {
    width: '360px',
  },
  context: {
    opacity: 0.6,
  },
  notInstalled: {
    opacity: 0.6,
  },
}));

type Props = {
  type: TransferWallet;
  open: boolean;
  onClose?: () => any;
};

// Renders the sidebar on the right-side to display the list of available wallets
// for the selected source or destination chain.
const WalletSidebar = (props: Props) => {
  const dispatch = useDispatch();
  const { classes } = useStyles();

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

  const connect = useCallback(
    async (walletInfo: WalletData) => {
      if (!selectedChain) {
        return;
      }

      props.onClose?.();
      await connectWallet(props.type, selectedChain, walletInfo, dispatch);
    },
    [props.type, props.onClose, selectedChain],
  );

  const renderWalletOptions = useCallback(
    (wallets: WalletData[]): JSX.Element[] => {
      const walletsSorted = wallets.sort((w) => (w.isReady ? -1 : 1));

      let walletsFiltered = walletsSorted;

      if (search) {
        const searchTerm = search.toLowerCase();

        walletsFiltered = walletsSorted.filter(
          ({ name, type }: WalletData) =>
            name.toLowerCase().includes(searchTerm) ||
            type.toLowerCase().includes(searchTerm),
        );
      }

      return walletsFiltered.map((wallet) => {
        const isWalletReady = wallet.isReady;

        return (
          <ListItemButton
            key={wallet.name}
            dense
            sx={{
              display: 'flex',
              flexDirection: 'row',
            }}
            onClick={() => {
              if (isWalletReady) {
                connect(wallet);
              } else {
                window.open(wallet.wallet.getUrl());
              }
            }}
          >
            <ListItemIcon>
              <WalletIcon name={wallet.name} icon={wallet.icon} height={32} />
            </ListItemIcon>
            <Typography fontSize={14}>
              <div className={`${!isWalletReady && classes.notInstalled}`}>
                {!isWalletReady && 'Install'} {wallet.name}
              </div>
              <div className={classes.context}>{wallet.type.toUpperCase()}</div>
            </Typography>
          </ListItemButton>
        );
      });
    },
    [connect, search],
  );

  const sidebarContent = useMemo((): JSX.Element => {
    switch (walletOptionsResult.state) {
      case 'loading':
        return <CircularProgress />;
      case 'error':
        return <AlertBannerV2 error show content={walletOptionsResult.error} />;
      case 'result':
        if (walletOptionsResult.options?.length === 0) {
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
                  placeholder="Search for a wallet"
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
        // TODO: Do we ever get to this case? If so, what should be the UI?
        return <></>;
    }
  }, [walletOptionsResult]);

  return (
    <Drawer
      anchor="right"
      open={props.type && props.open}
      onClose={() => {
        props.onClose?.();
      }}
    >
      <div className={classes.drawer}>{sidebarContent}</div>
    </Drawer>
  );
};

export default WalletSidebar;
