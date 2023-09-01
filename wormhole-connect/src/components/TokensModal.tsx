import React, {
  ChangeEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTheme } from '@mui/material/styles';
import { useMediaQuery } from '@mui/material';
import { makeStyles } from 'tss-react/mui';
import { ChainName } from '@wormhole-foundation/wormhole-connect-sdk';
import { BigNumber } from 'ethers';

import { RootState } from '../store';
import { CHAINS, TOKENS_ARR } from '../config';
import { TokenConfig } from '../config/types';
import {
  setBalance,
  formatBalance,
  clearBalances,
} from '../store/transferInput';
import { displayAddress } from '../utils';
import { CENTER, NO_INPUT } from '../utils/style';
import Operator from '../utils/routes';

import Header from './Header';
import Modal from './Modal';
import Spacer from './Spacer';
import Search from './Search';
import Scroll from './Scroll';
import TokenIcon from '../icons/TokenIcons';
import CircularProgress from '@mui/material/CircularProgress';
import Tabs from './Tabs';
import { isCosmWasmChain } from '../utils/cosmos';

const useStyles = makeStyles()((theme: any) => ({
  tokensContainer: {
    display: 'flex',
    flexDirection: 'column',
  },
  noResults: {
    ...CENTER,
    minHeight: '72px',
  },
  checkboxRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: theme.palette.font.primary,
    fontWeight: 400,
    fontSize: '14px',
  },
  subheader: {
    margin: '0 8px',
    fontSize: '18px',
    textAlign: 'left',
    fontFamily: theme.palette.font.header,
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
  tokenRowLeft: {
    display: 'flex',
    alignItems: 'center',
    fontSize: '14px',
    gap: '8px',
    textAlign: 'left',
  },
  tokenRowIcon: {
    width: '32px',
    height: '32px',
    marginRight: '12px',
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
  advanced: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    margin: '16px 0',
    cursor: 'pointer',
  },
  arrow: {
    transition: 'transform 0.4s',
  },
  invert: {
    transform: 'rotate(180deg)',
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
  },
  advancedContent: {
    marginBottom: '16px',
  },
  nativeNetwork: {
    opacity: '60%',
  },
  register: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    marginTop: '16px',
  },
  registerText: {
    opacity: '60%',
    fontSize: '16px',
  },
  registerLink: {
    color: theme.palette.success[500],
    textDecoration: 'underline',
    fontSize: '14px',
  },
  loading: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '72px',
  },
}));

const displayNativeNetwork = (token: TokenConfig): string => {
  const chainConfig = CHAINS[token.nativeNetwork];
  if (!chainConfig) return '';
  return chainConfig.displayName;
};

