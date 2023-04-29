import React from 'react';
import { ChainName } from '@wormhole-foundation/wormhole-connect-sdk';
import { makeStyles } from 'tss-react/mui';
import { LINK } from '../../utils/style';
import { CHAINS, isMainnet } from '../../config';
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

  let explorerLink;
  if (props.type === 'tx') {
    if (networkConfig.key === 'sui') {
      explorerLink = `${networkConfig.explorerUrl}txblock/${props.txHash}`;
    } else {
      explorerLink = `${networkConfig.explorerUrl}tx/${props.txHash}`;
    }
  } else {
    explorerLink = `${networkConfig.explorerUrl}address/${props.address}`;
  }

  if (!isMainnet) {
    if (networkConfig.key === 'solana') {
      explorerLink += '?cluster=devnet';
    }
    if (networkConfig.key === 'sui') {
      explorerLink += '?network=testnet';
    }
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
