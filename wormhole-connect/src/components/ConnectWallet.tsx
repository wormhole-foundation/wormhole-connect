import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useTheme } from '@mui/material/styles';
import { makeStyles } from 'tss-react/mui';
import { ScopedCssBaseline, Tooltip, useMediaQuery } from '@mui/material';

import { RootState } from 'store';
import { setWalletModal } from 'store/router';
import { disconnectWallet as disconnectFromStore } from 'store/wallet';
import { TransferWallet } from 'utils/wallet';
import { copyTextToClipboard, displayWalletAddress } from 'utils';

import DownIcon from 'icons/Down';
import WalletIcon from 'icons/Wallet';
import WalletIcons from 'icons/WalletIcons';
import PopupState, { bindTrigger, bindPopover } from 'material-ui-popup-state';
import Popover from '@mui/material/Popover';
import { EXPLORER } from 'config';
import { ExplorerConfig } from 'config/types';

type StyleProps = { disabled?: boolean };
const useStyles = makeStyles<StyleProps>()((theme: any, { disabled }) => ({
  connectWallet: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'end',
    gap: '8px',
    padding: '8px 16px',
    borderRadius: '8px',
    backgroundColor: theme.palette.button.primary,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.7 : 1.0,
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

type ExplorerLinkProps = {
  address: string;
} & ExplorerConfig;

function ExplorerLink({
  address,
  href,
  target = '_blank',
  label = 'Transactions',
}: ExplorerLinkProps) {
  const { classes } = useStyles({ disabled: false });
  const handleOpenExplorer = () =>
    window.open(href.replace('{:address}', address), target);
  return (
    <div className={classes.dropdownItem} onClick={handleOpenExplorer}>
      {label}
    </div>
  );
}

function ConnectWallet(props: Props) {
  const { disabled = false, type } = props;
  const { classes } = useStyles({ disabled });
  const theme = useTheme();
  const dispatch = useDispatch();
  const mobile = useMediaQuery(theme.breakpoints.down('sm'));
  const wallet = useSelector((state: RootState) => state.wallet[type]);

  const connect = async (popupState?: any) => {
    if (disabled) return;
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

  if (wallet && wallet.address) {
    return (
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
                <WalletIcons
                  name={wallet.name}
                  icon={wallet.icon}
                  height={24}
                />
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
                    {EXPLORER ? (
                      <ExplorerLink
                        address={wallet.address}
                        href={EXPLORER.href}
                        target={EXPLORER.target}
                        label={EXPLORER.label}
                      />
                    ) : null}
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
    );
  } else {
    let button = (
      <div className={classes.connectWallet} onClick={() => connect()}>
        <WalletIcon />
        <div>{mobile ? 'Connect' : 'Connect wallet'}</div>
      </div>
    );

    if (disabled) {
      return (
        <Tooltip title={'Please select a network first'}>{button}</Tooltip>
      );
    } else {
      return button;
    }
  }
}

export default ConnectWallet;