function DisplayTokens(props: {
  tokens: TokenConfig[];
  balances: any;
  walletAddress: string | undefined;
  network: any;
  selectToken: any;
  loading: boolean;
  search: string;
}) {
  const { classes } = useStyles();
  const theme: any = useTheme();
  const {
    tokens,
    balances,
    walletAddress,
    network,
    selectToken,
    loading,
    search,
  } = props;
  return (
    <Scroll
      height="calc(100vh - 375px)"
      blendColor={theme.palette.modal.background}
    >
      <div className={classes.tokensContainer}>
        {tokens.length > 0 ? (
          <div>
            {tokens.map((token, i) => (
              <div
                className={classes.tokenRow}
                key={i}
                onClick={() => selectToken(token.key)}
              >
                <div className={classes.tokenRowLeft}>
                  <TokenIcon name={token.icon} height={32} />
                  <div>
                    <div>{token.symbol}</div>
                    <div className={classes.nativeNetwork}>
                      {displayNativeNetwork(token)}
                    </div>
                  </div>
                </div>
                <div className={classes.tokenRowRight}>
                  <div className={classes.tokenRowBalanceText}>Balance</div>
                  <div className={classes.tokenRowBalance}>
                    {balances[token.key] && walletAddress ? (
                      <div>{balances[token.key]}</div>
                    ) : network && walletAddress ? (
                      <CircularProgress size={14} />
                    ) : (
                      <div>{NO_INPUT}</div>
                    )}
                  </div>
                </div>
                <div className={classes.tokenRowAddressContainer}>
                  <div className={classes.tokenRowAddress}>
                    {token.tokenId
                      ? displayAddress(
                          token.tokenId.chain,
                          token.tokenId.address,
                        )
                      : 'Native'}
                  </div>
                </div>
              </div>
            ))}
          </div>
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
  network: ChainName | undefined;
  walletAddress: string | undefined;
  onSelect: (token: string) => any;
  onClose: any;
  type: 'source' | 'dest';
};

function isCosmosNativeToken(token: TokenConfig) {
  return token.tokenId && isCosmWasmChain(token.tokenId.chain);
}

function TokensModal(props: Props) {
  const theme = useTheme();
  const dispatch = useDispatch();
  const { open, network, walletAddress, type } = props;
  const mobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [loading, setLoading] = useState(false);
  const [balancesLoaded, setBalancesLoaded] = useState(false);
  const [tokens, setTokens] = useState<TokenConfig[]>([]);
  const [search, setSearch] = useState('');

  const {
    sourceBalances,
    destBalances,
    supportedSourceTokens,
    supportedDestTokens,
    route,
  } = useSelector((state: RootState) => state.transferInput);

  const allTokens = useMemo(() => {
    const arr =
      type === 'source'
        ? TOKENS_ARR
        : TOKENS_ARR.filter((t) => {
            return !!t.tokenId;
          });
    return arr.filter((t) => !isCosmosNativeToken(t));
  }, [type]);

  const supportedTokens = useMemo(() => {
    const supported =
      type === 'source' ? supportedSourceTokens : supportedDestTokens;
    return supported.filter((t) => !isCosmosNativeToken(t));
  }, [type, supportedSourceTokens, supportedDestTokens]);

  const tokenBalances = useMemo(
    () => (type === 'source' ? sourceBalances : destBalances),
    [type, sourceBalances, destBalances],
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
    setBalancesLoaded(false);
  }, [network, walletAddress]);

  const getBalances = useCallback(async () => {
    if (!walletAddress || !network) return;
    const operator = new Operator();
    // fetch all N tokens and trigger a single update action
    const balancesArr = await Promise.all(
      allTokens.map(async (t) => {
        let balance: BigNumber | null = null;
        try {
          balance = t.tokenId
            ? await operator.getTokenBalance(
                route,
                walletAddress,
                t.tokenId,
                network,
              )
            : await operator.getNativeBalance(route, walletAddress, network);
        } catch (e) {
          console.warn('Failed to fetch balance', e);
        }

        return formatBalance(network, t, balance);
      }),
    );

    const balances = balancesArr.reduceRight((acc, tokenBalance) => {
      return Object.assign(acc, tokenBalance);
    }, {});

    dispatch(
      setBalance({
        type,
        balances,
      }),
    );
  }, [walletAddress, network, dispatch, type, allTokens, route]);

  // fetch token balances and set in store
  useEffect(() => {
    let active = true;
    if (!walletAddress || !network) {
      setTokens(supportedTokens);
      return;
    }

    if (!balancesLoaded) {
      dispatch(clearBalances(type));
      setLoading(true);
      getBalances().finally(() => {
        if (active) {
          setLoading(false);
          setBalancesLoaded(true);
        }
      });
    }
    return () => {
      active = false;
    };
  }, [
    walletAddress,
    supportedTokens,
    network,
    dispatch,
    getBalances,
    type,
    open,
    balancesLoaded,
  ]);

  useEffect(() => {
    // get tokens that exist on the chain and have a balance greater than 0
    // if token is USDC, only show native ones
    const filtered = supportedTokens.filter((t) => {
      if (!t.tokenId && t.nativeNetwork !== network) return false;
      if (t.symbol === 'USDC' && t.nativeNetwork !== network) return false;
      if (type === 'dest') return true;
      const b = tokenBalances[t.key];
      const isNullBalance = b !== null && b !== '0';
      return isNullBalance;
    });
    setTokens(filtered);
  }, [tokenBalances, network, supportedTokens, type]);

  const tabs = [
    {
      label: 'Available Tokens',
      panel: (
        <DisplayTokens
          tokens={displayedTokens}
          balances={tokenBalances}
          walletAddress={walletAddress}
          network={network}
          selectToken={selectToken}
          loading={loading}
          search={search}
        />
      ),
    },
    {
      label: 'All Tokens',
      panel: (
        <DisplayTokens
          tokens={allTokens}
          balances={tokenBalances}
          walletAddress={walletAddress}
          network={network}
          selectToken={selectToken}
          loading={loading}
          search={search}
        />
      ),
    },
  ];

  return (
    <Modal open={open} closable width={500} onClose={closeTokensModal}>
      <Header text="Select asset" size={28} />
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
