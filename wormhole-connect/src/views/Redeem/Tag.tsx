import { toChainId } from '@wormhole-foundation/sdk';
import { stripHexPrefix } from 'sdklegacy';
import LaunchIcon from '@mui/icons-material/Launch';
import InputContainer from 'components/InputContainer';
import config from 'config';
import { WORMSCAN } from 'config/constants';
import ArrowRight from 'icons/ArrowRight';
import TokenIcon from 'icons/TokenIcons';
import React, { useMemo } from 'react';
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
  const fromChainConfig = config.chains[txData.fromChain]!;
  const toChainConfig = config.chains[txData.toChain]!;

  const sendTx = txData.sendTx;
  const sequence = txData.sequence;
  const baseEmitter = txData.emitterAddress;

  const emitter = baseEmitter ? stripHexPrefix(baseEmitter) : undefined;

  const link = useMemo(() => {
    console.log(txData, sendTx);
    if (!txData) return;
    // As of 2023-10-12, wormscan only supports tx lookup on EVM chains (before a VAA is generated)
    if (isEvmChain(fromChainConfig.id) && sendTx) {
      return `${WORMSCAN}tx/${sendTx}${
        config.isMainnet ? '' : '?network=TESTNET'
      }`;
    }
    if (!emitter || !sequence) return;

    const chainId = isGatewayChain(fromChainConfig.id)
      ? toChainId('wormchain')
      : fromChainConfig.id;
    return `${WORMSCAN}tx/${chainId}/${emitter}/${sequence}${
      config.isMainnet ? '' : '?network=TESTNET'
    }`;
  }, [txData, sendTx, emitter, sequence, fromChainConfig.id]);
  return (
    <div>
      <InputContainer>
        <div className={classes.row}>
          <div className={classes.chain}>
            <TokenIcon icon={fromChainConfig.icon!} height={24} />
            <div>{fromChainConfig.displayName}</div>
          </div>
          <ArrowRight />
          <div className={classes.chain}>
            <TokenIcon icon={toChainConfig.icon!} height={24} />
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
          <div>View on Wormholescan</div>
          <LaunchIcon />
        </a>
      )}
    </div>
  );
}

export default ChainsTag;
