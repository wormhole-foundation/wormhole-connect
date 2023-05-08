import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { makeStyles } from 'tss-react/mui';
import { RootState } from '../store';
import { TransferWallet } from '../utils/wallet';
import { copyTextToClipboard, displayWalletAddress } from '../utils';

import DownIcon from '../icons/Down';
import WalletIcon from '../icons/Wallet';
import WalletIcons from '../icons/WalletIcons';
import PopupState, { bindTrigger, bindPopover } from 'material-ui-popup-state';
import Popover from '@mui/material/Popover';
import { setWalletModal } from '../store/router';
import { disconnectWallet as disconnectFromStore } from '../store/wallet';
import { ScopedCssBaseline } from '@mui/material';

const useStyles = makeStyles()((theme) => ({
  connectWallet: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'end',
    gap: '8px',
    padding: '8px 16px',
    borderRadius: '20px',
    backgroundColor: theme.palette.button.primary,
    cursor: 'pointer',
  },
  walletIcon: {
    width: '24px',
    height: '24px',
  },
  down: {
    marginRight: '-8px',
  },
  dropdown: {
    backgroundColor: theme.palette.popover.background,
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    padding: '8px',
    width: '175px',
  },
  dropdownItem: {
    borderRadius: '8px',
    padding: '16px',
    cursor: 'pointer',
    '&:hover': {
      backgroundColor: theme.palette.popover.secondary,
    },
  },
}));

type Props = {
  type: TransferWallet;
  disabled?: boolean;
};

function ConnectWallet(props: Props) {
  const { disabled = false, type } = props;
  const { classes } = useStyles();
  const dispatch = useDispatch();
  const wallet = useSelector((state: RootState) => state.wallet[type]);

  const connect = async (popupState?: any) => {
    if (popupState) popupState.close();
    dispatch(setWalletModal(type));
  };

  const copy = async (popupState: any) => {
    await copyTextToClipboard(wallet.address);
    popupState.close();
  };

  const disconnectWallet = async () => {
    dispatch(disconnectFromStore(type));
  };

  return wallet && wallet.address ? (
    <PopupState variant="popover" popupId="demo-popup-popover">
      {(popupState) => {
        const { onClick: triggerPopup, ...boundProps } =
          bindTrigger(popupState);

        const onClick = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
          if (disabled) return;
          triggerPopup(e);
        };

        return (
          <div>
            <div
              className={classes.connectWallet}
              onClick={onClick}
              {...boundProps}
            >
              <WalletIcons name={wallet.name} icon={wallet.icon} height={24} />
              {displayWalletAddress(wallet.type, wallet.address)}
              {!disabled && <DownIcon className={classes.down} />}
            </div>
            <Popover
              {...bindPopover(popupState)}
              sx={{ marginTop: 1 }}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
            >
              <ScopedCssBaseline enableColorScheme>
                <div className={classes.dropdown}>
                  <div
                    className={classes.dropdownItem}
                    onClick={() => copy(popupState)}
                  >
                    Copy address
                  </div>
                  <div
                    className={classes.dropdownItem}
                    onClick={() => connect(popupState)}
                  >
                    Change wallet
                  </div>
                  <div
                    className={classes.dropdownItem}
                    onClick={disconnectWallet}
                  >
                    Disconnect
                  </div>
                </div>
              </ScopedCssBaseline>
            </Popover>
          </div>
        );
      }}
    </PopupState>
  ) : (
    <div className={classes.connectWallet} onClick={() => connect()}>
      <WalletIcon />
      <div>Connect wallet</div>
    </div>
  );
}

export default ConnectWallet;
