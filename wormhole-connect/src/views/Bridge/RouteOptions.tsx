import React, { useEffect, useMemo, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { makeStyles } from 'tss-react/mui';
import { Chip, useMediaQuery, useTheme } from '@mui/material';
import { useDebounce } from 'use-debounce';
import { RootState } from 'store';
import { setAvailableRoutes, setTransferRoute } from 'store/transferInput';
import { LINK, joinClass } from 'utils/style';
import { toFixedDecimals } from 'utils/balance';
import RouteOperator from 'routes/operator';
import { getDisplayName } from 'utils';
import { TOKENS, ROUTES } from 'config';
import { Route } from 'config/types';
import { RoutesConfig, RouteData } from 'config/routes';

import BridgeCollapse, { CollapseControlStyle } from './Collapse';
import TokenIcon from 'icons/TokenIcons';
import ArrowRightIcon from 'icons/ArrowRight';
import Options from 'components/Options';
import { isGatewayChain } from 'utils/cosmos';

const useStyles = makeStyles()((theme: any) => ({
  link: {
    ...LINK(theme),
    margin: '0 0 0 4px',
  },
  tag: {
    padding: '4px 8px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    [theme.breakpoints.down('sm')]: {
      padding: '4px 0',
      backgroundColor: 'transparent !important',
    },
  },
  filled: {
    backgroundColor: theme.palette.card.secondary,
  },
  tagIcon: {
    [theme.breakpoints.down('sm')]: {
      display: 'none',
    },
  },
  route: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gridTemplateRows: '1fr',
    gridTemplateAreas: `"path fees"`,
    width: '100%',
    maxWidth: '100%',
    fontSize: '14px',
  },
  routeLeft: {
    gridArea: 'path',
    display: 'flex',
    flexDirection: 'column',
  },
  routeTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
    fontWeight: '600',
    marginBottom: '8px',
  },
  routePath: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    [theme.breakpoints.down('sm')]: {
      gap: '4px',
    },
  },
  routeRight: {
    gridArea: 'fees',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    padding: '4px 0',
    height: '100%',
  },
  routeAmt: {
    opacity: '0.6',
    fontSize: '12px',
  },
}));

export function Banner(props: { text?: string; route?: RouteData }) {
  const { classes } = useStyles();
  const text = props.text || 'This route provided by';
  const route = useSelector((state: RootState) => state.transferInput.route);

  const displayRoute = route && (props.route || RoutesConfig[route]);

  return displayRoute ? (
    <>
      {text}
      <a
        href={displayRoute.link}
        target="_blank"
        className={classes.link}
        rel="noreferrer"
      >
        {displayRoute.providedBy}
      </a>
    </>
  ) : (
    <></>
  );
}

type TagProps = {
  icon: JSX.Element;
  text: string;
  colorFilled?: boolean;
  height?: number;
};
function Tag(props: TagProps) {
  const { classes } = useStyles();
  const height = props.height || 20;

  return (
    <div
      className={joinClass([
        classes.tag,
        !!props.colorFilled && classes.filled,
      ])}
    >
      <div
        style={{ height: height, width: height }}
        className={classes.tagIcon}
      >
        {props.icon}
      </div>
      {props.text}
    </div>
  );
}

