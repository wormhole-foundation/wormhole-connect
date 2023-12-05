import { isEVMChain } from '@certusone/wormhole-sdk';
import { Link, Typography } from '@mui/material';
import { ChainName } from '@wormhole-foundation/wormhole-connect-sdk';
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { makeStyles } from 'tss-react/mui';

import { CHAINS, TOKENS } from 'config';
import { MAINNET_CHAINS } from 'config/mainnet';
import { TokenConfig } from 'config/types';
import { RootState } from 'store';
import { setWalletModal } from 'store/router';
import { getDisplayName, getTokenDecimals, getWrappedToken } from 'utils';
import { wh } from 'utils/sdk';
import { TransferWallet, switchChain, watchAsset } from 'utils/wallet';

import TokenIcon from 'icons/TokenIcons';
import { isGatewayChain } from 'utils/cosmos';
import ExplorerLink from './ExplorerLink';

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
    const evmChainId = CHAINS[txData.toChain]?.chainId;
    if (!evmChainId || typeof evmChainId === 'string') return;
    await switchChain(evmChainId, TransferWallet.RECEIVING);

    await watchAsset(
      {
        address: address,
        symbol: token.symbol,
        decimals: getTokenDecimals(
          wh.toChainId(txData.toChain),
          token.tokenId || 'native',
        ),
        // evm chain id
        chainId: evmChainId,
      },
      TransferWallet.RECEIVING,
    );
  };

  return (
    <Link onClick={addToWallet} href="#" className={classes.addTokenLink}>
      <Typography component={'span'} gap={1} className={classes.addToken}>
        <TokenIcon height={20} name={token.icon} />
        Add {getDisplayName(token)} to your wallet
      </Typography>
    </Link>
  );
}

function AddToSolanaWallet({ token, address }: AddTokenProps) {
  const { classes } = useStyles();

  return (
    <Typography component={'span'} className={classes.addToken}>
      <TokenIcon height={20} name={token.icon} />
      <span className={classes.addTokenText}>
        See {getDisplayName(token)} token on
      </span>
      <ExplorerLink
        styles={{ marginLeft: -4 }}
        chain={'solana'}
        type={'address'}
        address={address}
      />
    </Typography>
  );
}

function AddToSuiWallet({ token, address }: AddTokenProps) {
  const { classes } = useStyles();

  // display the token's metadata object ID for Sui
  return (
    <Typography component={'span'} className={classes.addToken}>
      <TokenIcon height={20} name={token.icon} />
      <span className={classes.addTokenText}>
        See {getDisplayName(token)} token on
      </span>
      <ExplorerLink
        styles={{ marginLeft: -4 }}
        chain={'sui'}
        type={'object'}
        object={address}
      />
    </Typography>
  );
}

function AddToAptosWallet({ token, address }: AddTokenProps) {
  const { classes } = useStyles();

  const tokenAccount = address.split('::')[0];
  return (
    <Typography component={'span'} className={classes.addToken}>
      <TokenIcon height={20} name={token.icon} />
      <span className={classes.addTokenText}>
        See {getDisplayName(token)} token on
      </span>
      <ExplorerLink
        styles={{ marginLeft: -4 }}
        chain={'aptos'}
        type={'address'}
        address={tokenAccount}
      />
    </Typography>
  );
}

function AddToWallet() {
  const txData = useSelector((state: RootState) => state.redeem.txData)!;
  const route = useSelector((state: RootState) => state.redeem.route);
  const [targetToken, setTargetToken] = useState<TokenConfig | undefined>(
    undefined,
  );
  const [targetAddress, setTargetAddress] = useState<string | null | undefined>(
    undefined,
  );

  useEffect(() => {
    const fetchTokenInfo = async () => {
      if (isGatewayChain(txData.toChain)) return;
      const tokenInfo = TOKENS[txData.receivedTokenKey];
      const wrapped = getWrappedToken(tokenInfo);
      if (!wrapped.tokenId) return;
      const address = await wh.getForeignAsset(wrapped.tokenId, txData.toChain);

      setTargetAddress(address);
      setTargetToken(wrapped);
    };

    fetchTokenInfo().catch((err) =>
      console.error('Failed to fetch token info', err),
    );
  }, [txData, route]);

  const chainId = wh.toChainId(txData.toChain as ChainName);

  if (!targetToken || !targetAddress) return <></>;

  if (isEVMChain(chainId)) {
    return <AddToEVMWallet address={targetAddress} token={targetToken} />;
  } else if (
    chainId === MAINNET_CHAINS.solana?.id &&
    targetToken.symbol !== 'WSOL'
  ) {
    return <AddToSolanaWallet address={targetAddress} token={targetToken} />;
  } else if (chainId === MAINNET_CHAINS.sui?.id) {
    return <AddToSuiWallet address={targetAddress} token={targetToken} />;
  } else if (
    chainId === MAINNET_CHAINS.aptos?.id &&
    targetToken.symbol !== 'APT'
  ) {
    return <AddToAptosWallet address={targetAddress} token={targetToken} />;
  }

  return <></>;
}

export default AddToWallet;
