import React, { ChangeEvent } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useTheme } from '@mui/material/styles';
import { makeStyles } from 'tss-react/mui';
import { ChainName } from '@wormhole-foundation/wormhole-connect-sdk';
import { RootState } from '../store';
import { CHAINS_ARR } from '../config';
import { setFromNetworksModal, setToNetworksModal } from '../store/router';
import { setFromNetwork, setToNetwork } from '../store/transfer';
import { clearWallet } from '../store/wallet';
import { CENTER, joinClass } from '../utils/style';
import { TransferWallet, walletAcceptedNetworks } from '../utils/wallet';

import Header from '../components/Header';
import Modal from '../components/Modal';
import Spacer from '../components/Spacer';
import Search from '../components/Search';
import Scroll from '../components/Scroll';
import TokenIcon from '../icons/TokenIcons';

const useStyles = makeStyles()((theme) => ({
  networksContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, 150px)',
    justifyContent: 'space-between',
  },
  noResults: {
    ...CENTER,
    minHeight: '130px',
  },
  networkTile: {
    width: '117px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    margin: '12px 4px',
    padding: '16px',
    transition: 'background-color 0.4s',
    cursor: 'pointer',
    borderRadius: '8px',
    '&:hover': {
      backgroundColor: theme.palette.options.select,
    },
  },
  networkIcon: {
    width: '48px',
    height: '48px',
  },
  networkText: {
    fontSize: '14px',
    marginTop: '16px',
  },
  disabled: {
    opacity: '40%',
    cursor: 'not-allowed',
    clickEvent: 'none',
  },
  subtitle: {
    opacity: '60%',
  },
}));

export enum ModalType {
  FROM = 1,
  TO = 2,
}

type Props = {
  open: boolean;
  type: ModalType;
  title: string;
  event: string;
};

function NetworksModal(props: Props) {
  const { classes } = useStyles();
  const theme = useTheme();
  const dispatch = useDispatch();

  const { fromNetwork, toNetwork } = useSelector(
    (state: RootState) => state.transfer,
  );
  const { sending, receiving } = useSelector(
    (state: RootState) => state.wallet,
  );
  const [chains, setChains] = React.useState(CHAINS_ARR);

  // listen for close event
  const closeNetworksModal = () => {
    setTimeout(() => setChains(CHAINS_ARR), 500);
    dispatch(setFromNetworksModal(false));
    dispatch(setToNetworksModal(false));
  };

  const isDisabled = (chain: ChainName) => {
    const type = props.type === ModalType.FROM ? sending.type : receiving.type;
    return !walletAcceptedNetworks(type).includes(chain);
  };

  // dispatch selectNetwork event
  const selectNetwork = async (network: ChainName) => {
    if (props.type === ModalType.FROM) {
      if (isDisabled(network)) {
        dispatch(clearWallet(TransferWallet.SENDING));
      }
      dispatch(setFromNetwork(network));
      dispatch(setFromNetworksModal(false));
    } else {
      if (isDisabled(network)) {
        dispatch(clearWallet(TransferWallet.RECEIVING));
      }
      dispatch(setToNetwork(network));
      dispatch(setToNetworksModal(false));
    }
  };

  const searchChains = (
    e:
      | ChangeEvent<HTMLInputElement>
      | ChangeEvent<HTMLTextAreaElement>
      | undefined,
  ) => {
    if (!e) return;
    const lowercase = e.target.value.toLowerCase();
    const filtered = CHAINS_ARR.filter((c) => {
      return c.key.includes(lowercase);
    });
    setChains(filtered);
  };

  const showChain = (chain: ChainName) => {
    if (props.type === ModalType.FROM) {
      return chain !== toNetwork;
    }
    return chain !== fromNetwork;
  };

  return (
    <Modal
      open={props.open}
      closable
      width={CHAINS_ARR.length > 6 ? 650 : 500}
      onClose={closeNetworksModal}
    >
      <Header text={props.title} size={28} />
      <div className={classes.subtitle}>Select Network</div>
      <Spacer height={16} />
      <Search placeholder="Search networks" onChange={searchChains} />
      <Spacer height={16} />
      <Scroll
        height="calc(100vh - 300px)"
        blendColor={theme.palette.modal.background}
      >
        {chains.length > 0 ? (
          <div className={classes.networksContainer}>
            {chains.map((chain: any, i) => {
              const disabled = isDisabled(chain.key);
              return (
                showChain(chain.key) && (
                  <div
                    key={i}
                    className={joinClass([
                      classes.networkTile,
                      !!disabled && classes.disabled,
                    ])}
                    onClick={() => selectNetwork(chain.key)}
                  >
                    <TokenIcon name={chain.icon} height={48} />
                    <div className={classes.networkText}>
                      {chain.displayName}
                    </div>
                  </div>
                )
              );
            })}
          </div>
        ) : (
          <div className={classes.noResults}>No results</div>
        )}
      </Scroll>
    </Modal>
  );
}

export default NetworksModal;