function RouteOption(props: { route: RouteData }) {
  const { classes } = useStyles();
  const theme = useTheme();
  const mobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { token, destToken, amount, toChain } = useSelector(
    (state: RootState) => state.transferInput,
  );
  const { toNativeToken, relayerFee } = useSelector(
    (state: RootState) => state.relay,
  );
  const [receiveAmt, setReceiveAmt] = useState<number | undefined>(undefined);

  useEffect(() => {
    async function load() {
      const receiveAmt = await RouteOperator.computeReceiveAmount(
        props.route.route,
        Number.parseFloat(amount),
        { toNativeToken, relayerFee },
      );
      setReceiveAmt(Number.parseFloat(toFixedDecimals(`${receiveAmt}`, 6)));
    }
    load();
  }, [props.route, amount, toNativeToken, relayerFee]);
  const fromTokenConfig = TOKENS[token];
  const fromTokenIcon = fromTokenConfig && (
    <TokenIcon name={fromTokenConfig.icon} height={20} />
  );
  const toTokenConfig = TOKENS[destToken];
  const toTokenIcon = toTokenConfig && (
    <TokenIcon name={toTokenConfig.icon} height={20} />
  );
  const routeName = props.route.route;

  const route = useMemo(() => {
    return RouteOperator.getRoute(routeName);
  }, [routeName]);

  const isAutomatic = useMemo(
    () =>
      route.AUTOMATIC_DEPOSIT ||
      (toChain && (isGatewayChain(toChain) || toChain === 'sei')),
    [route, toChain],
  );

  return (
    fromTokenConfig &&
    toTokenConfig && (
      <div className={classes.route}>
        <div className={classes.routeLeft}>
          <div className={classes.routeTitle}>
            {props.route.name}
            {/* TODO: isAutomatic to route and use transfer parameters to decide */}
            {isAutomatic ? (
              <Chip
                label="One transaction"
                color="success"
                variant="outlined"
                size="small"
              />
            ) : (
              <Chip
                label="Two transactions"
                color="warning"
                variant="outlined"
                size="small"
              />
            )}
          </div>
          <div className={classes.routePath}>
            <Tag
              icon={fromTokenIcon}
              text={getDisplayName(fromTokenConfig)}
              colorFilled
            />
            <ArrowRightIcon fontSize={mobile ? 'inherit' : undefined} />
            <Tag icon={props.route.icon()} text={props.route.providedBy} />
            <ArrowRightIcon fontSize={mobile ? 'inherit' : undefined} />
            <Tag
              icon={toTokenIcon}
              text={getDisplayName(toTokenConfig)}
              colorFilled
            />
          </div>
        </div>
        <div className={classes.routeRight}>
          <div>
            {receiveAmt} {getDisplayName(TOKENS[destToken])}
          </div>
          <div className={classes.routeAmt}>after fees</div>
        </div>
      </div>
    )
  );
}

function RouteOptions() {
  const dispatch = useDispatch();
  const [collapsed, setCollapsed] = useState(true);
  const {
    isTransactionInProgress,
    route,
    availableRoutes,
    token,
    destToken,
    fromChain,
    toChain,
    amount,
  } = useSelector((state: RootState) => state.transferInput);
  const onSelect = (value: Route) => {
    dispatch(setTransferRoute(value));
  };
  const [debouncedAmount] = useDebounce(amount, 500);

  useEffect(() => {
    if (!fromChain || !toChain || !token || !destToken || !debouncedAmount)
      return;
    const getAvailable = async () => {
      let available: string[] = [];
      for (const value of ROUTES) {
        const r = value as Route;
        const isSupported = await RouteOperator.isRouteAvailable(
          r,
          token,
          destToken,
          debouncedAmount,
          fromChain,
          toChain,
        );
        if (isSupported) {
          available.push(r);
        }
      }
      dispatch(setAvailableRoutes(available));
    };
    getAvailable();
  }, [dispatch, token, destToken, debouncedAmount, fromChain, toChain]);

  const onCollapseChange = (collapsed: boolean) => {
    setCollapsed(collapsed);
  };

  return availableRoutes ? (
    <BridgeCollapse
      title="Route"
      disabled={isTransactionInProgress}
      banner={<Banner />}
      disableCollapse
      startClosed
      onCollapseChange={onCollapseChange}
      controlStyle={
        availableRoutes && availableRoutes.length > 1
          ? CollapseControlStyle.Arrow
          : CollapseControlStyle.None
      }
    >
      <Options
        active={route}
        onSelect={onSelect}
        collapsable
        collapsed={collapsed}
      >
        {availableRoutes.map((route_) => {
          return {
            key: route_,
            child: <RouteOption route={RoutesConfig[route_ as Route]} />,
          };
        })}
      </Options>
    </BridgeCollapse>
  ) : (
    <></>
  );
}

export default RouteOptions;
