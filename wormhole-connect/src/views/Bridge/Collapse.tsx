import React, { useCallback } from 'react';
import { makeStyles } from 'tss-react/mui';
import Collapse from '@mui/material/Collapse';
import Down from '../../icons/Down';
import { LINK, joinClass } from '../../utils/style';
import Switch from '../../components/Switch';

const useStyles = makeStyles()((theme: any) => ({
  container: {
    width: '100%',
    borderRadius: '8px',
    boxShadow: theme.palette.card.elevation,
  },
  header: {
    width: '100%',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px',
    cursor: 'pointer',
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
    transition: 'border-radius 0.4s',
    display: 'flex',
    flexDirection: 'row',
  },
  open: {
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
}));

export enum CollapseControlStyle {
  None,
  Arrow,
  Switch,
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
};

function BridgeCollapse(props: Props) {
  const { classes } = useStyles();
  const { onCollapseChange } = props;
  const [collapsed, setCollapsed] = React.useState(props.startClosed || false);

  const toggleCollapsed = useCallback(() => {
    if (props.disabled) return;
    setCollapsed((prev) => !prev);
  }, [props.disabled]);

  const onChange = useCallback(() => {
    if (onCollapseChange) {
      onCollapseChange(collapsed);
    }
  }, [collapsed, onCollapseChange]);

  const controlStyle = props.controlStyle || CollapseControlStyle.Arrow;
  const collapsedState = props.controlled ? props.value : collapsed;

  const collapseControl =
    controlStyle === CollapseControlStyle.Arrow ? (
      <Down
        className={joinClass([classes.arrow, !collapsed && classes.invert])}
      />
    ) : (
      <Switch checked={!collapsed} />
    );

  return (
    <div className={classes.container}>
      <div
        className={joinClass([
          classes.header,
          (!!props.banner || !collapsedState) && classes.open,
          !!props.disabled && classes.disabled,
          // !!props.controlled && classes.controlled,
        ])}
        onClick={toggleCollapsed}
      >
        <div>
          <div className={classes.title}>{props.title}</div>
          {props.description && (
            <div className={classes.description}>{props.description}</div>
          )}
        </div>
        {collapseControl}
      </div>
      {props.banner && (
        <div
          className={joinClass([
            classes.banner,
            !collapsedState && classes.open,
          ])}
        >
          {props.banner}
        </div>
      )}

      <Collapse onExited={onChange} in={!collapsedState} unmountOnExit>
        {props.children}
      </Collapse>
    </div>
  );
}

export default BridgeCollapse;
