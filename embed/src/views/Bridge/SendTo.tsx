import React from 'react';
import { makeStyles } from '@mui/styles';
import NetworksModal from '../NetworksModal';
import NetworkTile from '../../components/NetworkTile';
import { Theme } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import { CHAINS, TOKENS } from '../../utils/sdk';
import InputContainer from '../../components/InputContainer';
import ConnectWallet, { Wallet } from '../../components/ConnectWallet';
import NoNetworkIcon from '../../icons/no-network.png';
import { setToNetworksModal } from '../../store/router';
import { joinClass, OPACITY } from '../../utils/style';

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
  card: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    backgroundColor: theme.palette.card.secondary,
    width: '100%',
    flexGrow: '1',
    padding: '12px',
    borderRadius: '0px !important',
    border: `0.5px solid ${theme.palette.divider + OPACITY[40]}`,
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
  // store values
  const showToNetworksModal = useSelector(
    (state: RootState) => state.router.showToNetworksModal,
  );
  const toNetwork = useSelector((state: RootState) => state.transfer.toNetwork);
  const token = useSelector((state: RootState) => state.transfer.token);
  const amount = useSelector((state: RootState) => state.transfer.amount);
  // get networks configs
  const toNetworkConfig = CHAINS[toNetwork];
  const tokenConfig = TOKENS[token];
  // set store values
  const openToNetworksModal = () => dispatch(setToNetworksModal(true));
  const balance = '12.34';

  return (
    <div className={classes.container}>
      <div className={classes.header}>
        <div className={classes.headerTitle}>Sending to</div>
        <ConnectWallet type={Wallet.RECEIVING} />
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
                  <img
                    className={classes.tokenIcon}
                    src={tokenConfig.icon}
                    alt="token icon"
                  />
                  {tokenConfig.symbol}
                </div>
              ) : (
                <div className={classes.tokenSelect}>
                  <img
                    className={classes.tokenIcon}
                    src={NoNetworkIcon}
                    alt="select token"
                  />
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

      {/* modal */}
      <NetworksModal
        open={showToNetworksModal}
        title="Send to"
        event="selectToNetwork"
      />
    </div>
  );
}

export default SendTo;
