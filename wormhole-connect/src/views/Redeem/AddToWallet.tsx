import { Link, Typography } from '@mui/material';
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { makeStyles } from 'tss-react/mui';

import config from 'config';
import { TokenConfig } from 'config/types';
import { RootState } from 'store';
import { setWalletModal } from 'store/router';
import {
  getTokenDecimals,
  getWrappedToken,
  getDisplayName,
  getChainConfig,
} from 'utils';
import { isEvmChain } from 'utils/sdk';
import { TransferWallet, switchChain, watchAsset } from 'utils/wallet';

import TokenIcon from 'icons/TokenIcons';
import ExplorerLink from './ExplorerLink';
import { isGatewayChain } from 'utils/cosmos';
import {
  isPorticoRoute,
  //isPorticoTransferDestInfo,
} from 'routes/porticoBridge/utils';
import { getTokenBridgeWrappedTokenAddress } from 'utils/sdkv2';

const useStyles = makeStyles()((theme) => ({
  addToken: {
    display: 'flex',
    alignItems: 'center',
    marginTop: '8px',
    flexDirection: 'row',
  },
  addTokenText: {
    marginLeft: '8px',
  },
  addTokenLink: {
    textDecoration: 'underline',
  },
}));

interface AddTokenProps {
  token: TokenConfig;
  address: string;
}

function AddToEVMWallet({ token, address }: AddTokenProps) {
  const dispatch = useDispatch();
  const { classes } = useStyles();

  const txData = useSelector((state: RootState) => state.redeem.txData)!;
  const receiverWallet = useSelector(
    (state: RootState) => state.wallet[TransferWallet.RECEIVING],
  );

  const addToWallet = async () => {
    if (!receiverWallet || !receiverWallet.address) {
      dispatch(setWalletModal(TransferWallet.RECEIVING));
      return;
    }

    // when using the automatic relay method the user may still have their wallet
    // configured to the source chain instead of the destination chain
    const evmChainId = config.chains[txData.toChain]?.chainId;
    if (!evmChainId || typeof evmChainId === 'string') return;
    await switchChain(evmChainId, TransferWallet.RECEIVING);

    await watchAsset(
      {
        address: address,
        symbol: token.symbol,
        decimals: getTokenDecimals(txData.toChain, token.tokenId || 'native'),
        // evm chain id
        chainId: evmChainId,
      },
      TransferWallet.RECEIVING,
    );
  };

  return (
    <Link onClick={addToWallet} href="#" className={classes.addTokenLink}>
      <Typography component={'span'} gap={1} className={classes.addToken}>
        <TokenIcon height={20} icon={token.icon} />
        Add {getDisplayName(token)} to your wallet
      </Typography>
    </Link>
  );
}

function AddToSolanaWallet({ token, address }: AddTokenProps) {
  const { classes } = useStyles();

  return (
    <Typography component={'span'} className={classes.addToken}>
      <TokenIcon height={20} icon={token.icon} />
      <span className={classes.addTokenText}>
        See {getDisplayName(token)} token on
      </span>
      <ExplorerLink
        styles={{ marginLeft: -4 }}
        chain={'Solana'}
        type={'address'}
        address={address}
        side="destination"
      />
    </Typography>
  );
}

function AddToSuiWallet({ token, address }: AddTokenProps) {
  const { classes } = useStyles();

  // display the token's metadata object ID for Sui
  return (
    <Typography component={'span'} className={classes.addToken}>
      <TokenIcon height={20} icon={token.icon} />
      <span className={classes.addTokenText}>
        See {getDisplayName(token)} token on
      </span>
      <ExplorerLink
        styles={{ marginLeft: -4 }}
        chain={'Sui'}
        type={'object'}
        object={address}
        side="destination"
      />
    </Typography>
  );
}

function AddToAptosWallet({ token, address }: AddTokenProps) {
  const { classes } = useStyles();

  const tokenAccount = address.split('::')[0];
  return (
    <Typography component={'span'} className={classes.addToken}>
      <TokenIcon height={20} icon={token.icon} />
      <span className={classes.addTokenText}>
        See {getDisplayName(token)} token on
      </span>
      <ExplorerLink
        styles={{ marginLeft: -4 }}
        chain={'Aptos'}
        type={'address'}
        address={tokenAccount}
        side="destination"
      />
    </Typography>
  );
}

function AddToWallet() {
  const txData = useSelector((state: RootState) => state.redeem.txData)!;
  const route = useSelector((state: RootState) => state.redeem.route);
  const transferDestInfo = useSelector(
    (state: RootState) => state.redeem.transferDestInfo,
  );
  const [targetToken, setTargetToken] = useState<TokenConfig | undefined>(
    undefined,
  );
  const [targetAddress, setTargetAddress] = useState<string | null | undefined>(
    undefined,
  );

  useEffect(() => {
    const fetchTokenInfo = async () => {
      if (isGatewayChain(txData.toChain)) return;
      const isPorticoTransfer = false; //isPorticoTransferDestInfo(transferDestInfo);
      // we need the transfer dest info to get the received token key for portico
      if (route && isPorticoRoute(route) && !isPorticoTransfer) return;
      const receivedTokenKey = isPorticoTransfer
        ? /* @ts-ignore */
          transferDestInfo.destTxInfo.receivedTokenKey
        : /* @ts-ignore */
          txData.receivedTokenKey;
      const tokenInfo = config.tokens[receivedTokenKey];
      if (!tokenInfo) return;
      try {
        if (getChainConfig(txData.toChain).gasToken === tokenInfo.key) return;
      } catch (e) {
        console.error(e);
      }
      const wrapped = getWrappedToken(tokenInfo);
      if (!wrapped.tokenId) return;

      const address = await getTokenBridgeWrappedTokenAddress(
        wrapped,
        txData.toChain,
      );

      if (!address) throw new Error('Failed to get foreign token address');

      if (txData.toChain === 'Sui' && address) {
        /*
        const context = config.wh.getContext(
          'Sui',
        ) as SuiContext<WormholeContext>;
        const metadata = await context.provider.getCoinMetadata({
          coinType: address.toString(),
        });
        setTargetAddress(metadata?.id);
        setTargetToken(wrapped);
        return;
         */
      }
      setTargetAddress(address.toString());
      setTargetToken(wrapped);
    };

    fetchTokenInfo().catch((err) =>
      console.error('Failed to fetch token info', err),
    );
  }, [txData, route, transferDestInfo]);

  const chain = txData.toChain;

  if (!targetToken || !targetAddress) return <></>;

  if (isEvmChain(txData.toChain)) {
    return <AddToEVMWallet address={targetAddress} token={targetToken} />;
  } else if (chain === 'Solana' && targetToken.symbol !== 'WSOL') {
    return <AddToSolanaWallet address={targetAddress} token={targetToken} />;
  } else if (chain === 'Sui') {
    return <AddToSuiWallet address={targetAddress} token={targetToken} />;
  } else if (chain === 'Aptos' && targetToken.symbol !== 'APT') {
    return <AddToAptosWallet address={targetAddress} token={targetToken} />;
  }

  return <></>;
}

export default AddToWallet;
