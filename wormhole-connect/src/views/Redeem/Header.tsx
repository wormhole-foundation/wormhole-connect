import React from 'react';
import { makeStyles } from 'tss-react/mui';
import { ChainName } from '@wormhole-foundation/wormhole-connect-sdk';
import { CHAINS } from '../../sdk/config';
import { displayAddress } from '../../utils';
import { LINK } from '../../utils/style';
import WalletIcon from '../../icons/components/Wallet';
import TokenIcon from '../../icons/components/TokenIcons';
import CircularProgress from '@mui/material/CircularProgress';
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
  link: {
    ...LINK(theme),
    transform: 'translateX(10px)',
  },
}));

type Props = {
  network: ChainName;
  address: string;
  txHash?: string;
  loading?: boolean;
};

function Header(props: Props) {
  const { classes } = useStyles();
  const networkConfig = CHAINS[props.network]!;
  let explorerLink = `${networkConfig.explorerUrl}tx/${props.txHash}`;
  if (
    networkConfig.key === 'solana' &&
    process.env.REACT_APP_ENV === 'TESTNET'
  ) {
    explorerLink += '?cluster=devnet';
  }
  return (
    <div className={classes.header}>
      <div className={classes.left}>
        <TokenIcon name={networkConfig.icon!} height={32} />
        <div>{displayAddress(props.network, props.address)}</div>
        <WalletIcon />
      </div>
      {props.loading ? (
        <CircularProgress size={26} />
      ) : (
        props.txHash && (
          <a
            className={classes.link}
            href={explorerLink}
            target="_blank"
            rel="noreferrer"
          >
            <div>View in {networkConfig.explorerName}</div>
            <LaunchIcon />
          </a>
        )
      )}
    </div>
  );
}

export default Header;
