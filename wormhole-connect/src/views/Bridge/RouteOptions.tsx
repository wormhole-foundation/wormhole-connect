import React, { useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { makeStyles } from 'tss-react/mui';
import { RootState } from '../../store';
import BridgeCollapse, { CollapseControlStyle } from './Collapse';
import { LINK, joinClass } from '../../utils/style';
import { TOKENS } from '../../config';
import TokenIcon from '../../icons/TokenIcons';
import ArrowRightIcon from '../../icons/ArrowRight';
import Options from '../../components/Options';
import { ROUTES, RouteData } from '../../config/routes';
import { useDispatch } from 'react-redux';
import { setTransferRoute, Route } from '../../store/transferInput';
import { Chip } from '@mui/material';
import Operator from '../../utils/routes';

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
  },
  filled: {
    backgroundColor: theme.palette.card.secondary,
  },
  route: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gridTemplateRows: '1fr',
    gridTemplateAreas: `"path fees"`,
    width: '100%',
    maxWidth: '100%',
    [theme.breakpoints.down('sm')]: {
      gridTemplateColumns: '1fr !important',
      gridTemplateAreas: `"path" !important`,
    },
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
  },
  routeRight: {
    gridArea: 'fees',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
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
  const { route } = useSelector((state: RootState) => state.transferInput);

  const displayRoute = props.route || ROUTES[route];

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
      <div style={{ height: height, width: height }}>{props.icon}</div>
      {props.text}
    </div>
  );
}

function RouteOption(props: { route: RouteData }) {
  const { classes } = useStyles();
  const { token, destToken } = useSelector(
    (state: RootState) => state.transferInput,
  );
  const fromTokenConfig = TOKENS[token];
  const fromTokenIcon = fromTokenConfig && (
    <TokenIcon name={fromTokenConfig.icon} height={16} />
  );
  const toTokenConfig = TOKENS[destToken];
  const toTokenIcon = toTokenConfig && (
    <TokenIcon name={toTokenConfig.icon} height={16} />
  );
  const routeName = props.route.route;

  const route = useMemo(() => {
    return new Operator().getRoute(routeName);
  }, [routeName]);

  return (
    fromTokenConfig &&
    toTokenConfig && (
      <div className={classes.route}>
        <div className={classes.routeLeft}>
          <div className={classes.routeTitle}>
            {props.route.name}
            {!route.AUTOMATIC_DEPOSIT ? (
              <Chip
                label="Two transactions"
                color="warning"
                variant="outlined"
                size="small"
              />
            ) : (
              <Chip
                label="One transaction"
                color="success"
                variant="outlined"
                size="small"
              />
            )}
          </div>
          <div className={classes.routePath}>
            <Tag
              icon={fromTokenIcon}
              text={fromTokenConfig.symbol}
              colorFilled
            />
            <ArrowRightIcon />
            <Tag icon={props.route.icon()} text={props.route.providedBy} />
            <ArrowRightIcon />
            <Tag icon={toTokenIcon} text={toTokenConfig.symbol} colorFilled />
          </div>
        </div>
        <div className={classes.routeRight}>
          <div>22.5 USDC</div>
          <div className={classes.routeAmt}>~ $22.50 after fees</div>
        </div>
      </div>
    )
  );
}

function RouteOptions() {
  const dispatch = useDispatch();
  const {
    isTransactionInProgress,
    route,
    token,
    destToken,
    fromNetwork,
    toNetwork,
    amount,
    validate,
  } = useSelector((state: RootState) => state.transferInput);
  const onSelect = (value: Route) => {
    dispatch(setTransferRoute(value));
  };

  const availableRoutes = useMemo(() => {
    if (!validate || !fromNetwork || !toNetwork) return Object.keys(ROUTES);
    let available: Route[] = [];
    Object.keys(ROUTES).forEach(async (r) => {
      const routeId = Number.parseInt(r) as Route;
      const route = new Operator().getRoute(routeId);
      const isSupported = await route.isRouteAvailable(
        token,
        destToken,
        amount,
        fromNetwork,
        toNetwork,
      );
      if (isSupported) {
        available.push(routeId);
      }
    });
    return available;
  }, [token, destToken, amount, fromNetwork, toNetwork]);

  const selectedElement = (
    <Options active={route} onSelect={() => {}}>
      {[
        {
          key: route,
          child: <RouteOption route={ROUTES[route]} />,
        },
      ]}
    </Options>
  );

  return (
    <>
      <BridgeCollapse
        title="Route"
        disabled={isTransactionInProgress}
        banner={<Banner />}
        startClosed={true}
        controlStyle={CollapseControlStyle.Arrow}
        selectedElement={selectedElement}
      >
        <Options active={route} onSelect={onSelect}>
          {availableRoutes.map((route) => {
            return {
              key: route,
              child: <RouteOption route={ROUTES[route]} />,
            };
          })}
        </Options>
      </BridgeCollapse>
    </>
  );
}

export default RouteOptions;
