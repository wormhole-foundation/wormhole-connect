import React, { memo } from 'react';
import { makeStyles } from 'tss-react/mui';
import { useTheme } from '@mui/material';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
import Link from '@mui/material/Link';

import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import TokenIcon from 'icons/TokenIcons';

import { ChainConfig, TokenConfig } from 'config/types';
import config from 'config';

import type { Chain } from '@wormhole-foundation/sdk';
import { getWrappedToken } from 'utils';

const useStyles = makeStyles()(() => ({
  tokenListItem: {
    display: 'flex',
    justifyContent: 'space-between',
    paddingLeft: 8,
    borderRadius: 8,
  },
  tokenDetails: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
  },
  addressLink: {
    display: 'inline-flex',
    alignItems: 'center',
    marginLeft: 4,
  },
}));

type TokenItemProps = {
  token: TokenConfig;
  chain: Chain;
  disabled?: boolean;
  onClick: () => void;
  balance?: string;
  isFetchingBalance?: boolean;
};

function TokenItem(props: TokenItemProps) {
  const { classes } = useStyles();
  const theme = useTheme();

  const { chain, token } = props;
  const chainConfig: ChainConfig | undefined = config.chains[chain];
  // If the token is native to the chain, show the token's address.
  // Otherwise, show the wrapped token's address.
  const address =
    chain === token.nativeChain
      ? token.tokenId?.address
      : getWrappedToken(token)?.foreignAssets?.[chain];
  const explorerURL = address
    ? `${chainConfig?.explorerUrl}address/${address}`
    : undefined;
  const addressDisplay = `${address?.slice(0, 4)}...${address?.slice(-4)}`;

  let displayName = token.displayName ?? token.symbol;
  if (chain !== token.nativeChain) {
    displayName = `${'Wormhole-wrapped'} ${displayName}`;
  }

  return (
    <ListItemButton
      className={classes.tokenListItem}
      dense
      disabled={props.disabled}
      onClick={props.onClick}
    >
      <div className={classes.tokenDetails}>
        <ListItemIcon>
          <TokenIcon icon={props.token.icon} height={32} />
        </ListItemIcon>
        <div>
          <Typography fontSize={16}>{props.token.symbol}</Typography>
          <Typography fontSize={10} color={theme.palette.text.secondary}>
            {displayName}
            {!!address && (
              <Link
                onClick={(e) => e.stopPropagation()}
                className={classes.addressLink}
                href={explorerURL}
                rel="noreferrer noopener"
                target="_blank"
              >
                {addressDisplay}
                <OpenInNewIcon sx={{ height: '8px', width: '12px' }} />
              </Link>
            )}
          </Typography>
        </div>
      </div>
      <Typography fontSize={14}>
        {props.isFetchingBalance ? (
          <CircularProgress size={24} />
        ) : (
          props.balance
        )}
      </Typography>
    </ListItemButton>
  );
}

export default memo(TokenItem);
