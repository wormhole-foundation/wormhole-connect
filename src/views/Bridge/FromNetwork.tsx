import React from 'react';
import { makeStyles } from '@mui/styles';
import NetworksModal from '../NetworksModal';
import NetworkTile from '../../components/NetworkTile';
import { Theme } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { setFromNetworksModal, setTokensModal } from '../../store/router';
import { RootState } from '../../store';
import MAINNET_CONFIG, { MAINNET_TOKENS } from '../../sdk/config/MAINNET';
import InputContainer from '../../components/InputContainer';
import InputTransparent from '../../components/InputTransparent';
import ConnectWallet, { Wallet } from '../../components/ConnectWallet';
import TokensModal from '../TokensModal';
import NoNetworkIcon from '../../icons/no-network.png';
import { joinClass } from '../../utils/style';
import { setAmount } from '../../store/transfer';

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
}));

function Network() {
  const classes = useStyles();
  const dispatch = useDispatch();
  // store values
  const showFromNetworksModal = useSelector(
    (state: RootState) => state.router.showFromNetworksModal,
  );
  const showTokensModal = useSelector(
    (state: RootState) => state.router.showTokensModal,
  );
  const fromNetwork = useSelector(
    (state: RootState) => state.transfer.fromNetwork,
  );
  const token = useSelector((state: RootState) => state.transfer.token);
  const tokenConfig = token && MAINNET_TOKENS[token];
  // get networks configs
  const fromNetworkConfig = MAINNET_CONFIG.chains[fromNetwork];
  // set store values
  const openFromNetworksModal = () => dispatch(setFromNetworksModal(true));
  const openTokensModal = () => dispatch(setTokensModal(true));
  function handleAmountChange(event) {
    console.log(event.target.value);
    dispatch(setAmount(event.target.value));
  }

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
                  Select
                </div>
              )}
            </div>
            <div className={classes.card}>
              <div className={classes.label}>Amount</div>
              {token ? (
                <InputTransparent
                  placeholder="0.00"
                  onChange={handleAmountChange}
                />
              ) : (
                <div>-</div>
              )}
            </div>
          </div>
        </div>
      </InputContainer>
      {/* modals */}
      <NetworksModal
        open={showFromNetworksModal}
        title="Send from"
        event="selectFromNetwork"
      />
      {showTokensModal && <TokensModal />}
    </div>
  );
}

export default Network;
