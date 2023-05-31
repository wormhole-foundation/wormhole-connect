import React, { ChangeEvent, useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTheme } from '@mui/material/styles';
import { useMediaQuery } from '@mui/material';
import { makeStyles } from 'tss-react/mui';
import { ChainName } from '@wormhole-foundation/wormhole-connect-sdk';
import { RootState } from '../store';
import { CHAINS, TOKENS_ARR } from '../config';
import { TokenConfig } from '../config/types';
import {
  setBalance,
  formatBalance,
  clearBalances,
} from '../store/transferInput';
import { displayAddress } from '../utils';
import { CENTER } from '../utils/style';
import { getBalance, getNativeBalance } from '../sdk';

import Header from './Header';
import Modal from './Modal';
import Spacer from './Spacer';
import Search from './Search';
import Scroll from './Scroll';
import Tooltip from './Tooltip';
// import Down from '../icons/Down';
// import Collapse from '@mui/material/Collapse';
import TokenIcon from '../icons/TokenIcons';
import CircularProgress from '@mui/material/CircularProgress';

const useStyles = makeStyles()((theme) => ({
  tokensContainer: {
    display: 'flex',
    flexDirection: 'column',
  },
  noResults: {
    ...CENTER,
    minHeight: '72px',
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

type Props = {
  open: boolean;
  network: ChainName | undefined;
  walletAddress: string | undefined;
  onSelect: (string) => any;
  onClose: any;
};

function TokensModal(props: Props) {
  const { classes } = useStyles();
  const theme = useTheme();
  const dispatch = useDispatch();
  const { open, network, walletAddress } = props;
  const mobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [loading, setLoading] = useState(false);
  const [tokens, setTokens] = useState<TokenConfig[]>([]);
  const [search, setSearch] = useState('');

  const { balances: tokenBalances } = useSelector(
    (state: RootState) => state.transferInput,
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

  const displayNativeNetwork = (token: TokenConfig): string => {
    const chainConfig = CHAINS[token.nativeNetwork];
    if (!chainConfig) return '';
    return chainConfig.displayName;
  };

  // fetch token balances and set in store
  useEffect(() => {
    if (!walletAddress || !network) {
      setTokens(TOKENS_ARR);
      return;
    }

    const getBalances = async () => {
      // fetch all N tokens and trigger a single update action
      const balances = await Promise.all(
        TOKENS_ARR.map(async (t) => {
          const balance = t.tokenId
            ? await getBalance(walletAddress, t.tokenId, network)
            : await getNativeBalance(walletAddress, network);

          return formatBalance(network, t, balance);
        }),
      );

      const balancesObj = balances.reduceRight((acc, tokenBalance) => {
        return Object.assign(acc, tokenBalance);
      }, {});

      dispatch(setBalance(balancesObj));
    };

    dispatch(clearBalances());
    setLoading(true);
    getBalances().finally(() => setLoading(false));
  }, [walletAddress, network, dispatch]);

  useEffect(() => {
    // get tokens that exist on the chain and have a balance greater than 0
    const filtered = TOKENS_ARR.filter((t) => {
      if (!t.tokenId && t.nativeNetwork !== network) return false;
      const b = tokenBalances[t.key];
      return b !== null && b !== '0';
    });
    setTokens(filtered);
  }, [tokenBalances, network]);

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
      <Spacer height={16} />
      <div className={classes.sectionHeader}>
        <div className={classes.subheader}>Tokens with liquid markets</div>
        {/* <Tooltip text="Please perform your own due diligence, but to our knowledge these tokens have liquid markets available (i.e. you should be able to trade and utilize your tokens) on your destination chain." /> */}
        <Tooltip text="Please perform your own due diligence, these tokens may not have liquid markets (i.e. you should be able to trade and utilize your tokens) on your destination chain." />
      </div>
      <Scroll
        height="calc(100vh - 375px)"
        blendColor={theme.palette.modal.background}
      >
        <div className={classes.tokensContainer}>
          {displayedTokens.length > 0 ? (
            <div>
              {displayedTokens.map((token, i) => (
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
                      {tokenBalances[token.key] && walletAddress ? (
                        <div>{tokenBalances[token.key]}</div>
                      ) : network && walletAddress ? (
                        <CircularProgress size={14} />
                      ) : (
                        <div>—</div>
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
            <div className={classes.noResults}>No results</div>
          )}

          {/* <div className={classes.advanced} onClick={toggleAdvanced}>
            <div className={classes.sectionHeader}>
              <div className={classes.subheader}>Tokens without established liquid markets</div>
              <Tooltip text="Once you transfer these assets to the destination chain you may not be able to trade or use them. If for any reason you cannot and want to transfer the assets back to the source chain, you'll be responsible for any gas fees necessary to complete the transaction." />
              </div>
              <Down
                className={joinClass([
                  classes.arrow,
                  showAdvanced && classes.invert,
                ])}
              />
            </div>
            <Collapse in={showAdvanced}>
            <div className={classes.advancedContent}>Advanced Options</div>
          </Collapse> */}
        </div>
      </Scroll>
    </Modal>
  );
}

export default TokensModal;
