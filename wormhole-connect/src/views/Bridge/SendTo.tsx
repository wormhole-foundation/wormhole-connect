import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { BigNumber } from 'ethers';
import { makeStyles } from '@mui/styles';
import { Theme } from '@mui/material';
import { RootState } from '../../store';
import { setToNetworksModal } from '../../store/router';
import { formatBalance } from '../../store/transfer';
import { TransferWallet } from '../../utils/wallet';
import { CHAINS, TOKENS } from '../../sdk/config';
import { getBalance } from '../../sdk/sdk';
import { joinClass, OPACITY } from '../../utils/style';
import InputContainer from '../../components/InputContainer';
import ConnectWallet from '../../components/ConnectWallet';
import NetworkTile from '../../components/NetworkTile';
import TokenIcon from '../../icons/components/TokenIcons';

const useStyles = makeStyles((theme: Theme) => ({
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  card: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
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
  disabled: {
    color: theme.palette.text.secondary + OPACITY[50] + ' !important',
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
    border: 'none',
  },
}));

function SendTo() {
  const classes = useStyles();
  const dispatch = useDispatch();
  const [balance, setBalance] = useState(undefined as string | undefined);
  // store values
  const toNetwork = useSelector((state: RootState) => state.transfer.toNetwork);
  const token = useSelector((state: RootState) => state.transfer.token);
  const amount = useSelector((state: RootState) => state.transfer.amount);
  const walletAddr = useSelector(
    (state: RootState) => state.wallet.receiving.address,
  );
  // get networks configs
  const toNetworkConfig = toNetwork ? CHAINS[toNetwork] : undefined;
  const tokenConfig = TOKENS[token];
  // set store values
  const openToNetworksModal = () => dispatch(setToNetworksModal(true));

  // balance
  useEffect(() => {
    if (!toNetwork || !tokenConfig || !walletAddr) return;
    if (tokenConfig.tokenId) {
      getBalance(walletAddr, tokenConfig.tokenId, toNetwork).then(
        (res: BigNumber | null) => {
          const balance = formatBalance(tokenConfig, res);
          setBalance(balance[tokenConfig.symbol]);
        },
      );
    } else if (tokenConfig.wrappedAsset) {
      const wrappedConfig = TOKENS[tokenConfig.wrappedAsset];
      if (wrappedConfig && wrappedConfig.tokenId) {
        getBalance(walletAddr, wrappedConfig.tokenId, toNetwork).then(
          (res: BigNumber | null) => {
            const balance = formatBalance(tokenConfig, res);
            setBalance(balance[tokenConfig.symbol]);
          },
        );
      }
    }
  }, [tokenConfig, toNetwork, walletAddr]);

  return (
    <div className={classes.container}>
      <div className={classes.header}>
        <div className={classes.headerTitle}>Sending to</div>
        <ConnectWallet type={TransferWallet.RECEIVING} />
      </div>

      <InputContainer>
        <div className={classes.content}>
          <NetworkTile
            network={toNetworkConfig}
            onClick={openToNetworksModal}
          />
          <div className={classes.inputs}>
            <div
              className={joinClass([classes.card, !token && classes.disabled])}
            >
              <div className={classes.label}>Token</div>
              {tokenConfig ? (
                <div className={classes.tokenSelect}>
                  <TokenIcon name={tokenConfig.icon} height={24} />
                  {tokenConfig.wrappedAsset || tokenConfig.symbol}
                </div>
              ) : (
                <div className={classes.tokenSelect}>
                  <TokenIcon name="no token" height={24} />
                  <div>-</div>
                </div>
              )}
            </div>
            <div className={classes.amtRow}>
              <div
                className={joinClass([
                  classes.card,
                  !token && classes.disabled,
                ])}
              >
                <div className={classes.label}>Amount</div>
                <div>{token && amount ? amount : '-'}</div>
              </div>
              <div
                className={joinClass([
                  classes.card,
                  (!token || !balance) && classes.disabled,
                  classes.balance,
                ])}
              >
                <div className={classes.label}>Balance</div>
                <div>{token && balance && balance ? balance : '-'}</div>
              </div>
            </div>
            {/* <div
              className={joinClass([classes.card, !token && classes.disabled])}
            >
              <div className={classes.label}>Amount</div>
              <div>{token && amount ? amount : '-'}</div>
            </div> */}
          </div>
        </div>
      </InputContainer>
    </div>
  );
}

export default SendTo;
