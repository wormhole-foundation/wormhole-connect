import { makeStyles } from '@mui/styles';
import React from 'react';
import Header from '../components/Header';
import Modal from '../components/Modal';
import Spacer from '../components/Spacer';
import Search from '../components/Search';
import Scroll from '../components/Scroll';
import { Theme } from '@mui/material';

import MAINNET_CONFIG from '../sdk/config/MAINNET';
import { ChainName } from '../sdk/types';
import { useDispatch } from 'react-redux';
import { setFromNetworksModal, setToNetworksModal } from '../store/router';

const useStyles = makeStyles((theme: Theme) => ({
  networksContainer: {
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  networkTile: {
    width: '117px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    margin: '12px',
    padding: '16px',
    transition: 'background-color 0.4s',
    cursor: 'pointer',
    borderRadius: '8px',
    '&:hover': {
      backgroundColor: theme.palette.primary[700],
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
}));

type Props = {
  title: string;
  event: string;
};

function NetworksModal(props: Props) {
  const classes = useStyles();
  const dispatch = useDispatch();
  // listen for close event
  const closeNetworksModal = () => {
    dispatch(setFromNetworksModal(false));
    dispatch(setToNetworksModal(false));
    document.removeEventListener('close', closeNetworksModal);
  };
  document.addEventListener('close', closeNetworksModal, { once: true });
  // dispatch selectNetwork event
  const emitSelectNetwork = (network: ChainName) => {
    console.log('emit');
    const event = new CustomEvent(props.event, { detail: network });
    document.dispatchEvent(event);
    closeNetworksModal();
  };

  return (
    <Modal closable width="650px">
      <Header text={props.title} />
      <div>Select Network</div>
      <Spacer height={16} />
      <Search placeholder="Search networks" />
      <Spacer height={16} />
      <Scroll height="calc(100vh - 300px)">
        <div className={classes.networksContainer}>
          {Object.values(MAINNET_CONFIG.chains)
            .filter((c) => !!c.icon)
            .map((chain, i) => {
              return (
                <div
                  key={i}
                  className={classes.networkTile}
                  onClick={() => emitSelectNetwork(chain.key)}
                >
                  <img
                    src={chain.icon}
                    alt={chain.displayName}
                    className={classes.networkIcon}
                  />
                  <div className={classes.networkText}>{chain.displayName}</div>
                </div>
              );
            })}
        </div>
      </Scroll>
    </Modal>
  );
}

export default NetworksModal;
