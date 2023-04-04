import { Link, Typography } from '@mui/material';
import {
  ChainName,
  coalesceChainId,
  isEVMChain,
} from '@xlabs-libs/wallet-aggregator-core';
import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { makeStyles } from 'tss-react/mui';
import {
  CHAINS,
  TESTNET_TO_MAINNET_CHAIN_NAMES,
  TOKENS,
  isProduction,
} from '../../config';
import { MAINNET_NETWORKS } from '../../config/mainnet';
import TokenIcon from '../../icons/TokenIcons';
import { getForeignAsset } from '../../sdk';
import { RootState } from '../../store';
import { setWalletModal } from '../../store/router';
import {
  copyTextToClipboard,
  displayAddress,
  getWrappedToken,
} from '../../utils';
import { TransferWallet, switchNetwork, watchAsset } from '../../utils/wallet';
import { TokenConfig } from '../../config/types';

const useStyles = makeStyles()((theme) => ({
  addToken: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginTop: '8px',
    flexDirection: 'row',
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
    if (!evmChainId) return;
    await switchNetwork(evmChainId, TransferWallet.RECEIVING);

    await watchAsset(
      {
        address: address,
        symbol: token.symbol,
        decimals: token.decimals,
        // evm chain id
        chainId: CHAINS[token.nativeNetwork]?.chainId,
      },
      TransferWallet.RECEIVING,
    );
  };

  return (
    <Link onClick={addToWallet} href="#" className={classes.addTokenLink}>
      <Typography component={'span'} className={classes.addToken}>
        <TokenIcon height={20} name={token.icon} />
        Add {token.symbol} to your wallet
      </Typography>
    </Link>
  );
}

function AddToSolanaWallet({ token, address }: AddTokenProps) {
  const { classes } = useStyles();

  const copyTokenAddress = async function () {
    await copyTextToClipboard(address);
  };

  return (
    <Typography component={'span'} className={classes.addToken}>
      <TokenIcon height={20} name={token.icon} />
      Copy {token.symbol} token address:
      <Link
        onClick={copyTokenAddress}
        href="#"
        className={classes.addTokenLink}
      >
        {displayAddress('solana', address)}
      </Link>
    </Typography>
  );
}

function AddToWallet() {
  const txData = useSelector((state: RootState) => state.redeem.txData)!;

  const [targetToken, setTargetToken] = useState<TokenConfig | undefined>(
    undefined,
  );
  const [targetAddress, setTargetAddress] = useState<string | undefined>(
    undefined,
  );

  useEffect(() => {
    const fetchTokenInfo = async () => {
      const tokenInfo = TOKENS[txData.tokenSymbol];
      const wrapped = getWrappedToken(tokenInfo);
      if (!wrapped.tokenId) return;
      const address = await getForeignAsset(wrapped.tokenId, txData.toChain);

      setTargetToken(wrapped);
      setTargetAddress(address);
    };

    fetchTokenInfo().catch((err) =>
      console.error('Failed to fetch token info', err),
    );
  }, [txData]);

  const chainName = isProduction
    ? (txData.toChain as ChainName)
    : TESTNET_TO_MAINNET_CHAIN_NAMES[txData.toChain];
  const chainId = coalesceChainId(chainName);

  if (!targetToken || !targetAddress) return <></>;

  if (isEVMChain(chainId)) {
    return <AddToEVMWallet address={targetAddress} token={targetToken} />;
  } else if (chainId === MAINNET_NETWORKS.solana?.id) {
    return <AddToSolanaWallet address={targetAddress} token={targetToken} />;
  }

  return <></>;
}

export default AddToWallet;
