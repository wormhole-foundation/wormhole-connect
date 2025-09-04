import React, { memo, useMemo } from 'react';
import { Box, Tooltip } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import Typography from '@mui/material/Typography';
import Link from '@mui/material/Link';
import { isNative } from '@wormhole-foundation/sdk';

import ArrowOutwardIcon from '@mui/icons-material/ArrowOutward';
import TokenIcon from 'icons/TokenIcons';

import type { Token } from 'config/tokens';

import type { Chain, amount as sdkAmount } from '@wormhole-foundation/sdk';
import { chainDisplayName, getTokenExplorerUrl, getTokenSymbol } from 'utils';
import ChainIcon from 'icons/ChainIcons';
import Color from 'color';
import TokenBalance from 'components/TokenBalance';

type TokenItemProps = {
  token: Token;
  chain: Chain;
  balance: sdkAmount.Amount | null;
  price: string | null;
  onClick: () => void;
  isSelected?: boolean;
  isFetchingBalance?: boolean;
  isSource?: boolean;
  isDimmed?: boolean;
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
  const explorerURL = address ? getTokenExplorerUrl(chain, address) : '';
  const addressDisplay = `${token.shortAddress}`;

  const displaySymbol = getTokenSymbol(token);

  return (
    <ListItemButton
      sx={{
        ...styles.tokenListItem,
        ...(props.isSelected && styles.tokenListItemSelected),
        ...(props.isDimmed ? { opacity: 0.6 } : {}),
      }}
      dense
      data-testid={`token-button-${chain.toLowerCase()}-${token.address.toString()}`}
      aria-label={`Select ${displaySymbol || token.symbol}`}
      onMouseDown={props.onClick}
    >
      <Box sx={styles.tokenDetails}>
        <ListItemIcon>
          <TokenIcon icon={props.token.icon} />
        </ListItemIcon>
        <div>
          <Typography>{displaySymbol}</Typography>

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

            {displaySymbol ? (
              <Typography fontSize={10} color={theme.palette.text.secondary}>
                {displaySymbol}
              </Typography>
            ) : null}

            {displaySymbol && !token.isNativeGasToken ? (
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
      <TokenBalance
        balance={props.balance}
        price={props.price}
        isFetching={props.isFetchingBalance}
      />
    </ListItemButton>
  );
}

export default memo(TokenItem);
