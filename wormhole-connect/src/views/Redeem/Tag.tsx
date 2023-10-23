import { CHAIN_ID_WORMCHAIN } from '@certusone/wormhole-sdk';
import LaunchIcon from '@mui/icons-material/Launch';
import InputContainer from 'components/InputContainer';
import { CHAINS, WORMSCAN, isMainnet } from 'config';
import ArrowRight from 'icons/ArrowRight';
import TokenIcon from 'icons/TokenIcons';
import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from 'store';
import { makeStyles } from 'tss-react/mui';
import { isGatewayChain } from 'utils/cosmos';
import { isEvmChain } from 'utils/sdk';
import { LINK } from 'utils/style';

const useStyles = makeStyles()((theme) => ({
  row: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  icon: {
    width: '24px',
    height: '24px',
  },
  chain: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  link: {
    ...LINK(theme),
    justifyContent: 'center',
  },
}));

function ChainsTag() {
  const { classes } = useStyles();
  const txData = useSelector((state: RootState) => state.redeem.txData)!;
  const fromChainConfig = CHAINS[txData.fromChain]!;
  const toChainConfig = CHAINS[txData.toChain]!;

  const emitterAddress = txData.emitterAddress
    ? txData.emitterAddress.startsWith('0x')
      ? txData.emitterAddress.slice(2)
      : txData.emitterAddress
    : undefined;
  // As of 2023-10-12, wormscan only supports tx lookup on EVM chains (before a VAA is generated)
  const link =
    txData &&
    (isEvmChain(fromChainConfig.id) && txData.sendTx
      ? `${WORMSCAN}tx/${txData.sendTx}${isMainnet ? '' : '?network=TESTNET'}`
      : txData.emitterAddress &&
        txData.sequence &&
        // Gateway-connected chain VAAs come from gateway
        `${WORMSCAN}tx/${
          isGatewayChain(fromChainConfig.id)
            ? CHAIN_ID_WORMCHAIN
            : fromChainConfig.id
        }/${emitterAddress}/${txData.sequence}${
          isMainnet ? '' : '?network=TESTNET'
        }`);
  return (
    <div>
      <InputContainer>
        <div className={classes.row}>
          <div className={classes.chain}>
            <TokenIcon name={fromChainConfig.icon!} height={24} />
            <div>{fromChainConfig.displayName}</div>
          </div>
          <ArrowRight />
          <div className={classes.chain}>
            <TokenIcon name={toChainConfig.icon!} height={24} />
            <div>{toChainConfig.displayName}</div>
          </div>
        </div>
      </InputContainer>
      {txData && link && (
        <a
          className={classes.link}
          href={link}
          target="_blank"
          rel="noreferrer"
        >
          <div>View on Wormhole Explorer</div>
          <LaunchIcon />
        </a>
      )}
    </div>
  );
}

export default ChainsTag;
