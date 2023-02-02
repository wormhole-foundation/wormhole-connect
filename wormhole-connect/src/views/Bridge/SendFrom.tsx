import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { makeStyles } from '@mui/styles';
import { BigNumber } from 'ethers';
import { Theme } from '@mui/material';
import { RootState } from '../../store';
import { setFromNetworksModal, setTokensModal } from '../../store/router';
import { Wallet } from '../../store/wallet';
import { setAmount } from '../../store/transfer';
import { joinClass } from '../../utils/style';
import { toDecimals } from '../../utils/balance';
import { CHAINS, TOKENS } from '../../sdk/config';
import { getBalance } from '../../sdk/sdk';
import NetworkTile from '../../components/NetworkTile';
import InputContainer from '../../components/InputContainer';
import InputTransparent from '../../components/InputTransparent';
import ConnectWallet from '../../components/ConnectWallet';
import TokensModal from '../TokensModal';
import TokenIcon from '../../icons/components/TokenIcons';

const useStyles = makeStyles((theme: Theme) => ({
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '8px 16px',
  },
  headerTitle: {
    fontSize: '16px',
    fontWeight: 'bold',
  },
  container: {
    width: '100%',
  },
  content: {
    display: 'flex',
    width: '100%',
    height: '152px',
  },
  inputs: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    height: '100%',
    width: '100%',
  },
  input: {
    cursor: 'text',
  },
  card: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    backgroundColor: theme.palette.card.secondary,
    borderRadius: '8px',
    width: '100%',
    flexGrow: '1',
    padding: '12px',
  },
  label: {
    fontSize: '14px',
    color: theme.palette.text.secondary,
    marginBottom: '4px',
  },
  tokenIcon: {
    width: '24px',
    height: '24px',
  },
  tokenSelect: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  pointer: {
    cursor: 'pointer',
  },
  amtRow: {
    display: 'flex',
    flexDirection: 'row',
    width: '100%',
    gap: '8px',
  },
  balance: {
    maxWidth: '150px',
    flexGrow: 'unset',
    flexShrink: '2',
    backgroundColor: 'transparent',
  },
}));

// TODO: make SentTo and SendFrom 1 component
function SendFrom() {
  const classes = useStyles();
  const dispatch = useDispatch();
  const [balance, setBalance] = useState(undefined as string | undefined);

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
  const token = useSelector((state: RootState) => state.transfer.token);
  const tokenConfig = token && TOKENS[token];
  const fromNetworkConfig = fromNetwork ? CHAINS[fromNetwork] : undefined;

  // set store values
  const openFromNetworksModal = () => dispatch(setFromNetworksModal(true));
  const openTokensModal = () => dispatch(setTokensModal(true));
  function handleAmountChange(event) {
    console.log(event.target.value);
    dispatch(setAmount(event.target.value));
  }

  // amount input focus
  const amtId = 'sendAmt';
  function focusAmt() {
    const input = document.getElementById(amtId);
    if (!input) return;
    input.focus();
  }

  // balance
  useEffect(() => {
    if (!fromNetwork || !tokenConfig || !walletAddr) return;
    if (tokenConfig.tokenId) {
      getBalance(walletAddr, tokenConfig.tokenId, fromNetwork).then(
        (res: BigNumber) => {
          const b = toDecimals(res, tokenConfig.decimals, 6);
          setBalance(b);
        },
      );
    }
  }, [tokenConfig, fromNetwork, walletAddr]);

  return (
    <div className={classes.container}>
      <div className={classes.header}>
        <div className={classes.headerTitle}>Sending from</div>
        <ConnectWallet type={Wallet.SENDING} />
      </div>

      <InputContainer>
        <div className={classes.content}>
          <NetworkTile
            network={fromNetworkConfig}
            onClick={openFromNetworksModal}
          />
          <div className={classes.inputs}>
            <div
              className={joinClass([classes.card, classes.pointer])}
              onClick={openTokensModal}
            >
              <div className={classes.label}>Token</div>
              {tokenConfig ? (
                <div className={classes.tokenSelect}>
                  <TokenIcon name={tokenConfig.icon} height={24} />
                  {tokenConfig.symbol}
                </div>
              ) : (
                <div className={classes.tokenSelect}>
                  <TokenIcon name="no token" height={24} />
                  Select
                </div>
              )}
            </div>
            <div className={classes.amtRow}>
              <div
                className={joinClass([classes.card, token && classes.input])}
                onClick={focusAmt}
              >
                <div className={classes.label}>Amount</div>
                {token ? (
                  <InputTransparent
                    placeholder="0.00"
                    id={amtId}
                    onChange={handleAmountChange}
                  />
                ) : (
                  <div>-</div>
                )}
              </div>
              <div
                className={joinClass([classes.card, classes.balance])}
                onClick={focusAmt}
              >
                <div className={classes.label}>Balance</div>
                <div>{token && balance && balance ? balance : '-'}</div>
              </div>
            </div>
          </div>
        </div>
      </InputContainer>
      {/* modals */}
      {showTokensModal && <TokensModal />}
    </div>
  );
}

export default SendFrom;
