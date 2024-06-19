import React, { useCallback, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { makeStyles } from 'tss-react/mui';

import { RootState } from 'store';
import { disconnectWallet as disconnectFromStore } from 'store/wallet';
import { TransferWallet } from 'utils/wallet';
import { copyTextToClipboard, displayWalletAddress } from 'utils';

import DownIcon from 'icons/Down';
import WalletIcons from 'icons/WalletIcons';
import PopupState, { bindTrigger, bindPopover } from 'material-ui-popup-state';
import Popover from '@mui/material/Popover';
import config from 'config';
import { TransferSide } from 'config/types';
import ExplorerLink from './ExplorerLink';
import WalletSidebar from './Sidebar';
import { Typography } from '@mui/material';

type StyleProps = { disabled?: boolean };

const useStyles = makeStyles<StyleProps>()((theme: any) => ({
  connectWallet: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '8px 16px',
    borderRadius: '8px',
    cursor: 'pointer',
    opacity: 1.0,
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
  side: TransferSide;
  type: TransferWallet;
};

const ConnectedWallet = (props: Props) => {
  const { type } = props;

  const dispatch = useDispatch();

  const { classes } = useStyles({});
  const wallet = useSelector((state: RootState) => state.wallet[type]);

  const [isOpen, setIsOpen] = useState(false);

  const connectWallet = useCallback(async (popupState?: any) => {
    if (popupState) {
      popupState.close();
    }

    setIsOpen(true);
  }, []);

  const copyAddress = useCallback(
    (popupState: any) => {
      copyTextToClipboard(wallet.address);
      popupState.close();
    },
    [wallet.address],
  );

  const disconnectWallet = useCallback(
    async (popupState: any) => {
      dispatch(disconnectFromStore(type));
      popupState.close();
    },
    [type],
  );

  if (!wallet?.address) {
    return <></>;
  }

  return (
    <>
      <PopupState
        variant="popover"
        popupId={`connected-wallet-popover-${props.side}`}
      >
        {(popupState) => {
          const { onClick: triggerPopup, ...boundProps } =
            bindTrigger(popupState);

          const onClick = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
            triggerPopup(e);
          };

          return (
            <>
              <div
                className={classes.connectWallet}
                onClick={onClick}
                {...boundProps}
              >
                <WalletIcons
                  name={wallet.name}
                  icon={wallet.icon}
                  height={24}
                />
                <Typography fontSize={14}>
                  {displayWalletAddress(wallet.type, wallet.address)}
                </Typography>
                <DownIcon className={classes.down} />
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
                <div className={classes.dropdown}>
                  <div
                    className={classes.dropdownItem}
                    onClick={() => copyAddress(popupState)}
                  >
                    Copy address
                  </div>
                  {config.explorer ? (
                    <ExplorerLink
                      address={wallet.address}
                      href={config.explorer.href}
                      target={config.explorer.target}
                      label={config.explorer.label}
                    />
                  ) : null}
                  <div
                    className={classes.dropdownItem}
                    onClick={() => connectWallet(popupState)}
                  >
                    Change wallet
                  </div>
                  <div
                    className={classes.dropdownItem}
                    onClick={() => disconnectWallet(popupState)}
                  >
                    Disconnect
                  </div>
                </div>
              </Popover>
            </>
          );
        }}
      </PopupState>
      <WalletSidebar
        open={isOpen}
        type={props.type}
        onClose={() => {
          setIsOpen(false);
        }}
      />
    </>
  );
};

export default ConnectedWallet;
