import { CHAIN_ID_WORMCHAIN } from '@certusone/wormhole-sdk';
import { stripHexPrefix } from '@wormhole-foundation/wormhole-connect-sdk';
import LaunchIcon from '@mui/icons-material/Launch';
import InputContainer from 'components/InputContainer';
import { CHAINS, WORMSCAN, isMainnet } from 'config';
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
  const signedMessage = useSelector(
    (state: RootState) => state.redeem.signedMessage,
  );
  const fromChainConfig = CHAINS[txData.fromChain]!;
  const toChainConfig = CHAINS[txData.toChain]!;

  const sendTx = txData.sendTx || signedMessage?.sendTx;
  const sequence = txData.sequence || signedMessage?.sequence;
  const baseEmitter = txData.emitterAddress || signedMessage?.emitterAddress;

  const emitter = baseEmitter ? stripHexPrefix(baseEmitter) : undefined;

  const link = useMemo(() => {
    if (!txData) return;
    // As of 2023-10-12, wormscan only supports tx lookup on EVM chains (before a VAA is generated)
    if (isEvmChain(fromChainConfig.id) && sendTx) {
      return `${WORMSCAN}tx/${sendTx}${isMainnet ? '' : '?network=TESTNET'}`;
    }
    if (!emitter || !sequence) return;

    const chainId = isGatewayChain(fromChainConfig.id)
      ? CHAIN_ID_WORMCHAIN
      : fromChainConfig.id;
    return `${WORMSCAN}tx/${chainId}/${emitter}/${sequence}${
      isMainnet ? '' : '?network=TESTNET'
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
