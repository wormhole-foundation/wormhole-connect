import React from 'react';
import { useDispatch } from 'react-redux';
import { makeStyles } from 'tss-react/mui';
import { ICON } from 'utils/style';
import { Route, setRoute } from 'store/router';

const useStyles = makeStyles()(() => ({
  menuIcon: ICON,
  menu: {
    display: 'flex',
    flexDirection: 'row',
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

export default function FooterNavBar() {
  const { classes } = useStyles();
  const dispatch = useDispatch();

  const navigate = (name: Route) => {
    dispatch(setRoute(name));
  };

  return (
    <div className={classes.menu}>
      <div className={classes.menuItem} onClick={() => navigate('search')}>
        Resume transaction
      </div>
      <div className={classes.menuItem} onClick={() => navigate('faq')}>
        FAQs
      </div>
      <div className={classes.menuItem} onClick={() => navigate('terms')}>
        Terms of Use
      </div>
    </div>
  );
}
