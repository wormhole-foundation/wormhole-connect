import { makeStyles } from '@mui/styles';
import React from 'react';
import Header from '../components/Header';
import Modal from '../components/Modal';
import Spacer from '../components/Spacer';
import Search from '../components/Search';
import Scroll from '../components/Scroll';
import { Theme } from '@mui/material';

import MAINNET_CONFIG from '../sdk/config/MAINNET';

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
};

function NetworksModal(props: Props) {
  const classes = useStyles();
  return (
    <Modal closable>
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
                <div key={i} className={classes.networkTile}>
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
