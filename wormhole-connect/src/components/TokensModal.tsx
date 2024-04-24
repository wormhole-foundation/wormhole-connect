import { Alert, Link, useMediaQuery } from '@mui/material';
import CircularProgress from '@mui/material/CircularProgress';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { useTheme } from '@mui/material/styles';
import { ChainName } from '@wormhole-foundation/wormhole-connect-sdk';
import { AVAILABLE_MARKETS_URL } from 'config/constants';
import config from 'config';
import { TokenConfig } from 'config/types';
import TokenIcon from 'icons/TokenIcons';
import React, { ChangeEvent, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from 'store';
import { makeStyles } from 'tss-react/mui';
import { displayAddress, sortTokens } from 'utils';
import { isGatewayChain } from 'utils/cosmos';
import { CENTER, NO_INPUT } from 'utils/style';
import Header from './Header';
import Modal from './Modal';
import Scroll from './Scroll';
import Search from './Search';
import Spacer from './Spacer';
import Tabs from './Tabs';
import { CCTPManual_CHAINS } from '../routes/cctpManual';
import { isTBTCCanonicalChain } from 'routes/tbtc';
import { CHAIN_ID_ETH } from '@certusone/wormhole-sdk/lib/esm/utils';
import useGetTokenBalances from 'hooks/useGetTokenBalances';
import { Balances } from 'store/transferInput';

const useStyles = makeStyles()((theme: any) => ({
  tokensContainer: {
    display: 'flex',
    flexDirection: 'column',
  },
  noResults: {
    ...CENTER,
    minHeight: '72px',
  },
  tokenRow: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    padding: '16px 8px',
    transition: `background-color 0.4s`,
    cursor: 'pointer',
    '&:hover': {
      backgroundColor: theme.palette.options.select,
    },
    '&:not(:last-child)': {
      borderBottom: `0.5px solid ${theme.palette.divider}`,
    },
  },
  moreTokensRow: {
    textDecoration: 'none',
    color: 'inherit',
  },
  tokenRowLeft: {
    display: 'flex',
    alignItems: 'center',
    fontSize: '14px',
    gap: '8px',
    textAlign: 'left',
  },
  tokenRowRight: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'right',
    textAlign: 'right',
  },
  tokenRowBalanceText: {
    opacity: '60%',
    fontSize: '12px',
  },
  tokenRowBalance: {
    fontSize: '14px',
  },
  tokenRowAddressContainer: {
    width: '100%',
    position: 'absolute',
    fontSize: '14px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tokenRowAddress: {
    width: '100px',
    textAlign: 'left',
    opacity: '60%',
  },
  nativeChain: {
    opacity: '60%',
  },
  loading: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '72px',
  },
  moreTokens: {
    textTransform: 'none',
    marginTop: '66px',
    minHeight: '64px',
    minWidth: '193px',
    backgroundColor: theme.palette.button.primary,
  },
  iconButton: {
    width: '32px',
    height: '32px',
    color: theme.palette.modal.background,
    backgroundColor: theme.palette.button.primaryText,
    '&:hover': {
      backgroundColor: theme.palette.button.primaryText,
    },
    borderRadius: '100%',
  },
  iconOpenInNew: {
    width: '19px',
    height: '19px',
  },
  moreTokensLabel: {
    marginRight: '16px',
  },
  noWrap: {
    whiteSpace: 'nowrap',
  },
}));

const displayNativeChain = (token: TokenConfig): string => {
  const chainConfig = config.chains[token.nativeChain];
  if (!chainConfig) return '';
  return chainConfig.displayName;
};

type DisplayTokensProps = {
  tokens: TokenConfig[];
  balances: Balances;
  walletAddress: string | undefined;
  chain: any;
  selectToken: (tokenKey: string) => void;
  loading: boolean;
  search: string;
  moreTokens?: (href: string, target?: string) => void;
};

