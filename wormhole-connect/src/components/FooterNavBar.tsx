import React, { useCallback, useMemo } from 'react';
import { useDispatch } from 'react-redux';
import { Box, useTheme } from '@mui/material';
import { ICON } from 'utils/style';
import { Route, setRoute } from 'store/router';
import config from 'config';
import { MenuEntry } from 'config/ui';

type MenuItem = {
  label: string;
  handleClick: () => void;
};

function itemAppender(acc: MenuItem[], item: MenuEntry) {
  const { order = acc.length, target = '_black', href, label } = item;
  acc.splice(order, 0, { label, handleClick: () => window.open(href, target) });
  return acc;
}

function defaultMenuItems(navigate: (name: Route) => void): MenuItem[] {
  return [
    { label: 'Resume Transaction', handleClick: () => navigate('search') },
    { label: 'Terms of Service', handleClick: () => navigate('terms') },
  ];
}

export default function FooterNavBar() {
  const theme = useTheme();
  const styles = useMemo(() => ({
    menuIcon: ICON,
    menu: {
      display: 'flex',
      [theme.breakpoints.down('md')]: {
        flexDirection: 'column',
      },
      flexDirection: 'row',
      gap: '8px',
      padding: '8px',
      width: '100%',
    },
    menuItem: {
      padding: '16px 0',
      textAlign: 'center',
      fontSize: '14px',
      margin: 'auto',
      cursor: 'pointer',
      '&:hover': {
        textDecoration: 'underline',
      },
    },
  }), [theme]);
  const dispatch = useDispatch();

  const navigate = useCallback(
    (name: Route) => {
      dispatch(setRoute(name));
    },
    [dispatch],
  );

  const entries = (config.ui?.menu ?? []).reduce(
    itemAppender,
    defaultMenuItems(navigate),
  );

  return (
    <Box sx={styles.menu}>
      {entries.map(({ label, handleClick }: MenuItem, idx) => (
        <Box
          sx={styles.menuItem}
          onClick={handleClick}
          key={`${label.toLowerCase()}_${idx}`}
        >
          {label}
        </Box>
      ))}
    </Box>
  );
}
