import React, { useEffect } from 'react';
import InputContainer from '../../components/InputContainer';
import Button from '../../components/Button';
import Spacer from '../../components/Spacer';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { CHAINS, isProduction, TOKENS } from '../../config';
import { getWrappedToken } from '../../utils';
import { makeStyles } from 'tss-react/mui';
import { Link, Typography } from '@mui/material';
import TokenIcon from '../../icons/TokenIcons';
import { ChainName, coalesceChainId, isEVMChain } from '@xlabs-libs/wallet-aggregator-core';
import { TransferWallet, watchAsset } from '../../utils/wallet';
import { TestnetChainName } from '@wormhole-foundation/wormhole-connect-sdk/dist/src/config/TESTNET';
import { MainnetChainName } from '@wormhole-foundation/wormhole-connect-sdk';
import { getForeignAsset } from '../../sdk';

type Props = {
  ctaText: string;
  cta?: React.MouseEventHandler<HTMLDivElement>;
};

const TESTNET_CHAIN_NAMES: { [k in TestnetChainName]: MainnetChainName} = {
  'goerli': 'ethereum',
  'fuji': 'avalanche',
  'mumbai': 'polygon',
  'alfajores': 'celo',
  'moonbasealpha': 'moonbeam',
  'solana': 'solana',
  'bsc': 'bsc',
  'fantom': 'fantom'
}

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
  }
}));

function CTA(props: Props) {
  const { classes } = useStyles();

  const txData = useSelector((state: RootState) => state.redeem.txData)!;

  const tokenInfo = TOKENS[txData.tokenSymbol];
  const targetToken = getWrappedToken(tokenInfo);

  const chainName = isProduction ? txData.toChain as ChainName : TESTNET_CHAIN_NAMES[txData.toChain];
  const chainId = coalesceChainId(chainName);

  const addToWallet = async () => {
    const targetAddress = await getForeignAsset(targetToken.tokenId!, txData.toChain);
    watchAsset({
      address: targetAddress,
      symbol: targetToken.symbol,
      decimals: targetToken.decimals,
      // evm chain id
      chainId: CHAINS[targetToken.nativeNetwork]?.chainId,
    }, TransferWallet.RECEIVING)
  };

  const canAddAsset = isEVMChain(chainId) && targetToken.tokenId;

  return (
    <div>
      <InputContainer>
        <div>The bridge is now complete.</div>
        <div>
          Click the button below to begin using your new Wormhole assets.
        </div>
        {canAddAsset ? (
          <Link onClick={addToWallet} href='#' className={classes.addTokenLink}>
            <Typography className={classes.addToken}>
              Add
              <TokenIcon height={20} name={targetToken.icon} />
              {targetToken.symbol} to your wallet
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
