import React, { useCallback, useMemo, useState } from 'react';
import { makeStyles } from 'tss-react/mui';
import { useDispatch, useSelector } from 'react-redux';

import CircularProgress from '@mui/material/CircularProgress';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';

import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';

import config from 'config';
import { RootState } from 'store';
import { TransferWallet, WalletData, connectWallet } from 'utils/wallet';

import AlertBannerV2 from 'components/v2/AlertBanner';
import { useAvailableWallets } from 'hooks/useAvailableWallets';
import WalletIcon from 'icons/WalletIcons';
import { validateWalletAddress } from 'utils/address';
import { ReadOnlyWallet } from 'utils/wallet/ReadOnlyWallet';
import { SANCTIONED_WALLETS } from 'consts/wallet';

const useStyles = makeStyles()((theme) => ({
  listButton: {
    display: 'flex',
    flexDirection: 'row',
    padding: '12px 16px',
  },
  drawer: {
    width: '360px',
  },
  notInstalled: {
    opacity: 0.6,
  },
  title: {
    width: '100%',
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  smOnly: {
    display: 'none',
    [theme.breakpoints.down('sm')]: {
      display: 'block',
    },
  },
  addressInputContainer: {
    display: 'flex',
    flexDirection: 'row',
    gap: '8px',
    width: '100%',
    padding: '16px',
  },
  addressField: {
    flex: 1,
  },
  submitButton: {
    width: '100%',
  },
}));

type Props = {
  type: TransferWallet;
  open: boolean;
  onClose?: () => any;
  showAddressInput?: boolean;
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
  const [address, setAddress] = useState('');
  const [addressError, setAddressError] = useState('');

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
    [selectedChain, props, dispatch],
  );

  const submitAddress = useCallback(async () => {
    if (!selectedChain || !address) return;

    const chainConfig = config.chains[selectedChain];
    if (!chainConfig) return;

    const nativeAddress = await validateWalletAddress(selectedChain, address);
    if (!nativeAddress) {
      setAddressError('Invalid Address');
      return;
    }

    for (const sanctioned of SANCTIONED_WALLETS) {
      if (nativeAddress.toString().toLowerCase() === sanctioned.toLowerCase()) {
        setAddressError('Sanctioned Address');
        return;
      }
    }

    const wallet = new ReadOnlyWallet(nativeAddress, selectedChain);

    const walletInfo: WalletData = {
      name: wallet.getName(),
      type: chainConfig.context,
      icon: wallet.getIcon(),
      isReady: true,
      wallet,
    };

    await connectWallet(
      TransferWallet.RECEIVING,
      selectedChain,
      walletInfo,
      dispatch,
    );

    props.onClose?.();
  }, [address, selectedChain, props.onClose]);

  const renderWalletOptions = useCallback(
    (wallets: WalletData[]): JSX.Element => {
      const walletsSorted = [...wallets].sort((w) => (w.isReady ? -1 : 1));

      const walletsFiltered = !search
        ? walletsSorted
        : walletsSorted.filter(({ name, type }: WalletData) =>
            [name, type].some((criteria) =>
              criteria.toLowerCase().includes(search.toLowerCase()),
            ),
          );

      return (
        <>
          {!walletsFiltered.length ? (
            <ListItem>
              <Typography>No results</Typography>
            </ListItem>
          ) : (
            walletsFiltered.map((wallet) => (
              <ListItemButton
                key={wallet.name}
                className={classes.listButton}
                dense
                onClick={() =>
                  wallet.isReady
                    ? connect(wallet)
                    : window.open(wallet.wallet.getUrl())
                }
              >
                <ListItemIcon>
                  <WalletIcon name={wallet.name} icon={wallet.icon} />
                </ListItemIcon>
                <Typography component="div" fontSize={14}>
                  <div className={`${!wallet.isReady && classes.notInstalled}`}>
                    {!wallet.isReady && 'Install'} {wallet.name}
                  </div>
                </Typography>
              </ListItemButton>
            ))
          )}
        </>
      );
    },
    [classes.listButton, classes.notInstalled, connect, search],
  );

  const sidebarContent = useMemo(() => {
    switch (walletOptionsResult.state) {
      case 'loading':
        return <CircularProgress />;
      case 'error':
        return <AlertBannerV2 error show content={walletOptionsResult.error} />;
      case 'result':
        return (
          !!walletOptionsResult.options?.length && (
            <List>
              <ListItem>
                <div className={classes.title}>
                  <Typography component={'div'} fontSize={16}>
                    {props.type === TransferWallet.RECEIVING
                      ? 'Select destination wallet'
                      : 'Connect a wallet'}
                  </Typography>
                  <div className={classes.smOnly}>
                    <IconButton onClick={props.onClose} sx={{ padding: 0 }}>
                      <CloseIcon sx={{ height: '18px', width: '18px' }} />
                    </IconButton>
                  </div>
                </div>
              </ListItem>
              <ListItem>
                <TextField
                  fullWidth
                  placeholder="Search for a wallet"
                  size="small"
                  variant="outlined"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
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
              {props.showAddressInput && !search && (
                <ListItem className={classes.addressInputContainer}>
                  <TextField
                    className={classes.addressField}
                    fullWidth
                    placeholder="Send to a wallet address"
                    size="small"
                    variant="outlined"
                    value={address}
                    onChange={(e) => {
                      setAddress(e.target.value);
                      setAddressError('');
                    }}
                    error={!!addressError}
                    helperText={addressError}
                  />
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={submitAddress}
                    disabled={!address}
                  >
                    Submit
                  </Button>
                </ListItem>
              )}
            </List>
          )
        );
      default:
        // TODO: Do we ever get to this case? If so, what should be the UI?
        return <></>;
    }
  }, [
    walletOptionsResult.state,
    walletOptionsResult.error,
    walletOptionsResult.options,
    classes.title,
    classes.smOnly,
    search,
    props.onClose,
    props.type,
    props.showAddressInput,
    renderWalletOptions,
    address,
    addressError,
    submitAddress,
  ]);

  return (
    <Drawer
      anchor="right"
      open={props.type && props.open}
      onClose={() => props.onClose?.()}
    >
      <div className={classes.drawer}>{sidebarContent}</div>
    </Drawer>
  );
};

export default WalletSidebar;
