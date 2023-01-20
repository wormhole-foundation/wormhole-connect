import React from 'react';
import { makeStyles } from 'tss-react/mui';
import CircularProgress from '@mui/material/CircularProgress';
import MAINNET_CONFIG from '../../sdk/config/MAINNET';
import { ChainName } from '../../sdk/types';
import WalletIcon from '../../icons/components/Wallet';
import { LINK } from '../../utils/style';
import LaunchIcon from '@mui/icons-material/Launch';

const useStyles = makeStyles()((theme) => ({
  header: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: '8px',
    borderBottom: `0.5px solid ${theme.palette.divider}`,
    marginBottom: '8px',
  },
  left: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    fontSize: '16px',
    gap: '8px',
  },
  networkIcon: {
    height: '32px',
    width: '32px',
  },
  link: LINK(theme),
}));

type Props = {
  network: ChainName;
  senderAddress: string;
  txHash?: string;
};

function NetworksTag(props: Props) {
  const { classes } = useStyles();
  const networkConfig = MAINNET_CONFIG.chains[props.network]!;
  return (
    <div className={classes.header}>
      <div className={classes.left}>
        <img
          className={classes.networkIcon}
          src={networkConfig.icon}
          alt={networkConfig.displayName}
        />
        <div>{props.senderAddress}</div>
        <WalletIcon />
      </div>
      {props.txHash ? (
        <a
          className={classes.link}
          href="https://wormhole.com/"
          target="_blank"
          rel="noreferrer"
        >
          <div>View in {networkConfig.explorerName}</div>
          <LaunchIcon />
        </a>
      ) : (
        <CircularProgress size={26} />
      )}
    </div>
  );
}

export default NetworksTag;
