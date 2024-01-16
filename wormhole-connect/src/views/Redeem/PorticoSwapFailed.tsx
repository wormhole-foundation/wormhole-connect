import React from 'react';
import { OKU_TRADE_BASE_URL } from 'routes/porticoBridge/consts';
import { PorticoDestTxInfo } from 'routes/porticoBridge/types';
import { makeStyles } from 'tss-react/mui';
import { getChainConfig, getDisplayName } from 'utils';
import { TOKENS } from 'config';
import { useSelector } from 'react-redux';
import { RootState } from 'store';

const useStyles = makeStyles()((theme: any) => ({
  link: {
    color: theme.palette.text.primary,
    textDecoration: 'underline',
    cursor: 'pointer',
  },
  root: {
    display: 'flex',
    gap: '8px',
    marginTop: theme.spacing(1),
  },
  warningIcon: {
    color: theme.palette.warning[500],
  },
}));

const PorticoSwapFailed = ({
  info: { swapFailed, receivedTokenKey },
}: {
  info: PorticoDestTxInfo;
}) => {
  const { classes } = useStyles();
  const txData = useSelector((state: RootState) => state.redeem.txData)!;
  if (!swapFailed || !txData) return null;
  const { canonicalTokenAddress, finalTokenAddress } = swapFailed;
  const { toChain } = txData;
  const displayName = getDisplayName(TOKENS[receivedTokenKey]);
  const toChainName = getChainConfig(toChain).displayName;
  const message = `The swap reverted on ${toChainName} and you received Wormhole Wrapped ${displayName} instead. You can retry the swap here:`;
  const swapUrl = `${OKU_TRADE_BASE_URL}/${toChain}/swap/${canonicalTokenAddress}/${finalTokenAddress}`;
  return (
    <div className={classes.root}>
      <div>
        {message}{' '}
        <a
          href={swapUrl}
          target="_blank"
          rel="noreferrer"
          className={classes.link}
        >
          Oku Trade
        </a>
      </div>
    </div>
  );
};

export default PorticoSwapFailed;
