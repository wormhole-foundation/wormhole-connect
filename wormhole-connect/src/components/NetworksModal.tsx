import React, { ChangeEvent, useState } from 'react';
import { useTheme } from '@mui/material/styles';
import { makeStyles } from 'tss-react/mui';
import {
  ChainConfig,
  ChainName,
} from '@wormhole-foundation/wormhole-connect-sdk';
import { CHAINS_ARR, CHAINS } from '../config';
import { CENTER, joinClass } from '../utils/style';

import Header from './Header';
import Modal from './Modal';
import Spacer from './Spacer';
import Search from './Search';
import Scroll from './Scroll';
import TokenIcon from '../icons/TokenIcons';

const useStyles = makeStyles()((theme: any) => ({
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
  title: string;
  open: boolean;
  chains?: ChainConfig[];
  isDisabled?: (chain: ChainName) => boolean;
  onClose: () => any;
  onSelect: (chain: ChainName) => any;
};

function NetworksModal(props: Props) {
  const { classes } = useStyles();
  const theme: any = useTheme();

  const chains = props.chains || CHAINS_ARR;
  const [search, setSearch] = useState<string | undefined>();

  const searchChains = (
    e:
      | ChangeEvent<HTMLInputElement>
      | ChangeEvent<HTMLTextAreaElement>
      | undefined,
  ) => {
    setSearch(e?.target.value.toLowerCase());
  };

  const showChain = (chain: ChainName) => {
    if (!search) return true;
    const chainConfig = CHAINS[chain]!;
    const name = chainConfig.displayName.toLowerCase();
    return name.includes(search);
  };

  const handleClose = () => {
    setTimeout(() => setSearch(undefined), 500);
    props.onClose();
  };

  const handleSelect = (chain: ChainName) => {
    props.onSelect(chain);
    handleClose();
  };

  return (
    <Modal
      open={props.open}
      closable
      width={CHAINS_ARR.length > 6 ? 650 : 500}
      onClose={handleClose}
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
              const disabled = !!props.isDisabled
                ? props.isDisabled(chain.key)
                : false;
              return (
                showChain(chain.key) && (
                  <div
                    key={i}
                    className={joinClass([
                      classes.networkTile,
                      !!disabled && classes.disabled,
                    ])}
                    onClick={() => handleSelect(chain.key)}
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
