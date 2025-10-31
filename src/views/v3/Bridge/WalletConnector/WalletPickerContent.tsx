import React, { useCallback, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { chainToPlatform } from '@wormhole-foundation/sdk';
import { useTheme } from '@mui/material';

import CircularProgress from '@mui/material/CircularProgress';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';

import config from 'config';
import type { RootState } from 'store';
import type { WalletData } from 'utils/wallet';
import { TransferWallet } from 'utils/wallet';
import type { InternalWalletProvider } from 'utils/wallet/InternalWalletProvider';

import AlertBannerV3 from 'components/v3/AlertBanner';
import { useAvailableWallets } from 'hooks/useAvailableWallets';
import useWalletProvider from 'hooks/useWalletProvider';
import WalletIcon from 'icons/WalletIcons';
import { validateWalletAddress } from 'utils/address';
import { ReadOnlyWallet } from 'utils/wallet/ReadOnlyWallet';
import { SANCTIONED_WALLETS } from 'consts/wallet';
import { clearWallet } from 'store/wallet';

interface WalletPickerContentProps {
  onSelect: () => void;
  showAddressInput: boolean;
  walletType: TransferWallet;
}

function WalletPickerContent({
  onSelect,
  showAddressInput,
  walletType,
}: WalletPickerContentProps) {
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
        flexDirection: 'row',
        gap: '8px',
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

  const [address, setAddress] = useState('');
  const [addressError, setAddressError] = useState('');

  const supportedChains = useMemo(() => {
    const networkContext = config.chainsArr.map((chain) =>
      chainToPlatform(chain.sdkName),
    );
    return new Set(networkContext);
  }, []);

  const selectedChain = useMemo(
    () => (walletType === TransferWallet.SENDING ? sourceChain : destChain),
    [walletType, sourceChain, destChain],
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

      // Close the dialog before proceeding
      // as other dialogs may popup
      onSelect();

      try {
        await internalWalletProvider.onWalletSelected(
          walletInfo.wallet,
          selectedChain,
          walletType,
        );
      } catch (error) {
        console.error('Failed to select wallet:', error);
      }
    },
    [selectedChain, walletType, onSelect, internalWalletProvider],
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

    // Close the dialog before proceeding
    // as other dialogs may popup
    onSelect();

    try {
      await internalWalletProvider.onWalletSelected(
        wallet,
        selectedChain,
        TransferWallet.RECEIVING,
      );
    } catch (error) {
      console.error('Failed to select wallet:', error);
    }
  }, [address, selectedChain, onSelect, dispatch, internalWalletProvider]);

  const renderWalletOptions = useCallback(
    (wallets: WalletData[]) => {
      const walletsSorted = [...wallets].sort((w) => (w.isReady ? -1 : 1));

      return walletsSorted.map((wallet) => (
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
      ));
    },
    [styles.listButton, styles.notInstalled, connect],
  );

  if (walletOptionsResult.state === 'loading') {
    return <CircularProgress />;
  }

  if (walletOptionsResult.state === 'error') {
    return <AlertBannerV3 error>{walletOptionsResult.error}</AlertBannerV3>;
  }

  if (!walletOptionsResult.options?.length) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', paddingY: 5 }}>
        <Typography>No available wallets</Typography>
      </Box>
    );
  }

  return (
    <>
      <List sx={{ overflow: 'auto', flex: 1 }}>
        {renderWalletOptions(walletOptionsResult.options)}
      </List>
      {showAddressInput && (
        <Box sx={styles.addressInputContainer}>
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
          <div>
            <Button
              variant="contained"
              color="primary"
              onClick={submitAddress}
              disabled={!address}
            >
              Submit
            </Button>
          </div>
        </Box>
      )}
    </>
  );
}

export default React.memo(WalletPickerContent);
