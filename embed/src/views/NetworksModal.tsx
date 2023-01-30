import React from 'react';
import { useTheme } from '@mui/material/styles';
import { makeStyles } from 'tss-react/mui';
import Header from '../components/Header';
import Modal from '../components/Modal';
import Spacer from '../components/Spacer';
import Search from '../components/Search';
import Scroll from '../components/Scroll';

import { CHAINS_ARR } from '../sdk/config';
import { ChainName } from 'sdk';
import { useDispatch } from 'react-redux';
import { setFromNetworksModal, setToNetworksModal } from '../store/router';
import { setFromNetwork, setToNetwork } from '../store/transfer';

const useStyles = makeStyles()((theme) => ({
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

  // dispatch selectNetwork event
  const selectNetwork = (network: ChainName) => {
    if (props.type === ModalType.FROM) {
      dispatch(setFromNetwork(network));
      dispatch(setFromNetworksModal(false));
    } else {
      dispatch(setToNetwork(network));
      dispatch(setToNetworksModal(false));
    }
  };

  return (
    <Modal
      open={props.open}
      closable
      width={CHAINS_ARR.length > 6 ? 'md' : 'sm'}
    >
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
                onClick={() => selectNetwork(chain.key)}
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
