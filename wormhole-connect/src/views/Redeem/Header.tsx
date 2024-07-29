import React from 'react';
import { makeStyles } from 'tss-react/mui';
import type { ChainName } from 'sdklegacy';

import config from 'config';
import { displayAddress } from 'utils';

import WalletIcon from 'icons/Wallet';
import TokenIcon from 'icons/TokenIcons';
import CircularProgress from '@mui/material/CircularProgress';
import ExplorerLink from './ExplorerLink';
import { TransferSide } from 'config/types';

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
  chainIcon: {
    height: '32px',
    width: '32px',
  },
}));

type Props = {
  chain: ChainName;
  address?: string;
  txHash?: string;
  loading?: boolean;
  text?: string;
  side: TransferSide;
};

function Header(props: Props) {
  const { classes } = useStyles();
  const chainConfig = config.chains[props.chain]!;
  return (
    <div className={classes.header}>
      <div className={classes.left}>
        <TokenIcon icon={chainConfig.icon!} height={32} />
        {props.address && (
          <>
            <div>{displayAddress(props.chain, props.address)}</div>
            <WalletIcon />
          </>
        )}
      </div>
      {props.loading ? (
        <CircularProgress size={26} />
      ) : props.text ? (
        <div data-testid={`${props.side}-section-scan-link-error-message`}>
          {props.text}
        </div>
      ) : (
        props.txHash && (
          <ExplorerLink
            chain={props.chain}
            type={'tx'}
            txHash={props.txHash}
            side={props.side}
          />
        )
      )}
    </div>
  );
}

export default Header;
