import React from 'react';
import type { ChainName } from '@wormhole-foundation/wormhole-connect-sdk';
import { makeStyles } from 'tss-react/mui';
import { LINK } from 'utils/style';
import config from 'config';
import LaunchIcon from '@mui/icons-material/Launch';
import { TransferSide } from 'config/types';

const useStyles = makeStyles()((theme) => ({
  link: {
    ...LINK(theme),
    transform: 'translateX(10px)',
  },
}));

type ExplorerLinkProps = {
  chain: ChainName;
  side: TransferSide;
  styles?: React.CSSProperties;
} & (
  | { type: 'tx'; txHash: string }
  | { type: 'address'; address: string }
  | { type: 'object'; object: string }
);

function ExplorerLink(props: ExplorerLinkProps) {
  const { classes } = useStyles();

  const chainConfig = config.chains[props.chain]!;

  let explorerLink;
  if (props.type === 'tx') {
    // TODO: refactor and use a map instead
    if (chainConfig.key === 'sui') {
      explorerLink = `${chainConfig.explorerUrl}txblock/${props.txHash}`;
    } else if (chainConfig.key === 'aptos') {
      explorerLink = `${chainConfig.explorerUrl}txn/${props.txHash}`;
    } else if (chainConfig.key === 'sei') {
      explorerLink = `${chainConfig.explorerUrl}transaction/${props.txHash}`;
    } else if (chainConfig.key === 'injective') {
      explorerLink = `${chainConfig.explorerUrl}transaction/${props.txHash}`;
    } else if (chainConfig.key === 'osmosis') {
      explorerLink =
        config.network === 'testnet'
          ? `${chainConfig.explorerUrl}txs/${props.txHash}`
          : `${chainConfig.explorerUrl}transactions/${props.txHash}`;
    } else {
      explorerLink = `${chainConfig.explorerUrl}tx/${props.txHash}`;
    }
  } else if (props.type === 'address') {
    if (chainConfig.key === 'aptos') {
      explorerLink = `${chainConfig.explorerUrl}account/${props.address}`;
    } else {
      explorerLink = `${chainConfig.explorerUrl}address/${props.address}`;
    }
  }

  if (props.type === 'object' && chainConfig.key === 'sui') {
    explorerLink = `${chainConfig.explorerUrl}object/${props.object}`;
  }

  if (!config.isMainnet) {
    if (chainConfig.key === 'solana') {
      explorerLink += '?cluster=devnet';
    }
    if (chainConfig.key === 'sui') {
      explorerLink += '?network=testnet';
    }
    if (chainConfig.key === 'aptos') {
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
      data-testid={`${props.side}-section-explorer-link`}
    >
      <div>{chainConfig.explorerName}</div>
      <LaunchIcon />
    </a>
  );
}

export default ExplorerLink;
