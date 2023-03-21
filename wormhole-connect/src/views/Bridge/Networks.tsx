import React from 'react';
import { useSelector } from 'react-redux';
import { makeStyles } from 'tss-react/mui';
import { RootState } from '../../store';
import NetworksModal, { ModalType } from '../NetworksModal';
import SendFrom from './SendFrom';
import SendTo from './SendTo';

const useStyles = makeStyles()((theme) => ({
  networks: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  networksTile: {
    width: '100%',
    maxWidth: '224px',
    boxShadow: theme.palette.card.elevation,
    borderRadius: '8px',
  },
}));

function Networks() {
  const { classes } = useStyles();
  // store values
  const showFromNetworksModal = useSelector(
    (state: RootState) => state.router.showFromNetworksModal,
  );
  const showToNetworksModal = useSelector(
    (state: RootState) => state.router.showToNetworksModal,
  );

  return (
    <div className={classes.networks}>
      <SendFrom />
      <SendTo />

      {/* modals */}
      <NetworksModal
        open={showFromNetworksModal}
        type={ModalType.FROM}
        title="Sending from"
        event="selectFromNetwork"
      />
      <NetworksModal
        open={showToNetworksModal}
        type={ModalType.TO}
        title="Sending to"
        event="selectToNetwork"
      />
    </div>
  );
}

export default Networks;
