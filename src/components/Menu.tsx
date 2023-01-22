import * as React from 'react';
import Popover from '@mui/material/Popover';
import PopupState, { bindTrigger, bindPopover } from 'material-ui-popup-state';
import { ICON } from '../utils/style';
import { makeStyles } from 'tss-react/mui';
import MenuIcon from '../icons/components/Menu';

const useStyles = makeStyles()((theme) => ({
  menuIcon: {
    ...ICON,
    borderRadius: '8px',
    backgroundColor: theme.palette.button.action,
    color: theme.palette.button.actionText,
  },
  menu: {
    backgroundColor: theme.palette.popover.background,
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    padding: '8px',
    width: '200px',
  },
  menuItem: {
    borderRadius: '8px',
    padding: '16px',
    cursor: 'pointer',
    '&:hover': {
      backgroundColor: theme.palette.popover.secondary,
    },
  },
}));

export default function Menu() {
  const { classes } = useStyles();

  return (
    <PopupState variant="popover" popupId="demo-popup-popover">
      {(popupState) => (
        <div>
          <div className={classes.menuIcon} {...bindTrigger(popupState)}>
            <MenuIcon />
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
            <div className={classes.menu}>
              <div className={classes.menuItem}>Bridge</div>
              <div className={classes.menuItem}>Redeem</div>
              <div className={classes.menuItem}>Terms of Use</div>
            </div>
          </Popover>
        </div>
      )}
    </PopupState>
  );
}
