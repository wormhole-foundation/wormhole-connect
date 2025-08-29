import type { JSX } from 'react';
import React, { useCallback, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { chainToPlatform } from '@wormhole-foundation/sdk';
import { useTheme } from '@mui/material';

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
import Box from '@mui/material/Box';

import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';

import config from 'config';
import type { RootState } from 'store';
import type { WalletData } from 'utils/wallet';
import { TransferWallet } from 'utils/wallet';
import { isInternalProvider } from 'utils/wallet/InternalWalletProvider';
import type { InternalWalletProvider } from 'utils/wallet/InternalWalletProvider';

import AlertBannerV3 from 'components/v3/AlertBanner';
import { useAvailableWallets } from 'hooks/useAvailableWallets';
import useWalletProvider from 'hooks/useWalletProvider';
import WalletIcon from 'icons/WalletIcons';
import { validateWalletAddress } from 'utils/address';
import { ReadOnlyWallet } from 'utils/wallet/ReadOnlyWallet';
import { SANCTIONED_WALLETS } from 'consts/wallet';
import { clearWallet } from 'store/wallet';

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
  const theme = useTheme();
  const { walletProvider } = useWalletProvider();
  const internalWalletProvider = walletProvider as InternalWalletProvider;

  const styles = useMemo(
    () => ({
      listButton: {
        display: 'flex',
        flexDirection: 'row' as const,
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
        flexDirection: 'row' as const,
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
        flexDirection: 'row' as const,
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
    }),
    [theme],
  );

  const { fromChain: sourceChain, toChain: destChain } = useSelector(
    (state: RootState) => state.transferInput,
  );

  const { onClose, type: propsType } = props;

  const [search, setSearch] = useState('');
  const [address, setAddress] = useState('');
  const [addressError, setAddressError] = useState('');

  const supportedChains = useMemo(() => {
    const networkContext = config.chainsArr.map((chain) =>
      chainToPlatform(chain.sdkName),
    );
    return new Set(networkContext);
  }, []);

  const selectedChain = useMemo(
    () => (propsType === TransferWallet.SENDING ? sourceChain : destChain),
    [propsType, sourceChain, destChain],
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

      onClose?.();
      try {
        await internalWalletProvider.onWalletSelected(
          walletInfo.wallet,
          selectedChain,
          propsType,
        );
      } catch (error) {
        console.error('Failed to select wallet:', error);
      }
    },
    [selectedChain, propsType, onClose, internalWalletProvider],
  );

  const submitAddress = useCallback(async () => {
    if (!selectedChain || !address) return;

    const chainConfig = config.chains[selectedChain];
    if (!chainConfig) return;

    const nativeAddress = await validateWalletAddress(selectedChain, address);
    if (!nativeAddress) {
      setAddressError('Invalid Address');
      dispatch(clearWallet(TransferWallet.RECEIVING));
      return;
    }

    for (const sanctioned of SANCTIONED_WALLETS) {
      if (nativeAddress.toString().toLowerCase() === sanctioned.toLowerCase()) {
        setAddressError('Restricted Address');
        dispatch(clearWallet(TransferWallet.RECEIVING));
        return;
      }
    }

    const wallet = new ReadOnlyWallet(nativeAddress, selectedChain);

    onClose?.();
    try {
      await internalWalletProvider.onWalletSelected(
        wallet,
        selectedChain,
        TransferWallet.RECEIVING,
      );
    } catch (error) {
      console.error('Failed to select wallet:', error);
    }
  }, [address, selectedChain, onClose, dispatch, internalWalletProvider]);

  const handleClose = useCallback(() => {
    internalWalletProvider.onWalletSelectCancelled();
    props.onClose?.();
  }, [internalWalletProvider, props.onClose]);

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
                sx={styles.listButton}
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
                  <Box sx={!wallet.isReady ? styles.notInstalled : {}}>
                    {!wallet.isReady && 'Install'} {wallet.name}
                  </Box>
                </Typography>
              </ListItemButton>
            ))
          )}
        </>
      );
    },
    [styles.listButton, styles.notInstalled, connect, search],
  );

  const sidebarContent = useMemo(() => {
    switch (walletOptionsResult.state) {
      case 'loading':
        return <CircularProgress />;
      case 'error':
        return <AlertBannerV3 error>{walletOptionsResult.error}</AlertBannerV3>;
      case 'result':
        return (
          !!walletOptionsResult.options?.length && (
            <List>
              <ListItem>
                <Box sx={styles.title}>
                  <Typography component={'div'} fontSize={16}>
                    {props.type === TransferWallet.RECEIVING
                      ? 'Select destination wallet'
                      : 'Connect a wallet'}
                  </Typography>
                  <Box sx={styles.smOnly}>
                    <IconButton onClick={handleClose} sx={{ padding: 0 }}>
                      <CloseIcon sx={{ height: '18px', width: '18px' }} />
                    </IconButton>
                  </Box>
                </Box>
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
                <ListItem sx={styles.addressInputContainer}>
                  <TextField
                    sx={styles.addressField}
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
    walletOptionsResult,
    styles.title,
    styles.smOnly,
    styles.addressInputContainer,
    styles.addressField,
    props.type,
    props.showAddressInput,
    search,
    renderWalletOptions,
    address,
    addressError,
    submitAddress,
    handleClose,
  ]);

  if (!isInternalProvider(walletProvider)) {
    return null;
  }

  return (
    <Drawer
      anchor="right"
      open={propsType && props.open}
      onClose={handleClose}
      slotProps={{
        paper: {
          sx: styles.drawer,
        },
      }}
    >
      <Box sx={styles.drawer}>{sidebarContent}</Box>
    </Drawer>
  );
};

export default WalletSidebar;
