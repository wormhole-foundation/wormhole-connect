import React, { useMemo } from 'react';
import InputContainer from '../../components/InputContainer';
import Button from '../../components/Button';
import Spacer from '../../components/Spacer';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import {
  CHAINS,
  isProduction,
  TESTNET_TO_MAINNET_CHAIN_NAMES,
  TOKENS,
} from '../../config';
import { getWrappedToken } from '../../utils';
import { makeStyles } from 'tss-react/mui';
import { Link, Typography } from '@mui/material';
import TokenIcon from '../../icons/TokenIcons';
import {
  ChainName,
  coalesceChainId,
  isEVMChain,
} from '@xlabs-libs/wallet-aggregator-core';
import { switchNetwork, TransferWallet, watchAsset } from '../../utils/wallet';
import { getForeignAsset } from '../../sdk';

type Props = {
  ctaText: string;
  cta?: React.MouseEventHandler<HTMLDivElement>;
};

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

function CTA(props: Props) {
  const { classes } = useStyles();

  const txData = useSelector((state: RootState) => state.redeem.txData)!;

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

    // when using the automatic relay method the user may still have their wallet
    // configured to the source chain instead of the destination chain
    const evmChainId = CHAINS[txData.toChain]?.chainId;
    if (!evmChainId) return;
    await switchNetwork(evmChainId, TransferWallet.RECEIVING);

    const targetAddress = await getForeignAsset(
      targetToken.tokenId!,
      txData.toChain,
    );
    watchAsset(
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

  return (
    <div>
      <InputContainer>
        <div>The bridge is now complete.</div>
        <div>
          Click the button below to begin using your new Wormhole assets.
        </div>
        {canAddAsset ? (
          <Link onClick={addToWallet} href="#" className={classes.addTokenLink}>
            <Typography className={classes.addToken}>
              <TokenIcon height={20} name={targetToken.icon} />
              Add {targetToken.symbol} to your wallet
            </Typography>
          </Link>
        ) : (
          <></>
        )}
      </InputContainer>
      <Spacer />
      <Button onClick={props.cta} action elevated>
        {props.ctaText}
      </Button>
    </div>
  );
}

export default CTA;
