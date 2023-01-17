import { makeStyles } from '@mui/styles';
import React from 'react';
import Collapse from '@mui/material/Collapse';
import Header from '../components/Header';
import Modal from '../components/Modal';
import Spacer from '../components/Spacer';
import Search from '../components/Search';
import Scroll from '../components/Scroll';
import { Theme } from '@mui/material';
import ArrowDownIcon from '../icons/arrow-down.svg';

import { MAINNET_TOKENS } from '../sdk/config/MAINNET';
import { OPACITY } from '../utils/style';

const useStyles = makeStyles((theme: Theme) => ({
  networksContainer: {
    display: 'flex',
    flexDirection: 'column',
  },
  subheader: {
    fontSize: '18px',
    textAlign: 'left',
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
    '&:hover': {
      backgroundColor: theme.palette.primary[700],
    },
    '&:not(:last-child)': {
      borderBottom: `0.5px solid ${theme.palette.primary[500] + OPACITY[80]}`,
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
  }
}));

function TokensModal() {
  const classes = useStyles();
  const [showAdvanced, setShowAdvanced] = React.useState(false);
  const toggleAdvanced = () => {
    setShowAdvanced((prev) => !prev);
  };

  return (
    <Modal closable width={500}>
      <Header text="Select token" />
      <div>Select Network</div>
      <Spacer height={16} />
      <Search placeholder="Search by name or paste contract address" />
      <Spacer height={16} />
      <div className={classes.subheader}>Tokens with liquid markets</div>
      <Scroll height="calc(100vh - 300px)">
        <div className={classes.networksContainer}>
          {Object.values(MAINNET_TOKENS).map((token, i) => {
            return (
              <div className={classes.tokenRow}>
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
            <div className={classes.subheader}>Advanced</div>
            <img className={`${classes.arrow} ${showAdvanced && classes.invert}`} src={ArrowDownIcon} alt="down arrow" />
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
