import { makeStyles } from '@mui/styles';
import React from 'react';
import Collapse from '@mui/material/Collapse';
import Header from '../components/Header';
import Modal from '../components/Modal';
import Spacer from '../components/Spacer';
import Search from '../components/Search';
import Scroll from '../components/Scroll';
import Tooltip from '../components/Tooltip';
import { Theme } from '@mui/material';
import Down from '../icons/components/Down';

import { MAINNET_TOKENS } from '../sdk/config/MAINNET';
import { useDispatch } from 'react-redux';
import { setTokensModal } from '../store/router';
import { setToken } from '../store/transfer';
import { joinClass } from '../utils/style';

const useStyles = makeStyles((theme: Theme) => ({
  tokensContainer: {
    display: 'flex',
    flexDirection: 'column',
  },
  subheader: {
    fontSize: '18px',
    textAlign: 'left',
    marginRight: '8px',
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
      backgroundColor: theme.palette.primary[700],
    },
    '&:not(:last-child)': {
      borderBottom: `0.5px solid ${theme.palette.divider}`,
    },
  },
  tokenRowLeft: {
    display: 'flex',
    alignItems: 'center',
    fontSize: '14px',
  },
  tokenRowIcon: {
    width: '32px',
    height: '32px',
    marginRight: '12px',
  },
  tokenRowRight: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  tokenRowBalanceText: {
    opacity: '60%',
    fontSize: '12px',
  },
  tokenRowBalance: {
    fontSize: '14px',
  },
  tokenRowAddress: {
    width: '100%',
    position: 'absolute',
    fontSize: '14px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  advanced: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: '16px',
    cursor: 'pointer',
  },
  arrow: {
    transition: 'transform 0.4s',
  },
  invert: {
    transform: 'rotate(180deg)',
  },
  row: {
    display: 'flex',
    alignItems: 'center',
  },
}));

function TokensModal() {
  const classes = useStyles();
  const dispatch = useDispatch();
  const [showAdvanced, setShowAdvanced] = React.useState(false);
  const toggleAdvanced = () => setShowAdvanced((prev) => !prev);
  // listen for close event
  const closeTokensModal = () => {
    dispatch(setTokensModal(false));
    document.removeEventListener('click', closeTokensModal);
  };
  document.addEventListener('close', closeTokensModal, { once: true });
  // set token
  const selectToken = (token: string) => {
    dispatch(setToken(token));
    closeTokensModal();
  };

  return (
    <Modal closable width="500px">
      <Header text="Select token" />
      <Spacer height={16} />
      <Search placeholder="Search by name or paste contract address" />
      <Spacer height={16} />
      <div className={classes.row}>
        <div className={classes.subheader}>Tokens with liquid markets</div>
        <Tooltip text="Some text" />
      </div>
      <Scroll height="calc(100vh - 300px)">
        <div className={classes.tokensContainer}>
          {Object.values(MAINNET_TOKENS).map((token, i) => {
            return (
              <div
                className={classes.tokenRow}
                key={i}
                onClick={() => selectToken(token.symbol)}
              >
                <div className={classes.tokenRowLeft}>
                  <img
                    className={classes.tokenRowIcon}
                    src={token.icon}
                    alt={token.symbol}
                  />
                  <div>{token.symbol}</div>
                </div>
                <div className={classes.tokenRowRight}>
                  <div className={classes.tokenRowBalanceText}>Balance</div>
                  <div className={classes.tokenRowBalance}>200.4567</div>
                </div>
                <div className={classes.tokenRowAddress}>{token.address}</div>
              </div>
            );
          })}
          <div className={classes.advanced} onClick={toggleAdvanced}>
            <div className={classes.row}>
              <div className={classes.subheader}>Advanced</div>
              <Tooltip text="Some text" />
            </div>
            <Down
              className={joinClass([
                classes.arrow,
                showAdvanced && classes.invert,
              ])}
            />
          </div>
          <Collapse in={showAdvanced}>
            <div>Advanced Options</div>
          </Collapse>
        </div>
      </Scroll>
    </Modal>
  );
}

export default TokensModal;
