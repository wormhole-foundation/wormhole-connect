import React, { useCallback } from 'react';
import { makeStyles } from 'tss-react/mui';
import Collapse from '@mui/material/Collapse';
import Down from 'icons/Down';
import { LINK, joinClass } from 'utils/style';
import Switch from 'components/Switch';
import { Box, CircularProgress } from '@mui/material';

const useStyles = makeStyles()((theme: any) => ({
  container: {
    width: '100%',
    borderRadius: theme.spacing(1),
    boxShadow: theme.palette.card.elevation,
    position: 'relative',
  },
  header: {
    width: '100%',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px',
    backgroundColor: theme.palette.card.background,
    backgroundOpacity: '80%',
    borderRadius: '8px',
    transition: 'border-radius 0.4s',
  },
  title: {
    fontSize: '14px',
    fontWeight: 'bold',
  },
  description: {
    fontSize: '14px',
    opacity: '80%',
  },
  invert: {
    transform: 'rotate(180deg)',
  },
  arrow: {
    width: '32px',
    height: '32px',
    transition: 'transform 0.4s',
  },
  controlled: {
    cursor: 'default !important',
  },
  banner: {
    borderBottomRightRadius: '8px',
    borderBottomLeftRadius: '8px',
    backgroundColor: theme.palette.info[500],
    padding: '8px 16px',
    display: 'flex',
    flexDirection: 'row',
    transition: 'border-radius 0.1s 0.3s',
  },
  open: {
    transition: 'border-radius 0s 0s',
    borderBottomLeftRadius: '0 !important',
    borderBottomRightRadius: '0 !important',
  },
  disabled: {
    opacity: '70%',
    cursor: 'not-allowed !important',
  },
  link: {
    ...LINK(theme),
    margin: '0 0 0 4px',
  },
  collapseControl: {
    cursor: 'pointer',
  },
}));

export enum CollapseControlStyle {
  None = 1,
  Arrow = 2,
  Switch = 3,
}

function DownControl(props: { collapsed: boolean }) {
  const { classes } = useStyles();
  return (
    <Down
      className={joinClass([classes.arrow, !props.collapsed && classes.invert])}
    />
  );
}

function getControlComponent(
  control: CollapseControlStyle,
  collapsed: boolean,
) {
  switch (control) {
    case CollapseControlStyle.None: {
      return <></>;
    }
    case CollapseControlStyle.Arrow: {
      return <DownControl collapsed={collapsed} />;
    }
    case CollapseControlStyle.Switch: {
      return <Switch checked={!collapsed} />;
    }
    default: {
      return <></>;
    }
  }
}

type Props = {
  title: string;
  description?: string;
  children: JSX.Element | JSX.Element[];
  startClosed?: boolean;
  disabled?: boolean;
  banner?: JSX.Element | JSX.Element[] | false | undefined;
  controlled?: boolean; // control the open/closed state
  controlStyle?: CollapseControlStyle;
  value?: boolean; // open/closed value
  onCollapseChange?: (value: boolean) => void;
  disableCollapse?: boolean;
  loading?: boolean;
};

function BridgeCollapse(props: Props) {
  const { classes } = useStyles();
  const { onCollapseChange, disabled } = props;
  const [collapsed, setCollapsed] = React.useState(props.startClosed || false);

  const toggleCollapsed = useCallback(() => {
    if (disabled) return;
    setCollapsed((prev) => {
      if (onCollapseChange) {
        onCollapseChange(!prev);
      }
      return !prev;
    });
  }, [disabled, onCollapseChange]);

  const controlStyle = props.controlStyle || CollapseControlStyle.Arrow;
  const collapsedState = props.controlled ? props.value || false : collapsed;

  const collapseControl = getControlComponent(controlStyle, collapsedState);

  return (
    <div className={classes.container}>
      <div
        className={joinClass([
          classes.header,
          (!!props.banner || !collapsedState) && classes.open,
          !!disabled && classes.disabled,
        ])}
      >
        <div>
          <div className={classes.title}>{props.title}</div>
          {props.description && (
            <div className={classes.description}>{props.description}</div>
          )}
        </div>
        <div onClick={toggleCollapsed} className={classes.collapseControl}>
          {collapseControl}
        </div>
      </div>
      {props.banner && (
        <div
          className={joinClass([
            classes.banner,
            (props.disableCollapse || !collapsedState) && classes.open,
          ])}
        >
          {props.banner}
        </div>
      )}

      <Collapse in={props.disableCollapse || !collapsedState} unmountOnExit>
        {props.children}
      </Collapse>
      {props.loading ? (
        <Box
          position="absolute"
          top={0}
          left={0}
          height="100%"
          width="100%"
          borderRadius={1}
          sx={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
        >
          <CircularProgress
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%,-50%)',
            }}
          />
        </Box>
      ) : null}
    </div>
  );
}

export default BridgeCollapse;
