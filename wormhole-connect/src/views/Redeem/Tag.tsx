import React from 'react';
import { useSelector } from 'react-redux';
import { makeStyles } from 'tss-react/mui';

import { RootState } from 'store';
import { LINK } from 'utils/style';
import { CHAINS, WORMSCAN, isMainnet } from 'config';

import InputContainer from 'components/InputContainer';
import ArrowRight from 'icons/ArrowRight';
import LaunchIcon from '@mui/icons-material/Launch';
import TokenIcon from 'icons/TokenIcons';

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
  network: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  link: {
    ...LINK(theme),
    justifyContent: 'center',
  },
}));

function NetworksTag() {
  const { classes } = useStyles();
  const txData = useSelector((state: RootState) => state.redeem.txData)!;
  const fromNetworkConfig = CHAINS[txData.fromChain]!;
  const toNetworkConfig = CHAINS[txData.toChain]!;

  const emitterAddress = txData.emitterAddress
    ? txData.emitterAddress.startsWith('0x')
      ? txData.emitterAddress.slice(2)
      : txData.emitterAddress
    : undefined;
  const link =
    txData &&
    txData.emitterAddress &&
    txData.sequence &&
    `${WORMSCAN}tx/${fromNetworkConfig.id}/${emitterAddress}/${
      txData.sequence
    }${isMainnet ? '' : '?network=TESTNET'}`;

  return (
    <div>
      <InputContainer>
        <div className={classes.row}>
          <div className={classes.network}>
            <TokenIcon name={fromNetworkConfig.icon!} height={24} />
            <div>{fromNetworkConfig.displayName}</div>
          </div>
          <ArrowRight />
          <div className={classes.network}>
            <TokenIcon name={toNetworkConfig.icon!} height={24} />
            <div>{toNetworkConfig.displayName}</div>
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

export default NetworksTag;
