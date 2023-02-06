import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { makeStyles } from 'tss-react/mui';
import { useTheme } from '@mui/material/styles';
import { ICON } from '../utils/style';
import { Route, setRoute } from '../store/router';
import MenuIcon from '../icons/components/Menu';
import Modal from './Modal';
import Spacer from './Spacer';
import PoweredByIcon from '../icons/components/PoweredBy';

const useStyles = makeStyles()((theme) => ({
  menuIcon: ICON,
  menu: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    padding: '8px',
  },
  menuItem: {
    padding: '16px 0',
    textAlign: 'left',
    cursor: 'pointer',
    '&:hover': {
      textDecoration: 'underline',
    },
  },
}));

export default function Menu() {
  const { classes } = useStyles();
  const theme = useTheme();
  const dispatch = useDispatch();
  const [open, setOpen] = useState(false);

  // TODO: refactor so I can pass in close function instead of listening
  // listen for close event
  const closeMenu = () => {
    setOpen(false);
  };
  document.addEventListener('close', closeMenu);

  const navigate = (name: Route) => {
    dispatch(setRoute(name));
    closeMenu();
  };

  return (
    <div>
      <div className={classes.menuIcon} onClick={() => setOpen(true)}>
        <MenuIcon />
      </div>
      <Modal open={open} closable width={650}>
        <div className={classes.menu}>
          <PoweredByIcon color={theme.palette.text.primary} />
          <Spacer height={8} />
          <div className={classes.menuItem} onClick={() => navigate('bridge')}>
            Bridge
          </div>
          <div className={classes.menuItem} onClick={() => navigate('redeem')}>
            Claim balance
          </div>
          <div
            className={classes.menuItem}
            // onClick={() => navigate('redeem')}
          >
            FAQs
          </div>
          <div
            className={classes.menuItem}
            // onClick={() => navigate('redeem')}
          >
            Terms of Use
          </div>
        </div>
      </Modal>
    </div>
  );
}
