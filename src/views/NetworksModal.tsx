import { makeStyles } from '@mui/styles';
import { useTheme } from '@mui/material/styles';
import React from 'react';
import Header from '../components/Header';
import Modal from '../components/Modal';
import Spacer from '../components/Spacer';
import Search from '../components/Search';
import Scroll from '../components/Scroll';
import { Theme } from '@mui/material';

import { CHAINS_ARR } from '../store/transfer';
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
}));

type Props = {
  open: boolean;
  title: string;
  event: string;
};

function NetworksModal(props: Props) {
  const classes = useStyles();
  const theme = useTheme();
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
    <Modal open={props.open} closable width="md">
      <Header text={props.title} />
      <div>Select Network</div>
      <Spacer height={16} />
      <Search placeholder="Search networks" />
      <Spacer height={16} />
      <Scroll
        height="calc(100vh - 300px)"
        blendColor={theme.palette.card.background}
      >
        <div className={classes.networksContainer}>
          {CHAINS_ARR.filter((c) => !!c.icon).map((chain, i) => {
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
