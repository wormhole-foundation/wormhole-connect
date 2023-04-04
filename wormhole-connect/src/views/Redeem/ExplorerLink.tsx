import React from 'react';
import { ChainName } from '@wormhole-foundation/wormhole-connect-sdk';
import { makeStyles } from 'tss-react/mui';
import { LINK } from '../../utils/style';
import { CHAINS } from '../../config';
import LaunchIcon from '@mui/icons-material/Launch';

const useStyles = makeStyles()((theme) => ({
  link: {
    ...LINK(theme),
    transform: 'translateX(10px)',
  },
}));

type ExplorerLinkProps = {
  network: ChainName;
  styles?: React.CSSProperties;
} & ({ type: 'tx'; txHash: string } | { type: 'address'; address: string });

function ExplorerLink(props: ExplorerLinkProps) {
  const { classes } = useStyles();

  const networkConfig = CHAINS[props.network]!;

  let explorerLink =
    props.type === 'tx'
      ? `${networkConfig.explorerUrl}tx/${props.txHash}`
      : `${networkConfig.explorerUrl}address/${props.address}`;

  if (
    networkConfig.key === 'solana' &&
    process.env.REACT_APP_ENV === 'TESTNET'
  ) {
    explorerLink += '?cluster=devnet';
  }

  return (
    <a
      className={classes.link}
      style={props.styles}
      href={explorerLink}
      target="_blank"
      rel="noreferrer"
    >
      <div>{networkConfig.explorerName}</div>
      <LaunchIcon />
    </a>
  );
}

export default ExplorerLink;
