import React, { memo } from 'react';
import { makeStyles } from 'tss-react/mui';
import { Box, Tooltip, useTheme } from '@mui/material';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import { isNative, amount as sdkAmount } from '@wormhole-foundation/sdk';

import ArrowOutwardIcon from '@mui/icons-material/ArrowOutward';
import TokenIcon from 'icons/TokenIcons';

import { Token } from 'config/tokens';

import type { Chain } from '@wormhole-foundation/sdk';
import { chainDisplayName, getTokenExplorerUrl } from 'utils';
import ChainIcon from 'icons/ChainIcons';

const useStyles = makeStyles()((theme) => ({
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
    height: '10px',
    overflow: 'hidden',
    color: theme.palette.text.primary,
    opacity: 0.6,
  },
  wormholeWrappedDisclaimer: {
    display: 'inline',
    marginRight: 4,
  },
}));

type TokenItemProps = {
  token: Token;
  chain: Chain;
  balance: sdkAmount.Amount | null;
  price: string | null;
  onClick: () => void;
  disabled?: boolean;
  isFetchingBalance?: boolean;
};

function TokenItem(props: TokenItemProps) {
  const { classes } = useStyles();
  const theme = useTheme();

  const { chain, token } = props;
  // If the token is native to the chain, show the token's address.
  // Otherwise, show the wrapped token's address.
  const address = token.tokenId?.address.toString();
  const explorerURL = address ? getTokenExplorerUrl(chain, address) : undefined;
  const addressDisplay = `${token.shortAddress}`;

  return (
    <ListItemButton
      className={classes.tokenListItem}
      dense
      disabled={props.disabled}
      onClick={props.onClick}
    >
      <div className={classes.tokenDetails}>
        <ListItemIcon>
          <TokenIcon icon={props.token.icon} />
        </ListItemIcon>
        <div>
          <Typography>{token.display}</Typography>

          <Box display="flex">
            {token.tokenBridgeOriginalTokenId ? (
              <Tooltip
                title={`Wormhole-wrapped from ${chainDisplayName(
                  token.tokenBridgeOriginalTokenId.chain,
                )}`}
              >
                <Box margin="2px" marginRight="5px">
                  <ChainIcon
                    height={10}
                    icon={token.tokenBridgeOriginalTokenId.chain}
                  />
                </Box>
              </Tooltip>
            ) : null}

            {token.symbol ? (
              <Typography fontSize={10} color={theme.palette.text.secondary}>
                {token.symbol}
              </Typography>
            ) : null}

            {token.symbol && !token.isNativeGasToken ? (
              <Typography
                fontSize={10}
                color={theme.palette.text.secondary}
                marginLeft={1}
                marginRight={1}
              >
                {`•`}
              </Typography>
            ) : null}

            {!token.isNativeGasToken ? (
              <Typography fontSize={10} color={theme.palette.text.secondary}>
                {!isNative(address) && (
                  <Link
                    onClick={(e) => e.stopPropagation()}
                    className={classes.addressLink}
                    href={explorerURL}
                    rel="noreferrer noopener"
                    target="_blank"
                  >
                    {addressDisplay}
                    <ArrowOutwardIcon
                      sx={{
                        height: '10px',
                        width: '10px',
                        marginLeft: '2px',
                      }}
                    />
                  </Link>
                )}
              </Typography>
            ) : null}
          </Box>
        </div>
      </div>
      <Stack alignItems="flex-end">
        <Typography fontSize={14}>
          {props.isFetchingBalance ? (
            <CircularProgress size={24} />
          ) : props.balance ? (
            sdkAmount.display(sdkAmount.truncate(props.balance, 6))
          ) : (
            ''
          )}
        </Typography>
        {props.price && (
          <Typography color={theme.palette.text.secondary} fontSize="10px">
            {props.price}
          </Typography>
        )}
      </Stack>
    </ListItemButton>
  );
}

export default memo(TokenItem);
