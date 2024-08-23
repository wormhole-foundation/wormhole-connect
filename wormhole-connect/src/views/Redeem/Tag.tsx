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

  const link = useMemo(() => {
    return `${WORMSCAN}tx/${sendTx}${
      config.isMainnet ? '' : '?network=TESTNET'
    }`;
  }, [txData, sendTx, fromChainConfig.id]);
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