function DisplayTokens(props: DisplayTokensProps) {
  const { classes } = useStyles();
  const theme: any = useTheme();
  const {
    tokens,
    balances,
    walletAddress,
    chain,
    selectToken,
    loading,
    search,
    moreTokens = () => {
      /* noop */
    },
  } = props;

  const showCircularProgress = (token: string): boolean => {
    if (!chain || !walletAddress) return false;
    if (balances[token]?.balance !== null) return true;
    return false;
  };

  const sortedTokens = useMemo(() => {
    return sortTokens(tokens, chain);
  }, [tokens, chain]);

  return (
    <Scroll
      height="calc(100vh - 375px)"
      blendColor={theme.palette.modal.background}
    >
      <div className={classes.tokensContainer}>
        {sortedTokens.length > 0 ? (
          <>
            {sortedTokens.map((token) => (
              <div
                className={classes.tokenRow}
                key={token.key}
                onClick={() => selectToken(token.key)}
              >
                <div className={classes.tokenRowLeft}>
                  <TokenIcon icon={token.icon} height={32} />
                  <div>
                    <div>{token.symbol}</div>
                    <div className={classes.nativeChain}>
                      {displayNativeChain(token)}
                    </div>
                  </div>
                </div>
                <div className={classes.tokenRowRight}>
                  <div className={classes.tokenRowBalanceText}>Balance</div>
                  <div className={classes.tokenRowBalance}>
                    {balances[token.key]?.balance && walletAddress ? (
                      <div>{balances[token.key].balance}</div>
                    ) : showCircularProgress(token.key) ? (
                      <CircularProgress size={14} />
                    ) : (
                      <div>{NO_INPUT}</div>
                    )}
                  </div>
                </div>
                <div className={classes.tokenRowAddressContainer}>
                  <div className={classes.tokenRowAddress}>
                    <div className={classes.noWrap}>
                      {token.nativeChain === chain
                        ? 'Native'
                        : 'Wormhole Wrapped'}
                    </div>
                    {token.tokenId && (
                      <div>
                        {displayAddress(
                          token.tokenId.chain,
                          token.tokenId.address,
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {config.moreTokens ? (
              <>
                <div>
                  <Button
                    disableRipple
                    className={classes.moreTokens}
                    onClick={() =>
                      config.moreTokens &&
                      moreTokens(
                        config.moreTokens.href,
                        config.moreTokens.target,
                      )
                    }
                  >
                    <span className={classes.moreTokensLabel}>
                      {config.moreTokens.label}
                    </span>
                    <IconButton className={classes.iconButton}>
                      <OpenInNewIcon className={classes.iconOpenInNew} />
                    </IconButton>
                  </Button>
                </div>
              </>
            ) : null}
          </>
        ) : loading ? (
          <div className={classes.loading}>
            <CircularProgress size={24} />
          </div>
        ) : (
          <div className={classes.noResults}>
            {search ? 'No results' : 'No balances detected'}
          </div>
        )}
      </div>
    </Scroll>
  );
}

type Props = {
  open: boolean;
  chain: ChainName | undefined;
  walletAddress: string | undefined;
  onSelect: (token: string) => any;
  onClose: any;
  type: 'source' | 'dest';
};

function isGatewayNativeToken(token: TokenConfig) {
  return token.tokenId && isGatewayChain(token.tokenId.chain);
}

function TokensModal(props: Props) {
  const theme = useTheme();
  const { open, chain, walletAddress, type } = props;
  const mobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [tokens, setTokens] = useState<TokenConfig[]>([]);
  const [search, setSearch] = useState('');

  const {
    supportedSourceTokens,
    supportedDestTokens,
    allSupportedDestTokens: allSupportedDestTokensBase,
    fromChain,
    toChain,
  } = useSelector((state: RootState) => state.transferInput);

  const allSupportedDestTokens = useMemo(() => {
    return allSupportedDestTokensBase.filter((t) => !isGatewayNativeToken(t));
  }, [allSupportedDestTokensBase]);

  const supportedTokens = useMemo(() => {
    const supported =
      type === 'source' ? supportedSourceTokens : supportedDestTokens;
    return supported.filter((t) => !isGatewayNativeToken(t));
  }, [type, supportedSourceTokens, supportedDestTokens]);

  const queryTokens =
    type === 'dest' ? allSupportedDestTokens : supportedTokens;

  const { isFetching, balances } = useGetTokenBalances(
    walletAddress || '',
    chain,
    queryTokens,
  );

  // search tokens
  const handleSearch = (
    e:
      | ChangeEvent<HTMLInputElement>
      | ChangeEvent<HTMLTextAreaElement>
      | undefined,
  ) => {
    if (e) {
      const lowercase = e.target.value.toLowerCase();
      setSearch(lowercase);
    } else {
      setSearch('');
    }
  };

  const handleMoreTokens = (href: string, target = '_self') => {
    let hydratedHref = href;
    if (fromChain) {
      hydratedHref = hydratedHref.replace('{:sourceChain}', fromChain);
    }
    if (toChain) {
      hydratedHref = hydratedHref.replace('{:targetChain}', toChain);
    }
    window.open(
      hydratedHref.replace('&targetChain={:targetChain}', ''),
      target,
    );
  };

  const displayedTokens = useMemo(() => {
    if (!search) return tokens;
    return tokens.filter((c) => {
      const symbol = c.symbol.toLowerCase();
      return (
        symbol.includes(search) ||
        (c.tokenId && c.tokenId.address.toLowerCase().includes(search))
      );
    });
  }, [tokens, search]);

  // listen for close event
  const closeTokensModal = () => {
    setTimeout(() => setSearch(''), 500);
    props.onClose();
  };

  // select token
  const selectToken = (token: string) => {
    props.onSelect(token);
    closeTokensModal();
  };

  useEffect(() => {
    // get tokens that exist on the chain and have a balance greater than 0
    const filtered = supportedTokens.filter((t) => {
      if (!t.tokenId && t.nativeChain !== chain) return false;

      // if token is USDC and the chain is cctp enabled, only show native ones
      const isCctpChain = chain && CCTPManual_CHAINS.includes(chain);
      if (t.symbol === 'USDC' && t.nativeChain !== chain && isCctpChain)
        return false;

      if (t.symbol === 'tBTC' && chain) {
        // if the chain is canonical then only show the native tBTC token
        if (isTBTCCanonicalChain(chain)) {
          if (t.nativeChain !== chain) {
            return false;
          }
        } else {
          // if the chain is not canonical then only show the ethereum tBTC token
          // which is considered the canonical tBTC token
          if (config.wh.toChainId(t.nativeChain) !== CHAIN_ID_ETH) {
            return false;
          }
        }
      }

      if (type === 'dest') return true;
      if (!balances[t.key]) return true;
      const { balance } = balances[t.key];
      const isNonzeroBalance = balance !== null && balance !== '0';
      return isNonzeroBalance;
    });
    setTokens(filtered);
  }, [balances, chain, supportedTokens, type]);

  const tabs = [
    {
      label: 'Available Tokens',
      panel: (
        <DisplayTokens
          tokens={displayedTokens}
          balances={balances}
          walletAddress={walletAddress}
          chain={chain}
          selectToken={selectToken}
          moreTokens={handleMoreTokens}
          loading={isFetching}
          search={search}
        />
      ),
    },
    {
      label: 'All Tokens',
      panel: (
        <DisplayTokens
          tokens={type === 'dest' ? allSupportedDestTokens : supportedTokens}
          balances={balances}
          walletAddress={walletAddress}
          chain={chain}
          selectToken={selectToken}
          moreTokens={handleMoreTokens}
          loading={isFetching}
          search={search}
        />
      ),
    },
  ];

  return (
    <Modal open={open} closable width={500} onClose={closeTokensModal}>
      <Header text="Select asset" size={28} />
      <Spacer height={16} />
      <Alert variant="outlined" severity="info">
        You should always check for markets and liquidity before sending tokens.{' '}
        <Link
          href={AVAILABLE_MARKETS_URL}
          target="_blank"
          rel="noopener noreferrer"
        >
          Click here to see available markets for wrapped tokens.
        </Link>
      </Alert>
      <Spacer height={16} />
      <Search
        placeholder={
          mobile
            ? 'Token symbol or address'
            : 'Search by name or contract address'
        }
        onChange={handleSearch}
      />
      <Tabs tabs={tabs} />
    </Modal>
  );
}

export default TokensModal;
