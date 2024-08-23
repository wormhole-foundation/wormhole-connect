import React from 'react';
import { makeStyles } from 'tss-react/mui';
import { LINK } from 'utils/style';
import config from 'config';
import LaunchIcon from '@mui/icons-material/Launch';
import { TransferSide } from 'config/types';
import { isEvmChain } from 'utils/sdk';
import { Chain } from '@wormhole-foundation/sdk';

const useStyles = makeStyles()((theme) => ({
  link: {
    ...LINK(theme),
    transform: 'translateX(10px)',
  },
}));

type ExplorerLinkProps = {
  chain: Chain;
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
    if (chainConfig.key === 'Sui') {
      explorerLink = `${chainConfig.explorerUrl}txblock/${props.txHash}`;
    } else if (chainConfig.key === 'Aptos') {
      explorerLink = `${chainConfig.explorerUrl}txn/${props.txHash}`;
    } else if (chainConfig.key === 'Sei') {
      explorerLink = `${chainConfig.explorerUrl}transaction/${props.txHash}`;
    } else if (chainConfig.key === 'Injective') {
      explorerLink = `${chainConfig.explorerUrl}transaction/${props.txHash}`;
    } else if (chainConfig.key === 'Osmosis') {
      explorerLink =
        config.network === 'testnet'
          ? `${chainConfig.explorerUrl}txs/${props.txHash}`
          : `${chainConfig.explorerUrl}transactions/${props.txHash}`;
    } else {
      let txHash = props.txHash;
      if (isEvmChain(chainConfig.key)) {
        txHash = txHash.startsWith('0x') ? txHash : '0x' + txHash;
      }
      explorerLink = `${chainConfig.explorerUrl}tx/${txHash}`;
    }
  } else if (props.type === 'address') {
    if (chainConfig.key === 'Aptos') {
      explorerLink = `${chainConfig.explorerUrl}account/${props.address}`;
    } else {
      explorerLink = `${chainConfig.explorerUrl}address/${props.address}`;
    }
  }

  if (props.type === 'object' && chainConfig.key === 'Sui') {
    explorerLink = `${chainConfig.explorerUrl}object/${props.object}`;
  }

  if (!config.isMainnet) {
    if (chainConfig.key === 'Solana') {
      explorerLink += '?cluster=devnet';
    }
    if (chainConfig.key === 'Sui') {
      explorerLink += '?network=testnet';
    }
    if (chainConfig.key === 'Aptos') {
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
