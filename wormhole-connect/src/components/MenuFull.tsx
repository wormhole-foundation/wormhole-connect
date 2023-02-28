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

  const navigate = (name: Route) => {
    dispatch(setRoute(name));
    setOpen(false);
  };

  return (
    <div>
      <div className={classes.menuIcon} onClick={() => setOpen(true)}>
        <MenuIcon />
      </div>
      <Modal open={open} closable width={650} onClose={() => setOpen(false)}>
        <div className={classes.menu}>
          <PoweredByIcon color={theme.palette.text.primary} />
          <Spacer height={8} />
          <div className={classes.menuItem} onClick={() => navigate('bridge')}>
            Bridge
          </div>
          <div className={classes.menuItem} onClick={() => navigate('redeem')}>
            Resume transfer
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
