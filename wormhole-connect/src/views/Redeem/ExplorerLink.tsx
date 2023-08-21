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
} & (
  | { type: 'tx'; txHash: string }
  | { type: 'address'; address: string }
  | { type: 'object'; object: string }
);

function ExplorerLink(props: ExplorerLinkProps) {
  const { classes } = useStyles();

  const networkConfig = CHAINS[props.network]!;

  let explorerLink;
  if (props.type === 'tx') {
    // TODO: refactor and use a map instead
    if (networkConfig.key === 'sui') {
      explorerLink = `${networkConfig.explorerUrl}txblock/${props.txHash}`;
    } else if (networkConfig.key === 'aptos') {
      explorerLink = `${networkConfig.explorerUrl}txn/${props.txHash}`;
    } else if (networkConfig.key === 'sei') {
      explorerLink = `${networkConfig.explorerUrl}transaction/${props.txHash}`;
    } else if (networkConfig.key === 'osmosis') {
      explorerLink = `${networkConfig.explorerUrl}txs/${props.txHash}`;
    } else {
      explorerLink = `${networkConfig.explorerUrl}tx/${props.txHash}`;
    }
  } else if (props.type === 'address') {
    if (networkConfig.key === 'aptos') {
      explorerLink = `${networkConfig.explorerUrl}account/${props.address}`;
    } else {
      explorerLink = `${networkConfig.explorerUrl}address/${props.address}`;
    }
  }

  if (props.type === 'object' && networkConfig.key === 'sui') {
    explorerLink = `${networkConfig.explorerUrl}object/${props.object}`;
  }

  if (!isMainnet) {
    if (networkConfig.key === 'solana') {
      explorerLink += '?cluster=devnet';
    }
    if (networkConfig.key === 'sui') {
      explorerLink += '?network=testnet';
    }
    if (networkConfig.key === 'aptos') {
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
