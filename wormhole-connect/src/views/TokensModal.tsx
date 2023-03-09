import React, { ChangeEvent, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { makeStyles } from '@mui/styles';
import { useTheme } from '@mui/material/styles';
import { Theme } from '@mui/material';
import { RootState } from '../store';
import { CHAINS, TOKENS_ARR } from '../sdk/config';
import { setTokensModal } from '../store/router';
import { setToken, setBalance, formatBalance } from '../store/transfer';
import { displayAddress } from '../utils';
import { CENTER } from '../utils/style';
import { getBalance, getNativeBalance } from '../sdk/sdk';

import Header from '../components/Header';
import Modal from '../components/Modal';
import Spacer from '../components/Spacer';
import Search from '../components/Search';
import Scroll from '../components/Scroll';
import Tooltip from '../components/Tooltip';
// import Down from '../icons/components/Down';
// import Collapse from '@mui/material/Collapse';
import TokenIcon from '../icons/components/TokenIcons';
import CircularProgress from '@mui/material/CircularProgress';
import { TokenConfig } from '../config/types';
import { ChainId, ChainName } from '@wormhole-foundation/wormhole-connect-sdk';

const useStyles = makeStyles((theme: Theme) => ({
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
}));

function TokensModal() {
  const classes = useStyles();
  const theme = useTheme();
  const dispatch = useDispatch();

  // store values
  const showTokensModal = useSelector(
    (state: RootState) => state.router.showTokensModal,
  );
  const fromNetwork = useSelector(
    (state: RootState) => state.transfer.fromNetwork,
  );
  const walletAddr = useSelector(
    (state: RootState) => state.wallet.sending.address,
  );
  const filteredTokens = TOKENS_ARR.filter((t) => {
    if (!fromNetwork) return true;
    return !!t.tokenId || (!t.tokenId && t.nativeNetwork === fromNetwork);
  });
  const tokenBalances = useSelector(
    (state: RootState) => state.transfer.balances,
  );

  // state
  // const [showAdvanced, setShowAdvanced] = React.useState(false);
  // const toggleAdvanced = () => setShowAdvanced((prev) => !prev);
  const [tokens, setTokens] = React.useState(filteredTokens);

  // set tokens
  const searchTokens = (
    e:
      | ChangeEvent<HTMLInputElement>
      | ChangeEvent<HTMLTextAreaElement>
      | undefined,
  ) => {
    if (!e) return;
    const lowercase = e.target.value.toLowerCase();
    const filtered = filteredTokens.filter((c) => {
      const symbol = c.symbol.toLowerCase();
      return (
        symbol.includes(lowercase) ||
        (c.tokenId && c.tokenId.address.toLowerCase().includes(lowercase))
      );
    });
    setTokens(filtered);
  };
  // listen for close event
  const closeTokensModal = () => {
    dispatch(setTokensModal(false));
  };

  // select token
  const selectToken = (token: string) => {
    dispatch(setToken(token));
    closeTokensModal();
  };

  const displayNativeNetwork = (token: TokenConfig): string => {
    const chainConfig = CHAINS[token.nativeNetwork];
    if (!chainConfig) return '';
    return chainConfig.displayName;
  };

  // fetch token balances and set in store
  useEffect(() => {
    if (!walletAddr || !fromNetwork) return;
    const getBalances = async (
      tokens: TokenConfig[],
      walletAddr: string,
      chain: ChainName | ChainId,
    ) => {
      tokens.forEach(async (t) => {
        if (t.tokenId) {
          const balance = await getBalance(walletAddr, t.tokenId, chain);
          dispatch(setBalance(formatBalance(fromNetwork, t, balance)));
        } else {
          const balance = await getNativeBalance(walletAddr, chain);
          dispatch(setBalance(formatBalance(fromNetwork, t, balance)));
        }
      });
    };
    getBalances(filteredTokens, walletAddr, fromNetwork);
    // eslint-disable-next-line
  }, []);

  // TODO: filter out tokens that don't exist
  useEffect(() => {
    const filtered = tokens.filter((t) => tokenBalances[t.symbol] !== null);
    setTokens(filtered);
  }, [tokenBalances]);

  return (
    <Modal
      open={showTokensModal}
      closable
      width={500}
      onClose={closeTokensModal}
    >
      <Header text="Select asset" size={28} />
      <Spacer height={16} />
      <Search
        placeholder="Search by name or paste contract address"
        onChange={searchTokens}
      />
      <Spacer height={16} />
      <div className={classes.sectionHeader}>
        <div className={classes.subheader}>Tokens with liquid markets</div>
        <Tooltip text="Please perform your own due diligence, but to our knowledge these tokens have liquid markets available (i.e. you should be able to trade and utilize your tokens) on your destination chain." />
      </div>
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
                  onClick={() => selectToken(token.symbol)}
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
                      {tokenBalances[token.symbol] ? (
                        <div>{tokenBalances[token.symbol]}</div>
                      ) : fromNetwork && walletAddr ? (
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

      <div className={classes.register}>
        <div className={classes.registerText}>Don't see your token?</div>
        <a href="#" className={classes.registerLink}>
          Register token
        </a>
      </div>
    </Modal>
  );
}

export default TokensModal;
