import React, { useCallback } from 'react';
import { makeStyles } from 'tss-react/mui';
import Collapse from '@mui/material/Collapse';
import Down from '../../icons/Down';
import { joinClass, LINK } from '../../utils/style';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import Switch from '../../components/Switch';

const useStyles = makeStyles()((theme) => ({
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
    ...LINK,
    color: theme.palette.text.primary,
  },
}));

export enum CollapseControlStyle {
  Arrow,
  Switch,
}

type Props = {
  title: string;
  description?: string;
  children: JSX.Element | JSX.Element[];
  close?: boolean;
  disabled?: boolean;
  banner?: boolean;
  controlled?: boolean; // control the open/closed state
  controlStyle?: CollapseControlStyle;
  value?: boolean; // open/closed value
  onCollapseChange?: (value: boolean) => void;
};

function BridgeCollapse(props: Props) {
  const { classes } = useStyles();
  const [collapsed, setCollapsed] = React.useState(props.close || false);

  const toggleCollapsed = useCallback(() => {
    if (props.disabled) return;
    const newValue = !collapsed;

    setCollapsed(newValue);
    if (props.onCollapseChange) {
      props.onCollapseChange(newValue);
    }
  }, [collapsed, props.disabled, props.onCollapseChange]);

  const relayAvail = useSelector(
    (state: RootState) => state.transfer.automaticRelayAvail,
  );
  const controlled = !relayAvail || props.controlled;
  const controlStyle = props.controlStyle || CollapseControlStyle.Arrow;
  const collapsedState = props.disabled
    ? true
    : controlled
    ? props.value
    : collapsed;

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
          !!props.controlled && classes.controlled,
        ])}
        onClick={toggleCollapsed}
      >
        <div>
          <div className={classes.title}>{props.title}</div>
          {props.description && (
            <div className={classes.description}>{props.description}</div>
          )}
        </div>
        {!props.controlled && collapseControl}
      </div>
      {props.banner && relayAvail && (
        <div
          className={joinClass([
            classes.banner,
            !collapsedState && classes.open,
          ])}
        >
          This feature provided by{' '}
          <a
            href="https://github.com/XLabs"
            target="_blank"
            className={classes.link}
            rel="noreferrer"
          >
            xLabs
          </a>
        </div>
      )}
      <Collapse in={!collapsedState}>{props.children}</Collapse>
    </div>
  );
}

export default BridgeCollapse;
