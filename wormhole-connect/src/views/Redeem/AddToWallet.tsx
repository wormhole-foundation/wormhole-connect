import { Link, Typography } from '@mui/material';
import {
  ChainName,
  coalesceChainId,
  isEVMChain,
} from '@xlabs-libs/wallet-aggregator-core';
import React, { useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { makeStyles } from 'tss-react/mui';
import {
  CHAINS,
  isProduction,
  TESTNET_TO_MAINNET_CHAIN_NAMES,
  TOKENS,
} from '../../config';
import TokenIcon from '../../icons/TokenIcons';
import { getForeignAsset } from '../../sdk';
import { RootState } from '../../store';
import { getWrappedToken } from '../../utils';
import {
  switchNetwork,
  TransferWallet,
  WalletType,
  watchAsset,
} from '../../utils/wallet';
import { setWalletModal } from '../../store/router';

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

function AddToWallet() {
  const dispatch = useDispatch();
  const { classes } = useStyles();

  const txData = useSelector((state: RootState) => state.redeem.txData)!;
  const receiverWallet = useSelector(
    (state: RootState) => state.wallet[TransferWallet.RECEIVING],
  );

  const tokenInfo = TOKENS[txData.tokenSymbol];
  const targetToken = useMemo(() => {
    try {
      return getWrappedToken(tokenInfo);
    } catch (e) {
      console.error('Failed to retrieve wrapped token', e);
    }
  }, [tokenInfo]);

  const chainName = isProduction
    ? (txData.toChain as ChainName)
    : TESTNET_TO_MAINNET_CHAIN_NAMES[txData.toChain];
  const chainId = coalesceChainId(chainName);
  const canAddAsset = isEVMChain(chainId) && targetToken && targetToken.tokenId;

  const addToWallet = async () => {
    if (!targetToken) return;

    if (!receiverWallet || !receiverWallet.address) {
      dispatch(setWalletModal(TransferWallet.RECEIVING));
      return;
    }

    // when using the automatic relay method the user may still have their wallet
    // configured to the source chain instead of the destination chain
    const evmChainId = CHAINS[txData.toChain]?.chainId;
    if (!evmChainId) return;
    await switchNetwork(evmChainId, TransferWallet.RECEIVING);

    const targetAddress = await getForeignAsset(
      targetToken.tokenId!,
      txData.toChain,
    );
    await watchAsset(
      {
        address: targetAddress,
        symbol: targetToken.symbol,
        decimals: targetToken.decimals,
        // evm chain id
        chainId: CHAINS[targetToken.nativeNetwork]?.chainId,
      },
      TransferWallet.RECEIVING,
    );
  };

  return canAddAsset ? (
    <Link onClick={addToWallet} href="#" className={classes.addTokenLink}>
      <Typography component={'span'} className={classes.addToken}>
        <TokenIcon height={20} name={targetToken.icon} />
        Add {targetToken.symbol} to your wallet
      </Typography>
    </Link>
  ) : (
    <></>
  );
}

export default AddToWallet;
