import React, { Fragment, useMemo } from 'react';
import { Card, CardContent, useTheme } from '@mui/material';
import Typography from '@mui/material/Typography';
import type { ChainConfig } from 'config/types';
import type { Token } from 'config/tokens';
import type { WalletData } from 'store/wallet';
import SearchableList from 'views/v3/Bridge/AssetPicker/SearchableList';
import TokenItem from 'views/v3/Bridge/AssetPicker/TokenItem';
import { getUSDFormat, calculateUSDPriceRaw } from 'utils';
import config from 'config';
import type { Balances } from 'utils/wallet/types';
import { useTokenListWithSearch } from 'hooks/useTokenListWithSearch';
import TokenSectionHeader from './TokenSectionHeader';
import { useTokenListGrouping } from 'hooks/useTokenListGrouping';

type Props = {
  tokenList: Array<Token>;
  balances: Balances;
  isFetchingBalances: boolean;
  isFetching?: boolean;
  isConnectingWallet?: boolean;
  selectedChainConfig: ChainConfig;
  selectedToken?: Token;
  sourceToken?: Token;
  isSameChainSwap: boolean;
  isSource: boolean;
  wallet: WalletData;
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  onSelectToken: (key: Token) => void;
  fetchTokensProgress?: null | number;
};

const TokenList = (props: Props) => {
  const theme = useTheme();
  const tokenPastingIsEnabled = config.ui.disableUserInputtedTokens !== true;

  const { sortedTokens, tokenPrices } = useTokenListWithSearch({
    baseTokenList: props.tokenList,
    searchQuery: props.searchQuery,
    chain: props.selectedChainConfig.sdkName,
    isSource: props.isSource,
    isSameChainSwap: props.isSameChainSwap,
    sourceToken: props.sourceToken,
    balances: props.balances,
    walletAddress: props.wallet.address,
    tokenPastingEnabled: tokenPastingIsEnabled,
  });

  const emptyMessage = useMemo(() => {
    let message = '';

    if (props.isSource) {
      message = props.wallet?.address
        ? 'No supported tokens found in wallet'
        : '';
    } else {
      message = 'No supported destination tokens for this route';
    }

    return (
      <Typography variant="body2" color={theme.palette.grey.A400}>
        {message}
      </Typography>
    );
  }, [props.wallet?.address, props.isSource, theme.palette.grey.A400]);

  const placeholder = `Search for a token${
    tokenPastingIsEnabled ? ' or paste an address' : ''
  }`;

  const styles = useMemo(
    () => ({
      card: {
        background: theme.palette.input.background,
        maxWidth: '420px',
      },
      tokenListContainer: {
        padding: '16px 0 0 0 !important',
      },
      tokenList: {
        maxHeight: '360px',
        [theme.breakpoints.down('sm')]: {
          maxHeight: '520px',
        },
      },
    }),
    [theme],
  );

  // Determine the current state of the token list
  const listState = useMemo(() => {
    // Currently fetching initial data
    if (props.isFetching) {
      return 'loading';
    }

    // We have data but no tokens to show
    if (sortedTokens.length === 0) {
      return 'empty';
    }

    // Normal state - show the token list
    return 'ready';
  }, [props.isFetching, sortedTokens.length]);

  // Build sectioned list for source picker when not searching
  const isGroupingEnabled = props.isSource && !props.searchQuery;
  const isWalletConnected = Boolean(props.wallet?.address);

  const { listItems, ownedCount } = useTokenListGrouping({
    sortedTokens,
    isWalletConnected,
    isGroupingEnabled,
    balances: props.balances,
  });

  return (
    <Card sx={styles.card} variant="elevation">
      <CardContent sx={styles.tokenListContainer}>
        <SearchableList<Token>
          searchPlaceholder={placeholder}
          sx={styles.tokenList}
          dataTestId="token-search-list"
          searchQuery={props.searchQuery}
          listTitle={listState === 'empty' ? emptyMessage : ''}
          items={listItems}
          onQueryChange={props.onSearchQueryChange}
          renderFn={(token: Token, index: number) => {
            const balance = props.balances?.[token.key]?.balance;
            const tokenPrice = tokenPrices.get(token.key);
            const price =
              balance && tokenPrice !== undefined
                ? getUSDFormat(calculateUSDPriceRaw(tokenPrice, balance, token))
                : null;

            // Do not dim when no wallet is connected
            const isRestSection =
              isGroupingEnabled && isWalletConnected && index >= ownedCount;

            const headerLabel = (() => {
              if (!isGroupingEnabled) return null;
              if (index === 0 && ownedCount > 0) return 'Your tokens';
              if (index === ownedCount) return 'All tokens';
              return null;
            })();

            return (
              <Fragment key={token.key}>
                {headerLabel && <TokenSectionHeader label={headerLabel} />}
                <TokenItem
                  token={token}
                  chain={props.selectedChainConfig.sdkName}
                  onClick={() => props.onSelectToken(token)}
                  isSource={props.isSource}
                  balance={balance}
                  price={price}
                  isSelected={token.key === props.selectedToken?.key}
                  isFetchingBalance={props.isFetchingBalances}
                  isDimmed={isRestSection}
                />
              </Fragment>
            );
          }}
        />
      </CardContent>
    </Card>
  );
};

export default React.memo(TokenList);
