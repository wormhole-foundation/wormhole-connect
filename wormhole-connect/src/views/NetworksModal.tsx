import React, { ChangeEvent } from 'react';
import { useSelector } from 'react-redux';
import { useTheme } from '@mui/material/styles';
import { makeStyles } from 'tss-react/mui';
import { RootState } from '../store';
import Header from '../components/Header';
import Modal from '../components/Modal';
import Spacer from '../components/Spacer';
import Search from '../components/Search';
import Scroll from '../components/Scroll';

import { CHAINS_ARR } from '../sdk/config';
import { ChainName } from '@wormhole-foundation/wormhole-connect-sdk';
import { useDispatch } from 'react-redux';
import { setFromNetworksModal, setToNetworksModal } from '../store/router';
import { setFromNetwork, setToNetwork } from '../store/transfer';
import TokenIcon from '../icons/components/TokenIcons';
import { CENTER, joinClass } from '../utils/style';

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
    opacity: '60%',
    cursor: 'not-allowed',
    clickEvent: 'none',
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
  const [chains, setChains] = React.useState(CHAINS_ARR);
  const { fromNetwork, toNetwork } = useSelector(
    (state: RootState) => state.transfer,
  );

  // listen for close event
  const closeNetworksModal = () => {
    setTimeout(() => setChains(CHAINS_ARR), 500);
    dispatch(setFromNetworksModal(false));
    dispatch(setToNetworksModal(false));
    document.removeEventListener('click', closeNetworksModal);
  };
  document.addEventListener('close', closeNetworksModal, { once: true });

  const isDisabled = (chain: ChainName) => {
    if (props.type === ModalType.FROM) {
      if (!toNetwork) return false;
      return toNetwork === chain;
    } else {
      if (!fromNetwork) return false;
      return fromNetwork === chain;
    }
  };

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

  const searchChains = (
    e:
      | ChangeEvent<HTMLInputElement>
      | ChangeEvent<HTMLTextAreaElement>
      | undefined,
  ) => {
    if (!e) return;
    const lowercase = e.target.value.toLowerCase();
    const filtered = CHAINS_ARR.filter((c) => {
      return c.key.indexOf(lowercase) === 0;
    });
    setChains(filtered);
  };

  return (
    <Modal open={props.open} closable width={CHAINS_ARR.length > 6 ? 650 : 475}>
      <Header text={props.title} />
      <div>Select Network</div>
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
                <div
                  key={i}
                  className={joinClass([
                    classes.networkTile,
                    !!disabled && classes.disabled,
                  ])}
                  onClick={() => {
                    if (disabled) return;
                    selectNetwork(chain.key);
                  }}
                >
                  <TokenIcon name={chain.icon} height={48} />
                  <div className={classes.networkText}>{chain.displayName}</div>
                </div>
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
