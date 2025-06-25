import React, { memo, useMemo } from 'react';
import { Box, Tooltip } from '@mui/material';
import { useTheme } from '@mui/material/styles';
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
import { chainDisplayName, getExplorerUrl } from 'utils';
import ChainIcon from 'icons/ChainIcons';
import Color from 'color';

type TokenItemProps = {
  token: Token;
  chain: Chain;
  balance: sdkAmount.Amount | null;
  price: string | null;
  onClick: () => void;
  isSelected?: boolean;
  isFetchingBalance?: boolean;
};

function TokenItem(props: TokenItemProps) {
  const theme = useTheme();

  const styles = useMemo(
    () => ({
      tokenListItem: {
        display: 'flex',
        justifyContent: 'space-between',
        padding: '8px 16px',
        borderRadius: 0,
        ':hover': {
          backgroundColor: Color(theme.palette.primary.main).alpha(0.07).hexa(),
        },
      },
      tokenListItemSelected: {
        backgroundColor: Color(theme.palette.primary.main).alpha(0.07).hexa(),
      },
      tokenDetails: {
        display: 'flex',
        flexDirection: 'row' as const,
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
    }),
    [theme],
  );

  const { chain, token } = props;
  const address = token.tokenId?.address.toString();
  const explorerURL = address
    ? getExplorerUrl(chain, address, 'token')
    : undefined;
  const addressDisplay = `${token.shortAddress}`;

  return (
    <ListItemButton
      sx={{
        ...styles.tokenListItem,
        ...(props.isSelected && styles.tokenListItemSelected),
      }}
      dense
      data-testid={`token-button-${chain.toLowerCase()}-${token.address.toString()}`}
      onMouseDown={props.onClick}
    >
      <Box sx={styles.tokenDetails}>
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
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => e.stopPropagation()}
                    sx={styles.addressLink}
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
      </Box>
      <Stack alignItems="flex-end">
        <Typography fontSize={14}>
          {props.isFetchingBalance && props.balance === null ? (
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
