import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import Tooltip from '@mui/material/Tooltip';
import { makeStyles } from 'tss-react/mui';

import { RoutesConfig } from 'config/routes';
import useAvailableRoutes from 'hooks/useAvailableRoutes';
import SingleRoute from 'views/v2/Bridge/Routes/SingleRoute';

import type { Route } from 'config/types';
import type { RootState } from 'store';

const useStyles = makeStyles()((theme: any) => ({
  connectWallet: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '8px 16px',
    borderRadius: '8px',
    backgroundColor: theme.palette.button.primary,
    cursor: 'not-allowed',
    opacity: 0.7,
    margin: 'auto',
    maxWidth: '420px',
    width: '100%',
  },
}));

type Props = {
  selectedRoute: Route | undefined;
  onRouteChange: (route: Route) => void;
};

const Routes = (props: Props) => {
  const { classes } = useStyles();

  const { amount, routeStates } = useSelector(
    (state: RootState) => state.transferInput,
  );

  const { sending: sendingWallet, receiving: receivingWallet } = useSelector(
    (state: RootState) => state.wallet,
  );

  useAvailableRoutes();

  const supportedRoutes = useMemo(() => {
    if (!routeStates) {
      return [];
    }

    return routeStates.filter((rs) => rs.supported);
  }, [routeStates]);

  const walletsConnected = useMemo(
    () => Boolean(sendingWallet.address) && Boolean(receivingWallet.address),
    [sendingWallet.address, receivingWallet.address],
  );

  if (supportedRoutes.length === 0 || !walletsConnected) {
    return <></>;
  }

  if (walletsConnected && !(Number(amount) > 0)) {
    return (
      <Tooltip title="Please enter the amount to view available routes">
        <div className={classes.connectWallet}>
          <div>View routes</div>
        </div>
      </Tooltip>
    );
  }

  return (
    <>
      {supportedRoutes.map(({ name, available }) => {
        const routeConfig = RoutesConfig[name as Route];
        const isSelected = routeConfig.route === props.selectedRoute;
        return (
          <SingleRoute
            config={routeConfig}
            available={available}
            isSelected={isSelected}
            onSelect={props.onRouteChange}
          />
        );
      })}
    </>
  );
};

export default Routes;
