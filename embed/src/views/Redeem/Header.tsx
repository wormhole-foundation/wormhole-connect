import React from 'react';
import { makeStyles } from 'tss-react/mui';
import CircularProgress from '@mui/material/CircularProgress';
import { CHAINS } from '../../sdk/config';
import { ChainName } from '../../sdk/types';
import WalletIcon from '../../icons/components/Wallet';
import { LINK } from '../../utils/style';
import LaunchIcon from '@mui/icons-material/Launch';
import { displayEvmAddress } from '../../utils';

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
  link: {
    ...LINK(theme),
    transform: 'translateX(10px)',
  },
}));

type Props = {
  network: ChainName;
  address: string;
  txHash?: string;
};

function Header(props: Props) {
  const { classes } = useStyles();
  const networkConfig = CHAINS[props.network]!;
  const explorerLink = `${networkConfig.explorerUrl}tx/${props.txHash}`;
  return (
    <div className={classes.header}>
      <div className={classes.left}>
        <img
          className={classes.networkIcon}
          src={networkConfig.icon}
          alt={networkConfig.displayName}
        />
        <div>{displayEvmAddress(props.address)}</div>
        <WalletIcon />
      </div>
      {props.txHash ? (
        <a
          className={classes.link}
          href={explorerLink}
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

export default Header;
