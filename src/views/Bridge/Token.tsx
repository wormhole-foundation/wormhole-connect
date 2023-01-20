import React from 'react';
import { makeStyles } from '@mui/styles';
import InputContainer from '../../components/InputContainer';
import TokenIcon from '../../icons/token.svg';
import { Theme } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { setTokensModal } from '../../store/router';
import { RootState } from '../../store';
import { MAINNET_TOKENS } from '../../sdk/config/MAINNET';
import Down from '../../icons/components/Down';
import InputTransparent from '../../components/InputTransparent';
import TokensModal from '../TokensModal';
import { joinClass } from '../../utils/style';

const useStyles = makeStyles((theme: Theme) => ({
  row: {
    width: '100%',
    display: 'flex',
    items: 'center',
  },
  col: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
  },
  tokenSelect: {
    justifyContent: 'space-between',
  },
  tokenRow: {
    display: 'flex',
    alignItems: 'center',
    fontSize: '20px',
    cursor: 'pointer',
  },
  tokenRowIcon: {
    width: '32px',
    height: '32px',
    marginRight: '12px',
  },
  max: {
    fontSize: '14px',
    opacity: '50%',
    marginLeft: '16px',
  },
  balance: {
    marginTop: '4px',
    marginRight: '16px',
    textAlign: 'right',
  },
  cursor: {
    cursor: 'pointer',
  },
}));

function Bridge() {
  const classes = useStyles();
  const dispatch = useDispatch();
  const token = useSelector((state: RootState) => state.transfer.token);
  const tokenConfig = token ? MAINNET_TOKENS[token] : undefined;
  const openTokensModal = () => dispatch(setTokensModal(true));
  const showTokensModal = useSelector(
    (state: RootState) => state.router.showTokensModal,
  );

  return (
    <div className={classes.row}>
      {tokenConfig ? (
        <div className={classes.col}>
          <InputContainer>
            <div className={joinClass([classes.row, classes.tokenSelect])}>
              <div className={classes.tokenRow} onClick={openTokensModal}>
                <img
                  className={classes.tokenRowIcon}
                  src={tokenConfig!.icon}
                  alt={tokenConfig!.symbol}
                />
                <div>{tokenConfig!.symbol}</div>
                <Down />
              </div>
              <div className={classes.tokenRow}>
                <InputTransparent placeholder="0.00" align="right" />
                <div className={classes.max}>Max</div>
              </div>
            </div>
          </InputContainer>
          <div className={classes.balance}>Balance: 120.45</div>
        </div>
      ) : (
        <InputContainer onClick={openTokensModal}>
          <div className={joinClass([classes.row, classes.tokenSelect])}>
            Select token
            <img src={TokenIcon} alt="select token" />
          </div>
        </InputContainer>
      )}

      {showTokensModal && <TokensModal />}
    </div>
  );
}

export default Bridge;
