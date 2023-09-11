import * as React from 'react';
import { useDispatch } from 'react-redux';
import Popover from '@mui/material/Popover';
import PopupState, { bindTrigger, bindPopover } from 'material-ui-popup-state';
import { makeStyles } from 'tss-react/mui';

import { ICON } from 'utils/style';
import { Route, setRoute } from 'store/router';
import MenuIcon from 'icons/Menu';

const useStyles = makeStyles()((theme: any) => ({
  menuIcon: ICON,
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
  const dispatch = useDispatch();

  const navigate = (name: Route) => {
    dispatch(setRoute(name));
  };

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
              <div
                className={classes.menuItem}
                onClick={() => navigate('bridge')}
              >
                Bridge
              </div>
              <div
                className={classes.menuItem}
                onClick={() => navigate('redeem')}
              >
                Resume transaction
              </div>
              <div className={classes.menuItem} onClick={() => navigate('faq')}>
                FAQ
              </div>
              <div
                className={classes.menuItem}
                onClick={() => navigate('terms')}
              >
                Terms of Use
              </div>
            </div>
          </Popover>
        </div>
      )}
    </PopupState>
  );
}
