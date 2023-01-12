import React from 'react';
import { makeStyles } from 'tss-react/mui';
import { ChainName } from '@wormhole-foundation/wormhole-connect-sdk';
import { CHAINS } from '../../config';
import { displayAddress } from '../../utils';
import WalletIcon from '../../icons/Wallet';
import TokenIcon from '../../icons/TokenIcons';
import CircularProgress from '@mui/material/CircularProgress';
import ExplorerLink from './ExplorerLink';

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
}));

type Props = {
  network: ChainName;
  address: string;
  txHash?: string;
  loading?: boolean;
  text?: string;
};

function Header(props: Props) {
  const { classes } = useStyles();
  const networkConfig = CHAINS[props.network]!;
  return (
    <div className={classes.header}>
      <div className={classes.left}>
        <TokenIcon name={networkConfig.icon!} height={32} />
        <div>{displayAddress(props.network, props.address)}</div>
        <WalletIcon />
      </div>
      {props.loading ? (
        <CircularProgress size={26} />
      ) : props.text ? (
        <div>{props.text}</div>
      ) : (
        props.txHash && (
          <ExplorerLink
            network={props.network}
            type={'tx'}
            txHash={props.txHash}
          />
        )
      )}
    </div>
  );
}

export default Header;
